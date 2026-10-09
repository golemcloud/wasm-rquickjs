use crate::common::{CompiledTest, TestInstance, invoke_and_capture_output};
use camino::Utf8Path;
use rand::Rng;
use std::slice;
use std::sync::{
    Arc,
    atomic::{AtomicU64, Ordering},
};
use test_r::{test, test_dep};
use wasmtime::component::Val;
use wasmtime_wasi::{HostMonotonicClock, WasiCtx};

#[derive(Clone)]
struct RecordedClock {
    nanos: Arc<AtomicU64>,
    calls: Arc<AtomicU64>,
}

impl HostMonotonicClock for RecordedClock {
    fn resolution(&self) -> u64 {
        1
    }

    fn now(&self) -> u64 {
        self.calls.fetch_add(1, Ordering::SeqCst);
        self.nanos.load(Ordering::SeqCst)
    }
}

#[test]
#[test_r::timeout("120s")]
async fn hrtime_preserves_clock_samples_across_restoration(
    #[tagged_as("bigint_roundtrip")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let clock = RecordedClock {
        nanos: Arc::new(AtomicU64::new((1 << 53) - 1)),
        calls: Arc::new(AtomicU64::new(0)),
    };
    let mut builder = WasiCtx::builder();
    builder.monotonic_clock(clock.clone());
    let mut instance = TestInstance::new_with_wasi(compiled.wasm_path(), builder).await?;
    // Initialize the component dispatcher without touching process.hrtime.
    instance
        .invoke(None, "roundtrip-u64", &[Val::U64(0)])
        .await?;
    let mut snapshot = 0;
    for timestamp in [(1 << 53) - 1, (1 << 53) + 1] {
        clock.nanos.store(timestamp, Ordering::SeqCst);
        clock.calls.store(0, Ordering::SeqCst);
        let result = instance.invoke(None, "sample-hrtime", &[]).await?;
        assert_eq!(
            clock.calls.load(Ordering::SeqCst),
            1,
            "each cold or warm hrtime call must consume one host sample"
        );
        assert_eq!(result, Some(Val::U64(timestamp)));
        snapshot = timestamp;
    }
    clock.nanos.store(snapshot + 7, Ordering::SeqCst);
    let expected = instance.invoke(None, "elapsed-hrtime", &[]).await?;
    assert_eq!(expected, Some(Val::U64(7)));
    drop(instance);

    let mut builder = WasiCtx::builder();
    builder.monotonic_clock(clock.clone());
    let mut restored = TestInstance::new_with_wasi(compiled.wasm_path(), builder).await?;
    restored
        .invoke(None, "restore-hrtime", &[Val::U64(snapshot)])
        .await?;
    clock.calls.store(0, Ordering::SeqCst);
    assert_eq!(
        restored.invoke(None, "elapsed-hrtime", &[]).await?,
        expected
    );
    assert_eq!(clock.calls.load(Ordering::SeqCst), 1);

    clock
        .nanos
        .store(1_791_286_838_000_000_006, Ordering::SeqCst);
    assert_eq!(
        restored
            .invoke(
                None,
                "elapsed-hrtime-tuple",
                &[Val::U64(1_791_286_837), Val::U32(999_999_999)]
            )
            .await?,
        Some(Val::Tuple(vec![Val::S64(0), Val::U32(7)]))
    );
    for timestamp in [1_791_286_838_000_000_007, (1 << 63) + 1, u64::MAX] {
        clock.nanos.store(timestamp, Ordering::SeqCst);
        assert_eq!(
            restored.invoke(None, "sample-hrtime", &[]).await?,
            Some(Val::U64(timestamp))
        );
        assert_eq!(
            restored.invoke(None, "sample-hrtime-tuple", &[]).await?,
            Some(Val::Tuple(vec![
                Val::U64(timestamp / 1_000_000_000),
                Val::U32((timestamp % 1_000_000_000) as u32)
            ]))
        );
    }
    Ok(())
}

#[test_dep(tagged_as = "bigint_roundtrip", scope = Cloneable)]
async fn compiled_bigint_roundtrip() -> CompiledTest {
    let path = Utf8Path::new("examples/runtime/bigint-roundtrip");
    CompiledTest::new(path, true)
        .await
        .expect("Failed to compile bigint_roundtrip")
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
