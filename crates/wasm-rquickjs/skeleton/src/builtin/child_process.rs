// child_process module - JavaScript-only stub (no native functions needed)
pub const CHILD_PROCESS_JS: &str = include_str!("child_process.js");
pub const BACKEND_JS: &str = include_str!("child_process_backend.js");
pub const PUBLIC_BACKEND_JS: &str =
    "export { setProcessBackend } from '__wasm_rquickjs_builtin/child_process_backend';";

// Re-export for aliases
pub const REEXPORT_JS: &str =
    r#"export * from 'node:child_process'; export { default } from 'node:child_process';"#;
