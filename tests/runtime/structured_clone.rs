use crate::common::{CompiledTest, invoke_and_capture_output};
use test_r::{inherit_test_dep, test};
use wasmtime::component::Val;

inherit_test_dep!(
    #[tagged_as("structured_clone")]
    CompiledTest
);

#[test]
async fn structured_clone_primitives(
    #[tagged_as("structured_clone")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "test-primitives", &[]).await;
    let result = result?;

    if let Some(Val::String(s)) = result {
        assert!(s.contains("number: true"), "number cloning failed");
        assert!(s.contains("string: true"), "string cloning failed");
        assert!(s.contains("boolean: true"), "boolean cloning failed");
        assert!(s.contains("null: true"), "null cloning failed");
        assert!(s.contains("undefined: true"), "undefined cloning failed");
        assert!(s.contains("bigint: true"), "bigint cloning failed");
    } else {
        anyhow::bail!("Expected string result");
    }

    Ok(())
}

#[test]
async fn structured_clone_objects(
    #[tagged_as("structured_clone")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "test-objects", &[]).await;
    let result = result?;

    if let Some(Val::String(s)) = result {
        assert!(
            s.contains("object different ref: true"),
            "object should be cloned by value"
        );
        assert!(s.contains("object.a: true"), "object.a should be cloned");
        assert!(s.contains("object.b: true"), "object.b should be cloned");
        assert!(
            s.contains("nested different ref: true"),
            "nested object should be cloned"
        );
        assert!(
            s.contains("mutation isolated: true"),
            "mutation should be isolated"
        );
    } else {
        anyhow::bail!("Expected string result");
    }

    Ok(())
}

#[test]
async fn structured_clone_arrays(
    #[tagged_as("structured_clone")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "test-arrays", &[]).await;
    let result = result?;

    if let Some(Val::String(s)) = result {
        assert!(
            s.contains("array different ref: true"),
            "array should be cloned by value"
        );
        assert!(
            s.contains("array length: true"),
            "array length should match"
        );
        assert!(
            s.contains("typed array different ref: true"),
            "typed array should be cloned"
        );
        assert!(
            s.contains("typed array length: true"),
            "typed array length should match"
        );
    } else {
        anyhow::bail!("Expected string result");
    }

    Ok(())
}

#[test]
async fn structured_clone_collections(
    #[tagged_as("structured_clone")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "test-collections", &[]).await;
    let result = result?;

    if let Some(Val::String(s)) = result {
        assert!(
            s.contains("map different ref: true"),
            "map should be cloned"
        );
        assert!(s.contains("map size: true"), "map size should match");
        assert!(
            s.contains("set different ref: true"),
            "set should be cloned"
        );
        assert!(s.contains("set size: true"), "set size should match");
    } else {
        anyhow::bail!("Expected string result");
    }

    Ok(())
}

#[test]
async fn structured_clone_special_types(
    #[tagged_as("structured_clone")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "test-special-types", &[]).await;
    let result = result?;

    if let Some(Val::String(s)) = result {
        assert!(
            s.contains("date different ref: true"),
            "date should be cloned"
        );
        assert!(s.contains("date value: true"), "date value should match");
        assert!(
            s.contains("regex different ref: true"),
            "regex should be cloned"
        );
        assert!(
            s.contains("regex source: true"),
            "regex source should match"
        );
        assert!(s.contains("regex flags: true"), "regex flags should match");
        assert!(
            s.contains("error different ref: true"),
            "error should be cloned"
        );
        assert!(
            s.contains("error message: true"),
            "error message should match"
        );
    } else {
        anyhow::bail!("Expected string result");
    }

    Ok(())
}

#[test]
async fn structured_clone_circular_refs(
    #[tagged_as("structured_clone")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "test-circular-refs", &[]).await;
    let result = result?;

    if let Some(Val::String(s)) = result {
        assert!(
            s.contains("circular clone different ref: true"),
            "circular ref should be cloned"
        );
        assert!(
            s.contains("circular self ref: true"),
            "circular self ref should be preserved"
        );
        assert!(
            s.contains("circular array different ref: true"),
            "circular array should be cloned"
        );
        assert!(
            s.contains("circular array self ref: true"),
            "circular array self ref should be preserved"
        );
    } else {
        anyhow::bail!("Expected string result");
    }

    Ok(())
}
