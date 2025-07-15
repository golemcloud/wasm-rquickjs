test_r::enable!();

use crate::common::{CompiledTest, invoke_and_capture_output_with_stderr};
use camino::Utf8Path;
use test_r::{test, test_dep};
use wasmtime::component::Val;

#[allow(dead_code)]
mod common;

#[test_dep(tagged_as = "errors")]
fn compiled_errors() -> CompiledTest {
    let path = Utf8Path::new("examples/errors");
    CompiledTest::new(path).expect("Failed to compile errors")
}

#[test]
async fn missing_exported_top_level_function_in_js(
    #[tagged_as("errors")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, stdout, stderr) = invoke_and_capture_output_with_stderr(
        compiled.wasm_path(),
        None,
        "fun1",
        &[Val::String("world".to_string())],
    )
    .await;

    println!("{:#?}", result);
    println!("Output: {}", stdout);
    println!("Error: {}", stderr);

    assert!(result.is_err());
    assert!(stderr.contains("Cannot find exported JS function fun1"));

    Ok(())
}

#[test]
async fn missing_exported_interface_function_in_js(
    #[tagged_as("errors")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, stdout, stderr) = invoke_and_capture_output_with_stderr(
        compiled.wasm_path(),
        Some("quickjs:errors/api"),
        "fun2",
        &[Val::String("world".to_string())],
    )
    .await;

    println!("{:#?}", result);
    println!("Output: {}", stdout);
    println!("Error: {}", stderr);

    assert!(result.is_err());
    assert!(stderr.contains("Cannot find exported JS function api.fun2"));

    Ok(())
}

#[test]
async fn missing_exported_interface_in_js(
    #[tagged_as("errors")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, stdout, stderr) = invoke_and_capture_output_with_stderr(
        compiled.wasm_path(),
        Some("quickjs:errors/api2"),
        "fun7",
        &[Val::String("world".to_string())],
    )
    .await;

    println!("{:#?}", result);
    println!("Output: {}", stdout);
    println!("Error: {}", stderr);

    assert!(result.is_err());
    assert_eq!(
        result.err().unwrap().to_string(),
        "Interface quickjs:errors/api2 not found".to_string()
    );

    Ok(())
}

#[test]
async fn js_expects_nonexisting_parameter(
    #[tagged_as("errors")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, stdout, stderr) =
        invoke_and_capture_output_with_stderr(compiled.wasm_path(), None, "fun3", &[]).await;

    println!("{:#?}", result);
    println!("Output: {}", stdout);
    println!("Error: {}", stderr);

    assert!(result.is_ok());
    assert_eq!(
        result.ok().unwrap(),
        Some(Val::String("Hello, undefined!".to_string()))
    );

    Ok(())
}

#[test]
async fn js_expects_fewer_parameter(
    #[tagged_as("errors")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, stdout, stderr) = invoke_and_capture_output_with_stderr(
        compiled.wasm_path(),
        None,
        "fun4",
        &[Val::U32(1), Val::U32(2)],
    )
    .await;

    println!("{:#?}", result);
    println!("Output: {}", stdout);
    println!("Error: {}", stderr);

    assert!(result.is_ok());
    assert_eq!(
        result.ok().unwrap(),
        Some(Val::String("Hello, 1!".to_string()))
    );

    Ok(())
}

#[test]
async fn js_expects_wrong_parameter_types(
    #[tagged_as("errors")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, stdout, stderr) = invoke_and_capture_output_with_stderr(
        compiled.wasm_path(),
        None,
        "fun5",
        &[Val::U32(1), Val::String("b".to_string())],
    )
    .await;

    println!("{:#?}", result);
    println!("Output: {}", stdout);
    println!("Error: {}", stderr);

    assert!(result.is_err());
    assert!(stderr.contains("not a function")); // calling a.substring throws an exception

    Ok(())
}

#[test]
async fn js_returns_wrong_type(
    #[tagged_as("errors")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, stdout, stderr) =
        invoke_and_capture_output_with_stderr(compiled.wasm_path(), None, "fun6", &[]).await;

    println!("{:#?}", result);
    println!("Output: {}", stdout);
    println!("Error: {}", stderr);

    assert!(result.is_err());
    assert!(stderr.contains(
        r#"Unexpected result value: FromJs { from: "string", to: "f64", message: None }"#
    ));

    Ok(())
}
