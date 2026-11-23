//! The runtime's only QuickJS promise hook, shared by every consumer.
//!
//! QuickJS has one promise-hook slot per runtime, so a consumer that installed its own hook would
//! replace every other consumer's. This module owns the slot: it installs one dispatcher per
//! runtime and forwards each event to every registered consumer in registration order. Consumers
//! such as custom invocation contexts register here and never call `JS_SetPromiseHook` themselves.
//!
//! The dispatcher is installed on a runtime only when a consumer asks for it, so a runtime whose
//! consumers never need promise events pays nothing for them.

use rquickjs::{Ctx, JsLifetime, qjs};
use std::cell::{Cell, RefCell};

/// A promise hook event: the hook type, the promise, and, for `JS_PROMISE_HOOK_INIT`, its parent
/// promise or `undefined`.
pub(crate) type Consumer = fn(qjs::JSPromiseHookType, qjs::JSValue, qjs::JSValue);

thread_local! {
    static CONSUMERS: RefCell<Vec<Consumer>> = const { RefCell::new(Vec::new()) };
    /// Whether a consumer asked for the dispatcher, so runtimes created later install it from
    /// their start.
    static WANTED: Cell<bool> = const { Cell::new(false) };
}

/// Per-runtime state.
#[derive(JsLifetime)]
struct RuntimeHook {
    installed: Cell<bool>,
}

pub(crate) fn initialize(ctx: &Ctx<'_>) {
    ctx.store_userdata(RuntimeHook {
        installed: Cell::new(false),
    })
    .expect("Failed to initialize promise hook state");
    if WANTED.get() {
        install(ctx);
    }
}

/// Adds `consumer`, once, and installs the dispatcher on `ctx`'s runtime and on every runtime
/// created later.
pub(crate) fn register(ctx: &Ctx<'_>, consumer: Consumer) {
    CONSUMERS.with_borrow_mut(|consumers| {
        if !consumers
            .iter()
            .any(|existing| std::ptr::fn_addr_eq(*existing, consumer))
        {
            consumers.push(consumer);
        }
    });
    WANTED.set(true);
    install(ctx);
}

fn install(ctx: &Ctx<'_>) {
    let state = ctx
        .userdata::<RuntimeHook>()
        .expect("promise hook state not initialized");
    if state.installed.replace(true) {
        return;
    }
    // Installed through the C API because the safe rquickjs setter needs the runtime lock, which
    // the calling JavaScript already holds.
    unsafe {
        let rt = qjs::JS_GetRuntime(ctx.as_raw().as_ptr());
        qjs::JS_SetPromiseHook(rt, Some(dispatch), std::ptr::null_mut());
    }
}

unsafe extern "C" fn dispatch(
    _ctx: *mut qjs::JSContext,
    hook_type: qjs::JSPromiseHookType,
    promise: qjs::JSValue,
    parent: qjs::JSValue,
    _opaque: *mut std::ffi::c_void,
) {
    // A consumer may register another consumer from its callback, so no borrow is held while a
    // consumer runs.
    let mut index = 0;
    while let Some(consumer) = CONSUMERS.with_borrow(|consumers| consumers.get(index).copied()) {
        consumer(hook_type, promise, parent);
        index += 1;
    }
}

/// A second promise hook consumer for tests: a minimal `AsyncLocalStorage`-style store whose
/// numeric value follows promise reactions. JavaScript sees it as
/// `globalThis.__wasm_rquickjs_test_context_store` with `enable()`, `set(value)` and `get()`.
#[cfg(feature = "test-observability")]
pub(crate) mod test_context_store {
    use rquickjs::{Ctx, Function, Object, qjs};
    use std::cell::{Cell, RefCell};
    use std::collections::HashMap;

    thread_local! {
        static CURRENT: Cell<f64> = const { Cell::new(0.0) };
        static BY_PROMISE: RefCell<HashMap<usize, f64>> = RefCell::new(HashMap::new());
        static STACK: RefCell<Vec<f64>> = const { RefCell::new(Vec::new()) };
    }

    fn consumer(hook_type: qjs::JSPromiseHookType, promise: qjs::JSValue, _parent: qjs::JSValue) {
        let address = unsafe { qjs::JS_VALUE_GET_PTR(promise) } as usize;
        match hook_type {
            qjs::JSPromiseHookType_JS_PROMISE_HOOK_INIT => {
                BY_PROMISE.with_borrow_mut(|values| values.insert(address, CURRENT.get()));
            }
            qjs::JSPromiseHookType_JS_PROMISE_HOOK_BEFORE => {
                let value = BY_PROMISE
                    .with_borrow(|values| values.get(&address).copied())
                    .unwrap_or(0.0);
                STACK.with_borrow_mut(|stack| stack.push(CURRENT.replace(value)));
            }
            qjs::JSPromiseHookType_JS_PROMISE_HOOK_AFTER => {
                if let Some(previous) = STACK.with_borrow_mut(|stack| stack.pop()) {
                    CURRENT.set(previous);
                }
            }
            _ => {}
        }
    }

    pub(crate) fn install(ctx: &Ctx<'_>) -> rquickjs::Result<()> {
        let store = Object::new(ctx.clone())?;
        store.set(
            "enable",
            Function::new(ctx.clone(), |ctx: Ctx<'_>| {
                super::register(&ctx, consumer);
            })?,
        )?;
        store.set(
            "set",
            Function::new(ctx.clone(), |value: f64| CURRENT.set(value))?,
        )?;
        store.set("get", Function::new(ctx.clone(), || CURRENT.get())?)?;
        ctx.globals()
            .set("__wasm_rquickjs_test_context_store", store)
    }
}
