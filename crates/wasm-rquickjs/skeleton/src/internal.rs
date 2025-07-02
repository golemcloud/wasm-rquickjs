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
use std::rc::Rc;
use std::sync::atomic::{AtomicU32, AtomicUsize};
use std::task::{Context, Poll};
use tokio::runtime::Runtime;
use tokio::task::{JoinError, JoinSet, LocalSet, spawn_local};
use tokio_util::sync::CancellationToken;

static JS_MODULE: &str = include_str!("module.js");

pub const RESOURCE_TABLE_NAME: &str = "__wasm_rquickjs_resources";
pub const RESOURCE_ID_KEY: &str = "__wasm_rquickjs_resource_id";

pub struct JsState {
    pub tokio: Runtime,
    pub rt: AsyncRuntime,
    pub ctx: AsyncContext,
    pub last_resource_id: AtomicUsize,
    pub resource_drop_queue_tx: tokio::sync::mpsc::UnboundedSender<usize>,
    pub resource_drop_queue_rx: RefCell<Option<tokio::sync::mpsc::UnboundedReceiver<usize>>>,
    pub last_scheduled_task_id: AtomicU32,
    pub scheduled_tasks: RefCell<HashMap<u32, CancellationToken>>,
    pub current_join_set: RefCell<Option<JoinSet<()>>>,
}

impl JsState {
    pub fn new() -> Self {
        init_logging();

        let tokio = tokio::runtime::Builder::new_current_thread()
            .enable_time()
            .build()
            .expect("Failed to create Tokio runtime");

        let (rt, ctx) = tokio.block_on(async {
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

            (rt, ctx)
        });

        let (resource_drop_queue_tx, resource_drop_queue_rx) =
            tokio::sync::mpsc::unbounded_channel::<usize>();

        let last_resource_id = AtomicUsize::new(1);
        let last_scheduled_task_id = AtomicU32::new(0);
        Self {
            tokio,
            rt,
            ctx,
            last_resource_id,
            resource_drop_queue_tx,
            resource_drop_queue_rx: RefCell::new(Some(resource_drop_queue_rx)),
            last_scheduled_task_id,
            scheduled_tasks: RefCell::new(HashMap::new()),
            current_join_set: RefCell::new(None),
        }
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

    js_state.tokio.block_on(async move {
        let local = Rc::new(LocalSet::new());
        let join_set = JoinSet::new();

        js_state.current_join_set.replace(Some(join_set));

        local
            .run_until(async move {
                if let Some(mut resource_drop_queue_rx) = js_state.resource_drop_queue_rx.take() {
                    let heartbeat = spawn_local(async move {
                        loop {
                            tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
                        }
                    });

                    let resource_dropper = spawn_local(async move {
                        while let Some(resource_id) = resource_drop_queue_rx.recv().await {
                            if resource_id > 0 {
                                drop_js_resource(resource_id).await;
                            } else {
                                break;
                            }
                        }
                        resource_drop_queue_rx
                    });
                    let result = future.await;

                    // Await scheduled tasks
                    if let Err(err) = AwaitScheduledTasks::PollNext.await {
                        panic!("Error while awaiting scheduled tasks: {err}");
                    };

                    // Finish resource dropper
                    js_state
                        .resource_drop_queue_tx
                        .send(0)
                        .expect("Failed to enqueue resource dropper stop signal");
                    let resource_drop_queue_rx =
                        resource_dropper.await.expect("Resource dropper failed");
                    js_state
                        .resource_drop_queue_rx
                        .replace(Some(resource_drop_queue_rx));

                    heartbeat.abort();
                    result
                } else {
                    // This case will never happen because block_on does not allow reentry
                    unreachable!()
                }
            })
            .await
    })
}

enum AwaitScheduledTasks {
    PollNext,
    RunJs,
}

impl Future for AwaitScheduledTasks {
    type Output = Result<(), JoinError>;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        let state = get_js_state();
        let self_ = self.get_mut();
        match self_ {
            AwaitScheduledTasks::PollNext => {
                let mut join_set = state.current_join_set.borrow_mut();
                let poll_result = join_set
                    .as_mut()
                    .expect("No current join set")
                    .poll_join_next(cx);

                match poll_result {
                    Poll::Ready(Some(Ok(()))) => Poll::Pending, // One task done, go to the next
                    Poll::Ready(Some(Err(err))) => Poll::Ready(Err(err)), // Task failed, return the error
                    Poll::Ready(None) => Poll::Ready(Ok(())), // No more tasks to wait for
                    Poll::Pending => {
                        *self_ = AwaitScheduledTasks::RunJs; // No tasks ready, switch to running the JS event loop
                        cx.waker().wake_by_ref();
                        Poll::Pending
                    }
                }
            }
            AwaitScheduledTasks::RunJs => {
                // Scheduled tasks are still pending, we run the JS runtime in the meantime
                let mut idle_future = state.rt.idle();
                let idle_future = pin!(idle_future);
                let idle_poll_result = idle_future.poll(cx);
                match idle_poll_result {
                    Poll::Ready(()) => {
                        // idle() completed, going back to poll from the join set
                        *self_ = AwaitScheduledTasks::PollNext;
                        cx.waker().wake_by_ref();
                        Poll::Pending
                    }
                    Poll::Pending => Poll::Pending,
                }
            }
        }
    }
}

pub async fn call_js_export<A, R>(function_path: &[&str], args: A) -> R
where
    A: for<'js> IntoArgs<'js>,
    R: for<'js> FromJs<'js> + 'static,
{
    let js_state = get_js_state();

    let result: R = async_with!(js_state.ctx => |ctx| {
        let module: Object = ctx.globals().get("userModule").expect("Failed to get userModule");
        let (user_function, parent) = get_path(&module, function_path).expect(&format!("Cannot find exported JS function {}", function_path.join(".")));

        let result: Result<Value, Error> = call_with_this(ctx.clone(), user_function, parent, args);

        let result = match result {
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
                                    panic! ("Exception during awaiting call result for {function_path}: {exception:?}", function_path=function_path.join("."))
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
        };

        result
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
        let (constructor, _parent): (Constructor, Object) = get_path(&module, resource_path).expect(&format!("Cannot find exported JS resource class {}", resource_path.join(".")));

        let result: Result<Object, Error> = constructor.construct(args);

        let result = match result {
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
        };

        result
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
            .expect(&format!("Failed to get resource instance with id {resource_id}"));

        let method: Function = resource_instance.get(name)
            .expect(&format!("Failed to get method {name} from resource instance with id {resource_id}"));

        let result: Result<Value, Error> = call_with_this(ctx.clone(), method, resource_instance, args);

        let result = match result {
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
        };

        result
    }).await;
    js_state.rt.idle().await;
    result
}

pub fn enqueue_drop_js_resource(resource_id: usize) {
    let js_state = get_js_state();
    js_state
        .resource_drop_queue_tx
        .send(resource_id)
        .expect("Failed to enqueue resource drop");
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
