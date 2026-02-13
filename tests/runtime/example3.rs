use crate::common::{CompiledTest, TestInstance};
use test_r::{inherit_test_dep, test};
use wasmtime::component::Val;

inherit_test_dep!(
    #[tagged_as("example3")]
    CompiledTest
);

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
    assert_eq!(compare, Some(Val::S32(-1)));
    assert_eq!(name3, Some(Val::String("user1 & user2".to_string())));

    Ok(())
}
