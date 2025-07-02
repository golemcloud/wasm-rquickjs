use futures::future::{AbortHandle, Aborted};
use futures::stream::FuturesUnordered;
use futures_concurrency::future::Join;
use pin_project::pin_project;
use rquickjs::function::{Args, Constructor};
use rquickjs::loader::{BuiltinLoader, BuiltinResolver, ScriptLoader};
use rquickjs::prelude::*;
use rquickjs::{
    AsyncContext, AsyncRuntime, CatchResultExt, Ctx, Error, FromJs, Function, Module, Object,
    Promise, Value, async_with,
};
use std::cell::RefCell;
use std::collections::HashMap;
use std::future::Future;
use std::pin::{Pin, pin};
use std::sync::atomic::AtomicUsize;
use std::task::{Context, Poll};
use std::time::Duration;
use wasi::clocks::monotonic_clock::subscribe_duration;
use wasi_async_runtime::{Reactor, block_on};

static JS_MODULE: &str = include_str!("module.js");

pub const RESOURCE_TABLE_NAME: &str = "__wasm_rquickjs_resources";
pub const RESOURCE_ID_KEY: &str = "__wasm_rquickjs_resource_id";

pub struct JsState {
    pub reactor: RefCell<Option<Reactor>>,
    pub rt: AsyncRuntime,
    pub ctx: AsyncContext,
    pub last_resource_id: AtomicUsize,
    pub resource_drop_queue_tx: futures::channel::mpsc::UnboundedSender<usize>,
    pub resource_drop_queue_rx: RefCell<Option<futures::channel::mpsc::UnboundedReceiver<usize>>>,
    pub scheduled_tasks: RefCell<Vec<Pin<Box<dyn Future<Output = Result<(), Aborted>>>>>>,
    pub abort_handles: RefCell<HashMap<usize, AbortHandle>>,
    pub last_abort_id: AtomicUsize,
}

impl Default for JsState {
    fn default() -> Self {
        Self::new()
    }
}

impl JsState {
    pub fn new() -> Self {
        init_logging();

        block_on(|_reactor| async {
            let rt = AsyncRuntime::new().expect("Failed to create AsyncRuntime");
            let ctx = AsyncContext::full(&rt)
                .await
                .expect("Failed to create AsyncContext");

            let resolver = BuiltinResolver::default().with_module("bundle/script_module");
            let resolver = crate::modules::add_native_module_resolvers(resolver);
            let resolver = crate::builtin::add_module_resolvers(resolver);

            let loader = (
                BuiltinLoader::default().with_module("bundle/script_module", JS_MODULE),
                crate::modules::module_loader(),
                crate::builtin::module_loader(),
                ScriptLoader::default(),
            );

            rt.set_loader(resolver, loader).await;

            async_with!(ctx => |ctx| {
                let global = ctx.globals();

                global.set(RESOURCE_TABLE_NAME, Object::new(ctx.clone()))
                    .expect("Failed to initialize resource table");

                let wiring = crate::builtin::wire_builtins();
                Module::evaluate(
                    ctx.clone(),
                    "test",
                    format!(r#"
                    {wiring}
                    import * as userModule from 'bundle/script_module';
                    globalThis.userModule = userModule;
                    "#),
                )
                .catch(&ctx).expect("Failed to evaluate module initialization")
                .finish::<()>()
                .catch(&ctx).expect("Failed to finish module initialization");
            })
            .await;
            rt.idle().await;

            let (resource_drop_queue_tx, resource_drop_queue_rx) =
                futures::channel::mpsc::unbounded();

            let last_resource_id = AtomicUsize::new(1);
            Self {
                reactor: RefCell::new(None),
                rt,
                ctx,
                last_resource_id,
                resource_drop_queue_tx,
                resource_drop_queue_rx: RefCell::new(Some(resource_drop_queue_rx)),
                scheduled_tasks: RefCell::new(Vec::new()),
                abort_handles: RefCell::new(HashMap::new()),
                last_abort_id: AtomicUsize::new(0),
            }
        })
    }
}

#[cfg(feature = "logging")]
fn init_logging() {
    wasi_logger::Logger::install().expect("failed to install wasi_logger::Logger");
    log::set_max_level(log::LevelFilter::Trace);
}

#[cfg(not(feature = "logging"))]
fn init_logging() {
    // No-op if logging is not enabled
}

static mut STATE: Option<JsState> = None;

#[allow(static_mut_refs)]
pub fn get_js_state() -> &'static JsState {
    unsafe {
        if STATE.is_none() {
            STATE = Some(JsState::new());
        }
        STATE.as_ref().unwrap()
    }
}

pub fn async_exported_function<F: Future>(future: F) -> F::Output {
    let js_state = get_js_state();

    block_on(|reactor| async move {
        use futures::StreamExt;

        js_state.reactor.replace(Some(reactor));
        if let Some(mut resource_drop_queue_rx) = js_state.resource_drop_queue_rx.take() {
            let resource_dropper = async move {
                while let Some(resource_id) = resource_drop_queue_rx.next().await {
                    if resource_id > 0 {
                        drop_js_resource(resource_id).await;
                    } else {
                        break;
                    }
                }
                resource_drop_queue_rx
            };

            let result = async {
                let run_scheduled_tasks = async {
                    let mut futures = FuturesUnordered::from_iter(
                        js_state.scheduled_tasks.borrow_mut().drain(..),
                    );
                    while (futures.next().with_js_idle_loop().await).is_some() {
                        js_state.rt.idle().await;
                        futures.extend(js_state.scheduled_tasks.borrow_mut().drain(..))
                    }
                };

                let (future_result, _) = (future, run_scheduled_tasks).join().await;
                future_result
            };

            // Finish resource dropper
            js_state
                .resource_drop_queue_tx
                .unbounded_send(0)
                .expect("Failed to enqueue resource dropper stop signal");
            let (result, resource_drop_queue_rx) = (result, resource_dropper).join().await;
            js_state
                .resource_drop_queue_rx
                .replace(Some(resource_drop_queue_rx));

            result
        } else {
            // This case will never happen because block_on does not allow reentry
            unreachable!()
        }
    })
}

pub async fn call_js_export<A, R>(function_path: &[&str], args: A) -> R
where
    A: for<'js> IntoArgs<'js>,
    R: for<'js> FromJs<'js> + 'static,
{
    let js_state = get_js_state();

    let result: R = async_with!(js_state.ctx => |ctx| {
        let module: Object = ctx.globals().get("userModule").expect("Failed to get userModule");
        let (user_function, parent) = get_path(&module, function_path).unwrap_or_else(|| panic!("Cannot find exported JS function {}", function_path.join(".")));

        let result: Result<Value, Error> = call_with_this(ctx.clone(), user_function, parent, args);

        match result {
            Err(Error::Exception) => {
                let exception = ctx.catch();
                panic! ("Exception during call: {exception:?}");
            }
            Err(e) => {
                panic! ("Error during call: {e:?}");
            }
            Ok(value) => {
                if value.is_promise() {
                    let promise: Promise = value.into_promise().unwrap();
                    let promise_future = promise.into_future::<R> ();
                    match promise_future.await {
                        Ok(result) => {
                            result
                        }
                        Err(e) => {
                            match e {
                                Error::Exception => {
                                    let exception = ctx.catch();
                                    panic! ("Exception during awaiting call result: {exception:?}")
                                }
                                _ => {
                                    panic ! ("Error during awaiting call result: {e:?}")
                                }
                            }
                        }
                    }
                }
                else {
                    R::from_js(&ctx, value).expect("Unexpected result value")
                }
            }
        }
    }).await;
    js_state.rt.idle().await;
    result
}

pub async fn call_js_resource_constructor<A>(resource_path: &[&str], args: A) -> usize
where
    A: for<'js> IntoArgs<'js>,
{
    let js_state = get_js_state();

    let result = async_with!(js_state.ctx => |ctx| {
        let module: Object = ctx.globals().get("userModule").expect("Failed to get userModule");
        let (constructor, _parent): (Constructor, Object) = get_path(&module, resource_path).unwrap_or_else(|| panic!("Cannot find exported JS resource class {}", resource_path.join(".")));

        let result: Result<Object, Error> = constructor.construct(args);

        match result {
            Err(Error::Exception) => {
                let exception = ctx.catch();
                panic! ("Exception during call: {exception:?}");
            }
            Err(e) => {
                panic! ("Error during call: {e:?}");
            }
            Ok(resource) => {
                let resource_id = get_free_resource_id();
                resource.set(RESOURCE_ID_KEY, resource_id)
                    .expect("Failed to set resource ID");
                let resource_table: Object = ctx.globals().get(RESOURCE_TABLE_NAME)
                    .expect("Failed to get the resource table");
                resource_table
                    .set(resource_id.to_string(), resource)
                    .expect("Failed to store resource instance");

                resource_id
            }
        }
    }).await;
    js_state.rt.idle().await;
    result
}

pub fn get_free_resource_id() -> usize {
    get_js_state()
        .last_resource_id
        .fetch_add(1, std::sync::atomic::Ordering::Relaxed)
}

pub async fn call_js_resource_method<A, R>(resource_id: usize, name: &str, args: A) -> R
where
    A: for<'js> IntoArgs<'js>,
    R: for<'js> FromJs<'js> + 'static,
{
    let js_state = get_js_state();

    let result: R = async_with!(js_state.ctx => |ctx| {
        let resource_table: Object = ctx.globals().get(RESOURCE_TABLE_NAME)
            .expect("Failed to get the resource table");
        let resource_instance: Object = resource_table.get(resource_id.to_string())
            .unwrap_or_else(|_| panic!("Failed to get resource instance with id {resource_id}"));

        let method: Function = resource_instance.get(name)
            .unwrap_or_else(|_| panic!("Failed to get method {name} from resource instance with id {resource_id}"));

        let result: Result<Value, Error> = call_with_this(ctx.clone(), method, resource_instance, args);

        match result {
            Err(Error::Exception) => {
                let exception = ctx.catch();
                panic! ("Exception during call: {exception:?}");
            }
            Err(e) => {
                panic! ("Error during call: {e:?}");
            }
            Ok(value) => {
                if value.is_promise() {
                    let promise: Promise = value.into_promise().unwrap();
                    let promise_future = promise.into_future::<R> ();
                    match promise_future.await {
                        Ok(result) => {
                            result
                        }
                        Err(e) => {
                            match e {
                                Error::Exception => {
                                    let exception = ctx.catch();
                                    panic! ("Exception during awaiting call result: {exception:?}")
                                }
                                _ => {
                                    panic ! ("Error during awaiting call result: {e:?}")
                                }
                            }
                        }
                    }
                }
                else {
                    R::from_js(&ctx, value).expect("Unexpected result value")
                }
            }
        }
    }).await;
    js_state.rt.idle().await;
    result
}

pub fn enqueue_drop_js_resource(resource_id: usize) {
    let js_state = get_js_state();
    js_state
        .resource_drop_queue_tx
        .unbounded_send(resource_id)
        .expect("Failed to enqueue resource drop");
}

pub async fn sleep(duration: Duration) {
    let js_state = get_js_state();
    let reactor = js_state.reactor.borrow().clone().unwrap();

    let pollable = subscribe_duration(duration.as_nanos() as u64);
    reactor.wait_for(pollable).await;
}

async fn drop_js_resource(resource_id: usize) {
    let js_state = get_js_state();

    async_with!(js_state.ctx => |ctx| {
        let resource_table: Object = ctx.globals().get(RESOURCE_TABLE_NAME)
            .expect("Failed to get the resource table");
        if let Err(e) = resource_table.remove(resource_id.to_string()) {
            panic!("Failed to delete resource {resource_id}: {e:?}");
        }
    })
    .await;
    js_state.rt.idle().await;
}

fn call_with_this<'js, A, R>(
    ctx: Ctx<'js>,
    function: Function<'js>,
    this: Object<'js>,
    args: A,
) -> rquickjs::Result<R>
where
    A: IntoArgs<'js>,
    R: FromJs<'js>,
{
    let num = args.num_args();
    let mut accum_args = Args::new(ctx.clone(), num + 1);
    accum_args.this(this)?;
    args.into_args(&mut accum_args)?;
    function.call_arg(accum_args)
}

fn get_path<'js, V: FromJs<'js>>(root: &Object<'js>, path: &[&str]) -> Option<(V, Object<'js>)> {
    let (head, tail) = path.split_first()?;
    if tail.is_empty() {
        root.get(*head).ok().map(|v| (v, root.clone()))
    } else {
        let next: Object<'js> = root.get(*head).ok()?;
        get_path(&next, tail)
    }
}

/// Future that runs the JS event loop every time the underlying future is pending
#[pin_project]
struct WithJsIdleLoop<F> {
    #[pin]
    inner: F,
    state: WithJsIdleLoopState,
}

impl<F: Future> WithJsIdleLoop<F> {
    pub fn new(inner: F) -> Self {
        WithJsIdleLoop {
            inner,
            state: WithJsIdleLoopState::Inner,
        }
    }
}

enum WithJsIdleLoopState {
    Inner,
    Js,
}

impl<F: Future> Future for WithJsIdleLoop<F> {
    type Output = F::Output;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        let this = self.project();
        match this.state {
            WithJsIdleLoopState::Inner => {
                let inner_poll = this.inner.poll(cx);
                match inner_poll {
                    Poll::Ready(result) => Poll::Ready(result),
                    Poll::Pending => {
                        // Switch to JS event loop
                        *this.state = WithJsIdleLoopState::Js;
                        cx.waker().wake_by_ref();
                        Poll::Pending
                    }
                }
            }
            WithJsIdleLoopState::Js => {
                let js_state = get_js_state();
                let idle_future = js_state.rt.idle();
                let idle_future = pin!(idle_future);
                let idle_poll_result = idle_future.poll(cx);
                match idle_poll_result {
                    Poll::Ready(()) => {
                        // Go back to the inner future
                        *this.state = WithJsIdleLoopState::Inner;
                        cx.waker().wake_by_ref();
                        this.inner.poll(cx)
                    }
                    Poll::Pending => Poll::Pending,
                }
            }
        }
    }
}

trait JsFutureExt {
    fn with_js_idle_loop(self) -> WithJsIdleLoop<Self>
    where
        Self: Sized;
}

impl<F: Future> JsFutureExt for F {
    fn with_js_idle_loop(self) -> WithJsIdleLoop<Self> {
        WithJsIdleLoop::new(self)
    }
}
