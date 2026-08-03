use crate::common::{CompiledTest, invoke_and_capture_output};
use camino::Utf8Path;
use test_r::{test, test_dep};

#[test_dep(tagged_as = "owned_runtime", scope = Cloneable)]
async fn compiled_owned_runtime() -> CompiledTest {
    CompiledTest::new(Utf8Path::new("examples/runtime/owned-runtime"), true)
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
    for (side, cwd) in [("left", "/"), ("right", "/test")] {
        assert_eq!(report[side]["value"]["label"], side);
        assert_eq!(report[side]["value"]["argv"][1], format!("/{side}.mjs"));
        assert_eq!(report[side]["value"]["cwd"], cwd);
        assert_eq!(report[side]["value"]["timerId"], 0);
        assert_eq!(
            report[side]["stdout"],
            format!("{side}:start\n{side}:end\n")
        );
        assert_eq!(report[side]["stderr"], "");
    }
    Ok(())
}
