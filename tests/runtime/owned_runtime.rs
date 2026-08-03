use crate::common::{CompiledTest, FeatureCombination, invoke_and_capture_output};
use camino::Utf8Path;
use test_r::{test, test_dep};

#[test_dep(tagged_as = "owned_runtime", scope = Cloneable)]
async fn compiled_owned_runtime() -> CompiledTest {
    CompiledTest::new_with_features(
        Utf8Path::new("examples/runtime/owned-runtime"),
        true,
        FeatureCombination::InternalTestCodeRunner,
    )
    .await
    .expect("Failed to compile owned-runtime")
}

#[test]
async fn owned_runtime_isolation(
    #[tagged_as("owned_runtime")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, output) = invoke_and_capture_output(compiled.wasm_path(), None, "run", &[]).await;
    let result = result?;
    assert!(
        output.is_empty(),
        "nested output leaked to component stdio: {output}"
    );
    let Some(wasmtime::component::Val::String(json)) = result else {
        anyhow::bail!("expected JSON string result, got {result:?}");
    };
    let report: serde_json::Value = serde_json::from_str(&json)?;
    assert_eq!(report["liveStdout"], "live:first\nlive:last\n");
    assert_eq!(report["liveResult"]["value"]["label"], "live");
    assert_eq!(report["liveResult"]["value"]["argv"][1], "live");
    assert_eq!(
        report["ordering"][0], "data",
        "output was not delivered live"
    );
    assert_eq!(
        report["ordering"].as_array().unwrap().last().unwrap(),
        "result"
    );
    assert_eq!(report["left"]["value"], "left");
    assert_eq!(report["left"]["stdout"], "left\n");
    assert_eq!(report["right"]["value"], "right");
    assert_eq!(report["right"]["stdout"], "right\n");
    assert_eq!(report["timeoutError"], "runner job timed out");
    assert_eq!(report["overflowError"], "runner output exceeded maxBytes");
    assert_eq!(report["truncated"]["value"], "ok");
    assert_eq!(report["truncated"]["stdout"], "éé");
    assert_eq!(report["truncated"]["overflowed"], true);
    assert_eq!(report["entry"]["value"]["kind"], "entry");
    assert_eq!(report["entry"]["stdout"], "entry\n");
    assert_eq!(report["cancellationError"], "runner job cancelled");
    assert_eq!(
        report["nested"]["value"],
        "nested code-runner jobs are not supported"
    );
    assert_eq!(
        report["capacityError"],
        "code-runner supports at most 8 active jobs per runtime"
    );
    assert_eq!(report["reclaimed"]["value"], "reclaimed");
    assert_eq!(report["isolation"]["peakActive"], 2);
    for side in ["left", "right"] {
        let probe = &report["isolation"][side]["value"];
        assert!(
            probe.get("probeError").is_none(),
            "{side} probe failed: {probe}"
        );
        assert_eq!(probe["fd"], 13);
        assert_eq!(probe["mode"], if side == "left" { 0o600 } else { 0o640 });
        assert_eq!(probe["linkParentValue"], format!("{side}:sibling"));
        assert_eq!(probe["packageValue"], format!("{side}:package"));
        assert_eq!(probe["esmValue"], format!("{side}:esm"));
        assert_eq!(probe["jsonValue"], format!("{side}:json"));
        assert_eq!(probe["cjsReexportValue"], format!("{side}:cjs"));
    }
    assert_eq!(report["isolation"]["left"]["value"]["secondFd"], 14);
    assert_eq!(
        report["isolation"]["right"]["value"]["foreignFdError"],
        "EBADF"
    );
    Ok(())
}
