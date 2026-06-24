use crate::common::{CompiledTest, invoke_and_capture_output};
use camino::Utf8Path;
use test_r::{test, test_dep};
use wasmtime::component::Val;

#[test_dep(tagged_as = "variant_list_roundtrip", scope = Cloneable)]
async fn compiled_variant_list_roundtrip() -> CompiledTest {
    let path = Utf8Path::new("examples/runtime/variant-list-roundtrip");
    CompiledTest::new(path, true)
        .await
        .expect("Failed to compile variant-list-roundtrip")
}

#[test]
async fn roundtrip_large_variant_list(
    #[tagged_as("variant_list_roundtrip")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let input = Val::List(large_variant_list());

    let (result, _) = invoke_and_capture_output(
        compiled.wasm_path(),
        Some("quickjs:variant-list-roundtrip/api"),
        "roundtrip-items",
        std::slice::from_ref(&input),
    )
    .await;

    assert_eq!(result?, Some(input));
    Ok(())
}

#[test]
async fn roundtrip_large_variant_list_in_record(
    #[tagged_as("variant_list_roundtrip")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let input = Val::Record(vec![("items".to_string(), Val::List(large_variant_list()))]);

    let (result, _) = invoke_and_capture_output(
        compiled.wasm_path(),
        Some("quickjs:variant-list-roundtrip/api"),
        "roundtrip-payload",
        std::slice::from_ref(&input),
    )
    .await;

    assert_eq!(result?, Some(input));
    Ok(())
}

#[test]
async fn roundtrip_large_variant_list_in_variant(
    #[tagged_as("variant_list_roundtrip")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let input = Val::Variant(
        "direct".to_string(),
        Some(Box::new(Val::List(large_variant_list()))),
    );

    let (result, _) = invoke_and_capture_output(
        compiled.wasm_path(),
        Some("quickjs:variant-list-roundtrip/api"),
        "roundtrip-envelope",
        std::slice::from_ref(&input),
    )
    .await;

    assert_eq!(result?, Some(input));
    Ok(())
}

fn large_variant_list() -> Vec<Val> {
    (0..10_000)
        .map(|idx| match idx % 3 {
            0 => Val::Variant("empty".to_string(), None),
            1 => Val::Variant("number".to_string(), Some(Box::new(Val::U32(idx)))),
            _ => Val::Variant(
                "label".to_string(),
                Some(Box::new(Val::String(format!("item-{idx}")))),
            ),
        })
        .collect::<Vec<_>>()
}
