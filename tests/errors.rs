test_r::enable!();

use crate::common::{CompiledTest, TestInstance, invoke_and_capture_output_with_stderr};
use camino::Utf8Path;
use indoc::indoc;
use std::slice;
use test_r::{test, test_dep};
use wasmtime::component::Val;

#[allow(dead_code)]
mod common;

#[test_dep(tagged_as = "errors")]
fn compiled_errors() -> CompiledTest {
    let path = Utf8Path::new("examples/errors");
    CompiledTest::new(path, true).expect("Failed to compile errors")
}

#[test]
async fn missing_exported_top_level_function_in_js(
    #[tagged_as("errors")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _stdout, stderr) = invoke_and_capture_output_with_stderr(
        compiled.wasm_path(),
        None,
        "fun1",
        &[Val::String("world".to_string())],
    )
    .await;

    assert!(result.is_err());
    assert!(stderr.contains(indoc!(
        r#"Cannot find exported JS function fun1 of WIT package quickjs:errors
           Provided exports:
             api, api22, api3, fun3, fun4, fun5, fun6, wrongFun1

           Try adding an export `export const fun1 = ...`"#
    )));

    Ok(())
}

#[test]
async fn missing_exported_interface_function_in_js(
    #[tagged_as("errors")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _stdout, stderr) = invoke_and_capture_output_with_stderr(
        compiled.wasm_path(),
        Some("quickjs:errors/api"),
        "fun2",
        &[Val::String("world".to_string())],
    )
    .await;

    assert!(result.is_err());
    assert!(stderr.contains(indoc!(
        r#"Cannot find exported JS function api.fun2 of WIT package quickjs:errors
           Provided exports:
             api, api22, api3, fun3, fun4, fun5, fun6, wrongFun1

           Keys in api:
             wrongFun2

           Try adding a field `fun2` to api"#
    )));

    Ok(())
}

#[test]
async fn missing_exported_interface_in_js(
    #[tagged_as("errors")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _stdout, stderr) = invoke_and_capture_output_with_stderr(
        compiled.wasm_path(),
        Some("quickjs:errors/api2"),
        "fun7",
        &[],
    )
    .await;

    assert!(result.is_err());
    assert!(stderr.contains(indoc!(
        r#"Cannot find exported JS function api2.fun7 of WIT package quickjs:errors
           Provided exports:
             api, api22, api3, fun3, fun4, fun5, fun6, wrongFun1

           Try adding an export `export const api2 = { ... }`"#
    )));

    Ok(())
}

#[test]
async fn js_expects_nonexisting_parameter(
    #[tagged_as("errors")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _stdout, stderr) =
        invoke_and_capture_output_with_stderr(compiled.wasm_path(), None, "fun3", &[]).await;

    assert!(result.is_err());
    assert!(stderr.contains(indoc!(
        r#"The WIT specification defines 0 parameters,
           but the exported JavaScript function got 1 parameters (exported function fun3 in WIT package quickjs:errors)"#
    )));

    Ok(())
}

#[test]
async fn js_expects_fewer_parameter(
    #[tagged_as("errors")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _stdout, stderr) = invoke_and_capture_output_with_stderr(
        compiled.wasm_path(),
        None,
        "fun4",
        &[Val::U32(1), Val::U32(2)],
    )
    .await;

    assert!(result.is_err());
    assert!(stderr.contains(indoc!(
        r#"The WIT specification defines 2 parameters,
           but the exported JavaScript function got 1 parameters (exported function fun4 in WIT package quickjs:errors)"#
    )));

    Ok(())
}

#[test]
async fn js_expects_wrong_parameter_types(
    #[tagged_as("errors")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _stdout, stderr) = invoke_and_capture_output_with_stderr(
        compiled.wasm_path(),
        None,
        "fun5",
        &[Val::U32(1), Val::String("b".to_string())],
    )
    .await;

    assert!(result.is_err());
    assert!(stderr.contains("Exception during call of fun5"));
    assert!(stderr.contains("not a function")); // calling a.substring throws an exception

    Ok(())
}

#[test]
async fn js_returns_wrong_type(
    #[tagged_as("errors")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _stdout, stderr) =
        invoke_and_capture_output_with_stderr(compiled.wasm_path(), None, "fun6", &[]).await;

    assert!(result.is_err());
    assert!(stderr.contains(
        r#"Unexpected result value for exported function fun6: Error converting from js 'string' into type 'f64'"#
    ));

    Ok(())
}

#[test]
async fn wrong_exported_js_class(
    #[tagged_as("errors")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let mut instance = TestInstance::new(compiled.wasm_path()).await?;
    let (result, _stdout, stderr) = instance
        .invoke_and_capture_output_with_stderr(
            Some("quickjs:errors/api3"),
            "[constructor]res1",
            &[Val::String("hello".to_string())],
        )
        .await;

    assert!(result.is_err());
    assert!(stderr.contains(indoc!(
        r#"Cannot find exported JS resource class api3.Res1 of WIT package quickjs:errors
           Provided exports:
             api, api22, api3, fun3, fun4, fun5, fun6, wrongFun1

           Keys in api3:
             Res11, Res2, Res3

           Try adding a field `Res1` to api3"#
    )));

    Ok(())
}

#[test]
async fn wrong_parameter_count_in_js_constructor(
    #[tagged_as("errors")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let mut instance = TestInstance::new(compiled.wasm_path()).await?;
    let (result, _stdout, stderr) = instance
        .invoke_and_capture_output_with_stderr(
            Some("quickjs:errors/api3"),
            "[constructor]res2",
            &[],
        )
        .await;

    assert!(result.is_err());
    assert!(stderr.contains(indoc!(
        r#"The WIT specification defines 0 parameters,
           but the exported JavaScript constructor got 1 parameters (exported constructor api3.Res2 in WIT package quickjs:errors)"#
    )));

    Ok(())
}

#[test]
async fn missing_method_in_js_class(
    #[tagged_as("errors")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let mut instance = TestInstance::new(compiled.wasm_path()).await?;
    let (result, _stdout, _stderr) = instance
        .invoke_and_capture_output_with_stderr(
            Some("quickjs:errors/api3"),
            "[constructor]res3",
            &[],
        )
        .await;
    let handle = result?.unwrap();

    let (result, _stdout, stderr) = instance
        .invoke_and_capture_output_with_stderr(
            Some("quickjs:errors/api3"),
            "[method]res3.m1",
            slice::from_ref(&handle),
        )
        .await;

    assert!(result.is_err());
    assert!(stderr.contains(indoc!(
        r#"Cannot find method m1 in an instance of class api3.Res3 of WIT package quickjs:errors
           Keys in the instance's prototype:
             constructor, m2, m3, mm1

           Try adding a method `m1() { ... }` to class api3.Res3"#
    )));

    Ok(())
}

#[test]
async fn method_with_wrong_parameter_count_in_js_class(
    #[tagged_as("errors")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let mut instance = TestInstance::new(compiled.wasm_path()).await?;
    let (result, _stdout, _stderr) = instance
        .invoke_and_capture_output_with_stderr(
            Some("quickjs:errors/api3"),
            "[constructor]res3",
            &[],
        )
        .await;
    let handle = result?.unwrap();

    let (result, _stdout, stderr) = instance
        .invoke_and_capture_output_with_stderr(
            Some("quickjs:errors/api3"),
            "[method]res3.m2",
            &[handle.clone(), Val::U32(1), Val::U32(2)],
        )
        .await;

    assert!(result.is_err());
    assert!(stderr.contains(indoc!(
        r#"The WIT specification defines 2 parameters,
           but the exported JavaScript method got 1 parameters (exported method m2 of class api3.Res3 representing a resource defined in WIT package quickjs:errors)"#
    )));
    Ok(())
}

#[test]
async fn method_with_wrong_return_type_in_js_class(
    #[tagged_as("errors")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let mut instance = TestInstance::new(compiled.wasm_path()).await?;
    let (result, _stdout, _stderr) = instance
        .invoke_and_capture_output_with_stderr(
            Some("quickjs:errors/api3"),
            "[constructor]res3",
            &[],
        )
        .await;
    let handle = result?.unwrap();

    let (result, _stdout, stderr) = instance
        .invoke_and_capture_output_with_stderr(
            Some("quickjs:errors/api3"),
            "[method]res3.m3",
            slice::from_ref(&handle),
        )
        .await;

    assert!(result.is_err());
    assert!(stderr.contains(indoc!(
        r#"Unexpected result value for method m3 in exported class api3.Res3: Error converting from js 'string' into type 'f64'"#
    )));
    Ok(())
}
