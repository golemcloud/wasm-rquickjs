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
    for side in ["left", "right"] {
        assert!(
            report[side]["value"].get("probeError").is_none(),
            "{side} owned-runtime probe failed: {}",
            report[side]["value"]["probeError"]
        );
    }
    assert_eq!(report["peakActive"], 2, "owned runtimes did not overlap");
    for side in ["left", "right"] {
        let cwd = format!("/tmp/wasm-rquickjs-owned-{side}");
        assert_eq!(report[side]["value"]["label"], side);
        assert_eq!(report[side]["value"]["mutation"], format!("{side}:mutated"));
        assert_eq!(report[side]["value"]["argv"][1], format!("/{side}.mjs"));
        assert_eq!(report[side]["value"]["cwd"], cwd);
        assert_eq!(report[side]["value"]["timerId"], 0);
        assert_eq!(report[side]["value"]["syncFile"], side);
        assert_eq!(report[side]["value"]["asyncFile"], side);
        assert_eq!(report[side]["value"]["fd"], 13);
        assert_eq!(
            report[side]["value"]["mode"],
            if side == "left" { 0o600 } else { 0o640 }
        );
        assert_eq!(report[side]["value"]["linkTarget"], "./target.txt");
        assert_eq!(report[side]["value"]["linkValue"], format!("{side}:target"));
        assert_eq!(
            report[side]["value"]["linkParentValue"],
            format!("{side}:sibling")
        );
        assert_eq!(report[side]["value"]["relativeModule"], side);
        assert_eq!(
            report[side]["stdout"],
            format!("{side}:start\n{side}:end\n")
        );
        assert_eq!(report[side]["stderr"], format!("{side}:stderr\n"));
    }
    assert_eq!(report["left"]["value"]["secondFd"], 14);
    assert_eq!(
        report["right"]["value"]["secondFd"],
        serde_json::Value::Null
    );
    assert_eq!(report["right"]["value"]["foreignFdError"], "EBADF");
    Ok(())
}
