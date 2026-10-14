//! Native ownership of the event loop and output of a one-shot process.
use super::runtime_services::{RuntimeOutputSink, RuntimeServices};
use super::terminal_process::{Signal, SignalHandle, output::NativeOutput};
use futures::task::AtomicWaker;
use rquickjs::{AsyncContext, AsyncRuntime, Ctx, Exception, Function, JsLifetime, Object, Value};
use std::cell::{Cell, RefCell};
use std::future::Future;
use std::rc::Rc;
use std::task::Poll;

#[rquickjs::module]
pub(crate) mod native_module {
    use rquickjs::Ctx;
    #[rquickjs::function]
    pub fn terminal_exit(ctx: Ctx<'_>, code: i32) -> rquickjs::Result<()> {
        if let Some(control) = crate::internal::terminal_runtime::control(&ctx)
            && control.terminal_exit_enabled()
        {
            control.stop(code);
            return crate::internal::terminal_runtime::raise_exit(&ctx);
        }
        Ok(())
    }

    #[rquickjs::function]
    pub fn terminal_uncaught(ctx: Ctx<'_>) -> rquickjs::Result<()> {
        terminal_exit(ctx, 1)
    }

    #[rquickjs::function]
    pub fn terminal_active(ctx: Ctx<'_>) -> bool {
        crate::internal::terminal_runtime::control(&ctx)
            .is_some_and(|control| control.terminal_exit_enabled())
    }

    #[rquickjs::function]
    pub fn enter_inline_child(ctx: Ctx<'_>) {
        if let Some(control) = crate::internal::terminal_runtime::control(&ctx) {
            control.enter_inline_child();
        }
    }

    #[rquickjs::function]
    pub fn leave_inline_child(ctx: Ctx<'_>) {
        if let Some(control) = crate::internal::terminal_runtime::control(&ctx) {
            control.leave_inline_child();
        }
    }

    #[qjs(declare)]
    pub fn declare(declarations: &rquickjs::module::Declarations) -> rquickjs::Result<()> {
        #[cfg(feature = "internal-test-execution")]
        declarations.declare("terminal_probe")?;
        let _ = declarations;
        Ok(())
    }

    #[qjs(evaluate)]
    pub fn evaluate<'js>(
        ctx: &rquickjs::Ctx<'js>,
        exports: &rquickjs::module::Exports<'js>,
    ) -> rquickjs::Result<()> {
        #[cfg(feature = "internal-test-execution")]
        exports.export("terminal_probe", js_terminal_probe)?;
        let _ = (ctx, exports);
        Ok(())
    }

    #[cfg(feature = "internal-test-execution")]
    #[rquickjs::function]
    pub(crate) async fn terminal_probe(ctx: Ctx<'_>, source: String) -> rquickjs::Result<String> {
        super::probe(source)
            .await
            .map_err(|message| rquickjs::Exception::throw_message(&ctx, &message))
    }
}

pub(crate) struct Control {
    active: Cell<usize>,
    running: Cell<bool>,
    inline_children: Cell<usize>,
    #[cfg(feature = "internal-test-execution")]
    post_exit_effects: Cell<usize>,
    exit: Cell<Option<i32>>,
    failure: RefCell<Option<String>>,
    wake: AtomicWaker,
    pub(crate) output: Rc<NativeOutput>,
    terminate_on_overflow: bool,
}

unsafe impl<'js> JsLifetime<'js> for Control {
    type Changed<'to> = Self;
}

impl Control {
    #[cfg(feature = "internal-test-execution")]
    pub(crate) fn new() -> Rc<Self> {
        Self::with_output_limit(8 * 1024 * 1024, false)
    }

    pub(crate) fn with_output_limit(limit: usize, terminate_on_overflow: bool) -> Rc<Self> {
        Rc::new(Self {
            active: Cell::new(0),
            running: Cell::new(false),
            inline_children: Cell::new(0),
            #[cfg(feature = "internal-test-execution")]
            post_exit_effects: Cell::new(0),
            exit: Cell::new(None),
            failure: RefCell::new(None),
            wake: AtomicWaker::new(),
            output: Rc::new(NativeOutput::new(limit, limit)),
            terminate_on_overflow,
        })
    }

    pub(crate) fn install(self: &Rc<Self>, ctx: &Ctx<'_>) {
        ctx.store_userdata(self.clone())
            .expect("terminal control already installed");
        ctx.store_userdata(SignalHandle(self.clone()))
            .expect("terminal signal already installed");
        ctx.userdata::<RuntimeServices>()
            .expect("runtime services not initialized")
            .set_output_sink(self.clone());
    }

    pub(crate) fn quiescent(&self) -> bool {
        self.active.get() == 0 && !self.running.get() && self.exit.get().is_none()
    }

    pub(crate) fn start(self: &Rc<Self>, ctx: &Ctx<'_>) -> rquickjs::Result<()> {
        if !self.quiescent() {
            return Err(Exception::throw_message(
                ctx,
                "process runtime is not quiescent",
            ));
        }
        self.output
            .reset()
            .map_err(|message| Exception::throw_message(ctx, message))?;
        ctx.userdata::<RuntimeServices>()
            .expect("runtime services not initialized")
            .set_output_sink(self.clone());
        self.running.set(true);
        ctx.globals().set(
            "__wasm_rquickjs_terminal_write",
            rquickjs::function::Func::from(write_output),
        )?;
        ctx.eval::<(), _>(r#"
            (() => {
                const write = globalThis.__wasm_rquickjs_terminal_write;
                for (const [stream, stderr] of [[process.stdout, false], [process.stderr, true]]) {
                    stream.write = (chunk, encoding, callback) => {
                        const cb = typeof encoding === 'function' ? encoding : callback;
                        const bytes = typeof chunk === 'string' ? Buffer.from(chunk, typeof encoding === 'string' ? encoding : undefined) : chunk;
                        write(stderr, bytes);
                        if (typeof cb === 'function') process.nextTick(cb, null);
                        return true;
                    };
                }
            })();
        "#)?;
        Ok(())
    }

    pub(crate) fn running(&self) -> bool {
        self.running.get()
    }

    pub(crate) fn terminal_exit_enabled(&self) -> bool {
        self.running.get() && self.inline_children.get() == 0
    }

    pub(crate) fn enter_inline_child(&self) {
        self.inline_children.set(
            self.inline_children
                .get()
                .checked_add(1)
                .expect("inline process depth overflow"),
        );
    }

    pub(crate) fn leave_inline_child(&self) {
        self.inline_children.set(
            self.inline_children
                .get()
                .checked_sub(1)
                .expect("inline process depth underflow"),
        );
    }

    pub(crate) fn stop(&self, code: i32) {
        if self.exit.get().is_none() {
            self.exit.set(Some(code));
            self.output.freeze();
        }
        self.wake.wake();
    }

    pub(crate) fn diagnostic(&self, message: String) {
        if self.exit.get().is_none() {
            let _ = self.output.append(true, message.as_bytes());
            let _ = self.output.append(true, b"\n");
            *self.failure.borrow_mut() = Some(message);
            self.stop(1);
        }
    }

    pub(crate) fn exit_code(&self) -> Option<i32> {
        self.exit.get()
    }

    #[cfg(feature = "internal-test-execution")]
    pub(crate) fn failure(&self) -> Option<String> {
        self.failure.borrow().clone()
    }

    fn check_output_limit(&self) {
        if self.terminate_on_overflow && self.output.overflowed() {
            self.stop(1);
        }
    }
}

impl Signal for Control {
    fn stopped(&self) -> bool {
        self.exit.get().is_some()
    }
    fn registered(&self) {
        self.active.set(
            self.active
                .get()
                .checked_add(1)
                .expect("process activity overflow"),
        );
    }
    fn released(&self) {
        self.active.set(
            self.active
                .get()
                .checked_sub(1)
                .expect("process activity underflow"),
        );
        self.wake.wake();
    }
    fn failed(&self, message: &'static str) {
        self.diagnostic(message.to_owned());
    }
}

impl RuntimeOutputSink for Control {
    fn write_stdout(&self, data: &str) {
        let _ = self.output.append(false, data.as_bytes());
        self.check_output_limit();
    }
    fn write_stderr(&self, data: &str) {
        let _ = self.output.append(true, data.as_bytes());
        self.check_output_limit();
    }
    fn is_component_output(&self) -> bool {
        false
    }
}

pub(crate) fn control(ctx: &Ctx<'_>) -> Option<Rc<Control>> {
    ctx.userdata::<Rc<Control>>().map(|value| (*value).clone())
}

pub(crate) fn stopped(ctx: &Ctx<'_>) -> bool {
    control(ctx).is_some_and(|control| control.exit_code().is_some())
}

fn write_output<'js>(
    ctx: Ctx<'js>,
    stderr: bool,
    data: rquickjs::TypedArray<'js, u8>,
) -> rquickjs::Result<()> {
    let control = control(&ctx).expect("terminal output without its owner");
    let bytes = data
        .as_bytes()
        .ok_or_else(|| Exception::throw_type(&ctx, "output buffer is detached"))?;
    control
        .output
        .append(stderr, bytes)
        .map_err(|message| Exception::throw_message(&ctx, message))?;
    control.check_output_limit();
    if control.exit_code().is_some() {
        return raise_exit(&ctx);
    }
    Ok(())
}

pub(crate) fn raise_exit(ctx: &Ctx<'_>) -> rquickjs::Result<()> {
    // QuickJS's existing uncatchable exception boundary prevents catch/finally
    // from resuming a terminated process. Create only the intrinsic object:
    // setting an Error property can invoke an inherited user setter after exit.
    unsafe {
        let value = Value::from_raw(
            ctx.clone(),
            rquickjs::qjs::JS_NewError(ctx.as_raw().as_ptr()),
        );
        if value.is_exception() {
            return Err(rquickjs::Error::Exception);
        }
        rquickjs::qjs::JS_SetUncatchableError(ctx.as_raw().as_ptr(), value.as_raw());
        Err(ctx.throw(value))
    }
}

pub(crate) fn diagnose(ctx: &Ctx<'_>, control: &Control, error: rquickjs::Error) {
    let exception = ctx.catch();
    if control.exit_code().is_some() {
        return;
    }
    // Keep potentially user-controlled getters and coercion inside one JS call.
    // An uncatchable exit aborts that call; Rust performs no further JS entry.
    let text = (|| {
        let format: Function = ctx
            .eval("error => { const stack = error == null ? undefined : error.stack; return String(stack == null ? error : stack); }")?;
        if control.exit_code().is_some() {
            return Err(rquickjs::Error::Exception);
        }
        format.call::<_, String>((exception,))
    })();
    if control.exit_code().is_some() {
        let _ = ctx.catch();
        return;
    }
    match text {
        Ok(text) => control.diagnostic(text),
        Err(_) => {
            let _ = ctx.catch();
            control.diagnostic(format!("process failed: {error}"));
        }
    }
}

pub(crate) fn script_error(ctx: &Ctx<'_>, control: &Control, error: rquickjs::Error) {
    if control.exit_code().is_some() {
        let _ = ctx.catch();
        return;
    }
    if !matches!(error, rquickjs::Error::Exception) {
        diagnose(ctx, control, error);
        return;
    }
    let exception = ctx.catch();
    let handler = ctx
        .globals()
        .get::<_, Function>("__wasm_rquickjs_handleUncaughtError");
    if control.exit_code().is_some() {
        return;
    }
    match handler.and_then(|handler| handler.call::<_, ()>((exception,))) {
        Ok(()) => {}
        Err(error) => diagnose(ctx, control, error),
    }
}

pub(crate) fn checkpoint(ctx: &Ctx<'_>) -> rquickjs::Result<bool> {
    let control = control(ctx).expect("terminal checkpoint without its owner");
    let mut did_work = false;
    loop {
        if control.exit_code().is_some() {
            return raise_exit(ctx).map(|()| did_work);
        }
        let drained_ticks = if let Ok(next_ticks) = ctx
            .globals()
            .get::<_, Function>("__wasm_rquickjs_drainNextTick")
        {
            if control.exit_code().is_some() {
                return raise_exit(ctx).map(|()| did_work);
            }
            next_ticks.call::<_, usize>(())?
        } else {
            0
        };
        did_work |= drained_ticks != 0;
        let rt = unsafe { rquickjs::qjs::JS_GetRuntime(ctx.as_raw().as_ptr()) };
        let mut jobs = 0;
        loop {
            if control.exit_code().is_some() {
                return raise_exit(ctx).map(|()| did_work);
            }
            let mut job_ctx = std::ptr::null_mut();
            let result = unsafe { rquickjs::qjs::JS_ExecutePendingJob(rt, &mut job_ctx) };
            if result < 0 {
                return Err(rquickjs::Error::Exception);
            }
            if result == 0 {
                break;
            }
            jobs += 1;
        }
        did_work |= jobs != 0;
        if control.exit_code().is_some() {
            return raise_exit(ctx).map(|()| did_work);
        }
        let emitted = match ctx
            .globals()
            .get::<_, Function>("__wasm_rquickjs_unhandled_rejection_checkpoint")
        {
            Ok(checkpoint) => {
                if control.exit_code().is_some() {
                    return raise_exit(ctx).map(|()| did_work);
                }
                checkpoint.call::<_, usize>(())?
            }
            Err(_) => 0,
        };
        if emitted == 0 && jobs == 0 && drained_ticks == 0 {
            return Ok(did_work);
        }
        did_work = true;
    }
}

/// The caller owns the runtime exclusively and releases every retained JS handle
/// before destroying it. This driver must never run beside idle()/drive().
pub(crate) async fn drive(rt: &AsyncRuntime, ctx: &AsyncContext, control: &Rc<Control>) {
    loop {
        if control.exit_code().is_some() {
            break;
        }
        ctx.with(|ctx| {
            if let Err(error) = checkpoint(&ctx) {
                diagnose(&ctx, control, error);
            }
            let services = ctx
                .userdata::<RuntimeServices>()
                .expect("runtime services not initialized");
            let timers = &services.timers;
            let timer_count = timers.abort_handles.borrow().len();
            let unref_count = timers.unrefed_timers.borrow().len();
            if timer_count != 0 && timer_count == unref_count && control.active.get() == timer_count
            {
                timers.abort_unrefed();
            }
        })
        .await;
        if control.exit_code().is_some() {
            break;
        }
        let result = futures::future::poll_fn(|cx| {
            control.wake.register(cx.waker());
            if control.exit_code().is_some() {
                return Poll::Ready(Ok(false));
            }
            let mut driver = std::pin::pin!(rt.execute_pending_job());
            match driver.as_mut().poll(cx) {
                Poll::Ready(Ok(false))
                    if control.exit_code().is_none() && control.active.get() != 0 =>
                {
                    Poll::Pending
                }
                result => result,
            }
        })
        .await;
        match result {
            Ok(false) => break,
            Ok(true) => {}
            Err(_) => {
                ctx.with(|ctx| {
                    diagnose(&ctx, control, rquickjs::Error::Exception);
                })
                .await;
            }
        }
    }
}

pub(crate) fn natural_exit(ctx: &Ctx<'_>, control: &Control) -> rquickjs::Result<()> {
    let process: Object = ctx.globals().get("process")?;
    let code = process.get::<_, Option<i32>>("exitCode")?.unwrap_or(0);
    process.set("_exiting", true)?;
    let emit: Function = process.get("emit")?;
    emit.call::<_, Value>((rquickjs::function::This(process), "exit", code))?;
    control.stop(code);
    Ok(())
}

pub(crate) async fn finish(rt: &AsyncRuntime, ctx: &AsyncContext, control: &Rc<Control>) {
    loop {
        drive(rt, ctx, control).await;
        if control.exit_code().is_some() {
            return;
        }
        ctx.with(|ctx| {
            let result = (|| {
                let process: Object = ctx.globals().get("process")?;
                let code = process.get::<_, Option<i32>>("exitCode")?.unwrap_or(0);
                let emit: Function = process.get("emit")?;
                emit.call::<_, Value>((rquickjs::function::This(process), "beforeExit", code))?;
                checkpoint(&ctx)?;
                if control.active.get() == 0 && control.exit_code().is_none() {
                    natural_exit(&ctx, control)?;
                }
                Ok::<(), rquickjs::Error>(())
            })();
            if let Err(error) = result {
                diagnose(&ctx, control, error);
            }
        })
        .await;
        if control.exit_code().is_some() {
            return;
        }
    }
}

#[cfg(feature = "internal-test-execution")]
pub(crate) async fn probe(source: String) -> Result<String, String> {
    use super::terminal_process::output::OutputTransport;
    struct Capture(RefCell<Vec<u8>>, RefCell<Vec<u8>>);
    impl OutputTransport for Capture {
        async fn finish(&self, stdout: Vec<u8>, stderr: Vec<u8>) -> Result<(), String> {
            *self.0.borrow_mut() = stdout;
            *self.1.borrow_mut() = stderr;
            Ok(())
        }
    }
    let ledger = Rc::new(super::terminal_process::admission::Ledger::default());
    let export = ledger.enter().map_err(str::to_owned)?;
    let bootstrap = ledger.retain().map_err(str::to_owned)?;
    let runtime = super::runtime_services::OwnedJsRuntime::new().await;
    let control = Control::new();
    runtime.ctx.with(|ctx| control.install(&ctx)).await;
    runtime.initialize_node_builtins().await?;
    drop(bootstrap);
    let lease = export
        .lease(control.quiescent() && !runtime.rt.is_job_pending().await)
        .map_err(str::to_owned)?;
    assert!(ledger.enter().is_err());
    runtime
        .ctx
        .with(|ctx| {
            control.start(&ctx)?;
            let effects = control.clone();
            ctx.globals().set(
                "probeMutation",
                rquickjs::function::Func::from(move || {
                    if effects.exit_code().is_some() {
                        effects
                            .post_exit_effects
                            .set(effects.post_exit_effects.get() + 1);
                    }
                }),
            )?;
            if let Err(error) = ctx.eval::<Value, _>(source) {
                diagnose(&ctx, &control, error);
            }
            Ok::<(), rquickjs::Error>(())
        })
        .await
        .map_err(|error| error.to_string())?;
    finish(&runtime.rt, &runtime.ctx, &control).await;
    let weak = runtime.rt.weak();
    let super::runtime_services::OwnedJsRuntime { rt, ctx } = runtime;
    drop(ctx);
    drop(rt);
    let released = weak.try_ref().is_none();
    if !released {
        return Err("terminal process retained its runtime".to_string());
    }
    let capture = Capture(RefCell::new(Vec::new()), RefCell::new(Vec::new()));
    let status = control
        .output
        .begin(control.exit_code().unwrap_or(0))
        .map_err(str::to_owned)?
        .finish(&capture)
        .await?;
    drop(lease);
    assert!(ledger.enter().is_err());
    Ok(serde_json::json!({
        "exitCode": status.exit_code, "stdout": *capture.0.borrow(), "stderr": *capture.1.borrow(),
        "runtimeReleased": released, "failure": control.failure(), "postExitEffects": control.post_exit_effects.get(), "phase": control.output.phase(),
    })
    .to_string())
}
