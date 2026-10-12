//! Bounded no-fork proof, not production node:process or a Golem tool provider.
//! Every run owns one runtime. Rust returns the status/output; terminated JS
//! is never resumed. All dependencies come from the unpatched registry.
use futures::task::AtomicWaker;
use rquickjs::{
    AsyncContext, AsyncRuntime, Ctx, Exception, Function, JsLifetime, Persistent, Promise, Value,
    function::Func,
};
use std::{
    cell::{Cell, RefCell},
    collections::VecDeque,
    future::Future,
    pin::Pin,
    rc::Rc,
    task::{Context, Poll, Waker},
    time::Instant,
};

#[path = "../../../crates/wasm-rquickjs/skeleton/src/internal/terminal_process.rs"]
mod terminal_process;
use terminal_process::output as native_output;
#[path = "../../../crates/wasm-rquickjs/skeleton/src/internal/terminal_bindings.rs"]
mod terminal_bindings;

use terminal_bindings as terminal_rquickjs;

#[rquickjs::module(crate = "terminal_rquickjs")]
mod macro_fixture {
    use super::terminal_rquickjs;
    use rquickjs::Ctx;

    #[rquickjs::function(crate = "terminal_rquickjs")]
    pub async fn exit_after_ready(ctx: Ctx<'_>) -> super::Converted {
        let state = ctx.userdata::<std::rc::Rc<super::State>>().unwrap().clone();
        let _ = super::native_exit(ctx.clone(), 7);
        let _ = ctx.catch();
        super::Converted(state)
    }

    #[rquickjs::function(crate = "terminal_rquickjs")]
    pub async fn ready() -> u32 {
        1
    }

    #[rquickjs::function]
    pub async fn stock_ready() -> u32 {
        1
    }
}

#[derive(rquickjs::class::Trace, JsLifetime)]
#[rquickjs::class]
struct MacroCounter {
    value: u32,
}

#[rquickjs::methods(crate = "terminal_rquickjs")]
impl MacroCounter {
    #[qjs(constructor)]
    pub fn new() -> Self {
        Self { value: 40 }
    }

    pub async fn add(&mut self) -> u32 {
        futures::future::ready(()).await;
        self.value += 1;
        self.value
    }

    pub async fn exit_after_ready(&self, ctx: Ctx<'_>) -> Converted {
        futures::future::ready(()).await;
        assert_eq!(self.value, 40);
        let state = ctx.userdata::<Rc<State>>().unwrap().clone();
        let _ = native_exit(ctx.clone(), 7);
        let _ = ctx.catch();
        Converted(state)
    }

    pub async fn verify_borrow<'js>(&self, ctx: Ctx<'js>) -> rquickjs::Result<BorrowChecked<'js>> {
        let class: rquickjs::Class<MacroCounter> = ctx.globals().get("borrowedCounter")?;
        assert!(class.try_borrow_mut().is_err());
        let mut yielded = false;
        futures::future::poll_fn(|cx| {
            if std::mem::replace(&mut yielded, true) {
                Poll::Ready(())
            } else {
                cx.waker().wake_by_ref();
                Poll::Pending
            }
        })
        .await;
        assert!(class.try_borrow_mut().is_err());
        assert_eq!(self.value, 40);
        Ok(BorrowChecked(class))
    }
}

struct BorrowChecked<'js>(rquickjs::Class<'js, MacroCounter>);

impl<'js> rquickjs::IntoJs<'js> for BorrowChecked<'js> {
    fn into_js(self, ctx: &Ctx<'js>) -> rquickjs::Result<Value<'js>> {
        assert!(
            self.0.try_borrow_mut().is_ok(),
            "macro's completed async body retained its class borrow during conversion"
        );
        Ok(Value::new_int(ctx.clone(), 42))
    }
}

#[derive(Default)]
struct State {
    variant: u32,
    count: bool,
    active_host: Cell<u32>,
    exit: Cell<Option<i32>>,
    stdout: RefCell<String>,
    stderr: RefCell<String>,
    overflow: Cell<bool>,
    mutations: Cell<u32>,
    host_polls: Cell<u32>,
    guards: Cell<u32>,
    dropped: Cell<u32>,
    converted: Cell<u32>,
    held_wakers: RefCell<Vec<Waker>>,
    next_ticks: RefCell<VecDeque<Persistent<Function<'static>>>>,
    completion: AtomicWaker,
    failure: RefCell<Option<String>>,
    native_output: Option<Rc<native_output::NativeOutput>>,
}
// No handle escapes its owning runtime; nextTick handles are released before
// dropping the context/runtime. The remaining fields are native data only.
unsafe impl<'js> JsLifetime<'js> for State {
    type Changed<'to> = Self;
}

impl terminal_process::Signal for State {
    fn stopped(&self) -> bool {
        self.exit.get().is_some()
    }
    fn registered(&self) {
        self.active_host.set(self.active_host.get() + 1);
    }
    fn released(&self) {
        self.active_host.set(self.active_host.get() - 1);
    }
    fn polled(&self) {
        if self.count {
            self.guards.set(self.guards.get() + 1);
        }
    }
    fn failed(&self, message: &'static str) {
        self.fail(message.into());
    }
}

impl State {
    fn stop(&self, code: i32) {
        if self.exit.get().is_none() {
            self.exit.set(Some(code));
        }
        self.completion.wake();
        if let Some(output) = &self.native_output {
            output.freeze();
        }
    }
    fn fail(&self, message: String) {
        *self.failure.borrow_mut() = Some(message);
        self.stop(1);
    }
    fn write(&self, stderr: bool, data: &str) {
        if self.exit.get().is_some() {
            self.mutations.set(self.mutations.get() + 1);
        }
        if let Some(output) = &self.native_output {
            let _ = output.append(stderr, data.as_bytes());
            return;
        }
        let mut buffer = if stderr {
            self.stderr.borrow_mut()
        } else {
            self.stdout.borrow_mut()
        };
        if buffer.len() + data.len() > 4096 {
            self.overflow.set(true);
        } else {
            buffer.push_str(data);
        }
    }
}

/// Guard polling at scheduler admission. A wrapper-owned adapter also checks
/// inside a poll, between readiness, conversion and Promise settlement.
struct Guarded<F> {
    inner: Option<F>,
    state: Rc<State>,
    enabled: bool,
    count: bool,
}
impl<F: Future> Guarded<F> {
    fn new(inner: F, state: Rc<State>, enabled: bool, count: bool) -> Self {
        state.active_host.set(state.active_host.get() + 1);
        Self {
            inner: Some(inner),
            state,
            enabled,
            count,
        }
    }
}
impl<F: Future> Future for Guarded<F> {
    type Output = F::Output;
    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        // SAFETY: inner is structurally pinned and never moved. Cancellation
        // uses Pin::set to drop it in place, rather than Option::take.
        let this = unsafe { self.get_unchecked_mut() };
        if this.count {
            this.state.guards.set(this.state.guards.get() + 1);
        }
        if this.enabled && this.state.exit.get().is_some() {
            unsafe { Pin::new_unchecked(&mut this.inner) }.set(None);
            return Poll::Pending;
        }
        let Some(inner) = (unsafe { Pin::new_unchecked(&mut this.inner) }).as_pin_mut() else {
            return Poll::Pending;
        };
        let result = inner.poll(cx);
        if this.enabled && this.state.exit.get().is_some() {
            // Do not forward Ready into conversion or Promise resolve/reject.
            unsafe { Pin::new_unchecked(&mut this.inner) }.set(None);
            return Poll::Pending;
        }
        result
    }
}

impl<F> Drop for Guarded<F> {
    fn drop(&mut self) {
        self.state.active_host.set(self.state.active_host.get() - 1);
    }
}

struct PendingHost(Rc<State>);
impl Future for PendingHost {
    type Output = u32;
    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<u32> {
        self.0.host_polls.set(self.0.host_polls.get() + 1);
        self.0.held_wakers.borrow_mut().push(cx.waker().clone());
        Poll::Pending
    }
}
impl Drop for PendingHost {
    fn drop(&mut self) {
        self.0.dropped.set(self.0.dropped.get() + 1);
    }
}

struct Converted(Rc<State>);
impl<'js> rquickjs::IntoJs<'js> for Converted {
    fn into_js(self, ctx: &Ctx<'js>) -> rquickjs::Result<Value<'js>> {
        self.0.converted.set(self.0.converted.get() + 1);
        Ok(Value::new_int(ctx.clone(), 42))
    }
}

struct ExitOnConversion(Rc<State>);
impl<'js> rquickjs::IntoJs<'js> for ExitOnConversion {
    fn into_js(self, ctx: &Ctx<'js>) -> rquickjs::Result<Value<'js>> {
        self.0.converted.set(self.0.converted.get() + 1);
        let value: Value = ctx.eval("({get then(){markMutation();return undefined}})")?;
        let _ = native_exit(ctx.clone(), 7);
        let _ = ctx.catch();
        Ok(value)
    }
}

struct RetainedHost(Rc<Cell<bool>>);
struct RetainedValue(Rc<Cell<bool>>);
impl Future for RetainedHost {
    type Output = RetainedValue;
    fn poll(self: Pin<&mut Self>, _: &mut Context<'_>) -> Poll<RetainedValue> {
        Poll::Ready(RetainedValue(self.0.clone()))
    }
}
impl Drop for RetainedHost {
    fn drop(&mut self) {
        self.0.set(false);
    }
}
impl<'js> rquickjs::IntoJs<'js> for RetainedValue {
    fn into_js(self, ctx: &Ctx<'js>) -> rquickjs::Result<Value<'js>> {
        assert!(self.0.get(), "future was dropped before result conversion");
        Ok(Value::new_int(ctx.clone(), 42))
    }
}

fn native_exit(ctx: Ctx<'_>, code: i32) -> rquickjs::Result<()> {
    let state = ctx.userdata::<Rc<State>>().unwrap().clone();
    let exception = Exception::from_message(ctx.clone(), "process terminated")?;
    state.stop(code);
    unsafe {
        rquickjs::qjs::JS_SetUncatchableError(ctx.as_raw().as_ptr(), exception.as_value().as_raw());
    }
    Err(ctx.throw(exception.into_value()))
}

async fn sleep(ms: u64) {
    #[cfg(feature = "p2")]
    wstd::task::sleep(wstd::time::Duration::from_millis(ms)).await;
    #[cfg(feature = "p3")]
    wasip3::clocks::monotonic_clock::wait_for(ms * 1_000_000).await;
    #[cfg(not(any(feature = "p2", feature = "p3")))]
    futures_timer::Delay::new(std::time::Duration::from_millis(ms)).await;
}

const WIRING: &str = r#"
const capturedExit = nativeExit;
const listeners = [];
globalThis.console = {
  log: text => writeOutput(false, String(text)+'\n'),
  error: text => writeOutput(true, String(text)+'\n')
};
globalThis.process = {
  exitCode: 0,
  on(event, callback) { if(event==='exit') listeners.push(callback); },
  nextTick: nativeNextTick,
  exit(code) {
    if(code !== undefined) this.exitCode = code;
    for(const callback of listeners) callback(this.exitCode);
    capturedExit(Number(this.exitCode) || 0);
  }
};
globalThis.setTimeout = nativeTimer;
globalThis.queueMicrotask = callback => Promise.resolve().then(callback);
"#;

fn native_next_tick<'js>(ctx: Ctx<'js>, callback: Function<'js>) {
    ctx.userdata::<Rc<State>>()
        .unwrap()
        .next_ticks
        .borrow_mut()
        .push_back(Persistent::save(&ctx, callback));
}

fn wrap<'js, F, R>(ctx: &Ctx<'js>, future: F) -> rquickjs::Result<Promise<'js>>
where
    F: Future<Output = R> + 'js,
    R: rquickjs::IntoJs<'js>,
{
    let state = ctx.userdata::<Rc<State>>().unwrap().clone();
    if state.variant == 0 {
        Promise::wrap_future(ctx, future)
    } else if state.variant == 2 {
        terminal_process::promise(ctx, future, state)
    } else {
        let count = state.count;
        Promise::wrap_future(ctx, Guarded::new(future, state, false, count))
    }
}

fn pending_host(ctx: Ctx<'_>) -> rquickjs::Result<Promise<'_>> {
    let state = ctx.userdata::<Rc<State>>().unwrap().clone();
    wrap(&ctx, PendingHost(state))
}

fn immediate_host(ctx: Ctx<'_>) -> rquickjs::Result<Promise<'_>> {
    wrap(&ctx, std::future::ready(42u32))
}

fn exit_during_host(ctx: Ctx<'_>) -> rquickjs::Result<Promise<'_>> {
    let state = ctx.userdata::<Rc<State>>().unwrap().clone();
    let stop_ctx = ctx.clone();
    wrap(&ctx, async move {
        let _ = native_exit(stop_ctx.clone(), 7);
        let _ = stop_ctx.catch();
        Converted(state)
    })
}

fn exit_on_conversion(ctx: Ctx<'_>) -> rquickjs::Result<Promise<'_>> {
    let state = ctx.userdata::<Rc<State>>().unwrap().clone();
    wrap(&ctx, std::future::ready(ExitOnConversion(state)))
}

fn failed_host(ctx: Ctx<'_>, kind: u32) -> rquickjs::Result<Promise<'_>> {
    let task_ctx = ctx.clone();
    wrap(&ctx, async move {
        if kind == 0 {
            Err::<u32, _>(rquickjs::Error::new_from_js("string", "number"))
        } else {
            Err::<u32, _>(task_ctx.throw(Value::new_int(task_ctx.clone(), 44)))
        }
    })
}

fn retained_host(ctx: Ctx<'_>) -> rquickjs::Result<Promise<'_>> {
    wrap(&ctx, RetainedHost(Rc::new(Cell::new(true))))
}

fn native_timer<'js>(ctx: Ctx<'js>, callback: Function<'js>, ms: u64) {
    let state = ctx.userdata::<Rc<State>>().unwrap().clone();
    let task_ctx = ctx.clone();
    let guarded = state.variant == 2;
    let tracked = state.variant != 0;
    let count = state.count;
    let task_state = state.clone();
    let future = async move {
        if ms != 0 {
            sleep(ms).await;
        }
        task_state.host_polls.set(task_state.host_polls.get() + 1);
        if let Err(error) = callback.call::<_, Value>(()) {
            if error.is_exception() {
                let _ = task_ctx.catch();
            }
            if task_state.exit.get().is_none() {
                task_state.fail("timer callback threw".into());
            }
        }
        // A real timer runs a turn checkpoint after its callback, so check
        // again INSIDE this poll before entering any further JavaScript.
        if guarded && task_state.exit.get().is_some() {
            return;
        }
        turn(&task_ctx, &task_state).unwrap();
    };
    if guarded {
        terminal_process::spawn(&ctx, future);
    } else if tracked {
        ctx.spawn(Guarded::new(future, state, guarded, count));
    } else {
        ctx.spawn(future);
    }
}

async fn runtime(variant: u32, count: bool) -> (AsyncRuntime, AsyncContext, Rc<State>) {
    runtime_with_output(variant, count, None).await
}

async fn runtime_with_output(
    variant: u32,
    count: bool,
    native_output: Option<Rc<native_output::NativeOutput>>,
) -> (AsyncRuntime, AsyncContext, Rc<State>) {
    let rt = AsyncRuntime::new().unwrap();
    rt.set_memory_limit(0).await;
    let ctx = AsyncContext::full(&rt).await.unwrap();
    let state = Rc::new(State {
        variant,
        count,
        native_output,
        ..State::default()
    });
    ctx.with(|ctx| {
        ctx.store_userdata(state.clone()).unwrap();
        if variant == 2 {
            ctx.store_userdata(terminal_process::SignalHandle(state.clone()))
                .unwrap();
        }
        let module =
            rquickjs::Module::declare_def::<js_macro_fixture, _>(ctx.clone(), "macro-fixture")
                .unwrap();
        let (module, initialization) = module.eval().unwrap();
        initialization.finish::<()>().unwrap();
        let exit_after_ready: Function = module.get("exit_after_ready").unwrap();
        ctx.globals()
            .set("macroExitAfterReady", exit_after_ready)
            .unwrap();
        let ready: Function = module
            .get(if variant == 2 { "ready" } else { "stock_ready" })
            .unwrap();
        ctx.globals().set("macroReadyHost", ready).unwrap();
        let facade_ready: Function = module.get("ready").unwrap();
        ctx.globals().set("facadeReadyHost", facade_ready).unwrap();
        rquickjs::Class::<MacroCounter>::define(&ctx.globals()).unwrap();
        ctx.globals()
            .set("nativeExit", Func::from(native_exit))
            .unwrap();
        if state.native_output.is_some() {
            let bytes_output = state.clone();
            ctx.globals()
                .set(
                    "writeNativeBytes",
                    Func::from(move |stderr: bool, bytes: Vec<u8>| {
                        bytes_output
                            .native_output
                            .as_ref()
                            .unwrap()
                            .append(stderr, &bytes)
                            .map(|accepted| accepted as u32)
                            .map_err(|_| rquickjs::Error::Unknown)
                    }),
                )
                .unwrap();
        }
        let output = state.clone();
        ctx.globals()
            .set(
                "writeOutput",
                Func::from(move |stderr: bool, text: String| output.write(stderr, &text)),
            )
            .unwrap();
        let mutations = state.clone();
        ctx.globals()
            .set(
                "markMutation",
                Func::from(move || mutations.mutations.set(mutations.mutations.get() + 1)),
            )
            .unwrap();
        ctx.globals()
            .set("nativeNextTick", Func::from(native_next_tick))
            .unwrap();
        ctx.globals()
            .set("pendingHost", Func::from(pending_host))
            .unwrap();
        ctx.globals()
            .set("immediateHost", Func::from(immediate_host))
            .unwrap();
        ctx.globals()
            .set("exitDuringHost", Func::from(exit_during_host))
            .unwrap();
        ctx.globals()
            .set("exitOnConversion", Func::from(exit_on_conversion))
            .unwrap();
        ctx.globals()
            .set("failedHost", Func::from(failed_host))
            .unwrap();
        ctx.globals()
            .set("retainedHost", Func::from(retained_host))
            .unwrap();
        ctx.globals()
            .set("nativeTimer", Func::from(native_timer))
            .unwrap();
        ctx.eval::<(), _>(WIRING).unwrap();
    })
    .await;
    (rt, ctx, state)
}

fn turn(ctx: &Ctx<'_>, state: &State) -> rquickjs::Result<()> {
    // Drain a batch while holding the lock, but check after EACH dispatch.
    // This avoids one context-lock acquisition per Promise job.
    loop {
        if state.exit.get().is_some() {
            return Ok(());
        }
        let tick = state.next_ticks.borrow_mut().pop_front();
        if let Some(tick) = tick {
            if let Err(error) = tick.restore(ctx)?.call::<_, Value>(()) {
                if error.is_exception() {
                    let _ = ctx.catch();
                }
                if state.exit.get().is_none() {
                    state.fail("nextTick callback threw".into());
                }
            }
            continue;
        }
        let rt = unsafe { rquickjs::qjs::JS_GetRuntime(ctx.as_raw().as_ptr()) };
        let mut job_ctx = std::ptr::null_mut();
        let result = unsafe { rquickjs::qjs::JS_ExecutePendingJob(rt, &mut job_ctx) };
        if result < 0 {
            let _ = ctx.catch();
            if state.exit.get().is_none() {
                state.fail("Promise job threw".into());
            }
        }
        if result == 0 {
            return Ok(());
        }
    }
}

async fn drive(rt: &AsyncRuntime, ctx: &AsyncContext, state: &Rc<State>) {
    // No async_with!, idle(), drive(), Promise.finish(), or PromiseFuture in
    // the terminal path. Every host future is guarded inside its adapter.
    while state.exit.get().is_none() {
        ctx.with(|ctx| turn(&ctx, state)).await.unwrap();
        if state.exit.get().is_some() {
            break;
        }
        let result = futures::future::poll_fn(|cx| {
            state.completion.register(cx.waker());
            if state.exit.get().is_some() {
                return Poll::Ready(Ok(false));
            }
            let mut driver = std::pin::pin!(rt.execute_pending_job());
            match driver.as_mut().poll(cx) {
                Poll::Ready(Ok(false))
                    if state.exit.get().is_none() && state.active_host.get() != 0 =>
                {
                    // The stock scheduler registered THIS waker. Sleep until a
                    // host operation wakes it, without spinning or a timer.
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
                    let _ = ctx.catch();
                })
                .await;
                if state.exit.get().is_none() {
                    state.fail("host adapter threw".into());
                }
            }
        }
    }
}

#[derive(serde::Serialize)]
struct Case {
    name: &'static str,
    source: &'static str,
    code: i32,
    stdout: &'static str,
    stderr: &'static str,
}
const CASES: &[Case] = &[
    Case {
        name: "sync-exit",
        source: "console.log('before');console.error('warning');process.exit(7);console.log('after');",
        code: 7,
        stdout: "before\n",
        stderr: "warning\n",
    },
    Case {
        name: "await-before-exit",
        source: "(async()=>{await 0;markMutation();console.log('after')})();process.exit(7);",
        code: 7,
        stdout: "",
        stderr: "",
    },
    Case {
        name: "bound-before-exit",
        source: "Promise.resolve().then((()=>markMutation()).bind(null));process.exit(7);",
        code: 7,
        stdout: "",
        stderr: "",
    },
    Case {
        name: "catch-finally",
        source: "try{process.exit(7)}catch{markMutation()}finally{markMutation()}",
        code: 7,
        stdout: "",
        stderr: "",
    },
    Case {
        name: "exit-from-await",
        source: "(async()=>{await 0;process.exit(7);markMutation()})();",
        code: 7,
        stdout: "",
        stderr: "",
    },
    Case {
        name: "exit-code-drains",
        source: "process.exitCode=3;(async()=>{await 0;console.log('drained')})();",
        code: 3,
        stdout: "drained\n",
        stderr: "",
    },
    Case {
        name: "timer-success",
        source: "setTimeout(()=>console.log('delayed'),5);",
        code: 0,
        stdout: "delayed\n",
        stderr: "",
    },
    Case {
        name: "timer-exit",
        source: "setTimeout(()=>process.exit(7),5);setTimeout(()=>markMutation(),50);",
        code: 7,
        stdout: "",
        stderr: "",
    },
    Case {
        name: "pending-host-exit",
        source: "pendingHost();setTimeout(()=>process.exit(7),5);",
        code: 7,
        stdout: "",
        stderr: "",
    },
    Case {
        name: "same-batch-host-exit",
        source: "setTimeout(()=>process.exit(7),0);setTimeout(()=>markMutation(),0);",
        code: 7,
        stdout: "",
        stderr: "",
    },
    Case {
        name: "post-ready-conversion",
        source: "exitDuringHost().then(()=>markMutation());immediateHost().then(()=>markMutation());",
        code: 7,
        stdout: "",
        stderr: "",
    },
    Case {
        name: "next-tick-before-exit",
        source: "process.nextTick(()=>markMutation());process.exit(7);",
        code: 7,
        stdout: "",
        stderr: "",
    },
    Case {
        name: "exit-from-next-tick",
        source: "process.nextTick(()=>process.exit(7));process.nextTick(()=>markMutation());",
        code: 7,
        stdout: "",
        stderr: "",
    },
    Case {
        name: "exit-listener",
        source: "process.on('exit',()=>console.log('listener'));process.on('exit',()=>queueMicrotask(()=>markMutation()));process.exit(7);",
        code: 7,
        stdout: "listener\n",
        stderr: "",
    },
    Case {
        name: "output-overflow",
        source: "console.log('x'.repeat(5000));process.exit(7);",
        code: 7,
        stdout: "",
        stderr: "",
    },
    Case {
        name: "exit-during-conversion",
        source: "exitOnConversion();",
        code: 7,
        stdout: "",
        stderr: "",
    },
    Case {
        name: "native-error-conversion",
        source: "try{await failedHost(0)}catch(e){console.log(e instanceof TypeError ? 'TypeError' : 'wrong')}process.exit(7);",
        code: 7,
        stdout: "TypeError\n",
        stderr: "",
    },
    Case {
        name: "native-thrown-value",
        source: "try{await failedHost(1)}catch(e){console.log(e)}process.exit(7);",
        code: 7,
        stdout: "44\n",
        stderr: "",
    },
    Case {
        name: "future-retained-through-conversion",
        source: "console.log(await retainedHost());",
        code: 0,
        stdout: "42\n",
        stderr: "",
    },
    Case {
        name: "macro-generated-async-exit",
        source: "macroExitAfterReady();immediateHost().then(()=>markMutation());",
        code: 7,
        stdout: "",
        stderr: "",
    },
    Case {
        name: "macro-generated-method-exit",
        source: "new MacroCounter().exit_after_ready();immediateHost().then(()=>markMutation());",
        code: 7,
        stdout: "",
        stderr: "",
    },
    Case {
        name: "macro-generated-method-borrow",
        source: "const counter=new MacroCounter();await counter.add();console.log(await counter.add());",
        code: 0,
        stdout: "42\n",
        stderr: "",
    },
    Case {
        name: "macro-generated-method-conversion-borrow",
        source: "globalThis.borrowedCounter=new MacroCounter();console.log(await borrowedCounter.verify_borrow());",
        code: 0,
        stdout: "42\n",
        stderr: "",
    },
];
pub const CASE_COUNT: u32 = CASES.len() as u32;

pub fn fixtures() -> String {
    serde_json::to_string(CASES).unwrap()
}

#[derive(serde::Serialize)]
struct Report {
    name: String,
    guarded: bool,
    exit_code: i32,
    stdout: String,
    stderr: String,
    overflow: bool,
    mutations: u32,
    host_polls: u32,
    guard_polls: u32,
    pending_drops: u32,
    conversions: u32,
    weak_runtime_released: bool,
    failure: Option<String>,
    elapsed_us: u64,
}

pub async fn run(case: u32, guarded: bool) -> String {
    let fixture = &CASES[case as usize];
    let started = Instant::now();
    let ledger = Rc::new(terminal_process::admission::Ledger::default());
    let export = ledger.enter().unwrap();
    let bootstrap = ledger.retain().unwrap();
    let (rt, ctx, state) = runtime(if guarded { 2 } else { 1 }, true).await;
    drop(bootstrap);
    let lease = export.lease(!rt.is_job_pending().await).unwrap();
    assert!(ledger.enter().is_err());
    let root = ctx
        .with(
            |ctx| match ctx.eval::<Value, _>(format!("(async()=>{{{}}})()", fixture.source)) {
                Ok(value) => Some(Persistent::save(&ctx, value)),
                Err(_) => {
                    let _ = ctx.catch();
                    None
                }
            },
        )
        .await;
    drive(&rt, &ctx, &state).await;
    let code = if let Some(code) = state.exit.get() {
        code
    } else {
        ctx.with(|ctx| {
            let process: rquickjs::Object = ctx.globals().get("process").unwrap();
            process.get::<_, i32>("exitCode").unwrap()
        })
        .await
    };
    // Rust-owned result capture does not resolve a JS wrapper Promise or drain
    // user work after exit. Disposal is terminal, not same-runtime recovery.
    state.next_ticks.borrow_mut().clear();
    drop(root);
    let weak = rt.weak();
    drop(ctx);
    drop(rt);
    for waker in state.held_wakers.borrow_mut().drain(..) {
        waker.wake();
    }
    drop(lease);
    assert!(ledger.enter().is_err());
    let report = Report {
        name: fixture.name.into(),
        guarded,
        exit_code: code,
        stdout: state.stdout.borrow().clone(),
        stderr: state.stderr.borrow().clone(),
        overflow: state.overflow.get(),
        mutations: state.mutations.get(),
        host_polls: state.host_polls.get(),
        guard_polls: state.guards.get(),
        pending_drops: state.dropped.get(),
        conversions: state.converted.get(),
        weak_runtime_released: weak.try_ref().is_none(),
        failure: state.failure.borrow().clone(),
        elapsed_us: started.elapsed().as_micros() as u64,
    };
    assert_eq!(code, fixture.code, "{} exit status", fixture.name);
    assert_eq!(report.stdout, fixture.stdout, "{} stdout", fixture.name);
    assert_eq!(report.stderr, fixture.stderr, "{} stderr", fixture.name);
    assert!(
        report.weak_runtime_released,
        "{} retained runtime",
        fixture.name
    );
    if guarded {
        assert_eq!(
            report.mutations, 0,
            "{} post-exit host effect",
            fixture.name
        );
        assert_eq!(report.failure, None, "{} unexpected failure", fixture.name);
        if case == 8 {
            assert_eq!(report.pending_drops, 1);
        }
        if case == 10 || case == 19 || case == 20 {
            assert_eq!(report.conversions, 0);
        }
        if case == 14 {
            assert!(report.overflow);
        }
    } else {
        match case {
            9 => assert_eq!(
                report.mutations, 1,
                "same-batch negative control missed bypass"
            ),
            19 | 20 => assert_eq!(
                report.conversions, 1,
                "macro negative control missed bypass"
            ),
            _ => panic!("unexpected unguarded case"),
        }
    }
    serde_json::to_string(&report).unwrap()
}

#[cfg(test)]
mod binding_tests {
    #[test]
    fn macro_adapter_without_signal_retains_stock_behavior() {
        futures::executor::block_on(async {
            let (rt, ctx, state) = super::runtime(1, false).await;
            let result = ctx.with(|ctx| {
                assert!(ctx.userdata::<super::terminal_process::SignalHandle>().is_none());
                let root: rquickjs::Promise = ctx.eval(
                    "(async()=>{const c=new MacroCounter();await c.add();await c.add();globalThis.borrowedCounter=new MacroCounter();return await borrowedCounter.verify_borrow()+await facadeReadyHost()})()",
                ).unwrap();
                rquickjs::Persistent::save(&ctx, root)
            }).await;
            rt.idle().await;
            ctx.with(|ctx| {
                assert_eq!(
                    result
                        .restore(&ctx)
                        .unwrap()
                        .result::<u32>()
                        .unwrap()
                        .unwrap(),
                    43
                );
            })
            .await;
            assert_eq!(state.active_host.get(), 0);
            drop(ctx);
            let weak = rt.weak();
            drop(rt);
            assert!(weak.try_ref().is_none());
        });
    }
}

pub async fn benchmark(workload: u32, variant: u32, size: u32) -> String {
    // 0: stock idle + unguarded adapters; 1: manual terminal driver + unguarded
    // adapters (driver cost); 2: manual terminal driver + guarded adapters.
    let started = Instant::now();
    let (rt, ctx, state) = runtime(variant, false).await;
    let initialized = started.elapsed();
    let script = match workload {
        0 => {
            format!("(async()=>{{let sum=0;for(let i=0;i<{size};i++)sum=(sum+i)|0;return sum}})()")
        }
        1 => format!(
            "(async()=>{{let sum=0;for(let i=0;i<{size};i++)sum+=(await Promise.resolve(1));return sum}})()"
        ),
        2 => format!(
            "(async()=>{{const values=await Promise.all(Array.from({{length:{size}}},()=>immediateHost()));return values.length}})()"
        ),
        3 => format!(
            "(async()=>{{const values=await Promise.all(Array.from({{length:{size}}},()=>macroReadyHost()));return values.length}})()"
        ),
        _ => panic!("unknown workload"),
    };
    let execution = Instant::now();
    let root = ctx
        .with(|ctx| {
            let promise: Promise = ctx.eval(script).unwrap();
            Persistent::save(&ctx, promise)
        })
        .await;
    if variant == 0 {
        rt.idle().await;
    } else {
        drive(&rt, &ctx, &state).await;
    }
    let result = ctx
        .with(|ctx| {
            root.clone()
                .restore(&ctx)
                .unwrap()
                .result::<i32>()
                .unwrap()
                .unwrap()
        })
        .await;
    if workload > 0 {
        assert_eq!(result, size as i32);
    } else {
        let expected = u64::from(size) * u64::from(size.saturating_sub(1)) / 2;
        assert_eq!(result, expected as i32);
    }
    let execution_us = execution.elapsed().as_micros() as u64;
    drop(root);
    drop(ctx);
    drop(rt);
    serde_json::json!({"workload":workload,"variant":variant,"size":size,"result":result,
        "initialization_us":initialized.as_micros() as u64,"execution_us":execution_us,
        "total_us":started.elapsed().as_micros() as u64})
    .to_string()
}

#[derive(Default)]
struct TestTransport {
    stdout: RefCell<Vec<u8>>,
    stderr: RefCell<Vec<u8>>,
    channels_finished: Cell<u32>,
    fail_stderr: bool,
    wait_forever: bool,
}

impl native_output::OutputTransport for TestTransport {
    async fn finish(&self, stdout: Vec<u8>, stderr: Vec<u8>) -> Result<(), String> {
        for (is_stderr, bytes) in [(false, stdout), (true, stderr)] {
            for chunk in bytes.chunks(2) {
                // Exercise an asynchronous native sink after QuickJS disposal.
                if self.wait_forever {
                    std::future::pending::<()>().await;
                }
                sleep(1).await;
                if is_stderr && self.fail_stderr {
                    return Err("stderr attachment failed".into());
                }
                let target = if is_stderr {
                    &self.stderr
                } else {
                    &self.stdout
                };
                target.borrow_mut().extend_from_slice(chunk);
            }
            self.channels_finished.set(self.channels_finished.get() + 1);
        }
        Ok(())
    }
}

pub const COMPLETION_CASE_COUNT: u32 = 7;

/// Integration fixture: accept output natively, terminate/dispose QuickJS, then
/// complete both output attachments from Rust. JSON is test instrumentation.
pub async fn complete(case: u32) -> String {
    use native_output::{NativeOutput, Phase};
    assert!(case < COMPLETION_CASE_COUNT);
    let source = match case {
        0 => {
            "writeNativeBytes(false,[0,255,128]);console.error('err');process.on('exit',()=>console.log('listener'));queueMicrotask(()=>writeNativeBytes(false,[42]));process.exit(7);"
        }
        1 => "process.exitCode=3;setTimeout(()=>console.log('delayed'),5);",
        2 => {
            "writeNativeBytes(false,[1,2,3]);writeNativeBytes(false,[4,5,6]);writeNativeBytes(true,[255,0]);process.exit(7);"
        }
        6 => "process.exit(9);",
        _ => "console.log('out');console.error('err');process.exit(7);",
    };
    let output = Rc::new(NativeOutput::new(if case == 2 { 4 } else { 128 }, 128));
    output.reset().unwrap();
    assert!(
        output.begin(0).is_err(),
        "completion cannot precede freezing"
    );
    let ledger = Rc::new(terminal_process::admission::Ledger::default());
    let export = ledger.enter().unwrap();
    let bootstrap = ledger.retain().unwrap();
    let (rt, ctx, state) = runtime_with_output(2, true, Some(output.clone())).await;
    drop(bootstrap);
    let lease = export.lease(!rt.is_job_pending().await).unwrap();
    let root = ctx
        .with(
            |ctx| match ctx.eval::<Value, _>(format!("(async()=>{{{source}}})()")) {
                Ok(value) => Some(Persistent::save(&ctx, value)),
                Err(error) => {
                    let _ = ctx.catch();
                    assert!(
                        state.exit.get().is_some(),
                        "unexpected script error: {error}"
                    );
                    None
                }
            },
        )
        .await;
    drive(&rt, &ctx, &state).await;
    let code = if let Some(code) = state.exit.get() {
        code
    } else {
        ctx.with(|ctx| {
            ctx.globals()
                .get::<_, rquickjs::Object>("process")
                .unwrap()
                .get::<_, i32>("exitCode")
                .unwrap()
        })
        .await
    };
    state.next_ticks.borrow_mut().clear();
    drop(root);
    let weak = rt.weak();
    drop(ctx);
    drop(rt);
    assert!(
        weak.try_ref().is_none(),
        "output finalization requires terminal disposal"
    );
    assert_eq!(state.mutations.get(), 0);
    assert_eq!(*state.failure.borrow(), None);
    // Natural completion freezes here. Explicit exit freezes before disposal.
    output.freeze();
    assert_eq!(output.phase(), Phase::Frozen);
    assert!(output.append(false, b"late write").is_err());
    let completion = output.begin(code).unwrap();
    assert!(
        output.begin(code).is_err(),
        "a competing completer must be rejected"
    );
    let transport = TestTransport {
        fail_stderr: case == 3,
        wait_forever: case == 4,
        ..TestTransport::default()
    };
    let result = if case == 4 {
        let mut future = Box::pin(completion.finish(&transport));
        assert!(futures::poll!(future.as_mut()).is_pending());
        drop(future);
        assert_eq!(output.phase(), Phase::Cancelled);
        assert_eq!(transport.channels_finished.get(), 0);
        Err("completion cancelled".into())
    } else {
        completion.finish(&transport).await
    };
    match case {
        3 => {
            assert_eq!(output.phase(), Phase::Failed);
            assert_eq!(result.as_ref().unwrap_err(), "stderr attachment failed");
            assert_eq!(transport.channels_finished.get(), 1);
        }
        4 => assert!(result.is_err()),
        _ => {
            assert_eq!(output.phase(), Phase::Complete);
            assert_eq!(transport.channels_finished.get(), 2);
            let status = result.as_ref().unwrap();
            assert_eq!(status.exit_code, code);
            assert_eq!(status.stdout_truncated, case == 2);
            assert!(!status.stderr_truncated);
        }
    }
    let expected_stdout: &[u8] = match case {
        0 => &[
            0, 255, 128, b'l', b'i', b's', b't', b'e', b'n', b'e', b'r', b'\n',
        ],
        1 => b"delayed\n",
        2 => &[1, 2, 3, 4],
        4 | 6 => b"",
        _ => b"out\n",
    };
    let expected_stderr: &[u8] = match case {
        1 | 3 | 4 | 6 => b"",
        2 => &[255, 0],
        _ => b"err\n",
    };
    assert_eq!(&*transport.stdout.borrow(), expected_stdout);
    assert_eq!(&*transport.stderr.borrow(), expected_stderr);
    assert!(output.append(true, b"late write").is_err());
    assert!(
        output.begin(code).is_err(),
        "completion must never replay or retry"
    );
    drop(lease);
    assert!(ledger.enter().is_err());
    serde_json::json!({"case":case,"result":result,"phase":output.phase(),
        "stdout":*transport.stdout.borrow(),"stderr":*transport.stderr.borrow(),
        "channels_finished":transport.channels_finished.get(),
        "weak_runtime_released":weak.try_ref().is_none()})
    .to_string()
}

#[cfg(feature = "p2")]
mod component {
    wit_bindgen::generate!({path:"wit-p2", world:"boundary"});
    struct Component;
    impl Guest for Component {
        fn complete(case: u32) -> String {
            wstd::runtime::block_on(super::complete(case))
        }
        fn run(case: u32, guarded: bool) -> String {
            wstd::runtime::block_on(super::run(case, guarded))
        }
        fn benchmark(workload: u32, variant: u32, size: u32) -> String {
            wstd::runtime::block_on(super::benchmark(workload, variant, size))
        }
    }
    export!(Component);
}
#[cfg(feature = "p3")]
mod component {
    wit_bindgen_p3::generate!({path:"wit-p3", world:"boundary", runtime_path:"wit_bindgen_p3::rt"});
    struct Component;
    impl Guest for Component {
        async fn complete(case: u32) -> String {
            super::complete(case).await
        }
        async fn run(case: u32, guarded: bool) -> String {
            super::run(case, guarded).await
        }
        async fn benchmark(workload: u32, variant: u32, size: u32) -> String {
            super::benchmark(workload, variant, size).await
        }
    }
    export!(Component);
}
