use crate::common::{CompiledTest, invoke_and_capture_output};
use camino::Utf8Path;
use indoc::indoc;
use test_r::{test, test_dep};

#[test_dep(tagged_as = "encoding")]
fn compiled_encoding() -> CompiledTest {
    let path = Utf8Path::new("examples/encoding");
    CompiledTest::new(path, true).expect("Failed to compile encoding")
}

#[test]
async fn encoding(#[tagged_as("encoding")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(compiled.wasm_path(), None, "test1", &[]).await;
    let _ = r?;

    assert_eq!(
        output,
        indoc!(
            r#"
        Decoded text: 𠮷
        Encoded array: {"0":226,"1":130,"2":172}
        Enqueued [Message 0]
        Encoded chunk: {"0":91,"1":77,"2":101,"3":115,"4":115,"5":97,"6":103,"7":101,"8":32,"9":48,"10":93}
        Enqueued [Message 1]
        Encoded chunk: {"0":91,"1":77,"2":101,"3":115,"4":115,"5":97,"6":103,"7":101,"8":32,"9":49,"10":93}
        Enqueued [Message 2]
        Encoded chunk: {"0":91,"1":77,"2":101,"3":115,"4":115,"5":97,"6":103,"7":101,"8":32,"9":50,"10":93}
        Enqueued [Message 3]
        Encoded chunk: {"0":91,"1":77,"2":101,"3":115,"4":115,"5":97,"6":103,"7":101,"8":32,"9":51,"10":93}
        Enqueued [Message 4]
        Encoded chunk: {"0":91,"1":77,"2":101,"3":115,"4":115,"5":97,"6":103,"7":101,"8":32,"9":52,"10":93}
        Enqueued [Message 5]
        Encoded chunk: {"0":91,"1":77,"2":101,"3":115,"4":115,"5":97,"6":103,"7":101,"8":32,"9":53,"10":93}
        Enqueued [Message 6]
        Encoded chunk: {"0":91,"1":77,"2":101,"3":115,"4":115,"5":97,"6":103,"7":101,"8":32,"9":54,"10":93}
        Enqueued [Message 7]
        Encoded chunk: {"0":91,"1":77,"2":101,"3":115,"4":115,"5":97,"6":103,"7":101,"8":32,"9":55,"10":93}
        Enqueued [Message 8]
        Encoded chunk: {"0":91,"1":77,"2":101,"3":115,"4":115,"5":97,"6":103,"7":101,"8":32,"9":56,"10":93}
        Encoded buffer from stream: [91,77,101,115,115,97,103,101,32,48,93,91,77,101,115,115,97,103,101,32,49,93,91,77,101,115,115,97,103,101,32,50,93,91,77,101,115,115,97,103,101,32,51,93,91,77,101,115,115,97,103,101,32,52,93,91,77,101,115,115,97,103,101,32,53,93,91,77,101,115,115,97,103,101,32,54,93,91,77,101,115,115,97,103,101,32,55,93,91,77,101,115,115,97,103,101,32,56,93]
        Decoded chunk: "[Message 0][Mess"
        Decoded chunk: "age 1][Message 2"
        Decoded chunk: "][Message 3][Mes"
        Decoded chunk: "sage 4][Message "
        Decoded chunk: "5][Message 6][Me"
        Decoded chunk: "ssage 7][Message"
        Decoded chunk: " 8]"
        "#
        )
    );

    Ok(())
}

#[test]
async fn encoding_coercion(#[tagged_as("encoding")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(compiled.wasm_path(), None, "test2", &[]).await;
    let r = r?;

    println!("Output:\n{}", output);

    assert_eq!(r, Some(wasmtime::component::Val::Bool(true)));
    Ok(())
}
