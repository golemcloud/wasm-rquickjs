// worker_threads module - JavaScript-only stub (no native functions needed)
pub const WORKER_THREADS_JS: &str = include_str!("worker_threads.js");

// Re-export for aliases
pub const REEXPORT_JS: &str =
    r#"export * from 'node:worker_threads'; export { default } from 'node:worker_threads';"#;
