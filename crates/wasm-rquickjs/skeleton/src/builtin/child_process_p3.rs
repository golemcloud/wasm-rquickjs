use crate::internal::runtime_services::{OwnedJsRuntime, RuntimeOutputSink, RuntimeServices};
use futures::future::{Either, poll_fn, select};
use futures::task::AtomicWaker;
use rquickjs::class::Trace;
use rquickjs::{
    AsyncContext, CatchResultExt, Ctx, Exception, Function, JsLifetime, Module, Object, Persistent,
};
use serde::Deserialize;
use std::cell::{Cell, RefCell};
use std::collections::HashMap;
use std::path::PathBuf;
use std::rc::Rc;
use std::task::Poll;
use std::time::{Duration, Instant};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Options {
    max_buffer: Option<f64>,
    timeout: Option<u64>,
    stdio: [String; 3],
}

#[derive(Deserialize)]
struct Request {
    options: Options,
}

type InitialProcess = (Vec<String>, HashMap<String, String>, PathBuf);

pub(crate) struct ChildState {
    request: RefCell<Option<String>>,
    process: InitialProcess,
    options: Options,
    parent: Option<Rc<ChildState>>,
    deadline: Cell<Option<Instant>>,
    output: RefCell<Vec<(bool, Vec<u8>)>>,
    lengths: [Cell<usize>; 2],
    completion: RefCell<Option<serde_json::Value>>,
    reason: Cell<Option<&'static str>>,
    overflow_stdout: Cell<Option<bool>>,
    pub(crate) exited: Cell<bool>,
    event: AtomicWaker,
    control: AtomicWaker,
}

impl ChildState {
    pub(crate) fn write(&self, stdout: bool, bytes: &[u8]) {
        if self.reason.get().is_some() {
            return;
        }
        let index = usize::from(!stdout);
        if self.options.stdio[index + 1] == "ignore" {
            return;
        }
        // Inherited output is delivered by the parent so embedding-specific
        // stream adapters remain authoritative. Bound that transfer too.
        let limit = if self.options.stdio[index + 1] == "inherit" {
            64 * 1024 * 1024
        } else {
            self.options
                .max_buffer
                .map(|limit| limit as usize)
                .unwrap_or(usize::MAX)
        };
        let remaining = limit.saturating_sub(self.lengths[index].get());
        // Match a bounded pipe read: sync Node results retain the read that
        // crossed maxBuffer; async collectors apply their encoding-aware limit.
        let overrun = if self.options.stdio[index + 1] == "inherit" {
            0
        } else {
            64 * 1024
        };
        let accepted = bytes.len().min(remaining.saturating_add(overrun));
        if accepted != 0 {
            self.lengths[index].set(self.lengths[index].get() + accepted);
            self.output
                .borrow_mut()
                .push((stdout, bytes[..accepted].to_vec()));
        }
        if bytes.len() > remaining {
            self.overflow_stdout.set(Some(stdout));
            self.stop("overflow");
        }
        self.event.wake();
    }

    fn stop(&self, reason: &'static str) {
        if self.completion.borrow().is_none() && self.reason.get().is_none() {
            self.reason.set(Some(reason));
            self.control.wake();
        }
    }

    fn read(&self) -> String {
        serde_json::json!({
            "events": self.output.borrow_mut().drain(..).collect::<Vec<_>>(),
            "done": self.completion.borrow().is_some(),
            "result": *self.completion.borrow(),
        })
        .to_string()
    }
}

impl RuntimeOutputSink for ChildState {
    fn write_stdout(&self, data: &str) {
        self.write(true, data.as_bytes());
    }
    fn write_stderr(&self, data: &str) {
        self.write(false, data.as_bytes());
    }
}

/// A parent-owned handle. Neither the handle nor its state roots a child context.
#[derive(Trace, JsLifetime)]
#[rquickjs::class]
pub struct Child {
    #[qjs(skip_trace)]
    state: Rc<ChildState>,
}

#[rquickjs::methods(rename_all = "camelCase")]
impl Child {
    #[qjs(constructor)]
    pub fn new(ctx: Ctx<'_>, request: String) -> rquickjs::Result<Self> {
        let parsed: Request = serde_json::from_str(&request)
            .map_err(|error| Exception::throw_type(&ctx, &error.to_string()))?;
        let services = ctx.userdata::<RuntimeServices>().unwrap();
        Ok(Self {
            state: Rc::new(ChildState {
                request: RefCell::new(Some(request)),
                process: (
                    services.process.args(),
                    services.process.env(),
                    services.process.cwd(),
                ),
                options: parsed.options,
                parent: services.node_child.borrow().clone(),
                deadline: Cell::new(None),
                output: RefCell::default(),
                lengths: [Cell::new(0), Cell::new(0)],
                completion: RefCell::default(),
                reason: Cell::new(None),
                overflow_stdout: Cell::new(None),
                exited: Cell::new(false),
                event: AtomicWaker::new(),
                control: AtomicWaker::new(),
            }),
        })
    }

    pub fn run_sync(&self, ctx: Ctx<'_>) -> rquickjs::Result<String> {
        let request = self.take_request(&ctx)?;
        // This private boundary drives only the child future and explicitly
        // composed work. wasip3's wit-bindgen instance must stay separate from
        // the outer export's wit-bindgen-p3 async-spawn queue: consuming that
        // queue here would steal the suspended parent's runtime driver.
        wasip3::wit_bindgen::rt::async_support::block_on(run(request, self.state.clone()));
        Ok(self.state.read())
    }

    pub async fn start(&self, ctx: Ctx<'_>) -> rquickjs::Result<()> {
        let request = self.take_request(&ctx)?;
        run(request, self.state.clone()).await;
        Ok(())
    }

    pub async fn wait(&self) -> String {
        poll_fn(|cx| {
            self.state.event.register(cx.waker());
            if !self.state.output.borrow().is_empty() || self.state.completion.borrow().is_some() {
                Poll::Ready(())
            } else {
                Poll::Pending
            }
        })
        .await;
        self.state.read()
    }

    pub fn cancel(&self) -> bool {
        if self.state.completion.borrow().is_some() || self.state.reason.get().is_some() {
            return false;
        }
        self.state.stop("cancelled");
        true
    }

    #[qjs(skip)]
    fn take_request(&self, ctx: &Ctx<'_>) -> rquickjs::Result<String> {
        self.state
            .request
            .borrow_mut()
            .take()
            .ok_or_else(|| Exception::throw_message(ctx, "child already started"))
    }
}

async fn run(request: String, state: Rc<ChildState>) {
    let own_deadline = state
        .options
        .timeout
        .filter(|ms| *ms != 0)
        .and_then(|ms| Instant::now().checked_add(Duration::from_millis(ms)));
    // A nested synchronous boundary cannot poll its parent's driver. Carry
    // the deadline into the descendant's own wait and interpreter interrupt.
    let parent_deadline = state
        .parent
        .as_ref()
        .and_then(|parent| parent.deadline.get());
    let deadline = match (own_deadline, parent_deadline) {
        (Some(own), Some(parent)) => Some(own.min(parent)),
        (own, parent) => own.or(parent),
    };
    state.deadline.set(deadline);
    let execution = execute(request, state.clone(), deadline);
    let cancellation = poll_fn(|cx| {
        state.control.register(cx.waker());
        if state.reason.get().is_some() {
            Poll::Ready(())
        } else {
            Poll::Pending
        }
    });
    let timeout = async {
        match deadline {
            Some(deadline) => {
                wasip3::clocks::monotonic_clock::wait_for(
                    deadline
                        .saturating_duration_since(Instant::now())
                        .as_nanos()
                        .min(u64::MAX as u128) as u64,
                )
                .await;
                state.stop("timeout");
            }
            None => futures::future::pending().await,
        }
    };
    let result = {
        futures::pin_mut!(execution, cancellation, timeout);
        let control = select(cancellation, timeout);
        futures::pin_mut!(control);
        match select(control, execution).await {
            Either::Right((result, _)) => result,
            Either::Left(_) => Ok(serde_json::json!({ "status": null })),
        }
    }; // Drop all child futures/roots before publishing terminal completion.
    // A nested synchronous call can finish after this driver's timer became
    // ready without giving select another poll of its control branch.
    if deadline.is_some_and(|deadline| Instant::now() >= deadline) {
        state.stop("timeout");
    }
    let mut result = match result {
        Ok(result) => result,
        Err(error) => {
            state.write(false, format!("{error}\n").as_bytes());
            serde_json::json!({ "status": 1 })
        }
    };
    if let Some(reason) = state.reason.get() {
        result["status"] = serde_json::Value::Null;
        result["reason"] = reason.into();
        if let Some(stdout) = state.overflow_stdout.get() {
            result["stream"] = if stdout { "stdout" } else { "stderr" }.into();
        }
    }
    *state.completion.borrow_mut() = Some(result);
    state.event.wake();
}

async fn execute(
    request: String,
    state: Rc<ChildState>,
    deadline: Option<Instant>,
) -> Result<serde_json::Value, String> {
    let runtime = OwnedJsRuntime::new().await;
    runtime.disable_execution().await;
    runtime
        .configure_process(
            state.process.0.clone(),
            state.process.1.clone(),
            state.process.2.clone(),
        )
        .await?;
    runtime.set_output_sink(state.clone()).await;
    runtime
        .ctx
        .with(|ctx| {
            *ctx.userdata::<RuntimeServices>()
                .unwrap()
                .node_child
                .borrow_mut() = Some(state.clone());
        })
        .await;
    runtime.initialize_node_builtins().await?;
    let timers = super::super::child_timers::ChildTimers::install(&runtime).await;
    let interrupt = state.clone();
    runtime
        .rt
        .set_interrupt_handler(Some(Box::new(move || {
            if deadline.is_some_and(|deadline| Instant::now() >= deadline) {
                interrupt.stop("timeout");
            }
            interrupt.reason.get().is_some()
        })))
        .await;
    let session = AsyncContext::async_with(&runtime.ctx, async |ctx| {
        let bootstrap = async {
            Module::import(&ctx, "node:child_process")?
                .into_future::<Object>()
                .await?;
            let begin: Function = ctx.globals().get("__wasm_rquickjs_begin_node_child")?;
            ctx.globals().remove("__wasm_rquickjs_begin_node_child")?;
            let session: Object = begin.call((request,))?;
            Ok::<_, rquickjs::Error>(Persistent::save(&ctx, session))
        }
        .await;
        bootstrap
            .catch(&ctx)
            .map_err(crate::internal::format_caught_error)
    })
    .await?;
    let mut emitted_before_exit = false;
    loop {
        let did_work = timers.drain(&runtime).await?;
        if state.exited.get() || (emitted_before_exit && !did_work) {
            break;
        }
        runtime
            .ctx
            .with(|ctx| {
                (|| -> rquickjs::Result<()> {
                    let session = session.clone().restore(&ctx)?;
                    session.get::<_, Function>("beforeExit")?.call(())
                })()
                .catch(&ctx)
                .map_err(crate::internal::format_caught_error)
            })
            .await?;
        emitted_before_exit = true;
    }
    let result = runtime
        .ctx
        .with(|ctx| {
            (|| -> rquickjs::Result<String> {
                let session = session.restore(&ctx)?;
                session.get::<_, Function>("finish")?.call(())
            })()
            .catch(&ctx)
            .map_err(crate::internal::format_caught_error)
        })
        .await?;
    serde_json::from_str(&result).map_err(|error| error.to_string())
}
