/// Integration tests for the BinarySlot injection mode.
///
/// Usage: cargo test --test binary_inject -- --nocapture
#[allow(dead_code)]
mod common;

use camino::{Utf8Path, Utf8PathBuf};
use common::TestInstance;
use heck::ToSnakeCase;
use std::process::Command;
use wasm_rquickjs::capability_scan::{ALL_CAPABILITIES, Capability, enabled_bits};
use wasm_rquickjs::{
    EmbeddingMode, JsModuleSpec, generate_wrapper_crate, inject_js_into_component,
    patch_capability_gates_in_bytes, read_capability_gates_from_bytes,
};
use wasmtime::component::Val;

/// Generates a wrapper crate using BinarySlot mode, compiles it, injects JS,
/// and optionally optimizes with Wizer.
struct BinarySlotTestBuilder {
    example_name: String,
    #[allow(dead_code)]
    wrapper_crate_root: Utf8PathBuf,
    wasm_path: Utf8PathBuf,
}

impl BinarySlotTestBuilder {
    fn new(example_name: &str) -> anyhow::Result<Self> {
        let example_path = Utf8Path::new("examples/runtime").join(example_name);
        let wrapper_crate_root = Utf8Path::new("tmp")
            .join(format!("{example_name}-binary-inject"))
            .join("normal");
        let shared_target = Utf8Path::new("..").join("..").join("inject-target");

        eprintln!("Generating wrapper crate with BinarySlot for '{example_name}'...");
        generate_wrapper_crate(
            &example_path.join("wit"),
            &[JsModuleSpec {
                name: example_name.to_string(),
                mode: EmbeddingMode::BinarySlot,
            }],
            &wrapper_crate_root,
            None,
        )?;

        eprintln!("Compiling wrapper crate...");
        let status = Command::new("cargo")
            .arg("build")
            .arg("--target")
            .arg("wasm32-wasip2")
            .arg("--target-dir")
            .arg(&shared_target)
            .current_dir(&wrapper_crate_root)
            .status()?;
        assert!(status.success(), "cargo build failed");

        let wasm_path = Utf8Path::new("tmp")
            .join("inject-target")
            .join("wasm32-wasip2")
            .join("debug")
            .join(format!("{}.wasm", example_name.to_snake_case()));

        Ok(Self {
            example_name: example_name.to_string(),
            wrapper_crate_root,
            wasm_path,
        })
    }

    fn inject(&self, js_source: &str) -> anyhow::Result<Utf8PathBuf> {
        let injected_path = Utf8PathBuf::from(format!(
            "tmp/{}-binary-inject/{}-injected.wasm",
            self.example_name, self.example_name
        ));
        inject_js_into_component(&self.wasm_path, &injected_path, &[js_source])?;
        Ok(injected_path)
    }

    async fn inject_and_optimize(&self, js_source: &str) -> anyhow::Result<Utf8PathBuf> {
        let injected_path = self.inject(js_source)?;
        let optimized_path = Utf8PathBuf::from(format!(
            "tmp/{}-binary-inject/{}-optimized.wasm",
            self.example_name, self.example_name
        ));
        wasm_rquickjs::optimize_component(&injected_path, &optimized_path, "wizer-initialize")
            .await?;
        Ok(optimized_path)
    }
}

#[tokio::main]
async fn main() {
    // Test 1: inject JS and run without Wizer
    test_inject_and_run().await;

    // Test 2: inject JS, optimize with Wizer, then run
    test_inject_optimize_and_run().await;

    // Test 3: re-inject different JS into the same template
    test_reinject_different_js().await;

    // Test 4: patch the capability-gates slot, then inject + run
    test_patch_capability_gates_and_run().await;

    eprintln!("\n=== All binary_inject tests passed ===");
}

async fn test_inject_and_run() {
    eprintln!("\n--- test_inject_and_run ---");

    let builder = BinarySlotTestBuilder::new("example1").expect("Failed to build template");

    let js_source = r#"
function helloImpl(name) {
    return `Hello from injected JS, ${name}!`;
}

async function asyncHelloImpl(name) {
    return `Async hello from injected JS, ${name}!`;
}

export const something = 42;
export const hello = helloImpl;
export const asyncHello = asyncHelloImpl;
"#;

    let injected_path = builder.inject(js_source).expect("Failed to inject JS");

    let mut test_instance = TestInstance::new(&injected_path)
        .await
        .expect("Failed to create test instance");

    let (result, _stdout) = test_instance
        .invoke_and_capture_output(None, "hello", &[Val::String("World".into())])
        .await;

    let result = result.expect("Function call failed");
    match result {
        Some(Val::String(s)) => {
            assert!(
                s.contains("injected JS"),
                "Expected injected JS output, got: {s}"
            );
            eprintln!("  ✓ hello returned: {s}");
        }
        other => panic!("Unexpected result: {other:?}"),
    }
}

async fn test_inject_optimize_and_run() {
    eprintln!("\n--- test_inject_optimize_and_run ---");

    let builder = BinarySlotTestBuilder::new("example1").expect("Failed to build template");

    let js_source = r#"
function helloImpl(name) {
    return `Hello from optimized injected JS, ${name}!`;
}

async function asyncHelloImpl(name) {
    return `Async hello from optimized injected JS, ${name}!`;
}

export const something = 99;
export const hello = helloImpl;
export const asyncHello = asyncHelloImpl;
"#;

    let optimized_path = builder
        .inject_and_optimize(js_source)
        .await
        .expect("Failed to inject + optimize");

    let mut test_instance = TestInstance::new(&optimized_path)
        .await
        .expect("Failed to create test instance");

    let (result, _stdout) = test_instance
        .invoke_and_capture_output(None, "hello", &[Val::String("World".into())])
        .await;

    let result = result.expect("Function call failed");
    match result {
        Some(Val::String(s)) => {
            assert!(
                s.contains("optimized injected JS"),
                "Expected optimized injected output, got: {s}"
            );
            eprintln!("  ✓ hello returned: {s}");
        }
        other => panic!("Unexpected result: {other:?}"),
    }
}

async fn test_reinject_different_js() {
    eprintln!("\n--- test_reinject_different_js ---");

    let builder = BinarySlotTestBuilder::new("example1").expect("Failed to build template");

    // First injection
    let js1 = r#"
export const something = 1;
export function hello(name) { return `First: ${name}`; }
export async function asyncHello(name) { return `First async: ${name}`; }
"#;

    let path1 = builder.inject(js1).expect("First injection failed");

    // Second injection from the same template
    let injected_path2 = Utf8PathBuf::from(format!(
        "tmp/{}-binary-inject/{}-injected2.wasm",
        builder.example_name, builder.example_name
    ));
    let js2 = r#"
export const something = 2;
export function hello(name) { return `Second: ${name}`; }
export async function asyncHello(name) { return `Second async: ${name}`; }
"#;
    inject_js_into_component(&builder.wasm_path, &injected_path2, &[js2])
        .expect("Second injection failed");

    // Run first
    let mut inst1 = TestInstance::new(&path1)
        .await
        .expect("Failed to create instance 1");
    let (r1, _) = inst1
        .invoke_and_capture_output(None, "hello", &[Val::String("X".into())])
        .await;
    match r1.expect("Call 1 failed") {
        Some(Val::String(s)) => {
            assert!(s.contains("First"), "Expected 'First' in: {s}");
            eprintln!("  ✓ injection 1: {s}");
        }
        other => panic!("Unexpected: {other:?}"),
    }

    // Run second
    let mut inst2 = TestInstance::new(&injected_path2)
        .await
        .expect("Failed to create instance 2");
    let (r2, _) = inst2
        .invoke_and_capture_output(None, "hello", &[Val::String("X".into())])
        .await;
    match r2.expect("Call 2 failed") {
        Some(Val::String(s)) => {
            assert!(s.contains("Second"), "Expected 'Second' in: {s}");
            eprintln!("  ✓ injection 2: {s}");
        }
        other => panic!("Unexpected: {other:?}"),
    }
}

/// End-to-end smoke test for the per-capability gates slot:
///
/// 1. Build a BinarySlot template — its embedded gates default to all-ones.
/// 2. Read the gates and assert the default is "all enabled".
/// 3. Patch the slot to disable a few capabilities the example does not use
///    (Sqlite, Vm, Tls, Dns, Http2). The remaining capabilities stay on so
///    that `example1` still has everything it needs to run.
/// 4. Read back the gates from the patched bytes to confirm round-trip.
/// 5. Inject the JS into the patched wasm and call an exported function to
///    confirm the patched component still instantiates and runs.
async fn test_patch_capability_gates_and_run() {
    eprintln!("\n--- test_patch_capability_gates_and_run ---");

    let builder = BinarySlotTestBuilder::new("example1").expect("Failed to build template");

    // Step 1 + 2: read the default gates from the freshly-built template.
    let template_bytes =
        std::fs::read(builder.wasm_path.as_std_path()).expect("Failed to read template wasm");
    let initial = read_capability_gates_from_bytes(&template_bytes)
        .expect("Failed to read default capability gates from template");
    assert_eq!(
        initial,
        u64::MAX,
        "freshly-built template should have all-enabled gates",
    );
    eprintln!(
        "  ✓ default gates = {:#018x} (all {} capabilities enabled)",
        initial,
        initial.count_ones()
    );

    // Step 3: choose a subset to disable. example1 just runs basic JS that
    // returns a string and does no networking, sqlite, vm-eval, etc.
    //
    // NOTE: `node:module` statically imports nearly every other builtin so it
    // can route `require('node:X')` calls. That means flipping off any of the
    // builtins it imports while keeping `Module` enabled would crash at JS
    // wiring time (the static imports in module.js would fail to resolve).
    // Disabling `Module` alongside the other leaves keeps the wiring valid;
    // example1 never calls `require()`, so dropping the global is safe.
    let to_disable = [
        Capability::Module,
        Capability::Sqlite,
        Capability::Vm,
        Capability::Tls,
        Capability::Http2,
    ];
    let kept: Vec<Capability> = ALL_CAPABILITIES
        .iter()
        .copied()
        .filter(|c| !to_disable.contains(c))
        .collect();
    let new_bits = enabled_bits(kept.iter().copied());

    let patched_bytes = patch_capability_gates_in_bytes(&template_bytes, new_bits)
        .expect("patch_capability_gates_in_bytes failed");

    // Step 4: read back and verify each disabled bit is cleared.
    let read_back =
        read_capability_gates_from_bytes(&patched_bytes).expect("Failed to read patched gates");
    assert_eq!(read_back, new_bits, "patched gates must round-trip");
    for cap in to_disable {
        assert_eq!(
            read_back & (1u64 << cap.bit_index()),
            0,
            "bit for {} should be cleared",
            cap.marker_name(),
        );
    }
    eprintln!(
        "  ✓ patched gates = {:#018x} (disabled {} capabilities)",
        read_back,
        to_disable.len()
    );

    // Persist the patched template so we can drive the standard JS injection
    // path against it.
    let patched_template_path = Utf8PathBuf::from(format!(
        "tmp/{}-binary-inject/{}-gates-patched.wasm",
        builder.example_name, builder.example_name
    ));
    std::fs::write(patched_template_path.as_std_path(), &patched_bytes)
        .expect("Failed to write patched template");

    // Step 5: inject JS into the patched template and run it.
    let injected_path = Utf8PathBuf::from(format!(
        "tmp/{}-binary-inject/{}-gates-patched-injected.wasm",
        builder.example_name, builder.example_name
    ));
    let js_source = r#"
export const something = 7;
export function hello(name) { return `gates-patched: ${name}`; }
export async function asyncHello(name) { return `gates-patched async: ${name}`; }
"#;
    inject_js_into_component(&patched_template_path, &injected_path, &[js_source])
        .expect("inject_js_into_component failed against patched template");

    let mut instance = TestInstance::new(&injected_path)
        .await
        .expect("Failed to create instance from patched+injected wasm");

    let (result, _stdout) = instance
        .invoke_and_capture_output(None, "hello", &[Val::String("World".into())])
        .await;

    match result.expect("Function call failed") {
        Some(Val::String(s)) => {
            assert!(
                s.contains("gates-patched"),
                "Expected 'gates-patched' in output, got: {s}",
            );
            eprintln!("  ✓ patched+injected run returned: {s}");
        }
        other => panic!("Unexpected: {other:?}"),
    }
}
