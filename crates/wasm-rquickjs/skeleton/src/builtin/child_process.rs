// child_process module - JavaScript-only stub (no native functions needed)
pub const CHILD_PROCESS_JS: &str = include_str!("child_process.js");

pub(crate) fn source() -> &'static str {
    #[cfg(not(feature = "terminal-process"))]
    {
        CHILD_PROCESS_JS
    }
    #[cfg(feature = "terminal-process")]
    {
        static SOURCE: std::sync::LazyLock<String> = std::sync::LazyLock::new(|| {
            let enter =
                "    try {\n        process.argv = [String(command)].concat(invocationArgs);";
            let leave = "    } finally {\n        process.argv = oldArgv;";
            assert_eq!(CHILD_PROCESS_JS.matches(enter).count(), 1);
            assert_eq!(CHILD_PROCESS_JS.matches(leave).count(), 1);
            let source = CHILD_PROCESS_JS.replace(enter, "    enter_inline_child();\n    try {\n        process.argv = [String(command)].concat(invocationArgs);")
                .replace(leave, "    } finally {\n        leave_inline_child();\n        process.argv = oldArgv;");
            format!(
                "import {{ enter_inline_child, leave_inline_child }} from '__wasm_rquickjs_builtin/terminal_process_native';\n{source}"
            )
        });
        &SOURCE
    }
}

// Re-export for aliases
pub const REEXPORT_JS: &str =
    r#"export * from 'node:child_process'; export { default } from 'node:child_process';"#;
