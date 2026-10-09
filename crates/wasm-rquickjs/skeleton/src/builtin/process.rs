// Native functions for the process implementation
#[rquickjs::module(rename = "camelCase")]
pub mod native_module {
    use rquickjs::{BigInt, Ctx, Persistent, Promise};
    use std::collections::HashMap;
    use std::path::Path;

    #[rquickjs::function]
    pub fn memory_usage(ctx: Ctx<'_>) -> Vec<i64> {
        let rt = unsafe { rquickjs::qjs::JS_GetRuntime(ctx.as_raw().as_ptr()) };
        let mut stats = std::mem::MaybeUninit::uninit();
        unsafe { rquickjs::qjs::JS_ComputeMemoryUsage(rt, stats.as_mut_ptr()) };
        let stats = unsafe { stats.assume_init() };
        vec![
            stats.malloc_size,
            stats.memory_used_size,
            stats.obj_size,
            stats.binary_object_size,
        ]
    }

    #[rquickjs::function]
    pub fn write_stdout(ctx: Ctx<'_>, data: String) {
        let sink = ctx
            .userdata::<crate::internal::runtime_services::RuntimeServices>()
            .expect("runtime services not initialized")
            .output_sink();
        sink.write_stdout(&data);
    }

    #[rquickjs::function]
    pub fn write_stderr(ctx: Ctx<'_>, data: String) {
        let sink = ctx
            .userdata::<crate::internal::runtime_services::RuntimeServices>()
            .expect("runtime services not initialized")
            .output_sink();
        sink.write_stderr(&data);
    }

    #[rquickjs::function]
    pub fn get_args(ctx: Ctx<'_>) -> Vec<String> {
        ctx.userdata::<crate::internal::runtime_services::RuntimeServices>()
            .expect("runtime services not initialized")
            .process
            .args()
    }

    #[rquickjs::function]
    pub fn get_env(ctx: Ctx<'_>) -> HashMap<String, String> {
        ctx.userdata::<crate::internal::runtime_services::RuntimeServices>()
            .expect("runtime services not initialized")
            .process
            .env()
    }

    #[rquickjs::function]
    pub fn get_cwd(ctx: Ctx<'_>) -> String {
        ctx.userdata::<crate::internal::runtime_services::RuntimeServices>()
            .expect("runtime services not initialized")
            .process
            .cwd()
            .to_string_lossy()
            .into_owned()
    }

    #[rquickjs::function]
    pub fn chdir(ctx: Ctx<'_>, path: String) -> Option<String> {
        let services = ctx
            .userdata::<crate::internal::runtime_services::RuntimeServices>()
            .expect("runtime services not initialized");
        match services.process.chdir(Path::new(&path)) {
            Ok(()) => None,
            Err(error) => Some(
                match error.kind() {
                    std::io::ErrorKind::NotFound => "ENOENT",
                    std::io::ErrorKind::PermissionDenied => "EACCES",
                    _ => "EINVAL",
                }
                .to_string(),
            ),
        }
    }

    #[rquickjs::function]
    pub fn hrtime_ns(ctx: Ctx<'_>) -> rquickjs::Result<BigInt<'_>> {
        #[cfg(feature = "p2")]
        let nanos = wasip2::clocks::monotonic_clock::now();

        #[cfg(feature = "p3")]
        let nanos = wasip3::clocks::monotonic_clock::now();

        BigInt::from_u64(ctx, nanos)
    }

    #[rquickjs::function]
    pub fn has_typescript_runtime() -> bool {
        cfg!(feature = "typescript-runtime")
    }

    #[rquickjs::function]
    pub fn typescript_runtime_mode() -> Option<&'static str> {
        if cfg!(feature = "typescript-transform-runtime") {
            Some("transform")
        } else if cfg!(feature = "typescript-runtime") {
            Some("strip")
        } else {
            None
        }
    }

    /// Returns a promise that resolves once every referenced task scheduled by the current
    /// component runtime has reached quiescence. Unlike a timer-based approximation, the wait is
    /// driven by the same runtime boundary used after an exported function returns.
    #[rquickjs::function]
    pub fn await_runtime_idle<'js>(ctx: Ctx<'js>) -> rquickjs::Result<Promise<'js>> {
        let services = ctx
            .userdata::<crate::internal::runtime_services::RuntimeServices>()
            .expect("runtime services not initialized");
        if !services.execution_enabled.get() {
            return Err(rquickjs::Exception::throw_message(
                &ctx,
                "runtime idle waits are only available in the component runtime",
            ));
        }

        let (promise, resolve, reject) = Promise::new(&ctx)?;
        crate::internal::spawn_runtime_idle_waiter(
            Persistent::save(&ctx, resolve),
            Persistent::save(&ctx, reject),
        );
        Ok(promise)
    }
}

// JS functions for the process implementation
pub const PROCESS_JS: &str = include_str!("process.js");

// Re-export for aliases
pub const REEXPORT_JS: &str =
    r#"export * from 'node:process'; export { default } from 'node:process';"#;

pub const WIRE_JS: &str = r#"
        import __wasm_rquickjs_process from 'node:process';
        globalThis.process = __wasm_rquickjs_process;
    "#;
