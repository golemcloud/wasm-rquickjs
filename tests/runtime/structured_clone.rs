use crate::common::{CompiledTest, TestInstance, invoke_and_capture_output};
use camino::Utf8Path;
use test_r::{test, test_dep};
use wasmtime::component::Val;

#[test_dep(tagged_as = "structured_clone", scope = Cloneable)]
async fn compiled_structured_clone() -> CompiledTest {
    let path = Utf8Path::new("examples/runtime/structured-clone");
    CompiledTest::new(path, true)
        .await
        .expect("Failed to compile structured_clone")
}

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

#[test]
async fn structured_clone_policy_markers(
    #[tagged_as("structured_clone")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "test-policy-case",
        &[Val::U8(0)],
    )
    .await;
    assert_eq!(result?, Some(Val::String("ok".into())), "{output}");
    Ok(())
}

#[test]
async fn structured_clone_policy_intrinsic_exemptions(
    #[tagged_as("structured_clone")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "test-policy-case",
        &[Val::U8(1)],
    )
    .await;
    assert_eq!(result?, Some(Val::String("ok".into())), "{output}");
    Ok(())
}

#[test]
async fn structured_clone_policy_graph_edges(
    #[tagged_as("structured_clone")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "test-policy-case",
        &[Val::U8(2)],
    )
    .await;
    assert_eq!(result?, Some(Val::String("ok".into())), "{output}");
    Ok(())
}

#[test]
async fn structured_clone_policy_transfer_aliases(
    #[tagged_as("structured_clone")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "test-policy-case",
        &[Val::U8(3)],
    )
    .await;
    assert_eq!(result?, Some(Val::String("ok".into())), "{output}");
    Ok(())
}

#[test]
async fn structured_clone_policy_transfer_atomicity(
    #[tagged_as("structured_clone")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "test-policy-case",
        &[Val::U8(4)],
    )
    .await;
    assert_eq!(result?, Some(Val::String("ok".into())), "{output}");
    Ok(())
}

#[test]
async fn structured_clone_policy_trusted_messaging(
    #[tagged_as("structured_clone")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "test-policy-case",
        &[Val::U8(5)],
    )
    .await;
    assert_eq!(result?, Some(Val::String("ok".into())), "{output}");
    Ok(())
}

#[test]
async fn structured_clone_policy_blob_bytes(
    #[tagged_as("structured_clone")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "test-policy-case",
        &[Val::U8(6)],
    )
    .await;
    assert_eq!(result?, Some(Val::String("ok".into())), "{output}");
    Ok(())
}

#[test]
async fn structured_clone_policy_blob_hooks(
    #[tagged_as("structured_clone")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "test-policy-case",
        &[Val::U8(7)],
    )
    .await;
    assert_eq!(result?, Some(Val::String("ok".into())), "{output}");
    Ok(())
}

#[test]
async fn structured_clone_policy_host_objects(
    #[tagged_as("structured_clone")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "test-policy-case",
        &[Val::U8(8)],
    )
    .await;
    assert_eq!(result?, Some(Val::String("ok".into())), "{output}");
    Ok(())
}

#[test]
async fn structured_clone_policy_signal_initial_state(
    #[tagged_as("structured_clone")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "test-policy-case",
        &[Val::U8(9)],
    )
    .await;
    assert_eq!(result?, Some(Val::String("ok".into())), "{output}");
    Ok(())
}

#[test]
async fn structured_clone_policy_signal_forwarding(
    #[tagged_as("structured_clone")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "test-policy-case",
        &[Val::U8(10)],
    )
    .await;
    assert_eq!(result?, Some(Val::String("ok".into())), "{output}");
    Ok(())
}

#[test]
async fn structured_clone_policy_unsupported_capabilities(
    #[tagged_as("structured_clone")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "test-policy-case",
        &[Val::U8(11)],
    )
    .await;
    assert_eq!(result?, Some(Val::String("ok".into())), "{output}");
    Ok(())
}

#[test]
async fn structured_clone_policy_public_conversion(
    #[tagged_as("structured_clone")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "test-policy-case",
        &[Val::U8(12)],
    )
    .await;
    assert_eq!(result?, Some(Val::String("ok".into())), "{output}");
    Ok(())
}

#[test]
async fn structured_clone_policy_message_lifecycle(
    #[tagged_as("structured_clone")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "test-policy-case",
        &[Val::U8(13)],
    )
    .await;
    assert_eq!(result?, Some(Val::String("ok".into())), "{output}");
    Ok(())
}

#[test]
async fn structured_clone_policy_signal_weak_lifetime(
    #[tagged_as("structured_clone")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "test-policy-case",
        &[Val::U8(14)],
    )
    .await;
    assert_eq!(result?, Some(Val::String("ok".into())), "{output}");
    Ok(())
}

#[test]
#[ignore]
async fn structured_clone_policy_measurement(
    #[tagged_as("structured_clone")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let mut instance = TestInstance::new(compiled.wasm_path()).await?;
    if let Ok(path) = std::env::var("WASM_RQUICKJS_CLONE_BENCH_BASELINE") {
        std::fs::copy(path, instance.temp_dir_path().join("baseline-clone.js"))?;
    }
    let (result, output) = instance
        .invoke_and_capture_output(None, "test-policy-case", &[Val::U8(250)])
        .await;
    println!("clone policy measurement: {:?}; {output}", result?);
    Ok(())
}

#[test]
async fn structured_clone_policy_immutable_buffer(
    #[tagged_as("structured_clone")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "test-policy-case",
        &[Val::U8(15)],
    )
    .await;
    assert_eq!(result?, Some(Val::String("ok".into())), "{output}");
    Ok(())
}

#[test]
async fn structured_clone_policy_trusted_owner_intrinsics(
    #[tagged_as("structured_clone")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "test-policy-case",
        &[Val::U8(16)],
    )
    .await;
    assert_eq!(result?, Some(Val::String("ok".into())), "{output}");
    Ok(())
}

#[test]
async fn structured_clone_policy_signal_forwarding_errors(
    #[tagged_as("structured_clone")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "test-policy-case",
        &[Val::U8(17)],
    )
    .await;
    assert_eq!(result?, Some(Val::String("ok".into())), "{output}");
    Ok(())
}

#[test]
async fn structured_clone_policy_signal_transfer_chain(
    #[tagged_as("structured_clone")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "test-policy-case",
        &[Val::U8(18)],
    )
    .await;
    assert_eq!(result?, Some(Val::String("ok".into())), "{output}");
    Ok(())
}

#[test]
async fn structured_clone_policy_synchronous_port_receive(
    #[tagged_as("structured_clone")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "test-policy-case",
        &[Val::U8(19)],
    )
    .await;
    assert_eq!(result?, Some(Val::String("ok".into())), "{output}");
    Ok(())
}

#[test]
async fn structured_clone_policy_array_shapes(
    #[tagged_as("structured_clone")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "test-policy-case",
        &[Val::U8(20)],
    )
    .await;
    assert_eq!(result?, Some(Val::String("ok".into())), "{output}");
    Ok(())
}

#[test]
async fn structured_clone_policy_node_property_and_error_semantics(
    #[tagged_as("structured_clone")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "test-policy-case",
        &[Val::U8(21)],
    )
    .await;
    assert_eq!(result?, Some(Val::String("ok".into())), "{output}");
    Ok(())
}

#[test]
async fn structured_clone_policy_transfer_only_hosts(
    #[tagged_as("structured_clone")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "test-policy-case",
        &[Val::U8(22)],
    )
    .await;
    assert_eq!(result?, Some(Val::String("ok".into())), "{output}");
    Ok(())
}

#[test]
async fn structured_clone_policy_aborted_validation_and_reason_order(
    #[tagged_as("structured_clone")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "test-policy-case",
        &[Val::U8(23)],
    )
    .await;
    assert_eq!(result?, Some(Val::String("ok".into())), "{output}");
    Ok(())
}

#[test]
async fn structured_clone_policy_aborted_duck_gc_cleanup(
    #[tagged_as("structured_clone")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "test-policy-case",
        &[Val::U8(24)],
    )
    .await;
    assert_eq!(result?, Some(Val::String("ok".into())), "{output}");
    Ok(())
}

#[test]
async fn structured_clone_policy_process_environment(
    #[tagged_as("structured_clone")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "test-policy-case",
        &[Val::U8(25)],
    )
    .await;
    assert_eq!(result?, Some(Val::String("ok".into())), "{output}");
    Ok(())
}
