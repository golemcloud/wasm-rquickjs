use crate::common::{CompiledTest, invoke_and_capture_output};
use anyhow::anyhow;
use camino::Utf8Path;
use indoc::indoc;
use test_r::{inherit_test_dep, test, test_dep};
use wasmtime::component::Val;

#[test_dep(tagged_as = "imports1")]
async fn compiled_imports1() -> CompiledTest {
    let path = Utf8Path::new("examples/runtime/imports1");
    CompiledTest::new(path, true)
        .await
        .expect("Failed to compile imports1")
}

#[test_dep(tagged_as = "imports2")]
async fn compiled_imports2() -> CompiledTest {
    let path = Utf8Path::new("examples/runtime/imports2");
    CompiledTest::new(path, true)
        .await
        .expect("Failed to compile imports2")
}

#[test_dep(tagged_as = "imports3")]
async fn compiled_imports3() -> CompiledTest {
    let path = Utf8Path::new("examples/runtime/imports3");
    CompiledTest::new(path, true)
        .await
        .expect("Failed to compile imports3")
}

inherit_test_dep!(
    #[tagged_as("example3")]
    CompiledTest
);

#[test_dep(tagged_as = "types_in_exports")]
async fn compiled_types_in_exports() -> CompiledTest {
    let path = Utf8Path::new("examples/runtime/types-in-exports");
    CompiledTest::new(path, true)
        .await
        .expect("Failed to compile types-in-exports")
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
          [Function: HelloWithStaticCreate] {
            create: [Function (anonymous)],
            compare: [Function (anonymous)],
            merge: [Function (anonymous)]
          }
          [Function (anonymous)]
          [Function (anonymous)]
          [Function (anonymous)]
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
