use crate::common::{CompiledTest, FeatureCombination, TestInstance};
use camino::Utf8Path;
use test_r::{test, test_dep};
use wasm_rquickjs::{EmbeddingMode, JsModuleSpec};
use wasmtime::component::Val;

async fn invoke(instance: &mut TestInstance, name: &str) -> anyhow::Result<Option<Val>> {
    instance
        .invoke_and_capture_output_with_stderr(None, name, &[])
        .await
        .0
}

#[test_dep(tagged_as = "engine_gc", scope = Cloneable)]
async fn compiled_engine_gc() -> CompiledTest {
    let path = Utf8Path::new("examples/runtime/engine-gc");
    CompiledTest::new_with_features_and_additional_modules(
        path,
        true,
        FeatureCombination::InternalTestExecution,
        &[JsModuleSpec {
            name: "engine-extra".to_string(),
            mode: EmbeddingMode::EmbedFile(path.join("src/engine-extra.js")),
        }],
    )
    .await
    .expect("Failed to compile engine GC regressions")
}

#[test]
async fn engine_regexp_sets(
    #[tagged_as("engine_gc")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let mut instance = TestInstance::new(compiled.wasm_path()).await?;
    assert_eq!(
        invoke(&mut instance, "regexp-sets").await?,
        Some(Val::Bool(true))
    );
    Ok(())
}

#[test]
async fn engine_embedded_attributes(
    #[tagged_as("engine_gc")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let mut instance = TestInstance::new(compiled.wasm_path()).await?;
    assert_eq!(
        invoke(&mut instance, "embedded-attributes").await?,
        Some(Val::Bool(true))
    );
    Ok(())
}

#[test]
async fn engine_registered_json_attributes(
    #[tagged_as("engine_gc")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let mut instance = TestInstance::new(compiled.wasm_path()).await?;
    assert_eq!(
        invoke(&mut instance, "registered-json-attributes").await?,
        Some(Val::Bool(true))
    );
    Ok(())
}

#[test]
async fn engine_gc_failed_imports_release_tokens(
    #[tagged_as("engine_gc")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let mut instance = TestInstance::new(compiled.wasm_path()).await?;
    assert_eq!(
        invoke(&mut instance, "failed-imports").await?,
        Some(Val::Bool(true))
    );
    Ok(())
}

#[test]
async fn engine_gc_shared_body_errors(
    #[tagged_as("engine_gc")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let mut instance = TestInstance::new(compiled.wasm_path()).await?;
    assert_eq!(
        invoke(&mut instance, "shared-body-errors").await?,
        Some(Val::Bool(true))
    );
    Ok(())
}

#[test]
async fn engine_gc_typed_buffers(
    #[tagged_as("engine_gc")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let mut instance = TestInstance::new(compiled.wasm_path()).await?;
    assert_eq!(
        invoke(&mut instance, "typed-buffers").await?,
        Some(Val::Bool(true))
    );
    Ok(())
}

#[test]
async fn engine_gc_accounting(
    #[tagged_as("engine_gc")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let mut instance = TestInstance::new(compiled.wasm_path()).await?;
    invoke(&mut instance, "accounting").await?;
    Ok(())
}

#[test]
async fn engine_gc_cycles_reuse_memory(
    #[tagged_as("engine_gc")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let mut instance = TestInstance::new_with_memory_tracking(compiled.wasm_path()).await?;
    for iteration in 0..2 {
        let start = instance.linear_memory_high_water_bytes();
        let result = invoke(&mut instance, "cycle-stress").await?;
        let Some(Val::String(report)) = result else {
            anyhow::bail!("expected memory report");
        };
        println!("iteration {iteration}: {report}");
        // The first invocation includes warmup; the second must reuse capacity.
        if iteration == 1 {
            assert!(
                instance
                    .linear_memory_high_water_bytes()
                    .saturating_sub(start)
                    <= 32 * 1024 * 1024
            );
        }
    }
    Ok(())
}

#[test]
async fn engine_gc_async_roots(
    #[tagged_as("engine_gc")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let mut instance = TestInstance::new(compiled.wasm_path()).await?;
    assert_eq!(
        invoke(&mut instance, "async-roots").await?,
        Some(Val::Bool(true))
    );
    Ok(())
}

#[test]
async fn engine_gc_owned_runtimes(
    #[tagged_as("engine_gc")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let mut instance = TestInstance::new(compiled.wasm_path()).await?;
    assert_eq!(
        invoke(&mut instance, "owned-runtimes").await?,
        Some(Val::Bool(true))
    );
    Ok(())
}

#[test]
#[ignore = "manual diagnostic for pre-existing strong JS registry retention"]
async fn engine_gc_registry_retention_control(
    #[tagged_as("engine_gc")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let mut instance = TestInstance::new(compiled.wasm_path()).await?;
    let Some(Val::String(report)) = invoke(&mut instance, "registry-retention").await? else {
        anyhow::bail!("expected registry memory report");
    };
    println!("registry retention control: {report}");
    Ok(())
}

#[test]
async fn engine_gc_large_retained_heap(
    #[tagged_as("engine_gc")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let mut instance = TestInstance::new(compiled.wasm_path()).await?;
    let start = std::time::Instant::now();
    let report = invoke(&mut instance, "retained-heap").await?;
    println!("large retained heap ({:?}): {report:?}", start.elapsed());
    Ok(())
}
