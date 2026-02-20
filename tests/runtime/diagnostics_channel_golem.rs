use crate::common::{CompiledTest, FeatureCombination, GolemPreparedComponent, TestInstance};
use camino::Utf8Path;
use test_r::{test, test_dep};
use wasmtime::component::Val;

#[test_dep(tagged_as = "diagnostics_channel_golem")]
fn compiled_diagnostics_channel_golem() -> CompiledTest {
    let path = Utf8Path::new("examples/diagnostics-channel-golem");
    CompiledTest::new_with_features(path, false, FeatureCombination::Golem)
        .expect("Failed to compile diagnostics-channel-golem")
}

#[test]
async fn golem_context_tracing(
    #[tagged_as("diagnostics_channel_golem")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let prepared = GolemPreparedComponent::new(compiled.wasm_path())?;
    let mut instance = TestInstance::from_golem_prepared(&prepared).await?;

    let (result, output) = instance.invoke_and_capture_output(None, "test", &[]).await;
    let result = result?;

    if let Some(Val::String(json_str)) = result {
        let r: serde_json::Value = serde_json::from_str(&json_str)?;

        let errors = r["errors"].as_array().unwrap();
        assert!(
            errors.is_empty(),
            "Unexpected errors: {:?}\nOutput: {}",
            errors,
            output
        );

        // Golem tracing auto-installed on http.client channels
        assert!(
            r["golemTracingInstalled"].as_bool().unwrap(),
            "golemTracingInstalled should be true"
        );

        // traceSync on http.client works
        assert!(
            r["traceSyncResult"].as_bool().unwrap(),
            "traceSyncResult should be true"
        );

        // traceSync with error works
        assert!(
            r["traceSyncError"].as_bool().unwrap(),
            "traceSyncError should be true"
        );

        // Custom tracing channel works
        assert!(
            r["customTraceSync"].as_bool().unwrap(),
            "customTraceSync should be true"
        );
        assert!(
            r["customNoGolemSubs"].as_bool().unwrap(),
            "customNoGolemSubs should be true"
        );

        // Verify spans were recorded by the mock host
        let spans = prepared.spans.lock().unwrap();
        assert!(
            spans.len() >= 2,
            "Expected at least 2 spans from traceSync calls, got {}. Output: {}",
            spans.len(),
            output
        );

        // Check first span (successful GET)
        let first_span = &spans[0];
        assert!(first_span.finished, "First span should be finished");
        assert!(
            first_span.attributes.iter().any(|(k, _)| k == "method"),
            "First span should have 'method' attribute: {:?}",
            first_span.attributes
        );
        assert!(
            first_span
                .attributes
                .iter()
                .any(|(k, v)| k == "method" && v == "GET"),
            "First span method should be GET: {:?}",
            first_span.attributes
        );

        // Check second span (failed POST with error)
        let second_span = &spans[1];
        assert!(second_span.finished, "Second span should be finished");
        assert!(
            second_span
                .attributes
                .iter()
                .any(|(k, v)| k == "error" && v == "true"),
            "Second span should have error=true: {:?}",
            second_span.attributes
        );
    } else {
        anyhow::bail!("Expected string result from test function");
    }

    Ok(())
}
