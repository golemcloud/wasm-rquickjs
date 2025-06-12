use rquickjs::function::{Args, Constructor};
use rquickjs::loader::{BuiltinLoader, BuiltinResolver, ModuleLoader, ScriptLoader};
use rquickjs::prelude::*;
use rquickjs::{
    AsyncContext, AsyncRuntime, CatchResultExt, Ctx, Error, FromJs, Function, Module, Object,
    Promise, Value, async_with,
};
use std::future::Future;
use std::sync::atomic::AtomicUsize;
use tokio::runtime::Runtime;

static JS_MODULE: &str = include_str!("module.js");

pub const RESOURCE_TABLE_NAME: &str = "__wasm_rquickjs_resources";
pub const RESOURCE_ID_KEY: &str = "__wasm_rquickjs_resource_id";

struct JsState {
    pub tokio: Runtime,
    pub rt: AsyncRuntime,
    pub ctx: AsyncContext,
    pub last_resource_id: AtomicUsize,
}

// TODO: remove
#[rquickjs::function]
fn print(msg: String) {
    println!("{msg}");
}

impl JsState {
    pub fn new() -> Self {
        let tokio = tokio::runtime::Builder::new_current_thread()
            .enable_time()
            .build()
            .expect("Failed to create Tokio runtime");

        let (rt, ctx) = tokio.block_on(async {
            let rt = AsyncRuntime::new().expect("Failed to create AsyncRuntime");
            let ctx = AsyncContext::full(&rt)
                .await
                .expect("Failed to create AsyncContext");

            let resolver = BuiltinResolver::default()
                .with_module("bundle/script_module");
            let resolver = crate::modules::add_native_module_resolvers(resolver);

            let loader = (
                BuiltinLoader::default().with_module("bundle/script_module", JS_MODULE),
                crate::modules::module_loader(),
                ScriptLoader::default(),
            );

            rt.set_loader(resolver, loader).await;

            async_with!(ctx => |ctx| {
                // TODO: remove >>>
                let global = ctx.globals();
                global
                    .set(
                        "__print",
                        js_print
                    )
                    .expect("Failed to set global print");

                ctx.eval::<(), _>(
                    r#"
                    globalThis.console = {
                      log(...v) {
                        globalThis.__print(`${v.join(" ")}`)
                      }
                    }
                "#).catch(&ctx).expect("Failed to set up console.log");
                // TODO: <<< remove
                // TODO: inject generated native modules

                global.set(RESOURCE_TABLE_NAME, Object::new(ctx.clone()))
                    .expect("Failed to initialize resource table");

                Module::evaluate(
                    ctx.clone(),
                    "test",
                    r#"
                    import * as userModule from 'bundle/script_module';
                    globalThis.userModule = userModule;
                    "#,
                )
                .catch(&ctx).expect("Failed to evaluate module initialization")
                .finish::<()>()
                .catch(&ctx).expect("Failed to finish module initialization");
            })
            .await;
            rt.idle().await;

            (rt, ctx)
        });

        let last_resource_id = AtomicUsize::new(0);
        Self {
            tokio,
            rt,
            ctx,
            last_resource_id,
        }
    }
}

static mut STATE: Option<JsState> = None;

#[allow(static_mut_refs)]
fn get_js_state() -> &'static JsState {
    unsafe {
        if STATE.is_none() {
            STATE = Some(JsState::new());
        }
        STATE.as_ref().unwrap()
    }
}

pub fn async_exported_function<F: Future>(future: F) -> F::Output {
    let js_state = get_js_state();
    js_state.tokio.block_on(future)
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

pub async fn drop_js_resource(resource_id: usize) {
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
