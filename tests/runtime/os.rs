use crate::common::{CompiledTest, invoke_and_capture_output};
use camino::Utf8Path;
use test_r::{test, test_dep};
use wasmtime::component::Val;

#[test_dep(tagged_as = "os")]
fn compiled_os() -> CompiledTest {
    let path = Utf8Path::new("examples/os");
    CompiledTest::new(path, true).expect("Failed to compile os")
}

#[test]
async fn os_eol_constant(#[tagged_as("os")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (result, _output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "test", &[]).await;
    let result = result?;

    // The result should be a JSON string with os module test results
    if let Some(Val::String(json_str)) = result {
        let result_obj: serde_json::Value = serde_json::from_str(&json_str)?;

        // Verify that EOL constant exists and is a string
        assert!(
            result_obj["hasEOL"].as_bool().unwrap_or(false),
            "os.EOL should exist"
        );
        assert!(
            result_obj["canImportAsOs"].as_bool().unwrap_or(false),
            "os module should be importable"
        );

        // Verify key functions exist
        assert!(
            result_obj["hasArch"].as_bool().unwrap_or(false),
            "os.arch should exist"
        );
        assert!(
            result_obj["hasPlatform"].as_bool().unwrap_or(false),
            "os.platform should exist"
        );
        assert!(
            result_obj["hasHostname"].as_bool().unwrap_or(false),
            "os.hostname should exist"
        );
        assert!(
            result_obj["hasUptime"].as_bool().unwrap_or(false),
            "os.uptime should exist"
        );
        assert!(
            result_obj["hasHomedir"].as_bool().unwrap_or(false),
            "os.homedir should exist"
        );
        assert!(
            result_obj["hasTmpdir"].as_bool().unwrap_or(false),
            "os.tmpdir should exist"
        );
    } else {
        anyhow::bail!("Expected string result from test function");
    }

    Ok(())
}
