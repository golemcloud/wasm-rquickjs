use crate::common::{CompiledTest, invoke_and_capture_output};
use camino::Utf8Path;
use test_r::{test, test_dep};
use wasmtime::component::Val;

#[test_dep(tagged_as = "export_interface_name_collision", scope = Cloneable)]
async fn compiled_export_interface_name_collision() -> CompiledTest {
    let path = Utf8Path::new("examples/runtime/export-interface-name-collision");
    CompiledTest::new(path, true)
        .await
        .expect("Failed to compile export_interface_name_collision")
}

#[test]
async fn first_colliding_guest_invoke(
    #[tagged_as("export_interface_name_collision")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) = invoke_and_capture_output(
        compiled.wasm_path(),
        Some("test:a/guest@1.0.0"),
        "invoke",
        &[
            Val::String("a".to_string()),
            Val::String("b".to_string()),
            Val::String("c".to_string()),
        ],
    )
    .await;
    let result = result?;

    assert_eq!(result, Some(Val::String("a:b:c".to_string())));

    Ok(())
}

#[test]
async fn second_colliding_guest_invoke(
    #[tagged_as("export_interface_name_collision")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) = invoke_and_capture_output(
        compiled.wasm_path(),
        Some("test:b/guest@1.0.0"),
        "invoke",
        &[
            Val::String("a".to_string()),
            Val::String("b".to_string()),
            Val::String("c".to_string()),
            Val::String("d".to_string()),
            Val::String("e".to_string()),
        ],
    )
    .await;
    let result = result?;

    assert_eq!(result, Some(Val::String("a:b:c:d:e".to_string())));

    Ok(())
}
