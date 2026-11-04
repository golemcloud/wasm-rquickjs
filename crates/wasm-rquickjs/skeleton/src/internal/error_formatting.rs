//! Bounded host diagnostics. Inspecting a thrown value must not execute it.

use rquickjs::function::This;
use rquickjs::{CaughtError, Ctx, Function, JsLifetime, Object, Value, qjs};
use std::cell::RefCell;
use std::ffi::CStr;
use std::mem::MaybeUninit;

const MAX_FIELD_LENGTH: i64 = 4096;
const MAX_STACK_LENGTH: i64 = 16 * 1024;
const MAX_PROTOTYPES: usize = 8;
const MAX_SUMMARY_DEPTH: usize = 2;
const MAX_SUMMARY_PROPERTIES: usize = 16;
const MAX_SUMMARY_BYTES: usize = 4096;

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

fn safe_array(value: &Value<'_>) -> bool {
    value.is_object()
        && !value.is_proxy()
        && value
            .ctx()
            .userdata::<DiagnosticIntrinsics>()
            .is_some_and(|intrinsics| unsafe {
                qjs::JS_GetClassID(value.as_raw()) == intrinsics.array_class
            })
}

enum Property<'js> {
    Absent,
    Accessor { getter: bool, setter: bool },
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
        let getter = Value::from_raw(ctx.clone(), descriptor.getter);
        let setter = Value::from_raw(ctx.clone(), descriptor.setter);
        if descriptor.flags & qjs::JS_PROP_GETSET as i32 != 0 {
            Property::Accessor {
                getter: !getter.is_undefined(),
                setter: !setter.is_undefined(),
            }
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
    if !safe_object(&value) && !safe_array(&value) {
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
            Property::Accessor { .. } => return None,
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
    } else if value.is_function() {
        "<Function>".to_owned()
    } else {
        "<object>".to_owned()
    }
}

fn error_header(value: &Value<'_>) -> Option<String> {
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
    Some(match (name.is_empty(), message.is_empty()) {
        (true, _) => message,
        (_, true) => name,
        _ => format!("{name}: {message}"),
    })
}

fn native_error(value: &Value<'_>) -> Option<String> {
    let header = error_header(value)?;
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

/// Own-key discovery is engine-proportional, not constant-space/time. It never
/// invokes application code on the admitted ordinary class. Keep its native
/// table under RAII, render only a small subset, and fall back on engine OOM.
struct OwnKeys<'js> {
    ctx: Ctx<'js>,
    table: *mut qjs::JSPropertyEnum,
    length: u32,
}

impl<'js> OwnKeys<'js> {
    fn new(value: &Value<'js>) -> Option<Self> {
        let mut table = std::ptr::null_mut();
        let mut length = 0;
        let found = unsafe {
            qjs::JS_GetOwnPropertyNames(
                value.ctx().as_raw().as_ptr(),
                &mut table,
                &mut length,
                value.as_raw(),
                (qjs::JS_GPN_STRING_MASK | qjs::JS_GPN_ENUM_ONLY) as i32,
            )
        };
        if found < 0 {
            return None;
        }
        Some(Self {
            ctx: value.ctx().clone(),
            table,
            length,
        })
    }

    fn atom(&self, index: u32) -> qjs::JSAtom {
        // The caller only visits indices below the successful native length.
        unsafe { (*self.table.add(index as usize)).atom }
    }
}

impl Drop for OwnKeys<'_> {
    fn drop(&mut self) {
        unsafe { qjs::JS_FreePropertyEnum(self.ctx.as_raw().as_ptr(), self.table, self.length) };
    }
}

struct Summary<'js> {
    text: String,
    ancestors: Vec<Value<'js>>,
    remaining: usize,
    truncated: bool,
    failed: bool,
}

impl<'js> Summary<'js> {
    fn push(&mut self, text: &str) {
        if self.truncated {
            return;
        }
        let remaining = (MAX_SUMMARY_BYTES - '…'.len_utf8()).saturating_sub(self.text.len());
        let mut end = text.len().min(remaining);
        while !text.is_char_boundary(end) {
            end -= 1;
        }
        self.text.push_str(&text[..end]);
        self.truncated = end != text.len();
    }

    fn property(&mut self, owner: &Value<'js>, property: Property<'js>, depth: usize) {
        if owner.ctx().has_exception() {
            self.failed = true;
            self.push("<inspection unavailable>");
            return;
        }
        match property {
            Property::Data(value) => self.value(&value, depth),
            Property::Accessor { getter, setter } => self.push(match (getter, setter) {
                (true, true) => "[Getter/Setter]",
                (true, false) => "[Getter]",
                (false, true) => "[Setter]",
                (false, false) => "undefined",
            }),
            Property::Absent => self.push("[empty]"),
        }
    }

    fn value(&mut self, value: &Value<'js>, depth: usize) {
        if self.truncated || self.failed {
            return;
        }
        if !value.is_object() || value.is_proxy() {
            let text = primitive(value);
            if depth > 0 && value.is_string() {
                self.push(&format!("{text:?}"));
            } else {
                self.push(&text);
            }
            if value.ctx().has_exception() {
                self.failed = true;
            }
            return;
        }
        if let Some(header) = error_header(value) {
            self.push(&header);
            if value.ctx().has_exception() {
                self.failed = true;
            }
            return;
        }
        if value.ctx().has_exception() {
            self.failed = true;
            self.push("<inspection unavailable>");
            return;
        }
        let array = safe_array(value);
        if !array && !safe_object(value) {
            self.push(&primitive(value));
            return;
        }
        if self.ancestors.iter().any(|ancestor| ancestor == value) {
            self.push("[Circular]");
            return;
        }
        if depth >= MAX_SUMMARY_DEPTH || self.remaining == 0 {
            self.push(if array { "[…]" } else { "{…}" });
            return;
        }
        self.ancestors.push(value.clone());
        if array {
            self.array(value, depth);
        } else {
            self.record(value, depth);
        }
        self.ancestors.pop();
    }

    fn array(&mut self, value: &Value<'js>, depth: usize) {
        let length = own_property(value, c"length");
        if value.ctx().has_exception() {
            self.failed = true;
            self.push("<array unavailable>");
            return;
        }
        let Property::Data(length) = length else {
            self.failed = true;
            self.push("<array unavailable>");
            return;
        };
        let Some(length) = length.as_number() else {
            self.push("<array unavailable>");
            return;
        };
        // A genuine Array has a native uint32 length, including sparse arrays.
        let length = length as u64;
        self.push("[");
        let mut index = 0;
        while index < length && self.remaining > 0 && !self.truncated && !self.failed {
            if index > 0 {
                self.push(", ");
            }
            self.remaining -= 1;
            let atom =
                unsafe { qjs::JS_NewAtomUInt32(value.ctx().as_raw().as_ptr(), index as u32) };
            if atom == qjs::JS_ATOM_NULL {
                self.failed = true;
                self.push("<inspection unavailable>");
                break;
            }
            let property = property_by_atom(value, atom);
            unsafe { qjs::JS_FreeAtom(value.ctx().as_raw().as_ptr(), atom) };
            self.property(value, property, depth + 1);
            index += 1;
        }
        if index < length {
            self.push(if index == 0 { "…" } else { ", …" });
        }
        self.push("]");
    }

    fn record(&mut self, value: &Value<'js>, depth: usize) {
        let Some(keys) = OwnKeys::new(value) else {
            self.failed = true;
            self.push("<object: keys unavailable>");
            return;
        };
        self.push("{");
        let mut index = 0;
        while index < keys.length && self.remaining > 0 && !self.truncated && !self.failed {
            if index > 0 {
                self.push(", ");
            }
            self.remaining -= 1;
            let atom = keys.atom(index);
            let key = unsafe {
                Value::from_raw(
                    value.ctx().clone(),
                    qjs::JS_AtomToString(value.ctx().as_raw().as_ptr(), atom),
                )
            };
            let Some(key) = bounded_string(&key, 256) else {
                self.failed = true;
                self.push("<key unavailable>");
                break;
            };
            self.push(&format!("{key:?}: "));
            if !self.truncated {
                self.property(value, property_by_atom(value, atom), depth + 1);
            }
            index += 1;
        }
        if index < keys.length {
            self.push(if index == 0 { "…" } else { ", …" });
        }
        self.push("}");
    }
}

fn summary<'js>(value: &Value<'js>) -> String {
    let mut summary = Summary {
        text: String::new(),
        ancestors: Vec::with_capacity(MAX_SUMMARY_DEPTH),
        remaining: MAX_SUMMARY_PROPERTIES,
        truncated: false,
        failed: false,
    };
    summary.value(value, 0);
    if summary.truncated {
        summary.text.push('…');
    }
    summary.text
}

fn tagged_error(value: &Value<'_>) -> Option<String> {
    let tag = data_property(value, c"tag")?;
    let tag = bounded_string(&tag, MAX_FIELD_LENGTH)?;
    Some(
        match data_property(value, c"val").filter(|value| !value.is_undefined()) {
            Some(value) => format!("Error: {tag}: {}", summary(&value)),
            None => format!("Error: {tag}"),
        },
    )
}

pub fn format_js_exception(value: &Value<'_>) -> String {
    preserving_exception(value, || {
        native_error(value)
            .or_else(|| tagged_error(value))
            .unwrap_or_else(|| format!("JavaScript exception: {}", summary(value)))
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
