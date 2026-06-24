//! Baseline benchmark for generated QuickJS <-> Rust glue code.
//!
//! Usage:
//!   cargo test --test glue_benchmark -- --nocapture

#![allow(dead_code)]

#[path = "common/mod.rs"]
mod common;

use std::process::Command;
use std::time::{Duration, Instant};

use camino::{Utf8Path, Utf8PathBuf};
use common::{PreparedComponent, TestInstance};
use heck::ToSnakeCase;
use wasm_rquickjs::{EmbeddingMode, JsModuleSpec, generate_wrapper_crate};
use wasmtime::component::Val;

const EXAMPLE: &str = "variant-list-roundtrip";
const INTERFACE: &str = "quickjs:variant-list-roundtrip/api";

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let wasm_path = build_release_example(EXAMPLE).await?;
    let prepared = PreparedComponent::new(&wasm_path)?;

    let small = Val::U32(42);
    let list = Val::List(large_variant_list());
    let record = Val::Record(vec![("items".to_string(), Val::List(large_variant_list()))]);
    let variant = Val::Variant(
        "direct".to_string(),
        Some(Box::new(Val::List(large_variant_list()))),
    );

    println!("generated glue benchmark");
    println!("component: {wasm_path}");
    println!();

    run_case(
        &prepared,
        "small exported call",
        "roundtrip-number",
        std::slice::from_ref(&small),
        2_000,
    )
    .await?;
    run_case(
        &prepared,
        "list<variant> 10k",
        "roundtrip-items",
        std::slice::from_ref(&list),
        25,
    )
    .await?;
    run_case(
        &prepared,
        "record { items: list<variant> 10k }",
        "roundtrip-payload",
        std::slice::from_ref(&record),
        25,
    )
    .await?;
    run_case(
        &prepared,
        "variant direct(list<variant> 10k)",
        "roundtrip-envelope",
        std::slice::from_ref(&variant),
        25,
    )
    .await?;

    Ok(())
}

async fn build_release_example(name: &str) -> anyhow::Result<Utf8PathBuf> {
    let example_path = Utf8Path::new("examples/runtime").join(name);
    let wrapper_crate_root = Utf8Path::new("tmp").join(name).join("glue-bench-release");
    let shared_target = Utf8Path::new("..").join("..").join("rt-target");

    println!("Generating wrapper crate for '{name}' to {wrapper_crate_root}");
    generate_wrapper_crate(
        &example_path.join("wit"),
        &[JsModuleSpec {
            name: name.to_string(),
            mode: EmbeddingMode::EmbedFile(example_path.join("src").join(format!("{name}.js"))),
        }],
        &wrapper_crate_root,
        None,
    )?;

    println!("Compiling release wrapper crate in {wrapper_crate_root}");
    let status = Command::new("cargo")
        .arg("build")
        .arg("--target")
        .arg("wasm32-wasip2")
        .arg("--release")
        .arg("--target-dir")
        .arg(&shared_target)
        .current_dir(&wrapper_crate_root)
        .status()?;
    anyhow::ensure!(
        status.success(),
        "cargo build failed for {wrapper_crate_root}"
    );

    let wasm_path = Utf8Path::new("tmp")
        .join("rt-target")
        .join("wasm32-wasip2")
        .join("release")
        .join(format!("{}.wasm", name.to_snake_case()));
    let optimized_path = wasm_path.with_extension("optimized.wasm");
    wasm_rquickjs::optimize_component(&wasm_path, &optimized_path, "wizer-initialize").await?;
    Ok(optimized_path)
}

async fn run_case(
    prepared: &PreparedComponent,
    label: &str,
    function_name: &str,
    args: &[Val],
    iterations: usize,
) -> anyhow::Result<()> {
    let mut instance = TestInstance::from_prepared(prepared).await?;

    for _ in 0..3 {
        instance
            .invoke(Some(INTERFACE), function_name, args)
            .await?;
    }

    let mut durations = Vec::with_capacity(iterations);
    for _ in 0..iterations {
        let start = Instant::now();
        let result = instance
            .invoke(Some(INTERFACE), function_name, args)
            .await?;
        let elapsed = start.elapsed();
        assert!(result.is_some(), "{function_name} returned no value");
        durations.push(elapsed);
    }

    durations.sort();
    let total = durations.iter().copied().sum::<Duration>();
    let mean = total / iterations as u32;
    let median = durations[iterations / 2];
    let min = durations[0];
    let max = durations[iterations - 1];

    println!(
        "{label:<38} iterations={iterations:<5} mean={:>10.2}us median={:>10.2}us min={:>10.2}us max={:>10.2}us",
        micros(mean),
        micros(median),
        micros(min),
        micros(max),
    );

    Ok(())
}

fn large_variant_list() -> Vec<Val> {
    (0..10_000)
        .map(|idx| match idx % 3 {
            0 => Val::Variant("empty".to_string(), None),
            1 => Val::Variant("number".to_string(), Some(Box::new(Val::U32(idx)))),
            _ => Val::Variant(
                "label".to_string(),
                Some(Box::new(Val::String(format!("item-{idx}")))),
            ),
        })
        .collect()
}

fn micros(duration: Duration) -> f64 {
    duration.as_secs_f64() * 1_000_000.0
}
