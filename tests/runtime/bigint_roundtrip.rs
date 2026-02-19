use crate::common::{CompiledTest, invoke_and_capture_output};
use camino::Utf8Path;
use rand::Rng;
use std::slice;
use test_r::{test, test_dep};
use wasmtime::component::Val;

#[test_dep(tagged_as = "bigint_roundtrip")]
fn compiled_bigint_roundtrip() -> CompiledTest {
    let path = Utf8Path::new("examples/bigint-roundtrip");
    CompiledTest::new(path, true).expect("Failed to compile bigint_roundtrip")
}

#[test]
async fn roundtrip_u64(
    #[tagged_as("bigint_roundtrip")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    // FIXME: This should use a property-based testing library, but proptest does not support async.
    let mut rng = rand::rng();
    let mut cases = Vec::new();
    for _ in 0..5 {
        cases.push(rng.random());
    }
    // interesting hardcoded cases
    cases.push(u64::MAX);
    cases.push(u64::MIN);

    for case in cases {
        let input = Val::U64(case);
        let (result, _) = invoke_and_capture_output(
            compiled.wasm_path(),
            None,
            "roundtrip-u64",
            slice::from_ref(&input),
        )
        .await;
        assert_eq!(result?, Some(input));
    }
    Ok(())
}

#[test]
async fn roundtrip_s64(
    #[tagged_as("bigint_roundtrip")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    // FIXME: This should use a property-based testing library, but proptest does not support async.
    let mut rng = rand::rng();
    let mut cases = Vec::new();
    for _ in 0..5 {
        cases.push(rng.random());
    }
    // interesting hardcoded cases
    cases.push(i64::MAX);
    cases.push(i64::MIN);

    for case in cases {
        let input = Val::S64(case);
        let (result, _) = invoke_and_capture_output(
            compiled.wasm_path(),
            None,
            "roundtrip-s64",
            slice::from_ref(&input),
        )
        .await;
        assert_eq!(result?, Some(input));
    }
    Ok(())
}
