use crate::native::NativeModule;
use rquickjs::function::Args;
use rquickjs::loader::{BuiltinLoader, BuiltinResolver, ModuleLoader, ScriptLoader};
use rquickjs::prelude::*;
use rquickjs::{
    AsyncContext, AsyncRuntime, CatchResultExt, Ctx, Error, FromJs, Function, Module, Object,
    Promise, Value, async_with,
};
use std::future::Future;
use tokio::runtime::Runtime;

static JS_MODULE: &str = include_str!("module.js");

struct JsState {
    pub tokio: Runtime,
    pub rt: AsyncRuntime,
    pub ctx: AsyncContext,
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
                .with_module("bundle/script_module")
                .with_module("bundle/native_module");
            let loader = (
                BuiltinLoader::default().with_module("bundle/script_module", JS_MODULE),
                ModuleLoader::default().with_module("bundle/native_module", NativeModule),
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

                Module::evaluate(
                    ctx.clone(),
                    "test",
                    r#"
                    globalThis.__print(`JSDEBUG: Before import`);

                    import * as userModule from 'bundle/script_module';

                    globalThis.__print(`JSDEBUG: Loaded userModule`);
                    globalThis.userModule = userModule;
                    "#,
                )
                .catch(&ctx).expect("Failed to evaluate module initialization")
                .finish::<()>()
                .catch(&ctx).expect("Failed to finish module initialization");

                println!("DEBUG: JS initialization async_with ending");
            }).await;
            rt.idle().await;

            println!("DEBUG: JS module loaded");

            (rt, ctx)
        });

        Self { tokio, rt, ctx }
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
    println!("async_exported_function gets js_state");
    let js_state = get_js_state();
    println!("async_exported_function runs future");
    js_state.tokio.block_on(future)
}

// TODO: remove debug prints
// TODO: inject generated native modules
pub async fn call_js_export<A, R>(function_name: &str, args: A) -> R
where
    A: for<'js> IntoArgs<'js>,
    R: for<'js> FromJs<'js> + 'static,
{
    let js_state = get_js_state();

    let result: R = async_with!(js_state.ctx => |ctx| {
        let module: Object = ctx.globals().get("userModule").expect("Failed to get userModule");
        let user_function: Function = module.get(function_name).expect(&format!("Cannot find exported JS function {function_name}"));

        let result: Result<Value, Error> = call_with_this(ctx.clone(), user_function, module, args);

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

pub fn call_with_this<'js, A, R>(
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
