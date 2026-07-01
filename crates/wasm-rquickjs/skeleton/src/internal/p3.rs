//! Minimal WASI Preview 3 runtime spine for the generated rquickjs component.
//!
//! Unlike the Preview 2 skeleton this module does NOT depend on `wstd`, `wasip2`,
//! pollables, or `block_on`. Exported WIT functions are generated as `async fn`s
//! that `.await` directly on the component-model async executor, and the single
//! shared `rquickjs::AsyncRuntime` is created once via an async init-once guard
//! (`ensure_initialized`) that is safe under concurrent exported calls.

use rquickjs::function::{Args, IntoArgs};
use rquickjs::loader::{BuiltinLoader, BuiltinResolver};
use rquickjs::{
    AsyncContext, AsyncRuntime, CatchResultExt, CaughtError, Ctx, Error, FromJs, Function, Module,
    Object, Persistent, Promise, String as JsString, Value, async_with,
};
use std::cell::RefCell;
use std::collections::HashMap;
use std::future::Future;
use std::pin::Pin;
use std::task::{Context as TaskContext, Poll};

/// Global key under which the `Symbol.dispose` value is published. Resource classes generated
/// for imported WIT resources read this global to wire `[Symbol.dispose]` onto their prototype,
/// so it must match the constant the Preview 2 path uses (`internal/p2.rs`).
pub const DISPOSE_SYMBOL: &str = "__wasm_rquickjs_symbol_dispose";

/// All Rust-side runtime state for the component. A single instance lives in
/// `STATE` and is shared across all (possibly concurrent) exported calls.
pub struct JsState {
    pub rt: AsyncRuntime,
    pub ctx: AsyncContext,
    pub exported_function_cache: RefCell<HashMap<&'static [&'static str], CachedExportedFunction>>,
    pub variant_case_tag_cache: RefCell<HashMap<&'static str, Persistent<JsString<'static>>>>,
}

pub struct CachedExportedFunction {
    function: Persistent<Function<'static>>,
    parent: Persistent<Object<'static>>,
    parameter_count: usize,
}

impl JsState {
    /// Create the runtime, context, resolvers and loaders. Does NOT evaluate any
    /// JavaScript, so it is safe to publish to `STATE` before `finish_init`.
    async fn new_base() -> Self {
        let rt = AsyncRuntime::new().expect("Failed to create AsyncRuntime");
        // Raise the GC threshold to reduce the chance of triggering a QuickJS-ng
        // shape refcount bug during heavy async/promise workloads.
        rt.set_gc_threshold(256 * 1024 * 1024).await;
        let ctx = AsyncContext::full(&rt)
            .await
            .expect("Failed to create AsyncContext");

        let mut builtin_resolver =
            BuiltinResolver::default().with_module(crate::JS_EXPORT_MODULE_NAME);
        for (name, _) in crate::JS_ADDITIONAL_MODULES.iter() {
            builtin_resolver = builtin_resolver.with_module(name.to_string());
        }
        let builtin_resolver = crate::modules::add_native_module_resolvers(builtin_resolver);
        let builtin_resolver = crate::builtin::add_module_resolvers(builtin_resolver);

        let mut builtin_loader = BuiltinLoader::default()
            .with_module(crate::JS_EXPORT_MODULE_NAME, crate::js_export_module());
        for (name, get_module) in crate::JS_ADDITIONAL_MODULES.iter() {
            let source = (get_module)();
            builtin_loader = builtin_loader.with_module(name.to_string(), source);
        }

        let loader = (
            builtin_loader,
            crate::modules::module_loader(),
            crate::builtin::module_loader(),
        );

        rt.set_loader(builtin_resolver, loader).await;

        Self {
            rt,
            ctx,
            exported_function_cache: RefCell::new(HashMap::new()),
            variant_case_tag_cache: RefCell::new(HashMap::new()),
        }
    }

    /// Evaluate the user module (and any additional modules). Must run after
    /// `STATE` is published so re-entrant `get_js_state()` calls find it.
    async fn finish_init(&self) {
        async_with!(self.ctx => |ctx| {
            // Resource classes generated for imported WIT resources wire `[Symbol.dispose]` onto
            // their prototype via the global `DISPOSE_SYMBOL`, so it must be defined before the
            // user module (which triggers resource-class registration) is imported.
            Module::evaluate(
                ctx.clone(),
                "dispose",
                format!(
                    r#"
                    const dispose = Symbol.for("dispose");
                    globalThis.{DISPOSE_SYMBOL} = dispose;
                    Symbol.dispose = dispose;
                    const asyncDispose = Symbol.for("asyncDispose");
                    Symbol.asyncDispose = asyncDispose;
                    "#
                ),
            )
            .catch(&ctx)
            .unwrap_or_else(|e| panic!("Failed to evaluate dispose module initialization:\n{}", format_caught_error(e)))
            .finish::<()>()
            .catch(&ctx)
            .unwrap_or_else(|e| panic!("Failed to finish dispose module initialization:\n{}", format_caught_error(e)));

            Module::evaluate(
                ctx.clone(),
                "__wasm_rquickjs_init_entry",
                format!(
                    r#"
                    import * as userModule from '{}';
                    globalThis.userModule = userModule;
                    "#,
                    crate::JS_EXPORT_MODULE_NAME
                ),
            )
            .catch(&ctx)
            .unwrap_or_else(|e| panic!("Failed to evaluate module initialization:\n{}", format_caught_error(e)))
            .finish::<()>()
            .catch(&ctx)
            .unwrap_or_else(|e| panic!("Failed to finish module initialization:\n{}", format_caught_error(e)));

            for (name, _) in crate::JS_ADDITIONAL_MODULES.iter() {
                Module::import(&ctx, name.to_string())
                    .catch(&ctx)
                    .unwrap_or_else(|e| panic!("Failed to import user module {name}:\n{}", format_caught_error(e)))
                    .finish::<()>()
                    .catch(&ctx)
                    .unwrap_or_else(|e| panic!("Failed to finish importing user module {name}:\n{}", format_caught_error(e)));
            }
        })
        .await;
        self.rt.idle().await;
    }
}

#[derive(Clone, Copy, PartialEq, Eq)]
enum InitState {
    NotStarted,
    InProgress,
    Done,
}

static mut STATE: Option<JsState> = None;
static mut INIT: InitState = InitState::NotStarted;

/// Cooperative yield: returns `Pending` exactly once (re-waking immediately) so
/// that another concurrent task can make progress. Used to wait for an in-flight
/// initialization without busy-spinning the host.
struct YieldNow(bool);

impl Future for YieldNow {
    type Output = ();

    fn poll(mut self: Pin<&mut Self>, cx: &mut TaskContext<'_>) -> Poll<()> {
        if self.0 {
            Poll::Ready(())
        } else {
            self.0 = true;
            cx.waker().wake_by_ref();
            Poll::Pending
        }
    }
}

/// Async init-once for the shared runtime. Safe under concurrent exported calls:
/// the component is single-threaded and cooperatively scheduled, so the
/// `NotStarted -> InProgress` transition happens atomically between await points;
/// concurrent callers observe `InProgress` and yield until initialization is
/// `Done`.
#[allow(static_mut_refs)]
pub async fn ensure_initialized() -> &'static JsState {
    loop {
        match unsafe { INIT } {
            InitState::NotStarted => {
                unsafe {
                    INIT = InitState::InProgress;
                }
                let state = JsState::new_base().await;
                unsafe {
                    STATE = Some(state);
                }
                // Borrow the published state to evaluate JS. No `&mut STATE` is
                // taken across this await, so concurrent yielding callers are safe.
                unsafe { STATE.as_ref().unwrap() }.finish_init().await;
                unsafe {
                    INIT = InitState::Done;
                }
                return unsafe { STATE.as_ref().unwrap() };
            }
            InitState::InProgress => {
                YieldNow(false).await;
            }
            InitState::Done => {
                return unsafe { STATE.as_ref().unwrap() };
            }
        }
    }
}

/// Returns the already-initialized shared state. Only valid to call after
/// `ensure_initialized().await` has completed (i.e. from within an exported call).
#[allow(static_mut_refs)]
pub fn get_js_state() -> &'static JsState {
    unsafe {
        STATE
            .as_ref()
            .expect("JsState accessed before initialization; this is a bug in the generated code")
    }
}

pub async fn call_js_export<A, R>(
    wit_package: &'static str,
    function_path: &'static [&'static str],
    args: A,
) -> R
where
    A: for<'js> IntoArgs<'js>,
    R: for<'js> FromJs<'js> + 'static,
{
    call_js_export_internal(wit_package, function_path, args, |a| a, |_, _| None).await
}

pub async fn call_js_export_returning_result<A, R, E>(
    wit_package: &'static str,
    function_path: &'static [&'static str],
    args: A,
) -> crate::wrappers::JsResult<R, E>
where
    A: for<'js> IntoArgs<'js>,
    R: for<'js> FromJs<'js> + 'static,
    E: for<'js> FromJs<'js> + 'static,
{
    call_js_export_internal(
        wit_package,
        function_path,
        args,
        |a| crate::wrappers::JsResult(Ok(a)),
        |ctx, value| {
            FromJs::from_js(ctx, value.clone())
                .ok()
                .map(|e| crate::wrappers::JsResult(Err(e)))
        },
    )
    .await
}

async fn call_js_export_internal<A, R, FR, TME>(
    wit_package: &'static str,
    function_path: &'static [&'static str],
    args: A,
    map_result: impl Fn(R) -> FR,
    try_map_exception: TME,
) -> FR
where
    A: for<'js> IntoArgs<'js>,
    R: for<'js> FromJs<'js> + 'static,
    FR: 'static,
    TME: for<'js> Fn(&Ctx<'js>, &Value<'js>) -> Option<FR>,
{
    let js_state = ensure_initialized().await;

    async_with!(js_state.ctx => |ctx| {
        let (user_function, parent) =
            get_cached_js_export(js_state, &ctx, wit_package, function_path, args.num_args());

        let result: Result<Value, Error> = call_with_this(ctx.clone(), user_function, parent, args);

        match result {
            Err(Error::Exception) => {
                let exception = ctx.catch();
                if let Some(result) = try_map_exception(&ctx, &exception) {
                    result
                } else {
                    panic!("Exception during call of {fun}:\n{exception}", fun = function_path.join("."), exception = format_js_exception(&exception));
                }
            }
            Err(e) => {
                panic!("Error during call of {fun}:\n{e:?}", fun = function_path.join("."));
            }
            Ok(value) => {
                if value.is_promise() {
                    let promise: Promise = value.into_promise().unwrap();
                    let promise_future = promise.into_future::<R>();

                    match promise_future.await {
                        Ok(result) => map_result(result),
                        Err(e) => match e {
                            Error::Exception => {
                                let exception = ctx.catch();
                                if let Some(result) = try_map_exception(&ctx, &exception) {
                                    result
                                } else {
                                    panic!("Exception during awaiting call result for {function_path}:\n{exception}", function_path = function_path.join("."), exception = format_js_exception(&exception))
                                }
                            }
                            _ => panic!("Error during awaiting call result for {function_path}:\n{e:?}", function_path = function_path.join(".")),
                        },
                    }
                } else {
                    map_result(
                        R::from_js(&ctx, value).unwrap_or_else(|err| panic!("Unexpected result value for exported function {path}: {err}", path = function_path.join("."))),
                    )
                }
            }
        }
    })
    .await
}

fn get_cached_js_export<'js>(
    js_state: &JsState,
    ctx: &Ctx<'js>,
    wit_package: &'static str,
    function_path: &'static [&'static str],
    expected_parameter_count: usize,
) -> (Function<'js>, Object<'js>) {
    if let Some((function, parent, parameter_count)) = js_state
        .exported_function_cache
        .borrow()
        .get(function_path)
        .map(|cached| {
            (
                cached.function.clone(),
                cached.parent.clone(),
                cached.parameter_count,
            )
        })
    {
        if parameter_count != expected_parameter_count {
            panic!(
                "The WIT specification defines {} parameters,\nbut the exported JavaScript function got {} parameters (exported function {} in WIT package {})",
                expected_parameter_count,
                parameter_count,
                function_path.join("."),
                wit_package
            );
        }

        let function = function
            .restore(ctx)
            .expect("Failed to restore cached exported JS function");
        let parent = parent
            .restore(ctx)
            .expect("Failed to restore cached exported JS function parent");
        return (function, parent);
    }

    let module: Object = ctx
        .globals()
        .get("userModule")
        .expect("Failed to get userModule");
    let (user_function_obj, parent): (Object, Object) =
        get_path(&module, function_path).unwrap_or_else(|| {
            panic!(
                "{}",
                dump_cannot_find_export("exported JS function", function_path, &module, wit_package)
            )
        });
    let user_function = user_function_obj
        .as_function()
        .unwrap_or_else(|| {
            panic!(
                "Expected export {} to be a function",
                function_path.join(".")
            )
        })
        .clone();

    let parameter_count = user_function_obj
        .get::<&str, usize>("length")
        .unwrap_or_else(|_| {
            panic!(
                "Failed to get parameter count of exported function {}",
                function_path.join(".")
            )
        });
    if parameter_count != expected_parameter_count {
        panic!(
            "The WIT specification defines {} parameters,\nbut the exported JavaScript function got {} parameters (exported function {} in WIT package {})",
            expected_parameter_count,
            parameter_count,
            function_path.join("."),
            wit_package
        );
    }

    js_state.exported_function_cache.borrow_mut().insert(
        function_path,
        CachedExportedFunction {
            function: Persistent::save(ctx, user_function.clone()),
            parent: Persistent::save(ctx, parent.clone()),
            parameter_count,
        },
    );

    (user_function, parent)
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

fn dump_cannot_find_export(what: &str, path: &[&str], module: &Object, wit_package: &str) -> String {
    let mut panic_message = String::new();
    panic_message.push_str(&format!(
        "Cannot find {what} {} of WIT package {wit_package}",
        path.join(".")
    ));
    panic_message.push_str("\nProvided exports:\n");
    let mut keys: Vec<String> = vec![];
    for key in module.keys().flatten() {
        keys.push(key);
    }
    keys.sort();
    panic_message.push_str(&format!("  {}\n", keys.join(", ")));
    panic_message
}

pub fn variant_case_tag<'js>(
    ctx: &Ctx<'js>,
    name: &'static str,
) -> rquickjs::Result<JsString<'js>> {
    let js_state = get_js_state();
    if let Some(tag) = js_state.variant_case_tag_cache.borrow().get(name).cloned() {
        return tag.restore(ctx);
    }

    let tag = JsString::from_str(ctx.clone(), name)?;
    js_state
        .variant_case_tag_cache
        .borrow_mut()
        .insert(name, Persistent::save(ctx, tag.clone()));
    Ok(tag)
}

pub fn format_js_exception(exc: &Value) -> String {
    try_format_js_error(exc)
        .or_else(|| try_format_tagged_error(exc))
        .unwrap_or_else(|| {
            let formatted_exc = pretty_stringify_or_debug_print(exc);
            if formatted_exc.contains('\n') {
                format!("JavaScript exception:\n{formatted_exc}")
            } else {
                format!("JavaScript exception: {formatted_exc}")
            }
        })
}

pub fn try_format_js_error(err: &Value) -> Option<String> {
    let error_ctor: Object = err.ctx().globals().get("Error").ok()?;
    let obj = err.as_object()?;

    if !obj.is_instance_of(error_ctor) {
        return None;
    }

    let message: Option<String> = obj.get("message").ok();
    let stack: Option<String> = obj.get("stack").ok();

    match (message, stack) {
        (Some(msg), Some(st)) => Some(format!("JavaScript error: {msg}\nStack:\n{st}")),
        (Some(msg), None) => Some(format!("JavaScript error: {msg}")),
        (None, Some(st)) => Some(format!("JavaScript error: <no message>\nStack:\n{st}")),
        _ => None,
    }
}

pub fn try_format_tagged_error(err: &Value) -> Option<String> {
    let obj = err.as_object()?;
    let tag: Option<String> = obj.get("tag").ok();
    let val: Option<Value> = obj.get("val").ok();
    let val = val.and_then(|v| (!v.is_undefined()).then_some(v));

    match (tag, val) {
        (Some(tag), Some(val)) => {
            let formatted_val = pretty_stringify_or_debug_print(&val);
            if formatted_val.contains('\n') {
                Some(format!("Error: {tag}:\n{formatted_val}"))
            } else {
                Some(format!("Error: {tag}: {formatted_val}"))
            }
        }
        (Some(tag), None) => Some(format!("Error: {tag}")),
        _ => None,
    }
}

fn pretty_stringify_or_debug_print(val: &Value) -> String {
    if let Some(formatted) = try_pretty_stringify(val) {
        formatted
    } else {
        format!("{val:#?}")
    }
}

fn try_pretty_stringify(val: &Value) -> Option<String> {
    if val.is_undefined() {
        return Some("undefined".to_string());
    }

    if let Some(str) = val.as_string() {
        return str.to_string().ok();
    }

    let json: Object = val.ctx().globals().get("JSON").ok()?;
    let stringify: Function = json.get("stringify").ok()?;
    let res: Result<String, Error> = stringify.call((val, rquickjs::Undefined, 2));
    res.ok()
}

pub fn format_caught_error(caught: CaughtError) -> String {
    match caught {
        CaughtError::Error(e) => format!("Host error: {e:?}"),
        CaughtError::Exception(exc) => format_js_exception(&exc.into_value()),
        CaughtError::Value(val) => format_js_exception(&val),
    }
}
