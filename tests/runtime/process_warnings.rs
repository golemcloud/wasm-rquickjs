use crate::common::{CompiledTest, invoke_and_capture_output};
use camino::Utf8Path;
use test_r::{test, test_dep};
use wasmtime::component::Val;

#[test_dep(tagged_as = "process_warnings", scope = Cloneable)]
async fn compiled_process_warnings() -> CompiledTest {
    let path = Utf8Path::new("examples/runtime/process-warnings");
    CompiledTest::new(path, true)
        .await
        .expect("Failed to compile process-warnings")
}

#[test]
async fn default_warning_output_matches_node(
    #[tagged_as("process_warnings")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "test", &[]).await;
    let Some(Val::String(json)) = result? else {
        anyhow::bail!("Expected string result from test function");
    };
    let report: serde_json::Value = serde_json::from_str(&json)?;

    let executable = report["argv0"].as_str().unwrap();
    let executable = executable
        .rsplit('/')
        .next()
        .unwrap()
        .trim_end_matches(".exe");
    let executable = if executable.is_empty() {
        "node"
    } else {
        executable
    };
    assert_eq!(
        report["first"]["stderr"],
        format!(
            "(node:1) Warning: first\n(Use `{executable} --trace-warnings ...` to show where the warning was created)\n"
        )
    );
    assert_eq!(
        report["detailed"]["stderr"],
        "(node:1) [CODE001] Warning: detailed\nmore detail\n"
    );
    let traced = report["traced"]["stderr"].as_str().unwrap();
    assert!(
        traced.starts_with("(node:1) CustomWarning: traced\n    at "),
        "{traced}"
    );
    for case in ["first", "detailed", "traced"] {
        assert_eq!(
            report[case]["events"].as_array().unwrap().len(),
            1,
            "{case}"
        );
    }
    Ok(())
}
