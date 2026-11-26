//! The abort signal of generated async imports (`wasm-rquickjs:import-abort`).
//!
//! `withSignal(signal, fn)` makes `signal` current while `fn` runs synchronously. Every generated
//! async import bridge that JavaScript calls meanwhile takes the current signal with it. When the
//! signal aborts before the import finishes, the import's promise rejects with `signal.reason`
//! and the bridge drops the import future. Dropping a started import cancels its component-model
//! subtask, so the host stops the call or learns that its caller stopped waiting.

use rquickjs::{Ctx, JsLifetime, Value};
use std::cell::RefCell;
use std::future::Future;

/// Per-runtime state: the signal that async imports called now take with them.
#[derive(JsLifetime)]
pub(crate) struct ImportSignal<'js> {
    current: RefCell<Option<Value<'js>>>,
}

pub(crate) fn initialize(ctx: &Ctx<'_>) -> rquickjs::Result<()> {
    ctx.store_userdata(ImportSignal {
        current: RefCell::new(None),
    })
    .expect("Failed to initialize import abort state");
    Ok(())
}

fn state<'a, 'js>(ctx: &'a Ctx<'js>) -> rquickjs::runtime::UserDataGuard<'a, ImportSignal<'js>> {
    ctx.userdata::<ImportSignal>()
        .expect("import abort state not initialized")
}

/// Makes `signal` current and returns the signal that was current. `undefined` and `null` clear
/// it.
pub(crate) fn enter<'js>(ctx: &Ctx<'js>, signal: Value<'js>) -> Option<Value<'js>> {
    let signal = (!signal.is_undefined() && !signal.is_null()).then_some(signal);
    state(ctx).current.replace(signal)
}

/// Restores the signal that [`enter`] returned.
pub(crate) fn leave<'js>(ctx: &Ctx<'js>, previous: Option<Value<'js>>) {
    state(ctx).current.replace(previous);
}

fn current<'js>(ctx: &Ctx<'js>) -> Option<Value<'js>> {
    state(ctx).current.borrow().clone()
}

/// The JavaScript promise a generated async import bridge returns.
pub type AbortableImport<'js, T> =
    super::custom_invocation_context::ScopedImport<'js, rquickjs::Result<T>>;

/// Builds the result of a generated async import bridge. The bridge calls it in the synchronous
/// part of the JavaScript call, so the import runs in the scope of its caller and takes the
/// signal that is current now. A signal that is already aborted when the import would start
/// rejects the promise without starting the import.
pub fn abortable_import<'js, T: 'js>(
    ctx: &Ctx<'js>,
    future: impl Future<Output = rquickjs::Result<T>> + 'js,
) -> AbortableImport<'js, T> {
    match current(ctx) {
        None => super::custom_invocation_context::scoped_import(future),
        Some(signal) => {
            let ctx = ctx.clone();
            super::custom_invocation_context::scoped_import(async move {
                crate::builtin::with_abort_signal(&ctx, Some(signal), future).await
            })
        }
    }
}

/// The signal a deferred import bridge (an async import with `future<T>` / `stream<T>`
/// parameters) takes with it. Its import runs on its own task, so the bridge registers the abort
/// listener while a `Ctx` is available and aborts the task's import future from it.
pub struct DeferredImportSignal {
    signal: rquickjs::Persistent<rquickjs::Object<'static>>,
    callback: rquickjs::Persistent<rquickjs::Function<'static>>,
}

/// The signal that is current when a deferred import bridge is called.
pub enum DeferredImportAbort<'js> {
    /// No signal is current.
    None,
    /// The signal already aborted: the bridge rejects with this reason, lowers no parameter and
    /// starts no import.
    Aborted(Value<'js>),
    /// The bridge lowers its parameters, then arms the signal with [`arm_deferred_import_abort`].
    Current(rquickjs::Object<'js>),
}

/// What a deferred import bridge does after it lowered its parameters.
pub enum ArmedImportAbort<'js> {
    /// The signal aborted while the parameters were lowered: the bridge rejects with this reason
    /// and starts no import.
    Aborted(Value<'js>),
    /// The import future must run inside `futures::future::Abortable` with this registration.
    Armed(DeferredImportSignal, futures::future::AbortRegistration),
}

/// Takes the current signal for a deferred import bridge.
pub fn deferred_import_abort<'js>(ctx: &Ctx<'js>) -> rquickjs::Result<DeferredImportAbort<'js>> {
    let Some(signal) = current(ctx) else {
        return Ok(DeferredImportAbort::None);
    };
    let signal = rquickjs::Object::from_value(signal)?;
    if signal.get::<_, bool>("aborted")? {
        return Ok(DeferredImportAbort::Aborted(signal.get("reason")?));
    }
    Ok(DeferredImportAbort::Current(signal))
}

/// Registers the abort listener of a deferred import. The bridge calls it after it lowered its
/// parameters and before it starts the import, so a lowering error leaves no listener on the
/// signal, and an abort that arrives before the import starts still prevents the import.
pub fn arm_deferred_import_abort<'js>(
    ctx: &Ctx<'js>,
    signal: rquickjs::Object<'js>,
) -> rquickjs::Result<ArmedImportAbort<'js>> {
    use rquickjs::function::This;
    if signal.get::<_, bool>("aborted")? {
        return Ok(ArmedImportAbort::Aborted(signal.get("reason")?));
    }
    let (handle, registration) = futures::future::AbortHandle::new_pair();
    let callback = rquickjs::Function::new(ctx.clone(), move || handle.abort())?;
    let options = rquickjs::Object::new(ctx.clone())?;
    options.set("once", true)?;
    let add: rquickjs::Function = signal.get("addEventListener")?;
    add.call::<_, ()>((This(signal.clone()), "abort", callback.clone(), options))?;
    Ok(ArmedImportAbort::Armed(
        DeferredImportSignal {
            signal: rquickjs::Persistent::save(ctx, signal),
            callback: rquickjs::Persistent::save(ctx, callback),
        },
        registration,
    ))
}

impl DeferredImportSignal {
    /// Removes the abort listener once the import settled. Returns the signal's reason when the
    /// import was aborted.
    pub fn finish<'js>(
        self,
        ctx: &Ctx<'js>,
        aborted: bool,
    ) -> rquickjs::Result<Option<Value<'js>>> {
        use rquickjs::function::This;
        let signal = self.signal.restore(ctx)?;
        let callback = self.callback.restore(ctx)?;
        let remove: rquickjs::Function = signal.get("removeEventListener")?;
        let _ = remove.call::<_, ()>((This(signal.clone()), "abort", callback));
        if aborted {
            Ok(Some(signal.get("reason")?))
        } else {
            Ok(None)
        }
    }
}
