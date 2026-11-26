use crate::common::{CompiledTest, FeatureCombination, invoke_and_capture_output};
use camino::Utf8Path;
use camino_tempfile::Utf8TempDir;
use test_r::{test, test_dep};
use wasm_rquickjs::{EmbeddingMode, JsModuleSpec};
use wasmtime::component::Val;

#[test_dep(tagged_as = "example1", scope = Cloneable)]
async fn compiled_example1() -> CompiledTest {
    let path = Utf8Path::new("examples/runtime/example1");
    CompiledTest::new(path, true)
        .await
        .expect("Failed to compile example1")
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
async fn initializer_source_edits_preserve_fresh_state_and_embedded_optimization()
-> anyhow::Result<()> {
    let temp = Utf8TempDir::new()?;
    let path = temp.path().join("harness-initializer");
    std::fs::create_dir_all(path.join("wit"))?;
    std::fs::create_dir_all(path.join("src"))?;
    std::fs::write(
        path.join("wit/world.wit"),
        "package test:harness-initializer; world harness-initializer { export run: func() -> string; }",
    )?;
    let source = path.join("src/harness-initializer.js");
    let dependency = path.join("src/helper.js");
    let main = "import {value} from 'helper';
                globalThis.initializations = (globalThis.initializations ?? 0) + 1;
                let calls = 0;
                export function run() {
                    return value + ':' + globalThis.initializations + ':' + ++calls;
                }";
    std::fs::write(&source, "")?;
    let modified = std::fs::metadata(&source)?.modified()?;
    for value in ["A", "edited B ☃", "A"] {
        std::fs::write(&source, main)?;
        std::fs::write(&dependency, format!("export const value = '{value}';"))?;
        // Only the additional module changes. Content, not timestamps, must invalidate the snapshot.
        if !crate::common::truthy_env("WASM_RQUICKJS_TEST_UNOPTIMIZED") {
            for file in [&source, &dependency] {
                std::fs::File::open(file)?
                    .set_times(std::fs::FileTimes::new().set_modified(modified))?;
            }
        }
        let compiled = CompiledTest::new_with_features_and_additional_modules(
            &path,
            true,
            FeatureCombination::Normal,
            &[JsModuleSpec {
                name: "helper".into(),
                mode: EmbeddingMode::EmbedFile(dependency.clone()),
            }],
        )
        .await?;
        for _ in 0..2 {
            let (result, output) =
                invoke_and_capture_output(compiled.wasm_path(), None, "run", &[]).await;
            assert_eq!(result?, Some(Val::String(format!("{value}:1:1"))));
            assert!(output.is_empty(), "{output}");
        }
        if value == "edited B ☃" {
            std::fs::write(
                &source,
                main.replace(
                    "import {value} from 'helper';",
                    "const value = 'edited B ☃';",
                ),
            )?;
            let embedded = CompiledTest::new_unoptimized_with_features(
                &path,
                true,
                FeatureCombination::Normal,
            )
            .await?;
            let optimized = embedded.optimize().await?;
            let (result, _) =
                invoke_and_capture_output(optimized.wasm_path(), None, "run", &[]).await;
            assert_eq!(result?, Some(Val::String("edited B ☃:1:1".into())));
        }
    }
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
