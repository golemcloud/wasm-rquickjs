#[path = "child_process_p3.rs"]
pub(crate) mod p3;

#[rquickjs::module]
pub mod native_module {
    #[rquickjs::function]
    pub fn write_output(ctx: rquickjs::Ctx<'_>, stdout: bool, bytes: Vec<u8>) {
        if let Some(child) = ctx
            .userdata::<crate::internal::runtime_services::RuntimeServices>()
            .unwrap()
            .node_child
            .borrow()
            .as_ref()
        {
            child.write(stdout, &bytes);
        }
    }

    #[rquickjs::function]
    pub fn stop_child(ctx: rquickjs::Ctx<'_>) {
        if let Some(child) = ctx
            .userdata::<crate::internal::runtime_services::RuntimeServices>()
            .unwrap()
            .node_child
            .borrow()
            .as_ref()
        {
            child.exited.set(true);
        }
    }

    /// A throwing uncaught-exception or domain error handler is fatal, as in Node. The
    /// component has no process to exit, so it traps before any further JS runs.
    #[rquickjs::function]
    pub fn fail_uncaught_handler(message: String) {
        panic!("uncaught exception handler failed: {message}");
    }

    // The module macro does not preserve cfg on a class re-export.
    #[qjs(declare)]
    pub fn declare(exports: &rquickjs::module::Declarations) -> rquickjs::Result<()> {
        exports.declare("Child")?;
        Ok(())
    }

    #[qjs(evaluate)]
    pub fn evaluate<'js>(
        ctx: &rquickjs::Ctx<'js>,
        exports: &rquickjs::module::Exports<'js>,
    ) -> rquickjs::Result<()> {
        exports.export(
            "Child",
            rquickjs::Class::<super::p3::Child>::create_constructor(ctx)?,
        )?;
        Ok(())
    }
}

pub const CHILD_PROCESS_JS: &str = include_str!("child_process.js");
pub const BACKEND_JS: &str = include_str!("child_process_backend.js");
pub const PUBLIC_BACKEND_JS: &str =
    "export { setProcessBackend } from '__wasm_rquickjs_builtin/child_process_backend';";

// Re-export for aliases
pub const REEXPORT_JS: &str =
    r#"export * from 'node:child_process'; export { default } from 'node:child_process';"#;
