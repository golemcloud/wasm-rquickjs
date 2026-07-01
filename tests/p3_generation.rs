use camino::Utf8Path;
use camino_tempfile::Utf8TempDir;
use indoc::indoc;
use std::process::Command;
use wasm_rquickjs::{
    EmbeddingMode, GenerationTarget, JsModuleSpec, generate_wrapper_crate_with_target,
};

fn write_fixture(root: &Utf8Path, wit: &str, js: &str) -> anyhow::Result<()> {
    let wit_dir = root.join("wit");
    let src_dir = root.join("src");
    std::fs::create_dir_all(&wit_dir)?;
    std::fs::create_dir_all(&src_dir)?;
    std::fs::write(wit_dir.join("world.wit"), wit)?;
    std::fs::write(src_dir.join("module.js"), js)?;
    Ok(())
}

fn write_wit_dep(root: &Utf8Path, name: &str, wit: &str) -> anyhow::Result<()> {
    let deps_dir = root.join("wit").join("deps");
    std::fs::create_dir_all(&deps_dir)?;
    std::fs::write(deps_dir.join(name), wit)?;
    Ok(())
}

fn generate_p3(root: &Utf8Path) -> anyhow::Result<()> {
    generate_wrapper_crate_with_target(
        &root.join("wit"),
        &[JsModuleSpec {
            name: "module".to_string(),
            mode: EmbeddingMode::EmbedFile(root.join("src").join("module.js")),
        }],
        &root.join("out"),
        None,
        GenerationTarget::WasiP3,
    )
}

#[test]
fn p3_rejects_sync_wizer_initialize_export_from_input_wit() -> anyhow::Result<()> {
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:wizer;

            world wizer {
              export wizer-initialize: func();
            }
        "#},
        "",
    )?;

    assert!(
        generate_p3(temp.path()).is_err(),
        "P3 generation must reject synchronous exports even when the export is named wizer-initialize"
    );
    Ok(())
}

#[test]
fn p3_generated_crate_builds_with_wasi_system_clock_import() -> anyhow::Result<()> {
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:clock;

            world clock {
              import wasi:clocks/system-clock@0.3.0-rc-2026-03-15;
              export run: async func() -> u64;
            }
        "#},
        "export async function run() { return 1n; }\n",
    )?;
    write_wit_dep(
        temp.path(),
        "clocks.wit",
        indoc! {r#"
            package wasi:clocks@0.3.0-rc-2026-03-15;

            interface types {
              type duration = u64;
            }

            interface system-clock {
              use types.{duration};

              record instant {
                seconds: s64,
                nanoseconds: u32,
              }

              now: func() -> instant;
              get-resolution: func() -> duration;
            }
        "#},
    )?;

    generate_p3(temp.path())?;

    let output = Command::new("cargo")
        .arg("build")
        .arg("--manifest-path")
        .arg(temp.path().join("out").join("Cargo.toml"))
        .arg("--target")
        .arg("wasm32-wasip2")
        .output()?;

    assert!(
        output.status.success(),
        "P3 generated crate with a wasi:clocks/system-clock import should build; stdout:\n{}\nstderr:\n{}",
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    Ok(())
}

#[test]
fn p3_generated_crate_builds_with_async_result_export() -> anyhow::Result<()> {
    // An async export returning `result<T, E>`. Per the documented contract a result-returning
    // JS function returns the bare `ok` value or `throw`s for the `err` arm (the `{ tag, val }`
    // shape is only used for results received as inputs/data, not for result *return* values).
    // This locks in that the P3 result-export glue (`JsResult` + `call_js_export_returning_result`)
    // generates a crate that compiles. The ok/err runtime behavior is validated by the
    // `examples/p3/async-result` host-runner harness.
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:result-export;

            world result-export {
              export run: async func(flag: bool) -> result<u32, string>;
            }
        "#},
        indoc! {r#"
            export async function run(flag) {
              if (flag) {
                return 7;
              }
              throw "nope";
            }
        "#},
    )?;

    generate_p3(temp.path())?;

    let build = Command::new("cargo")
        .arg("build")
        .arg("--manifest-path")
        .arg(temp.path().join("out").join("Cargo.toml"))
        .arg("--target")
        .arg("wasm32-wasip2")
        .output()?;

    assert!(
        build.status.success(),
        "P3 generated crate with an async result export should build; stdout:\n{}\nstderr:\n{}",
        String::from_utf8_lossy(&build.stdout),
        String::from_utf8_lossy(&build.stderr)
    );
    Ok(())
}

#[test]
fn p3_rejects_methodless_exported_resource() -> anyhow::Result<()> {
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:methodless-resource;

            interface api {
              resource r;
            }

            world methodless-resource {
              export api;
              export run: async func() -> u32;
            }
        "#},
        "export async function run() { return 1; }\n",
    )?;

    assert!(
        generate_p3(temp.path()).is_err(),
        "P3 generation must reject exported resources even when the resource has no functions"
    );
    Ok(())
}

#[test]
fn p3_rejects_methodless_exported_resource_alias() -> anyhow::Result<()> {
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:methodless-resource-alias;

            interface resources {
              resource r;
            }

            interface api {
              use resources.{r};
            }

            world methodless-resource-alias {
              export api;
              export run: async func() -> u32;
            }
        "#},
        "export async function run() { return 1; }\n",
    )?;

    assert!(
        generate_p3(temp.path()).is_err(),
        "P3 generation must reject exported resources even when the exported interface re-exports the resource through a type alias"
    );
    Ok(())
}

#[test]
fn p3_rejects_methodless_world_level_resource() -> anyhow::Result<()> {
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:methodless-world-resource;

            world methodless-world-resource {
              resource r;
              export run: async func() -> u32;
            }
        "#},
        "export async function run() { return 1; }\n",
    )?;

    assert!(
        generate_p3(temp.path()).is_err(),
        "P3 generation must reject resources declared directly in the world even when the resource has no functions"
    );
    Ok(())
}

#[test]
fn p3_rejects_world_level_imported_resource() -> anyhow::Result<()> {
    // A resource declared directly in the world (rather than inside an interface) is only usable
    // through functions imported directly into the world. Those are a documented limitation
    // ("only whole interfaces" are supported for imports): they would land in the synthetic
    // global import module, which is never registered with QuickJS's module resolver/loader.
    // The Preview 3 path must reject this instead of emitting a crate that fails to compile.
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:world-resource;

            world world-resource {
              resource r;

              import make: func() -> r;
              import take: func(x: r);
              export run: async func() -> u32;
            }
        "#},
        "export async function run() { return 1; }\n",
    )?;

    assert!(
        generate_p3(temp.path()).is_err(),
        "P3 generation must reject resources imported directly into the world"
    );
    Ok(())
}

#[test]
fn p3_rejects_world_level_freestanding_import() -> anyhow::Result<()> {
    // Functions imported directly into the world (not through an interface) are a documented
    // limitation ("only whole interfaces" are supported for imports). On the Preview 3 path such
    // an import would build but trap at runtime ("Error resolving module ...") because the global
    // import module is never registered with QuickJS, so generation must reject it up front.
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:async-import-runtime;

            world async-import-runtime {
              import get-number: async func() -> u32;
              export run: async func() -> u32;
            }
        "#},
        indoc! {r#"
            import { getNumber } from 'async-import-runtime';

            export async function run() {
              return await getNumber();
            }
        "#},
    )?;

    assert!(
        generate_p3(temp.path()).is_err(),
        "P3 generation must reject functions imported directly into the world"
    );
    Ok(())
}
