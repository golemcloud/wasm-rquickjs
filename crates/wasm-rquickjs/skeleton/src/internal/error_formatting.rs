//! Bounded host diagnostics. Inspecting a thrown value must not execute it.

use rquickjs::function::This;
use rquickjs::{CaughtError, Ctx, Function, JsLifetime, Object, Value, qjs};
use std::cell::RefCell;
use std::ffi::CStr;
use std::mem::MaybeUninit;

const MAX_FIELD_LENGTH: i64 = 4096;
const MAX_STACK_LENGTH: i64 = 16 * 1024;
const MAX_PROTOTYPES: usize = 8;

#[derive(JsLifetime)]
struct DiagnosticIntrinsics<'js> {
    ordinary_class: qjs::JSClassID,
    array_class: qjs::JSClassID,
    error_prototype: Object<'js>,
    native_stack: Function<'js>,
    host_stack: RefCell<Option<Function<'js>>>,
}

/// Capture before module loading and application code can replace intrinsics.
pub(crate) fn initialize(ctx: &Ctx<'_>) -> rquickjs::Result<()> {
    let object = Object::new(ctx.clone())?;
    let ordinary_class = unsafe { qjs::JS_GetClassID(object.as_raw()) };
    let array = rquickjs::Array::new(ctx.clone())?;
    let array_class = unsafe { qjs::JS_GetClassID(array.as_raw()) };
    let error_prototype = ctx.eval("Error.prototype")?;
    let native_stack = ctx.eval("Object.getOwnPropertyDescriptor(Error.prototype, 'stack').get")?;
    ctx.store_userdata(DiagnosticIntrinsics {
        ordinary_class,
        array_class,
        error_prototype,
        native_stack,
        host_stack: RefCell::new(None),
    })
    .expect("Failed to initialize diagnostic intrinsics");
    #[cfg(feature = "test-observability")]
    install_test_observability(ctx)?;
    Ok(())
}

pub(crate) fn install_host_stack_reader<'js>(ctx: &Ctx<'js>, reader: Function<'js>) {
    *ctx.userdata::<DiagnosticIntrinsics>()
        .expect("diagnostic intrinsics not initialized")
        .host_stack
        .borrow_mut() = Some(reader);
}

fn preserving_exception<T>(value: &Value<'_>, format: impl FnOnce() -> T) -> T {
    let ctx = value.ctx();
    // A pending undefined/null is still an exception. Do not infer presence
    // from the caught value itself.
    let pending = ctx.has_exception().then(|| ctx.catch());
    let result = format();
    if ctx.has_exception() {
        drop(ctx.catch());
    }
    if let Some(pending) = pending {
        ctx.throw(pending);
    }
    result
}

fn bounded_string(value: &Value<'_>, limit: i64) -> Option<String> {
    let text = value.as_string()?;
    let mut length = 0;
    // On a primitive string QuickJS reads the stored flat/rope length. This
    // cannot dispatch a getter and avoids flattening an oversized rope.
    if unsafe { qjs::JS_GetLength(value.ctx().as_raw().as_ptr(), value.as_raw(), &mut length) } < 0
    {
        return None;
    }
    if length > limit {
        return Some("<string exceeds diagnostic limit>".to_owned());
    }
    // QuickJS can return WTF-8 for lone surrogates. Keep the string's kind and
    // bounded text, replacing invalid scalar values instead of labelling it
    // as an object or an unavailable message.
    let mut bytes = 0;
    let pointer =
        unsafe { qjs::JS_ToCStringLen(value.ctx().as_raw().as_ptr(), &mut bytes, text.as_raw()) };
    if pointer.is_null() {
        return None;
    }
    let native = NativeString {
        ctx: value.ctx().clone(),
        pointer,
    };
    let bytes = unsafe { std::slice::from_raw_parts(native.pointer.cast::<u8>(), bytes) };
    Some(String::from_utf8_lossy(bytes).into_owned())
}

struct NativeString<'js> {
    ctx: Ctx<'js>,
    pointer: *const std::ffi::c_char,
}

impl Drop for NativeString<'_> {
    fn drop(&mut self) {
        unsafe { qjs::JS_FreeCString(self.ctx.as_raw().as_ptr(), self.pointer) };
    }
}

fn safe_object(value: &Value<'_>) -> bool {
    if !value.is_object() || value.is_proxy() {
        return false;
    }
    value.is_error()
        || value
            .ctx()
            .userdata::<DiagnosticIntrinsics>()
            .is_some_and(|intrinsics| unsafe {
                qjs::JS_GetClassID(value.as_raw()) == intrinsics.ordinary_class
            })
}

enum Property<'js> {
    Absent,
    Accessor,
    Data(Value<'js>),
}

fn own_property<'js>(value: &Value<'js>, name: &CStr) -> Property<'js> {
    let ctx = value.ctx();
    let raw_ctx = ctx.as_raw().as_ptr();
    // Only called after rejecting proxies and exotic classes. Raw descriptors
    // distinguish a shadowing accessor from an absent field without calling it.
    unsafe {
        let atom = qjs::JS_NewAtom(raw_ctx, name.as_ptr());
        if atom == qjs::JS_ATOM_NULL {
            return Property::Absent;
        }
        let property = property_by_atom(value, atom);
        qjs::JS_FreeAtom(raw_ctx, atom);
        property
    }
}

fn property_by_atom<'js>(value: &Value<'js>, atom: qjs::JSAtom) -> Property<'js> {
    let ctx = value.ctx();
    unsafe {
        let mut descriptor = MaybeUninit::<qjs::JSPropertyDescriptor>::uninit();
        let found = qjs::JS_GetOwnProperty(
            ctx.as_raw().as_ptr(),
            descriptor.as_mut_ptr(),
            value.as_raw(),
            atom,
        );
        if found <= 0 {
            return Property::Absent;
        }
        let descriptor = descriptor.assume_init();
        // Every successful descriptor owns all three values, including unused
        // getters/setters. Transfer each to RAII before selecting the data.
        let data = Value::from_raw(ctx.clone(), descriptor.value);
        let _getter = Value::from_raw(ctx.clone(), descriptor.getter);
        let _setter = Value::from_raw(ctx.clone(), descriptor.setter);
        if descriptor.flags & qjs::JS_PROP_GETSET as i32 != 0 {
            Property::Accessor
        } else {
            Property::Data(data)
        }
    }
}

/// Minimal JS source-map adapter using the same native reflection owner.
/// Keys are trusted primitive field/index names; never coerce application keys.
pub(crate) fn host_data_property<'js>(
    value: Value<'js>,
    key: Value<'js>,
) -> rquickjs::Result<Value<'js>> {
    let ctx = value.ctx();
    let array = value.is_object()
        && !value.is_proxy()
        && ctx
            .userdata::<DiagnosticIntrinsics>()
            .is_some_and(|intrinsics| unsafe {
                qjs::JS_GetClassID(value.as_raw()) == intrinsics.array_class
            });
    if !safe_object(&value) && !array {
        return Ok(Value::new_undefined(ctx.clone()));
    }
    if key.is_string() {
        let mut length = 0;
        if unsafe { qjs::JS_GetLength(ctx.as_raw().as_ptr(), key.as_raw(), &mut length) } < 0 {
            return Err(rquickjs::Error::Exception);
        }
        if length > 512 {
            return Ok(Value::new_undefined(ctx.clone()));
        }
    } else if !key.is_symbol() {
        return Ok(Value::new_undefined(ctx.clone()));
    }
    let property = unsafe {
        let atom = qjs::JS_ValueToAtom(ctx.as_raw().as_ptr(), key.as_raw());
        if atom == qjs::JS_ATOM_NULL {
            return Err(rquickjs::Error::Exception);
        }
        let property = property_by_atom(&value, atom);
        qjs::JS_FreeAtom(ctx.as_raw().as_ptr(), atom);
        property
    };
    if ctx.has_exception() {
        return Err(rquickjs::Error::Exception);
    }
    Ok(match property {
        Property::Data(data) => data,
        _ => Value::new_undefined(ctx.clone()),
    })
}

fn is_error_like(value: &Value<'_>) -> bool {
    if value.is_error() {
        return true;
    }
    let Some(prototype) = value
        .ctx()
        .userdata::<DiagnosticIntrinsics>()
        .map(|intrinsics| intrinsics.error_prototype.clone())
    else {
        return false;
    };
    let mut owner = value.clone();
    for _ in 0..MAX_PROTOTYPES {
        if !safe_object(&owner) {
            return false;
        }
        if &owner == prototype.as_value() {
            return true;
        }
        owner = unsafe {
            Value::from_raw(
                owner.ctx().clone(),
                qjs::JS_GetPrototype(owner.ctx().as_raw().as_ptr(), owner.as_raw()),
            )
        };
    }
    false
}

fn data_property<'js>(value: &Value<'js>, name: &CStr) -> Option<Value<'js>> {
    let mut owner = value.clone();
    for _ in 0..MAX_PROTOTYPES {
        if !safe_object(&owner) {
            return None;
        }
        match own_property(&owner, name) {
            Property::Data(data) => return Some(data),
            Property::Accessor => return None,
            Property::Absent => {}
        }
        // Ordinary objects and native Errors have no prototype exotic method.
        owner = unsafe {
            Value::from_raw(
                owner.ctx().clone(),
                qjs::JS_GetPrototype(owner.ctx().as_raw().as_ptr(), owner.as_raw()),
            )
        };
    }
    None
}

fn primitive(value: &Value<'_>) -> String {
    if let Some(text) = bounded_string(value, MAX_FIELD_LENGTH) {
        text
    } else if value.is_undefined() {
        "undefined".to_owned()
    } else if value.is_null() {
        "null".to_owned()
    } else if let Some(boolean) = value.as_bool() {
        boolean.to_string()
    } else if let Some(number) = value.as_number() {
        if number.is_infinite() {
            if number.is_sign_positive() {
                "Infinity"
            } else {
                "-Infinity"
            }
            .to_owned()
        } else if number == 0.0 {
            "0".to_owned()
        } else {
            number.to_string()
        }
    } else if value.is_proxy() {
        "<Proxy>".to_owned()
    } else if value.is_big_int() {
        "<BigInt>".to_owned()
    } else if value.is_symbol() {
        "<Symbol>".to_owned()
    } else {
        "<object>".to_owned()
    }
}

fn native_error(value: &Value<'_>) -> Option<String> {
    if !is_error_like(value) {
        return None;
    }
    let name = data_property(value, c"name")
        .as_ref()
        .and_then(|name| bounded_string(name, MAX_FIELD_LENGTH))
        .unwrap_or_else(|| "Error".to_owned());
    let message = data_property(value, c"message")
        .as_ref()
        .and_then(|message| bounded_string(message, MAX_FIELD_LENGTH))
        .unwrap_or_else(|| "<message unavailable>".to_owned());
    let header = match (name.is_empty(), message.is_empty()) {
        (true, _) => message,
        (_, true) => name,
        _ => format!("{name}: {message}"),
    };
    // Clone and release userdata/RefCell guards before any engine call.
    let stack_readers = value
        .ctx()
        .userdata::<DiagnosticIntrinsics>()
        .map(|intrinsics| {
            (
                intrinsics.host_stack.borrow().clone(),
                intrinsics.native_stack.clone(),
            )
        });
    let stack = stack_readers.and_then(|(host, native)| {
        host.and_then(|reader| {
            let result = reader.call::<_, Value>((value,)).ok();
            // Never carry a reader failure into the pristine native fallback.
            if value.ctx().has_exception() {
                drop(value.ctx().catch());
            }
            let result = result?;
            // The captured private reader returns its own two-element array;
            // both elements are own data properties, inaccessible to user code.
            let tuple = result.as_array()?;
            let text = tuple.get::<Value>(0).ok()?;
            let prepared = tuple.get::<bool>(1).ok()?;
            Some((bounded_string(&text, MAX_STACK_LENGTH)?, prepared))
        })
        .or_else(|| {
            if value.ctx().has_exception() {
                drop(value.ctx().catch());
            }
            // This pristine QuickJS getter reads only native [[ErrorData]],
            // including VM Errors without the main realm's private state.
            if !value.is_error() {
                return None;
            }
            native
                .call::<_, Value>((This(value.clone()),))
                .ok()
                .and_then(|stack| bounded_string(&stack, MAX_STACK_LENGTH))
                .map(|stack| (stack, false))
        })
    });
    Some(match stack.filter(|(stack, _)| !stack.is_empty()) {
        Some((stack, true)) => format!("JavaScript error: {header}\nStack:\n{stack}"),
        Some((stack, false)) => format!("JavaScript error: {header}\nStack:\n{header}\n{stack}"),
        None => format!(
            "JavaScript error: {header}\nSource location unavailable: the engine supplied no usable native stack."
        ),
    })
}

fn tagged_error(value: &Value<'_>) -> Option<String> {
    let tag = data_property(value, c"tag")?;
    let tag = bounded_string(&tag, MAX_FIELD_LENGTH)?;
    Some(
        match data_property(value, c"val").filter(|value| !value.is_undefined()) {
            Some(value) => format!("Error: {tag}: {}", primitive(&value)),
            None => format!("Error: {tag}"),
        },
    )
}

pub fn format_js_exception(value: &Value<'_>) -> String {
    preserving_exception(value, || {
        native_error(value)
            .or_else(|| tagged_error(value))
            .unwrap_or_else(|| format!("JavaScript exception: {}", primitive(value)))
    })
}

pub fn try_format_js_error(value: &Value<'_>) -> Option<String> {
    preserving_exception(value, || native_error(value))
}

pub fn try_format_tagged_error(value: &Value<'_>) -> Option<String> {
    preserving_exception(value, || tagged_error(value))
}

pub fn format_caught_error(caught: CaughtError<'_>) -> String {
    match caught {
        CaughtError::Error(error) => format!("Host error: {error:?}"),
        CaughtError::Exception(error) => format_js_exception(&error.into_value()),
        CaughtError::Value(value) => format_js_exception(&value),
    }
}

#[cfg(feature = "test-observability")]
fn install_test_observability(ctx: &Ctx<'_>) -> rquickjs::Result<()> {
    fn observe<'js>(
        ctx: Ctx<'js>,
        value: Value<'js>,
        has_pending: bool,
        pending: Value<'js>,
    ) -> String {
        if has_pending {
            ctx.throw(pending.clone());
        }
        let formatted = format_js_exception(&value);
        let preserved = if has_pending {
            ctx.has_exception() && ctx.catch() == pending
        } else {
            !ctx.has_exception()
        };
        serde_json::json!({"formatted": formatted, "preserved": preserved}).to_string()
    }
    ctx.globals().set(
        "__wasm_rquickjs_test_format_exception",
        Function::new(ctx.clone(), observe)?,
    )
}
