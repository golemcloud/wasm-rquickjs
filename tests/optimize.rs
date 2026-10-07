use camino::Utf8Path;
use camino_tempfile::Utf8TempDir;
use wasm_rquickjs::{OptimizeOptions, optimize_component, optimize_component_with_options};

// Initialization mutates the last byte, so verifying the optimized component
// checks that snapshot extraction retained memory, not just that Wizer returned.
fn write_component(path: &Utf8Path, pages: u32) -> anyhow::Result<()> {
    let last_byte = pages * 65536 - 1;
    let wasm = wat::parse_str(format!(
        r#"(component
            (core module $m
                (memory (export "memory") {pages})
                (func (export "init")
                    i32.const {last_byte} i32.const 77 i32.store8)
                (func (export "read") (result i32)
                    i32.const {last_byte} i32.load8_u))
            (core instance $i (instantiate $m))
            (func (export "wizer-initialize") (canon lift (core func $i "init")))
            (func (export "read") (result u32) (canon lift (core func $i "read"))))"#
    ))?;
    std::fs::write(path, wasm)?;
    Ok(())
}

async fn assert_snapshot(path: &Utf8Path) -> anyhow::Result<()> {
    let mut config = wasmtime::Config::new();
    config.wasm_component_model(true);
    let engine = wasmtime::Engine::new(&config)?;
    let component = wasmtime::component::Component::from_file(&engine, path)?;
    let mut store = wasmtime::Store::new(&engine, ());
    let linker = wasmtime::component::Linker::new(&engine);
    let instance = linker.instantiate_async(&mut store, &component).await?;
    let read = instance.get_typed_func::<(), (u32,)>(&mut store, "read")?;
    assert_eq!(read.call_async(&mut store, ()).await?.0, 77);
    Ok(())
}

#[tokio::test]
async fn optimizer_default_options_preserve_existing_behavior() -> anyhow::Result<()> {
    assert_eq!(OptimizeOptions::default().hostcall_fuel, None);
    let temp = Utf8TempDir::new()?;
    let input = temp.path().join("input.wasm");
    let legacy = temp.path().join("legacy.wasm");
    let explicit = temp.path().join("explicit.wasm");
    write_component(&input, 3)?;
    optimize_component(&input, &legacy, "wizer-initialize").await?;
    optimize_component_with_options(
        &input,
        &explicit,
        "wizer-initialize",
        &OptimizeOptions::default(),
    )
    .await?;
    assert_eq!(std::fs::read(&legacy)?, std::fs::read(&explicit)?);
    assert_snapshot(&legacy).await?;
    Ok(())
}

#[cfg(feature = "use-golem-wasmtime")]
#[tokio::test]
async fn optimizer_copy_budget_controls_snapshot_extraction() -> anyhow::Result<()> {
    let temp = Utf8TempDir::new()?;
    let input = temp.path().join("input.wasm");
    let output = temp.path().join("output.wasm");
    // Initialization itself performs no hostcalls; exhaustion is in extraction.
    // Zero must fail even for a snapshot that succeeds with the engine default.
    // 129 MiB exceeds the fork's default 128 MiB copy budget.
    for (pages, fuel) in [
        (3, Some(0)),
        (129 * 16, None),
        (129 * 16, Some(128 * 1024 * 1024)),
    ] {
        write_component(&input, pages)?;
        let input = input.clone();
        let task_output = output.clone();
        let failure = tokio::spawn(async move {
            optimize_component_with_options(
                &input,
                &task_output,
                "wizer-initialize",
                &OptimizeOptions {
                    hostcall_fuel: fuel,
                },
            )
            .await
        })
        .await
        .expect_err("Wizer currently panics when snapshot extraction exhausts fuel");
        assert!(failure.is_panic());
        let panic = failure.into_panic();
        let message = panic.downcast_ref::<String>().expect("panic message");
        assert!(message.contains("fuel allocated for hostcalls has been exhausted"));
        assert!(!output.exists());
    }
    optimize_component_with_options(
        &input,
        &output,
        "wizer-initialize",
        &OptimizeOptions {
            hostcall_fuel: Some(512 * 1024 * 1024),
        },
    )
    .await?;
    assert_snapshot(&output).await?;
    Ok(())
}

#[cfg(not(feature = "use-golem-wasmtime"))]
#[tokio::test]
async fn optimizer_rejects_unsupported_copy_budget_before_io() {
    for fuel in [0, 512 * 1024 * 1024] {
        let error = optimize_component_with_options(
            Utf8Path::new("nonexistent-input.wasm"),
            Utf8Path::new("nonexistent-output.wasm"),
            "wizer-initialize",
            &OptimizeOptions {
                hostcall_fuel: Some(fuel),
            },
        )
        .await
        .unwrap_err();
        assert!(error.to_string().contains("requires use-golem-wasmtime"));
    }
}
