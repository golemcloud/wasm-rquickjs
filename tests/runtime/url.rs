use crate::common::{CompiledTest, invoke_and_capture_output};
use camino::Utf8Path;
use indoc::indoc;
use test_r::{test, test_dep};
use wasmtime::component::Val;

#[test_dep(tagged_as = "url")]
fn compiled_url() -> CompiledTest {
    let path = Utf8Path::new("examples/runtime/url");
    CompiledTest::new(path, false).expect("Failed to compile url")
}

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

#[test]
async fn url_test6(#[tagged_as("url")] compiled_test: &CompiledTest) -> anyhow::Result<()> {
    let (r, output) =
        invoke_and_capture_output(compiled_test.wasm_path(), None, "test6", &[]).await;
    let r = r?;

    println!("Output:\n{}", output);

    assert_eq!(r, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn url_test7(#[tagged_as("url")] compiled_test: &CompiledTest) -> anyhow::Result<()> {
    let (r, output) =
        invoke_and_capture_output(compiled_test.wasm_path(), None, "test7", &[]).await;
    let r = r?;

    println!("Output:\n{}", output);

    assert_eq!(r, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn url_test8(#[tagged_as("url")] compiled_test: &CompiledTest) -> anyhow::Result<()> {
    let (r, output) =
        invoke_and_capture_output(compiled_test.wasm_path(), None, "test8", &[]).await;
    let r = r?;

    println!("Output:\n{}", output);

    assert_eq!(r, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn url_test9(#[tagged_as("url")] compiled_test: &CompiledTest) -> anyhow::Result<()> {
    let (r, output) =
        invoke_and_capture_output(compiled_test.wasm_path(), None, "test9", &[]).await;
    let r = r?;

    println!("Output:\n{}", output);

    assert_eq!(r, Some(Val::Bool(true)));
    Ok(())
}
