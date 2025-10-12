use futures::future::AbortHandle;
use futures_concurrency::future::Join;
use rquickjs::function::{Args, Constructor};
use rquickjs::loader::{BuiltinLoader, BuiltinResolver, ScriptLoader};
use rquickjs::{
    AsyncContext, AsyncRuntime, CatchResultExt, Ctx, Error, Filter, FromJs, Function, Module,
    Object, Promise, Value, async_with,
};
use rquickjs::{CaughtError, prelude::*};
use std::cell::RefCell;
use std::collections::{HashMap, VecDeque};
use std::future::Future;
use std::pin::Pin;
use std::sync::atomic::AtomicUsize;
use wstd::runtime::block_on;

pub const RESOURCE_TABLE_NAME: &str = "__wasm_rquickjs_resources";
pub const RESOURCE_ID_KEY: &str = "__wasm_rquickjs_resource_id";
pub const DISPOSE_SYMBOL: &str = "__wasm_rquickjs_symbol_dispose";

pub struct JsState {
    pub rt: AsyncRuntime,
    pub ctx: AsyncContext,
    pub last_resource_id: AtomicUsize,
    pub resource_drop_queue_tx: futures::channel::mpsc::UnboundedSender<usize>,
    pub resource_drop_queue_rx: RefCell<Option<futures::channel::mpsc::UnboundedReceiver<usize>>>,
    pub abort_handles: RefCell<HashMap<usize, AbortHandle>>,
    pub last_abort_id: AtomicUsize,
    next_tick_queue:
        RefCell<VecDeque<Box<dyn FnOnce() -> Pin<Box<dyn Future<Output=()> + 'static>>>>>,
}

impl Default for JsState {
    fn default() -> Self {
        Self::new()
    }
}

impl JsState {
    pub fn new() -> Self {
        block_on(async {
            let rt = AsyncRuntime::new().expect("Failed to create AsyncRuntime");
            let ctx = AsyncContext::full(&rt)
                .await
                .expect("Failed to create AsyncContext");

            async_with!(ctx => |ctx| {
                Module::evaluate(
                    ctx.clone(),
                    "dispose",
                    format!(r#"
                    const dispose = Symbol.for("dispose");
                    globalThis.{DISPOSE_SYMBOL} = dispose;
                    Symbol.dispose = dispose;
                    "#)
                ).catch(&ctx)
                .unwrap_or_else(|e| panic!("Failed to evaluate dispose module initialization:\n{}", format_caught_error(e)))
                .finish::<()>()
                .catch(&ctx)
                .unwrap_or_else(|e| panic!("Failed to finish dispose module initialization:\n{}", format_caught_error(e)));
            })
                .await;
            rt.idle().await;

            let mut resolver = BuiltinResolver::default().with_module(crate::JS_EXPORT_MODULE_NAME);
            for (name, _) in crate::JS_ADDITIONAL_MODULES.iter() {
                resolver = resolver.with_module(name.to_string());
            }
            let resolver = crate::modules::add_native_module_resolvers(resolver);
            let resolver = crate::builtin::add_module_resolvers(resolver);

            let mut builtin_loader = BuiltinLoader::default()
                .with_module(crate::JS_EXPORT_MODULE_NAME, crate::JS_EXPORT_MODULE);
            for (name, get_module) in crate::JS_ADDITIONAL_MODULES.iter() {
                builtin_loader = builtin_loader.with_module(name.to_string(), (get_module)());
            }

            let loader = (
                builtin_loader,
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
                    import * as userModule from '{}';
                    globalThis.userModule = userModule;
                    "#, crate::JS_EXPORT_MODULE_NAME),
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
            rt.idle().await;

            let (resource_drop_queue_tx, resource_drop_queue_rx) =
                futures::channel::mpsc::unbounded();

            let last_resource_id = AtomicUsize::new(1);
            Self {
                rt,
                ctx,
                last_resource_id,
                resource_drop_queue_tx,
                resource_drop_queue_rx: RefCell::new(Some(resource_drop_queue_rx)),
                abort_handles: RefCell::new(HashMap::new()),
                last_abort_id: AtomicUsize::new(0),
                next_tick_queue: RefCell::new(VecDeque::new()),
            }
        })
    }

    pub fn add_next_tick_callback(
        &self,
        callback: Box<dyn FnOnce() -> Pin<Box<dyn Future<Output=()> + 'static>>>,
    ) {
        self.next_tick_queue.borrow_mut().push_back(callback);
    }

    fn pop_next_tick_callback(
        &self,
    ) -> Option<Box<dyn FnOnce() -> Pin<Box<dyn Future<Output=()> + 'static>>>> {
        let result = self.next_tick_queue.borrow_mut().pop_front();
        result
    }

    pub async fn idle(&self) {
        let mut n;

        loop {
            n = 0;

            while let Some(f) = self.pop_next_tick_callback() {
                println!("** CALLING NEXT_TICK CALLBACK");
                f().await;
                n += 1;
            }

            println!("** CALLING RT.IDLE");
            self.rt.idle().await;

            println!("** IDLE DONE {n}");

            if n == 0 {
                break;
            }
        }
    }
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

    block_on(async move {
        use futures::StreamExt;

        println!("async_exported_function start");
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

            // Finish resource dropper
            js_state
                .resource_drop_queue_tx
                .unbounded_send(0)
                .expect("Failed to enqueue resource dropper stop signal");
            let (result, resource_drop_queue_rx) = (future, resource_dropper).join().await;
            js_state
                .resource_drop_queue_rx
                .replace(Some(resource_drop_queue_rx));

            println!("async_exported_function end");

            result
        } else {
            // This case will never happen because block_on does not allow reentry
            unreachable!()
        }
    })
}

pub async fn call_js_export<A, R>(wit_package: &str, function_path: &[&str], args: A) -> R
where
    A: for<'js> IntoArgs<'js>,
    R: for<'js> FromJs<'js> + 'static,
{
    call_js_export_internal(wit_package, function_path, args, |a| a, |_, _| None).await
}

pub async fn call_js_export_returning_result<A, R, E>(
    wit_package: &str,
    function_path: &[&str],
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
    wit_package: &str,
    function_path: &[&str],
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
    let js_state = get_js_state();

    let result: FR = async_with!(js_state.ctx => |ctx| {
        let module: Object = ctx.globals().get("userModule").expect("Failed to get userModule");
        let (user_function_obj, parent): (Object, Object) = get_path(&module, function_path).unwrap_or_else(|| panic!("{}", dump_cannot_find_export("exported JS function", function_path, &module, wit_package)));
        let user_function = user_function_obj.as_function().unwrap_or_else(|| panic!("Expected export {} to be a function", function_path.join("."))).clone();

        let parameter_count = user_function_obj.get::<&str, usize>("length").unwrap_or_else(|_| panic!("Failed to get parameter count of exported function {}", function_path.join(".")));
        if parameter_count != args.num_args() {
            panic!(
                "The WIT specification defines {} parameters,\nbut the exported JavaScript function got {} parameters (exported function {} in WIT package {})",
                args.num_args(),
                parameter_count,
                function_path.join("."),
                wit_package
            );
        }

        let result: Result<Value, Error> = call_with_this(ctx.clone(), user_function, parent, args);

        match result {
            Err(Error::Exception) => {
                let exception = ctx.catch();
                if let Some(result) = try_map_exception(&ctx, &exception) {
                    result
                } else {
                    panic! ("Exception during call of {fun}:\n{exception}", fun = function_path.join("."), exception = format_js_exception(&exception));
                }
            }
            Err(e) => {
                panic! ("Error during call of {fun}:\n{e:?}", fun = function_path.join("."));
            }
            Ok(value) => {
                if value.is_promise() {
                    let promise: Promise = value.into_promise().unwrap();
                    let promise_future = promise.into_future::<R> ();
                    println!("promise future await start");
                    
                    match promise_future.await {
                        Ok(result) => {
                            map_result(result)
                        }
                        Err(e) => {
                            match e {
                                Error::Exception => {
                                    let exception = ctx.catch();
                                    if let Some(result) = try_map_exception(&ctx, &exception) {
                                        result
                                    } else {
                                        panic! ("Exception during awaiting call result for {function_path}:\n{exception}", function_path=function_path.join("."), exception = format_js_exception(&exception))
                                    }
                                }
                                _ => {
                                    panic ! ("Error during awaiting call result for {function_path}:\n{e:?}", function_path=function_path.join("."))
                                }
                            }
                        }
                    }
                }
                else {
                    (map_result)(
                        R::from_js(&ctx, value).expect(&format!("Unexpected result value for exported function {path}", path=function_path.join(".")))
                    )
                }
            }
        }
    }).await;
    println!("async_with finished, before idle");
    js_state.idle().await;
    println!("after idle");
    result
}

pub async fn call_js_resource_constructor<A>(
    wit_package: &str,
    resource_path: &[&str],
    args: A,
) -> usize
where
    A: for<'js> IntoArgs<'js>,
{
    let js_state = get_js_state();

    let result = async_with!(js_state.ctx => |ctx| {
        let module: Object = ctx.globals().get("userModule").expect("Failed to get userModule");
        let (constructor_obj, _parent): (Constructor, Object) = get_path(&module, resource_path).unwrap_or_else(|| panic!("{}", dump_cannot_find_export("exported JS resource class", resource_path, &module, wit_package)));
        let constructor = constructor_obj.as_constructor().unwrap_or_else(|| panic!("Expected export {path} to be a class with a constructor", path = resource_path.join("."))).clone();

        let parameter_count = constructor_obj.get::<&str, usize>("length").unwrap_or_else(|_| panic!("Failed to get parameter count of exported constructor {}", resource_path.join(".")));
        if parameter_count != args.num_args() {
            panic!(
                "The WIT specification defines {} parameters,\nbut the exported JavaScript constructor got {} parameters (exported constructor {} in WIT package {})",
                args.num_args(),
                parameter_count,
                resource_path.join("."),
                wit_package
            );
        }

        let result: Result<Object, Error> = constructor.construct(args);

        match result {
            Err(Error::Exception) => {
                let exception = ctx.catch();
                panic! ("Exception during call of constructor {path}:\n{exception}", path= resource_path.join("."), exception = format_js_exception(&exception));
            }
            Err(e) => {
                panic! ("Error during call of constructor {path}: {e:?}", path= resource_path.join("."));
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
    js_state.idle().await;
    result
}

pub fn get_free_resource_id() -> usize {
    get_js_state()
        .last_resource_id
        .fetch_add(1, std::sync::atomic::Ordering::Relaxed)
}

pub async fn call_js_resource_method<A, R>(
    wit_package: &str,
    resource_path: &[&str],
    resource_id: usize,
    name: &str,
    args: A,
) -> R
where
    A: for<'js> IntoArgs<'js>,
    R: for<'js> FromJs<'js> + 'static,
{
    call_js_resource_method_internal(
        wit_package,
        resource_path,
        resource_id,
        name,
        args,
        |a| a,
        |_, _| None,
    )
        .await
}

pub async fn call_js_resource_method_returning_result<A, R, E>(
    wit_package: &str,
    resource_path: &[&str],
    resource_id: usize,
    name: &str,
    args: A,
) -> crate::wrappers::JsResult<R, E>
where
    A: for<'js> IntoArgs<'js>,
    R: for<'js> FromJs<'js> + 'static,
    E: for<'js> FromJs<'js> + 'static,
{
    call_js_resource_method_internal(
        wit_package,
        resource_path,
        resource_id,
        name,
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

async fn call_js_resource_method_internal<A, R, FR, TME>(
    wit_package: &str,
    resource_path: &[&str],
    resource_id: usize,
    name: &str,
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
    let js_state = get_js_state();

    let result: FR = async_with!(js_state.ctx => |ctx| {
        let resource_table: Object = ctx.globals().get(RESOURCE_TABLE_NAME)
            .expect("Failed to get the resource table");
        let resource_instance: Object = resource_table.get(resource_id.to_string())
            .unwrap_or_else(|_| panic!("Failed to get resource instance with id #{resource_id} of class {}", resource_path.join(".")));

        let method_obj: Object = resource_instance.get(name)
            .unwrap_or_else(|_| panic!("{}", dump_cannot_find_method(
                name,
                resource_path,
                &resource_instance,
                wit_package,
            )));

        let method = method_obj.as_function().unwrap_or_else(|| panic!("Expected method {name} to be a function in class {}", resource_path.join("."))).clone();

        let parameter_count = method.get::<&str, usize>("length").unwrap_or_else(|_| panic!("Failed to get parameter count of exported method {name} in class {}", resource_path.join(".")));
        if parameter_count != args.num_args() {
            panic!(
                "The WIT specification defines {} parameters,\nbut the exported JavaScript method got {} parameters (exported method {} of class {} representing a resource defined in WIT package {})",
                args.num_args(),
                parameter_count,
                name,
                resource_path.join("."),
                wit_package
            );
        }

        let result: Result<Value, Error> = call_with_this(ctx.clone(), method, resource_instance, args);

        match result {
            Err(Error::Exception) => {
                let exception = ctx.catch();
                if let Some(result) = try_map_exception(&ctx, &exception) {
                    result
                } else {
                    panic!("Exception during call of method {name} in {path}:\n{exception}", path=resource_path.join("."), exception = format_js_exception(&exception));
                }
            }
            Err(e) => {
                panic!("Error during call of method {name} in {path}:\n{e:?}", path=resource_path.join("."));
            }
            Ok(value) => {
                if value.is_promise() {
                    let promise: Promise = value.into_promise().unwrap();
                    let promise_future = promise.into_future::<R> ();
                    match promise_future.await {
                        Ok(result) => {
                            map_result(result)
                        }
                        Err(e) => {
                            match e {
                                Error::Exception => {
                                    let exception = ctx.catch();
                                    if let Some(result) = try_map_exception(&ctx, &exception) {
                                        result
                                    } else {
                                        panic!("Exception during awaiting call result of method {name} in {path}:\n{exception:?}", path=resource_path.join("."), exception = format_js_exception(&exception));
                                    }
                                }
                                _ => {
                                    panic!("Error during awaiting call result of method {name} in {path}:\n{e:?}", path=resource_path.join("."));
                                }
                            }
                        }
                    }
                }
                else {
                    map_result(R::from_js(&ctx, value).expect(
                        &format!("Unexpected result value for method {name} in exported class {path}",
                                path=resource_path.join(".")
                        )))
                }
            }
        }
    }).await;
    js_state.idle().await;
    result
}

pub fn enqueue_drop_js_resource(resource_id: usize) {
    let js_state = get_js_state();
    js_state
        .resource_drop_queue_tx
        .unbounded_send(resource_id)
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
    js_state.idle().await;
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

fn dump_cannot_find_export(
    what: &str,
    path: &[&str],
    module: &Object,
    wit_package: &str,
) -> String {
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

    if path.len() == 1 {
        panic_message.push_str(&format!(
            "\nTry adding an export `export const {} = ...`\n",
            path[0]
        ));
    } else if path.len() > 1 {
        let mut current_object = module.clone();
        for i in 0..path.len() {
            match current_object.get::<&str, Object>(path[i]) {
                Ok(child) => {
                    current_object = child;
                }
                Err(_) => {
                    if i == 0 {
                        panic_message.push_str(&format!(
                            "\nTry adding an export `export const {} = {{ ... }}`\n",
                            path[i]
                        ));
                    } else {
                        panic_message.push_str(&format!("\nKeys in {}:\n", path[..i].join(".")));
                        let mut keys: Vec<String> = vec![];
                        for key in current_object.keys().flatten() {
                            keys.push(key);
                        }
                        keys.sort();
                        panic_message.push_str(&format!("  {}\n", keys.join(", ")));

                        panic_message.push_str(&format!(
                            "\nTry adding a field `{}` to {}\n",
                            path[i],
                            path[..i].join(".")
                        ));
                    }
                    break;
                }
            }
        }
    }
    panic_message
}

fn dump_cannot_find_method(
    name: &str,
    resource_path: &[&str],
    class_instance: &Object,
    wit_package: &str,
) -> String {
    let mut panic_message = String::new();
    panic_message.push_str(&format!(
        "Cannot find method {name} in an instance of class {path} of WIT package {wit_package}",
        path = resource_path.join(".")
    ));
    if let Some(prototype) = class_instance.get_prototype() {
        panic_message.push_str("\nKeys in the instance's prototype:\n");
        let mut keys: Vec<String> = vec![];
        for key in prototype
            .own_keys(Filter::new().symbol().string().private())
            .flatten()
        {
            keys.push(key);
        }
        keys.sort();
        panic_message.push_str(&format!("  {}\n", keys.join(", ")));
    }

    panic_message.push_str(&format!(
        "\nTry adding a method `{}() {{ ... }}` to class {path}\n",
        name,
        path = resource_path.join(".")
    ));

    panic_message
}

pub fn format_js_exception(exc: &Value) -> String {
    try_format_js_error(exc)
        .or_else(|| try_format_tagged_error(exc))
        .unwrap_or_else(|| {
            let formatted_exc = pretty_stringify_or_debug_print(&exc);
            if formatted_exc.contains("\n") {
                format!("JavaScript exception:\n{formatted_exc}", )
            } else {
                format!("JavaScript exception: {formatted_exc}", )
            }
        })
}

pub fn try_format_js_error(err: &Value) -> Option<String> {
    let obj = err.as_object()?;
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
    let val = val.and_then(|v| (!v.is_undefined()).then(|| v));

    match (tag, val) {
        (Some(tag), Some(val)) => {
            let formatted_val = pretty_stringify_or_debug_print(&val);
            if formatted_val.contains("\n") {
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

    // Return strings as they are
    if let Some(str) = val.as_string() {
        return str.to_string().ok();
    }

    // For other values try to use JSON.stringify()
    let json: Object = val.ctx().globals().get("JSON").ok()?;
    let stringify: Function = json.get("stringify").ok()?;
    let res: Result<String, Error> = stringify.call((val, rquickjs::Undefined, 2));
    res.ok()
}

pub fn format_caught_error(caught: CaughtError) -> String {
    match caught {
        CaughtError::Error(e) => {
            format!("Host error: {e:?}")
        }
        CaughtError::Exception(exc) => format_js_exception(&exc.into_value()),
        CaughtError::Value(val) => format_js_exception(&val),
    }
}
