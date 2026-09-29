use crate::common::{CompiledTest, TestInstance, TestTarget, test_target};
use camino::Utf8Path;
use test_r::test;
use wasmtime::component::{ResourceAny, Val};

const INTERFACE: &str = "quickjs:p2-exported-resource/api";

async fn construct_counter(instance: &mut TestInstance, value: u32) -> anyhow::Result<ResourceAny> {
    let (result, _) = instance
        .invoke_and_capture_output(Some(INTERFACE), "[constructor]counter", &[Val::U32(value)])
        .await;
    let Some(Val::Resource(resource)) = result? else {
        panic!("Expected a resource handle")
    };
    Ok(resource)
}

async fn invoke_resource(
    instance: &mut TestInstance,
    name: &str,
    args: &[Val],
) -> anyhow::Result<ResourceAny> {
    let (result, _) = instance
        .invoke_and_capture_output(Some(INTERFACE), name, args)
        .await;
    let Some(Val::Resource(resource)) = result? else {
        panic!("Expected a resource handle")
    };
    Ok(resource)
}

async fn counter_value(instance: &mut TestInstance, resource: ResourceAny) -> anyhow::Result<u32> {
    let (result, _) = instance
        .invoke_and_capture_output(
            Some(INTERFACE),
            "[method]counter.get",
            &[Val::Resource(resource)],
        )
        .await;
    let Some(Val::U32(value)) = result? else {
        panic!("Expected a u32 result")
    };
    Ok(value)
}

async fn resource_count(instance: &mut TestInstance) -> anyhow::Result<u32> {
    // P2 host drops are consumed by a concurrent dropper after a JS entry completes. The first
    // diagnostic call provides that entry; the second observes the settled resource table.
    let _ = instance
        .invoke_and_capture_output(Some(INTERFACE), "[static]counter.resource-count", &[])
        .await
        .0?;
    let (result, _) = instance
        .invoke_and_capture_output(Some(INTERFACE), "[static]counter.resource-count", &[])
        .await;
    let Some(Val::U32(value)) = result? else {
        panic!("Expected a u32 result")
    };
    Ok(value)
}

#[test]
async fn p2_promise_resource_ownership() -> anyhow::Result<()> {
    if test_target() != TestTarget::P2 {
        return Ok(());
    }

    let compiled =
        CompiledTest::new(Utf8Path::new("examples/runtime/p2-exported-resource"), true).await?;
    let mut instance = TestInstance::new(compiled.wasm_path()).await?;
    let baseline = resource_count(&mut instance).await?;

    let original = construct_counter(&mut instance, 20).await?;
    let identity = invoke_resource(
        &mut instance,
        "[static]counter.identity",
        &[Val::Resource(original)],
    )
    .await?;
    assert_eq!(counter_value(&mut instance, identity).await?, 20);
    instance.drop_resource(identity).await?;
    assert_eq!(resource_count(&mut instance).await?, baseline);

    let failing = construct_counter(&mut instance, 30).await?;
    let (failure, _) = instance
        .invoke_and_capture_output(
            Some(INTERFACE),
            "[static]counter.stash-and-fail",
            &[Val::Resource(failing)],
        )
        .await;
    assert_eq!(
        failure?,
        Some(Val::Result(Err(Some(Box::new(Val::String(
            "expected async failure".to_string()
        ))))))
    );

    let recovered = invoke_resource(&mut instance, "[static]counter.take", &[]).await?;
    assert_eq!(counter_value(&mut instance, recovered).await?, 30);
    instance.drop_resource(recovered).await?;
    assert_eq!(resource_count(&mut instance).await?, baseline);

    Ok(())
}
