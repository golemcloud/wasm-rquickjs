use crate::common::{CompiledTest, TestInstance};
use test_r::{inherit_test_dep, test};
use wasmtime::component::{ResourceAny, Val};

inherit_test_dep!(
    #[tagged_as("example3")]
    CompiledTest
);

async fn construct_hello(
    test_instance: &mut TestInstance,
    name: &str,
) -> anyhow::Result<ResourceAny> {
    let (result, _) = test_instance
        .invoke_and_capture_output(
            Some("quickjs:example3/iface"),
            "[constructor]hello",
            &[Val::String(name.to_string())],
        )
        .await;
    let Val::Resource(resource) = result?.expect("constructor should return a resource") else {
        panic!("Expected a resource handle")
    };
    Ok(resource)
}

async fn invoke_hello_static_resource(
    test_instance: &mut TestInstance,
    name: &str,
    args: &[Val],
) -> anyhow::Result<ResourceAny> {
    let (result, _) = test_instance
        .invoke_and_capture_output(Some("quickjs:example3/iface"), name, args)
        .await;
    let Val::Resource(resource) = result?.expect("static should return a resource") else {
        panic!("Expected a resource handle")
    };
    Ok(resource)
}

async fn hello_name(
    test_instance: &mut TestInstance,
    resource: ResourceAny,
) -> anyhow::Result<String> {
    let (result, _) = test_instance
        .invoke_and_capture_output(
            Some("quickjs:example3/iface"),
            "[method]hello.get-name",
            &[Val::Resource(resource)],
        )
        .await;
    let Some(Val::String(name)) = result? else {
        panic!("Expected a string result")
    };
    Ok(name)
}

#[test]
async fn example3(#[tagged_as("example3")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let mut test_instance = TestInstance::new(compiled.wasm_path()).await?;

    let (h1, _) = test_instance
        .invoke_and_capture_output(
            Some("quickjs:example3/iface"),
            "[constructor]hello",
            &[Val::String("user1".to_string())],
        )
        .await;
    let h1 = h1?;

    let Val::Resource(h1) = h1.unwrap() else {
        panic!("Expected a resource handle")
    };

    let (name1, _) = test_instance
        .invoke_and_capture_output(
            Some("quickjs:example3/iface"),
            "[method]hello.get-name",
            &[Val::Resource(h1)],
        )
        .await;
    let name1 = name1?;

    let (h2, _) = test_instance
        .invoke_and_capture_output(
            Some("quickjs:example3/iface"),
            "[constructor]hello",
            &[Val::String("user2".to_string())],
        )
        .await;
    let h2 = h2?;
    let Val::Resource(h2) = h2.unwrap() else {
        panic!("Expected a resource handle")
    };

    let (name2, _) = test_instance
        .invoke_and_capture_output(
            Some("quickjs:example3/iface"),
            "[method]hello.get-name",
            &[Val::Resource(h2)],
        )
        .await;
    let name2 = name2?;

    let (method_compare, _) = test_instance
        .invoke_and_capture_output(
            Some("quickjs:example3/iface"),
            "[method]hello.compare-with",
            &[Val::Resource(h1), Val::Resource(h2)],
        )
        .await;

    let method_compare = method_compare?;

    let (compare, _) = test_instance
        .invoke_and_capture_output(
            Some("quickjs:example3/iface"),
            "[static]hello.compare",
            &[Val::Resource(h1), Val::Resource(h2)],
        )
        .await;

    let compare = compare?;

    let (merged, _) = test_instance
        .invoke_and_capture_output(
            Some("quickjs:example3/iface"),
            "[static]hello.merge",
            &[Val::Resource(h1), Val::Resource(h2)],
        )
        .await;
    let merged = merged?;
    let Val::Resource(merged) = merged.unwrap() else {
        panic!("Expected a resource handle")
    };

    let (name3, _) = test_instance
        .invoke_and_capture_output(
            Some("quickjs:example3/iface"),
            "[method]hello.get-name",
            &[Val::Resource(merged)],
        )
        .await;
    let name3 = name3?;

    test_instance.drop_resource(merged).await?;

    assert_eq!(name1, Some(Val::String("user1".to_string())));
    assert_eq!(name2, Some(Val::String("user2".to_string())));
    assert_eq!(method_compare, Some(Val::S32(-1)));
    assert_eq!(compare, Some(Val::S32(-1)));
    assert_eq!(name3, Some(Val::String("user1 & user2".to_string())));

    let original = construct_hello(&mut test_instance, "identity").await?;
    let identity = invoke_hello_static_resource(
        &mut test_instance,
        "[static]hello.identity",
        &[Val::Resource(original)],
    )
    .await?;
    assert_eq!(hello_name(&mut test_instance, identity).await?, "identity");
    test_instance.drop_resource(identity).await?;

    let original = construct_hello(&mut test_instance, "drop original first").await?;
    let alias = invoke_hello_static_resource(
        &mut test_instance,
        "[static]hello.alias",
        &[Val::Resource(original)],
    )
    .await?;
    test_instance.drop_resource(original).await?;
    assert_eq!(
        hello_name(&mut test_instance, alias).await?,
        "drop original first"
    );
    test_instance.drop_resource(alias).await?;

    let original = construct_hello(&mut test_instance, "drop alias first").await?;
    let alias = invoke_hello_static_resource(
        &mut test_instance,
        "[static]hello.alias",
        &[Val::Resource(original)],
    )
    .await?;
    test_instance.drop_resource(alias).await?;
    assert_eq!(
        hello_name(&mut test_instance, original).await?,
        "drop alias first"
    );
    test_instance.drop_resource(original).await?;

    let stashed = construct_hello(&mut test_instance, "stashed").await?;
    let (stash_result, _) = test_instance
        .invoke_and_capture_output(
            Some("quickjs:example3/iface"),
            "[static]hello.stash",
            &[Val::Resource(stashed)],
        )
        .await;
    assert_eq!(stash_result?, None);
    let recovered =
        invoke_hello_static_resource(&mut test_instance, "[static]hello.take", &[]).await?;
    assert_eq!(hello_name(&mut test_instance, recovered).await?, "stashed");
    test_instance.drop_resource(recovered).await?;

    let failing = construct_hello(&mut test_instance, "recovered after failure").await?;
    let (failure, _) = test_instance
        .invoke_and_capture_output(
            Some("quickjs:example3/iface"),
            "[static]hello.stash-and-fail",
            &[Val::Resource(failing)],
        )
        .await;
    assert_eq!(
        failure?,
        Some(Val::Result(Err(Some(Box::new(Val::String(
            "expected failure".to_string()
        ))))))
    );
    let recovered =
        invoke_hello_static_resource(&mut test_instance, "[static]hello.take", &[]).await?;
    assert_eq!(
        hello_name(&mut test_instance, recovered).await?,
        "recovered after failure"
    );
    test_instance.drop_resource(recovered).await?;

    Ok(())
}
