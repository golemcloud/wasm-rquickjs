test_r::enable!();

use self::common::test_server::start_test_server;
use crate::common::{CompiledTest, TestInstance, invoke_and_capture_output};
use anyhow::anyhow;
use camino::Utf8Path;
use indoc::{formatdoc, indoc};
use pretty_assertions::assert_eq;
use rand::Rng;
use std::slice;
use test_r::{test, test_dep};
use wasmtime::component::Val;

#[allow(dead_code)]
mod common;

#[test_dep(tagged_as = "example1")]
fn compiled_example1() -> CompiledTest {
    let path = Utf8Path::new("examples/example1");
    CompiledTest::new(path, true).expect("Failed to compile example1")
}

#[test_dep(tagged_as = "example2")]
fn compiled_example2() -> CompiledTest {
    let path = Utf8Path::new("examples/example2");
    CompiledTest::new(path, true).expect("Failed to compile example2")
}

#[test_dep(tagged_as = "example3")]
fn compiled_example3() -> CompiledTest {
    let path = Utf8Path::new("examples/example3");
    CompiledTest::new(path, true).expect("Failed to compile example3")
}

#[test_dep(tagged_as = "console")]
fn compiled_console() -> CompiledTest {
    let path = Utf8Path::new("examples/console");
    CompiledTest::new(path, true).expect("Failed to compile console")
}

#[test_dep(tagged_as = "encoding")]
fn compiled_encoding() -> CompiledTest {
    let path = Utf8Path::new("examples/encoding");
    CompiledTest::new(path, true).expect("Failed to compile encoding")
}

#[test_dep(tagged_as = "export_from_inner_package")]
fn compiled_export_from_inner_package() -> CompiledTest {
    let path = Utf8Path::new("examples/export-from-inner-package");
    CompiledTest::new(path, true).expect("Failed to compile export-from-inner-package")
}

#[test_dep(tagged_as = "fetch")]
fn compiled_fetch() -> CompiledTest {
    let path = Utf8Path::new("examples/fetch");
    CompiledTest::new(path, true).expect("Failed to compile fetch")
}

#[test_dep(tagged_as = "imports1")]
fn compiled_imports1() -> CompiledTest {
    let path = Utf8Path::new("examples/imports1");
    CompiledTest::new(path, true).expect("Failed to compile imports1")
}

#[test_dep(tagged_as = "imports2")]
fn compiled_imports2() -> CompiledTest {
    let path = Utf8Path::new("examples/imports2");
    CompiledTest::new(path, true).expect("Failed to compile imports2")
}

#[test_dep(tagged_as = "imports3")]
fn compiled_imports3() -> CompiledTest {
    let path = Utf8Path::new("examples/imports3");
    CompiledTest::new(path, true).expect("Failed to compile imports3")
}

#[test_dep(tagged_as = "types_in_exports")]
fn compiled_types_in_exports() -> CompiledTest {
    let path = Utf8Path::new("examples/types-in-exports");
    CompiledTest::new(path, true).expect("Failed to compile types-in-exports")
}

#[test_dep(tagged_as = "stateful1")]
fn compiled_stateful1() -> CompiledTest {
    let path = Utf8Path::new("examples/stateful1");
    CompiledTest::new(path, true).expect("Failed to compile stateful1")
}

#[test_dep(tagged_as = "streams")]
fn compiled_streams() -> CompiledTest {
    let path = Utf8Path::new("examples/streams");
    CompiledTest::new(path, true).expect("Failed to compile streams")
}

#[test_dep(tagged_as = "timeout")]
fn compiled_timeout() -> CompiledTest {
    let path = Utf8Path::new("examples/timeout");
    CompiledTest::new(path, true).expect("Failed to compile timeout")
}

#[test_dep(tagged_as = "bigint_roundtrip")]
fn compiled_bigint_roundtrip() -> CompiledTest {
    let path = Utf8Path::new("examples/bigint-roundtrip");
    CompiledTest::new(path, true).expect("Failed to compile bigint-roundtrip")
}

#[test_dep(tagged_as = "pollable")]
fn compiled_pollable() -> CompiledTest {
    let path = Utf8Path::new("examples/pollable");
    CompiledTest::new(path, true).expect("Failed to compile pollable")
}

#[test_dep(tagged_as = "fs")]
fn compiled_fs() -> CompiledTest {
    let path = Utf8Path::new("examples/fs");
    CompiledTest::new(path, false).expect("Failed to compile fs")
}

#[test_dep(tagged_as = "url")]
fn compiled_url() -> CompiledTest {
    let path = Utf8Path::new("examples/url");
    CompiledTest::new(path, false).expect("Failed to compile url")
}

#[test]
async fn example1_sync(#[tagged_as("example1")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (result, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "hello",
        &[Val::String("world".to_string())],
    )
    .await;
    let result = result?;

    assert_eq!(result, Some(Val::String("Hello, world! (123)".to_string())));
    assert_eq!(output, "hello called with world\n");

    Ok(())
}

#[test]
async fn example1_async(#[tagged_as("example1")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (result, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "async-hello",
        &[Val::String("world".to_string())],
    )
    .await;
    let result = result?;

    assert_eq!(result, Some(Val::String("Hello, world! (123)".to_string())));
    assert_eq!(output, "hello called with world\n");

    Ok(())
}

#[test]
async fn example2_sync(#[tagged_as("example2")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (result, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        Some("quickjs:example2/exp1"),
        "hello",
        &[Val::String("world".to_string())],
    )
    .await;
    let result = result?;

    assert_eq!(result, Some(Val::String("Hello, world! (123)".to_string())));
    assert_eq!(output, "hello called with world\n");

    Ok(())
}

#[test]
async fn example2_async(#[tagged_as("example2")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (result, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        Some("quickjs:example2/exp2"),
        "async-hello",
        &[Val::String("world".to_string())],
    )
    .await;
    let result = result?;

    assert_eq!(result, Some(Val::String("Hello, world!".to_string())));
    assert_eq!(output, "hello called with world\n");

    Ok(())
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

#[test]
async fn console(#[tagged_as("console")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(compiled.wasm_path(), None, "run", &[]).await;
    let _ = r?;

    println!("{output}");

    // Removing the last 3 lines which are printed by timers and can have slight differences in the millisecond
    // values

    let lines = output.lines().collect::<Vec<_>>();
    let (output, timer_output) = lines.split_at(lines.len() - 3);
    let output = output.join("\n");
    let timer_output = timer_output.join("\n");

    assert_eq!(
        output,
        formatdoc!(
            r#"
    default: 1
    logged message 1 2 {{ key: 'value' }}
    TRACE: This is a trace message
    DEBUG: This is an debug message
    INFO: This is an info message
    WARN: This is a warning message
    ERROR: This is an error message
    default: 2
    WARN: Assertion failed: This is an assertion failure
    Group 1
    Inside Group 1
    Group 2
    Inside Group 2
    default: 3
    test: 1
    test: 2
    default: 1
    {colored}
    {{ key: 'value', nested: {{ a: 1, b: 2 }} }}
    ======================
     (index)  │ 0        │
    ----------------------
     0        │ apples   │
     1        │ oranges  │
     2        │ bananas  │
    ======================
    ==============================
     (index)  │ 0       │ 1      │
    ------------------------------
     0        │ Tyrone  │ Jones  │
     1        │ Janet   │ Smith  │
     2        │ Maria   │ Cruz   │
    ==============================
    =======================
     (index)    │ 0       │
    -----------------------
     firstName  │ Tyrone  │
     lastName   │ Jones   │
    =======================
    ========================
     (index)  │ firstName  │
    ------------------------
     0        │ Tyrone     │
     1        │ Janet      │
     2        │ Maria      │
    ========================"#,
            colored = "{ key: \u{1b}[32m'value'\u{1b}[39m, nested: { a: \u{1b}[33m1\u{1b}[39m, b: \u{1b}[33m2\u{1b}[39m } }"
        )
    );

    assert!(timer_output.contains("after 1 second"));
    assert!(timer_output.contains("after 2 seconds"));
    assert!(timer_output.contains("- timer ended"));

    Ok(())
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
async fn export_from_inner_package(
    #[tagged_as("export_from_inner_package")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        Some("quickjs:inner/exp1@0.0.1"),
        "hello",
        &[Val::String("world".to_string())],
    )
    .await;
    let result = result?;

    assert_eq!(result, Some(Val::String("Hello, world!".to_string())));
    assert_eq!(output, "hello called with world\n");

    Ok(())
}

#[test]
async fn fetch_1(#[tagged_as("fetch")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "test1", &[Val::U16(port)]).await;
    let _ = r?;

    assert!(output.contains(&format!(
        "Response from http://localhost:{port}/todos: 201 Created (ok=true)\n"
    )));
    assert!(output.contains(&format!(
        "Response from http://localhost:{port}/todos/0: 200 OK (ok=true)\n"
    )));
    assert!(output.contains(
        "Body: {\"id\":0,\"userId\":1,\"title\":\"foo\",\"body\":\"bar\",\"completed\":false}"
    ));

    Ok(())
}

#[test]
async fn fetch_2(#[tagged_as("fetch")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "test2", &[Val::U16(port)]).await;
    let _ = r?;

    assert_eq!(
        output,
        indoc!(
            r#"
        fetch test 2
        Response body as ArrayBuffer: {}
    "#
        )
    );

    Ok(())
}

#[test]
async fn fetch_3(#[tagged_as("fetch")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "test3", &[Val::U16(port)]).await;
    let _ = r?;

    let chunk_count = output
        .lines()
        .filter(|l| l.starts_with("Received chunk: "))
        .count();
    assert!(chunk_count > 0);

    Ok(())
}

#[test]
async fn fetch_4(#[tagged_as("fetch")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "test4", &[Val::U16(port)]).await;
    let _ = r?;

    assert!(output.contains(&format!(
        "Response from http://localhost:{port}/echo: 200 OK (ok=true)"
    )));
    assert!(output.contains("Body: [{\"id\":"));

    Ok(())
}

#[test]
async fn fetch_4_buffered(#[tagged_as("fetch")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "test4-buffered",
        &[Val::U16(port)],
    )
    .await;
    let _ = r?;

    assert!(output.contains(&format!(
        "Response from http://localhost:{port}/echo: 200 OK (ok=true)"
    )));
    assert!(output.contains("Body: [{\"id\":"));

    Ok(())
}

#[test]
async fn fetch_5(#[tagged_as("fetch")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "test5", &[Val::U16(port)]).await;
    let _ = r?;

    assert!(output.contains("200 '{\"id\":0,\""));
    assert!(output.contains("200 '{\"id\":1,\""));
    assert!(output.contains("200 '{\"id\":2,\""));
    assert!(output.contains("200 '{\"id\":3,\""));
    assert!(output.contains("200 '{\"id\":4,\""));

    Ok(())
}

#[test]
async fn fetch_6(#[tagged_as("fetch")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "test6", &[Val::U16(port)]).await;
    let _ = r?;

    assert!(output.contains(&format!(
        "Response from http://localhost:{port}/todos: 201 Created (ok=true)"
    )));
    assert!(output.contains(
        "Body: {\"id\":0,\"userId\":1,\"title\":\"foo\",\"body\":\"bar\",\"completed\":false}"
    ));

    Ok(())
}

#[test]
async fn fetch_7(#[tagged_as("fetch")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(compiled.wasm_path(), None, "test7", &[]).await;
    let _ = r?;

    assert!(output.contains("Blob text: hello, world"));
    assert!(output.contains("Blob array buffer length: 12"));
    assert!(output.contains("FormData keys: [\"f1\",\"f2\"]"));
    assert!(output.contains("f1 {}"));
    assert!(output.contains("f2 {\"size\":123,\"type\":\"\",\"name\":\"cat-video.mp4\"}"));

    Ok(())
}

#[test]
async fn fetch_8(#[tagged_as("fetch")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;
    let (r, output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "test8", &[Val::U16(port)]).await;
    let _ = r?;

    assert!(output.contains(&format!(
        "Response from http://localhost:{port}/todos: 201 Created (ok=true)"
    )));
    assert!(output.contains(
        "Body: {\"id\":0,\"userId\":1,\"title\":\"foo\",\"body\":\"bar\",\"completed\":false}"
    ));

    Ok(())
}

#[test]
async fn fetch_9(#[tagged_as("fetch")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;
    let (r, output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "test9", &[Val::U16(port)]).await;
    let _ = r?;

    assert!(output.contains(&format!(
        "http://localhost:{port}/echo-form: 200 OK (ok=true)"
    )));
    assert!(output.contains("Body: [{\"name\":\"f1\",\"data\":[97,98,99]},{\"name\":\"f2\",\"data\":[123,34,116,105,116,108,101,34,58,34,102,111,111,34,44,34,98,111,100,121,34,58,34,98,97,114,34,44,34,117,115,101,114,73,100,34,58,49,125]}]"));

    Ok(())
}

#[test]
async fn fetch_10(#[tagged_as("fetch")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "test10", &[Val::U16(port)]).await;
    let _ = r?;

    println!("{output}");

    assert!(output.contains(&format!(
        "Response from http://localhost:{port}/todos: 201 Created (ok=true)\n"
    )));
    assert!(output.contains(&format!(
        "Response from http://localhost:{port}/todos/0: 200 OK (ok=true)\n"
    )));
    assert!(output.contains(
        "Body: {\"id\":0,\"userId\":1,\"title\":\"foo\",\"body\":\"bar\",\"completed\":false}"
    ));

    Ok(())
}

#[test]
async fn imports1(#[tagged_as("imports1")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (result, _) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "test",
        &[Val::String("someone".to_string())],
    )
    .await;
    let result = result?;

    let Some(Val::String(result)) = result else {
        return Err(anyhow!("Expected a string result"));
    };

    let parts = result.split('-').map(|s| s.trim()).collect::<Vec<_>>();
    assert_eq!(parts.len(), 2);
    assert_eq!(parts[0], "someone");
    assert!(
        parts[1].parse::<u64>().is_ok(),
        "Expected a number in the second part"
    );

    Ok(())
}

#[test]
async fn imports2(
    #[tagged_as("imports2")] compiled: &CompiledTest,
    #[tagged_as("example3")] example3: &CompiledTest,
) -> anyhow::Result<()> {
    let composed = example3.plug_into(compiled)?;

    let (result, output) = invoke_and_capture_output(
        composed.wasm_path(),
        None,
        "test",
        &[Val::String("someone".to_string())],
    )
    .await;
    let result = result?;

    let Some(Val::String(result)) = result else {
        return Err(anyhow!("Expected a string result"));
    };

    assert_eq!(result, "someone & World");
    assert_eq!(
        output,
        indoc! { r#"
          Comparison 1: 1
          Comparison 2: -1
          Dump 1: someone
          Dump 2: ?
          Dump 3: [someone & World]
        "# }
    );

    Ok(())
}

#[test]
async fn imports2_static_create(
    #[tagged_as("imports2")] compiled: &CompiledTest,
    #[tagged_as("example3")] example3: &CompiledTest,
) -> anyhow::Result<()> {
    let composed = example3.plug_into(compiled)?;

    let (result, output) = invoke_and_capture_output(
        composed.wasm_path(),
        None,
        "test-static-create",
        &[Val::String("someone".to_string())],
    )
    .await;
    let result = result?;

    let Some(Val::String(result)) = result else {
        return Err(anyhow!("Expected a string result"));
    };

    assert_eq!(result, "someone");
    assert_eq!(
        output,
        indoc! { r#"
          { [Function: HelloWithStaticCreate] create: [Function], compare: [Function], merge: [Function] }
          [Function]
          [Function]
          [Function]
        "# }
    );

    Ok(())
}

#[test]
async fn imports3(
    #[tagged_as("imports3")] compiled: &CompiledTest,
    #[tagged_as("types_in_exports")] types_in_exports: &CompiledTest,
) -> anyhow::Result<()> {
    let composed = types_in_exports.plug_into(compiled)?;

    let (r, output) = invoke_and_capture_output(composed.wasm_path(), None, "test", &[]).await;
    let _ = r?;

    println!("{output}");
    assert_eq!(
        output,
        indoc!(
            r#"
            a: [0.10000000149011612,0.20000000298023224,0.30000001192092896]
            b: ["a","b"]
            c: ["c","d"]
            f1: 0.10000000149011612 - a - c,0.20000000298023224 - b - d,0.30000001192092896 - undefined - undefined
            a: hello world
            f2: 11
            a: true (boolean)
            b: -8 (number)
            c: -16 (number)
            d: -32 (number)
            e: -64 (bigint)
            f: 8 (number)
            g: 16 (number)
            h: 32 (number)
            i: 64 (bigint)
            j: 3.140000104904175 (number)
            k: 2.718281828459045 (number)
            l: c (string)
            m: hello world (string)
            f3: true,-8,-16,-32,-64,8,16,32,64,3.140000104904175,2.718281828459045,c,hello world
            a: {"tag":"ok","val":42}
            a.tag: ok
            a.val: 42
            f4: {"tag":"ok","val":42}
            a: {"tag":"err","val":"error message"}
            a.tag: err
            a.val: error message
            f5: {"tag":"err","val":"error message"}
            a: {"tag":"ok","val":"success"}
            a.tag: ok
            a.val: success
            f6: {"tag":"ok","val":"success"}
            a: {"tag":"ok"}
            a.tag: ok
            a.val: undefined
            f7: {"tag":"ok"}
            a: ["example",123,4.559999942779541]
            f8: undefined
            a: {"a":"test","b":42,"c":3.140000104904175,"d":{"x":1,"y":2},"f":{"tag":"ok","val":100},"g":[],"h":["one","two"],"i":["tuple",1,2.5]}
            f9: {"a":"test","b":42,"c":3.140000104904175,"d":{"x":1,"y":2},"f":{"tag":"ok","val":100},"g":[],"h":["one","two"],"i":["tuple",1,2.5]}
            a: {"tag":"specific","val":"example"}
            a.tag: specific
            a.val: example
            f10: {"tag":"specific","val":"example"}
            a: "blue"
            f11: the color is blue
            a: "green"
            f12: "green"
            a: {"read":true,"write":false,"execute":true}
            f13: {"read":true,"write":false,"execute":true}
            a: 1234567890
            f14: 1234567890
            bytes: 1,2,3,4,5
            f15: 1,2,3,4,5
            f15 is a Uint8Array with length: 5
      "#
        )
    );

    Ok(())
}

#[test]
async fn stateful1(#[tagged_as("stateful1")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let mut test_instance = TestInstance::new(compiled.wasm_path()).await?;

    let (v0, _) = test_instance
        .invoke_and_capture_output(None, "get", &[])
        .await;
    let v0 = v0?;

    let Val::S32(v0) = v0.unwrap() else {
        panic!("Expected s32")
    };

    let (r, output1) = test_instance
        .invoke_and_capture_output(None, "inc", &[Val::S32(1)])
        .await;
    let _ = r?;

    let (r, output2) = test_instance
        .invoke_and_capture_output(None, "inc", &[Val::S32(3)])
        .await;
    let _ = r?;

    let (v1, _) = test_instance
        .invoke_and_capture_output(None, "get", &[])
        .await;
    let v1 = v1?;

    let Val::S32(v1) = v1.unwrap() else {
        panic!("Expected s32")
    };

    assert_eq!(v0, 0);
    assert_eq!(output1, "inc by (1)\n");
    assert_eq!(output2, "inc by (1)\ninc by (3)\n");
    assert_eq!(v1, 4);

    Ok(())
}

#[test]
async fn streams(#[tagged_as("streams")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(compiled.wasm_path(), None, "test1", &[]).await;
    let _ = r?;

    assert_eq!(
        output,
        indoc!(
            r#"
    Enqueued 0
    Read 1 characters so far
    Most recently read chunk: 0
    Enqueued 1
    Read 2 characters so far
    Most recently read chunk: 1
    Enqueued 2
    Read 3 characters so far
    Most recently read chunk: 2
    Enqueued 3
    Read 4 characters so far
    Most recently read chunk: 3
    Enqueued 4
    Read 5 characters so far
    Most recently read chunk: 4
    Enqueued 5
    Read 6 characters so far
    Most recently read chunk: 5
    Enqueued 6
    Read 7 characters so far
    Most recently read chunk: 6
    Enqueued 7
    Read 8 characters so far
    Most recently read chunk: 7
    Enqueued 8
    Read 9 characters so far
    Most recently read chunk: 8
    Stream complete 012345678
    "#
        )
    );

    Ok(())
}

#[test]
async fn timeout_1(#[tagged_as("timeout")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(compiled.wasm_path(), None, "run", &[]).await;
    let _ = r?;

    assert_eq!(
        output,
        indoc!(
            r#"
        timeout test starts
        Message from setImmediate #1
        Message from setImmediate #2
        This is a repeated message every 250ms
        This is a repeated message every 250ms
        This is a repeated message every 250ms
        This is a delayed message after 1s, with params x, 100
        This is a repeated message every 250ms
        This is a repeated message every 250ms
        This is a repeated message every 250ms
        This is a repeated message every 250ms
        This is a delayed message after 2s
        This is a repeated message every 250ms
        This is a repeated message every 250ms
        This is a repeated message every 250ms
        This is a repeated message every 250ms
        This is a followup delayed message after 1s
        "#
        )
    );

    Ok(())
}

#[test]
#[ignore] // NOTE: this test passes with Golem but not with wasmtime. To be investigated.
async fn timeout_2(#[tagged_as("timeout")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(compiled.wasm_path(), None, "parallel", &[]).await;
    let _ = r?;

    for i in 0..1000 {
        assert!(output.contains(&format!("test {i}")));
    }

    Ok(())
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

#[test]
async fn await_pollable(#[tagged_as("pollable")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (r, _) = invoke_and_capture_output(compiled.wasm_path(), None, "test", &[]).await;
    let result = r?;

    let Some(Val::U64(n)) = result else {
        return Err(anyhow!("Expected a u64 result"));
    };
    assert!(n > 2000000000);
    Ok(())
}

#[test]
async fn fs(#[tagged_as("fs")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let mut instance = TestInstance::new(compiled.wasm_path()).await?;
    let (r, output) = instance.invoke_and_capture_output(None, "run", &[]).await;
    let _result = r?;

    let result_file = String::from_utf8(std::fs::read(
        instance.temp_dir_path().join("test").join("output.txt"),
    )?)?;

    assert_eq!(
        output,
        "Current working directory: /\nArguments: [ 'first-arg', 'second-arg' ]\nEnvironment variables:\nTEST_KEY: TEST_VALUE\nTEST_KEY_2: TEST_VALUE_2\n@@ TEST_KEY: TEST_VALUE\n@@ TEST_KEY_2: TEST_VALUE_2\n"
    );
    assert_eq!(result_file, "test file contents - Processed by test");
    Ok(())
}

#[test]
async fn fs_async(#[tagged_as("fs")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let mut instance = TestInstance::new(compiled.wasm_path()).await?;
    let (r, output) = instance
        .invoke_and_capture_output(None, "run-async", &[])
        .await;
    let _result = r?;

    let result_file = String::from_utf8(std::fs::read(
        instance.temp_dir_path().join("test").join("output.txt"),
    )?)?;

    assert_eq!(output, "test file contents\n");
    assert_eq!(result_file, "test file contents - Processed by test");
    Ok(())
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
