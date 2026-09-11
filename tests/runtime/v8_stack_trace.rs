use crate::common::{CompiledTest, invoke_and_capture_output};
use camino::Utf8Path;
use test_r::{test, test_dep};
use wasmtime::component::Val;

#[test_dep(tagged_as = "v8_stack_trace", scope = Cloneable)]
async fn compiled_v8_stack_trace() -> CompiledTest {
    let path = Utf8Path::new("examples/runtime/v8_stack_trace");
    CompiledTest::new(path, true)
        .await
        .expect("Failed to compile v8_stack_trace")
}

#[test]
async fn v8_stack_trace_capture_exists(
    #[tagged_as("v8_stack_trace")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(
        compiled_test.wasm_path(),
        None,
        "test-capture-stack-trace-exists",
        &[],
    )
    .await;
    let r = r?;
    println!("Output:\n{}", output);
    assert_eq!(r, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn v8_stack_trace_capture_basic(
    #[tagged_as("v8_stack_trace")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(
        compiled_test.wasm_path(),
        None,
        "test-capture-stack-trace-basic",
        &[],
    )
    .await;
    let r = r?;
    println!("Output:\n{}", output);
    assert_eq!(r, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn v8_stack_trace_prepare(
    #[tagged_as("v8_stack_trace")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(
        compiled_test.wasm_path(),
        None,
        "test-prepare-stack-trace",
        &[],
    )
    .await;
    let r = r?;
    println!("Output:\n{}", output);
    assert_eq!(r, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn v8_stack_trace_call_site_methods(
    #[tagged_as("v8_stack_trace")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(
        compiled_test.wasm_path(),
        None,
        "test-call-site-methods",
        &[],
    )
    .await;
    let r = r?;
    println!("Output:\n{}", output);
    assert_eq!(r, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn v8_stack_trace_late_prepare(
    #[tagged_as("v8_stack_trace")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(
        compiled_test.wasm_path(),
        None,
        "test-late-prepare-stack-trace",
        &[],
    )
    .await;
    let r = r?;
    println!("Output:\n{}", output);
    assert_eq!(r, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn v8_stack_trace_default_error_stack_headers(
    #[tagged_as("v8_stack_trace")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(
        compiled_test.wasm_path(),
        None,
        "test-default-error-stack-headers",
        &[],
    )
    .await;
    let r = r?;
    println!("Output:\n{}", output);
    assert_eq!(r, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn v8_stack_trace_error_inspect_uses_current_name(
    #[tagged_as("v8_stack_trace")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(
        compiled_test.wasm_path(),
        None,
        "test-error-inspect-uses-current-name",
        &[],
    )
    .await;
    let r = r?;
    println!("Output:\n{}", output);
    assert_eq!(r, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn v8_stack_trace_assertion_listener_stack_frame(
    #[tagged_as("v8_stack_trace")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(
        compiled_test.wasm_path(),
        None,
        "test-assertion-listener-stack-frame",
        &[],
    )
    .await;
    let r = r?;
    println!("Output:\n{}", output);
    let Some(Val::String(frame)) = r else {
        anyhow::bail!("expected a stack-frame string, got {r:?}");
    };
    assert!(
        frame.contains(" (") && frame.ends_with(')'),
        "expected a parenthesized stack frame, got {frame:?}"
    );
    Ok(())
}

#[test]
async fn v8_stack_trace_cjs_call_site_line_offset(
    #[tagged_as("v8_stack_trace")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(
        compiled_test.wasm_path(),
        None,
        "test-cjs-call-site-line-offset",
        &[],
    )
    .await;
    let r = r?;
    println!("Output:\n{}", output);
    assert_eq!(r, Some(Val::String("2".into())));
    Ok(())
}

#[test]
async fn v8_stack_trace_prepare_stack_trace_descriptors(
    #[tagged_as("v8_stack_trace")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(
        compiled_test.wasm_path(),
        None,
        "test-prepare-stack-trace-descriptors",
        &[],
    )
    .await;
    let r = r?;
    println!("Output:\n{}", output);
    assert_eq!(r, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn v8_stack_trace_constructor_opt(
    #[tagged_as("v8_stack_trace")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) =
        invoke_and_capture_output(compiled_test.wasm_path(), None, "test-constructor-opt", &[])
            .await;
    let r = r?;
    println!("Output:\n{}", output);
    assert_eq!(r, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn v8_stack_trace_limit(
    #[tagged_as("v8_stack_trace")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(
        compiled_test.wasm_path(),
        None,
        "test-stack-trace-limit",
        &[],
    )
    .await;
    let r = r?;
    println!("Output:\n{}", output);
    assert_eq!(r, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn v8_stack_trace_depd_pattern(
    #[tagged_as("v8_stack_trace")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) =
        invoke_and_capture_output(compiled_test.wasm_path(), None, "test-depd-pattern", &[]).await;
    let r = r?;
    println!("Output:\n{}", output);
    assert_eq!(r, Some(Val::Bool(true)));
    Ok(())
}
