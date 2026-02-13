use crate::common::{CompiledTest, invoke_and_capture_output};
use indoc::indoc;
use test_r::{inherit_test_dep, test};
use wasmtime::component::Val;

inherit_test_dep!(
    #[tagged_as("url")]
    CompiledTest
);

#[test]
async fn url_test1(#[tagged_as("url")] compiled_test: &CompiledTest) -> anyhow::Result<()> {
    let (r, output) =
        invoke_and_capture_output(compiled_test.wasm_path(), None, "test1", &[]).await;
    let r = r?;

    println!("Output:\n{}", output);

    assert_eq!(r, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn url_test2(#[tagged_as("url")] compiled_test: &CompiledTest) -> anyhow::Result<()> {
    let (r, output) =
        invoke_and_capture_output(compiled_test.wasm_path(), None, "test2", &[]).await;
    let r = r?;

    println!("Output:\n{}", output);

    assert_eq!(r, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn url_test3(#[tagged_as("url")] compiled_test: &CompiledTest) -> anyhow::Result<()> {
    let (r, output) =
        invoke_and_capture_output(compiled_test.wasm_path(), None, "test3", &[]).await;
    let _ = r?;

    println!("Output:\n{}", output);

    assert_eq!(
        output,
        indoc! {
            r#"[ 'q', 'URLUtils.searchParams' ]
           [ 'topic', 'api' ]
           true
           false
           true
           [ 'api' ]
           true
           undefined
           q=URLUtils.searchParams&topic=api&topic=webdev
           undefined
           q=URLUtils.searchParams&topic=More+webdev
           undefined
           q=URLUtils.searchParams
           "#
        }
    );
    Ok(())
}

#[test]
async fn url_test4(#[tagged_as("url")] compiled_test: &CompiledTest) -> anyhow::Result<()> {
    let (r, output) =
        invoke_and_capture_output(compiled_test.wasm_path(), None, "test4", &[]).await;
    let _ = r?;

    println!("Output:\n{}", output);

    assert_eq!(
        output,
        indoc! {
            r#"https:
            test
            pass
            example.com
            1234
            /path
            #fragment
            api
            URLUtils.searchParams
            https://test:pass@example.com:1234/path?query=URLUtils.searchParams&topic=api#fragment
            "#
        }
    );
    Ok(())
}

#[test]
async fn url_test5(#[tagged_as("url")] compiled_test: &CompiledTest) -> anyhow::Result<()> {
    let (r, output) =
        invoke_and_capture_output(compiled_test.wasm_path(), None, "test5", &[]).await;
    let r = r?;

    println!("Output:\n{}", output);

    assert_eq!(r, Some(Val::Bool(true)));
    Ok(())
}
