use crate::common::{CompiledTest, PreparedComponent, TestInstance, invoke_and_capture_output};
use camino::Utf8Path;
use std::time::{Duration, Instant};
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
#[ignore = "manual performance evidence; run explicitly after Error stack changes"]
async fn v8_stack_trace_benchmark(
    #[tagged_as("v8_stack_trace")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    const ITERATIONS: u32 = 3_000;
    const ROUNDS: usize = 7;
    let prepared = PreparedComponent::new(compiled_test.wasm_path())?;

    for path in [
        "construction",
        "first-read",
        "repeated-read",
        "throw-catch",
        "throw-plain",
        "capture-first-read",
        "custom-first-read",
    ] {
        let mut samples = Vec::with_capacity(ROUNDS);
        for _ in 0..ROUNDS {
            // Immutable engine/linker/component preparation is shared. Each
            // sample still gets a fresh store, component instance, WASI state,
            // QuickJS runtime, memory, and temp directory.
            let mut instance = TestInstance::from_prepared(&prepared).await?;
            let start = Instant::now();
            let result = instance
                .invoke(
                    None,
                    "benchmark-error-stack",
                    &[Val::String(path.into()), Val::U32(ITERATIONS)],
                )
                .await?;
            let elapsed = start.elapsed();
            assert!(matches!(result, Some(Val::U32(checksum)) if checksum > 0));
            samples.push(elapsed);
        }
        samples.sort_unstable();
        println!(
            "Error stack {path:<13} iterations={ITERATIONS} rounds={ROUNDS} median={:.3}ms min={:.3}ms max={:.3}ms",
            millis(samples[ROUNDS / 2]),
            millis(samples[0]),
            millis(samples[ROUNDS - 1]),
        );
    }

    Ok(())
}

fn millis(duration: Duration) -> f64 {
    duration.as_secs_f64() * 1_000.0
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
async fn v8_stack_trace_prepared_cache_does_not_retain_errors(
    #[tagged_as("v8_stack_trace")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _) = invoke_and_capture_output(
        compiled_test.wasm_path(),
        None,
        "test-prepared-stack-cache-does-not-retain-errors",
        &[],
    )
    .await;
    assert_eq!(result?, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn v8_stack_trace_custom_prepared_stack_cycles_are_collectable(
    #[tagged_as("v8_stack_trace")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _) = invoke_and_capture_output(
        compiled_test.wasm_path(),
        None,
        "test-prepared-stack-cache-does-not-retain-custom-cycles",
        &[],
    )
    .await;
    assert_eq!(result?, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn v8_stack_trace_private_weak_collections_bypass_public_prototypes(
    #[tagged_as("v8_stack_trace")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _) = invoke_and_capture_output(
        compiled_test.wasm_path(),
        None,
        "test-private-weak-collections-bypass-public-prototypes",
        &[],
    )
    .await;
    assert_eq!(result?, Some(Val::Bool(true)));
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
async fn v8_stack_trace_proxy_holder_engine_boundary(
    #[tagged_as("v8_stack_trace")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, output) = invoke_and_capture_output(
        compiled_test.wasm_path(),
        None,
        "test-proxy-stack-holder-engine-boundary",
        &[],
    )
    .await;
    println!("Output:\n{output}");
    assert_eq!(result?, Some(Val::Bool(true)));
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
