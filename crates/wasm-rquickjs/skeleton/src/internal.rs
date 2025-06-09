use crate::native::NativeModule;
use rquickjs::function::Args;
use rquickjs::loader::{BuiltinLoader, BuiltinResolver, ModuleLoader, ScriptLoader};
use rquickjs::prelude::IntoArgs;
use rquickjs::{
    async_with, AsyncContext, AsyncRuntime, CatchResultExt, Ctx, Error, FromJs, Function, Module,
    Object, Promise,
};
use std::future::Future;

static JS_MODULE: &str = include_str!("module.js");

pub fn async_exported_function<F: Future>(future: F) -> F::Output {
    tokio::runtime::Builder::new_current_thread()
        .enable_time()
        .build()
        .unwrap()
        .block_on(future)
}

// TODO: context has to be shared between invocations
// TODO: remove debug prints
// TODO: get rid of unwraps
// TODO: inject generated native modules
pub async fn call_js_export<A, R>(function_name: &str, args: A) -> R
where
    A: for<'js> IntoArgs<'js>,
    R: for<'js> FromJs<'js> + 'static,
{
    let resolver = BuiltinResolver::default()
        .with_module("bundle/script_module")
        .with_module("bundle/native_module");
    let loader = (
        BuiltinLoader::default().with_module("bundle/script_module", JS_MODULE),
        ModuleLoader::default().with_module("bundle/native_module", NativeModule),
        ScriptLoader::default(),
    );

    let rt = AsyncRuntime::new().unwrap();
    let ctx = AsyncContext::full(&rt).await.unwrap();
    rt.set_loader(resolver, loader).await;

    let result: R = async_with!(ctx => | ctx| {
        Module::evaluate(
            ctx.clone(),
            "test",
            r#"
            import { userModule } from 'bundle/script_module';

            globalThis.userModule = userModule;
            "#,
        ).unwrap().finish::< () > ().unwrap();

        let module: Object = ctx.globals().get("userModule").unwrap();
        let user_function: Function = module.get(function_name).unwrap();

        let promise: Result < Promise, Error > = call_with_this(ctx.clone(), user_function, module, args);

        let promise = if let Err(Error::Exception) = promise {
            let exception = ctx.catch();
            panic! ("Exception during call: {exception:?}");
        } else {
            promise.unwrap()
        };

        let promise_future = promise.into_future::< R> ();
        let result = match promise_future.await {
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
        };
        result
    }).await;
    rt.idle().await;
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
