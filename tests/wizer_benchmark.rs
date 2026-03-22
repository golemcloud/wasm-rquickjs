/// Quick benchmark to compare component startup with and without Wizer pre-initialization.
///
/// Usage: cargo test --test wizer_benchmark -- --nocapture
use std::fs;
use std::process::Command;
use std::time::{Duration, Instant};

use camino::{Utf8Path, Utf8PathBuf};
use heck::ToSnakeCase;
use wasmtime::component::{Component, Linker, ResourceTable, Val};
use wasmtime::{Config, Engine, Store, StoreContextMut, UpdateDeadline};
use wasmtime_wasi::cli::OutputFile;
use wasmtime_wasi::{WasiCtx, WasiCtxView, WasiView};
use wasmtime_wasi_http::{WasiHttpCtx, WasiHttpView};

use wasm_rquickjs::{EmbeddingMode, JsModuleSpec, generate_wrapper_crate};

use std::sync::{Arc, Mutex};

/// Mock logging level for wasi:logging/logging
#[derive(wasmtime::component::ComponentType, wasmtime::component::Lift)]
#[component(enum)]
#[repr(u8)]
#[allow(dead_code)]
enum LogLevel {
    #[component(name = "trace")]
    Trace,
    #[component(name = "debug")]
    Debug,
    #[component(name = "info")]
    Info,
    #[component(name = "warn")]
    Warn,
    #[component(name = "error")]
    Error,
    #[component(name = "critical")]
    Critical,
}

#[derive(Clone)]
struct Host {
    table: Arc<Mutex<ResourceTable>>,
    wasi: Arc<Mutex<WasiCtx>>,
    wasi_http: Arc<WasiHttpCtx>,
    started_at: Instant,
    timeout: Duration,
}

impl WasiView for Host {
    fn ctx(&mut self) -> WasiCtxView<'_> {
        WasiCtxView {
            ctx: Arc::get_mut(&mut self.wasi).unwrap().get_mut().unwrap(),
            table: Arc::get_mut(&mut self.table).unwrap().get_mut().unwrap(),
        }
    }
}

impl WasiHttpView for Host {
    fn ctx(&mut self) -> &mut WasiHttpCtx {
        Arc::get_mut(&mut self.wasi_http).unwrap()
    }

    fn table(&mut self) -> &mut ResourceTable {
        Arc::get_mut(&mut self.table).unwrap().get_mut().unwrap()
    }
}

fn build_example(name: &str) -> Utf8PathBuf {
    let example_path = Utf8Path::new("examples/runtime").join(name);
    let wrapper_crate_root = Utf8Path::new("tmp")
        .join(format!("{name}-wizer-bench"))
        .join("normal");
    let shared_target = Utf8Path::new("..").join("..").join("rt-target");

    eprintln!("Generating wrapper crate for '{name}'...");
    generate_wrapper_crate(
        &example_path.join("wit"),
        &[JsModuleSpec {
            name: name.to_string(),
            mode: EmbeddingMode::EmbedFile(example_path.join("src").join(format!("{name}.js"))),
        }],
        &wrapper_crate_root,
        None,
    )
    .expect("Failed to generate wrapper crate");

    eprintln!("Compiling wrapper crate...");
    let status = Command::new("cargo-component")
        .arg("build")
        .arg("--target-dir")
        .arg(&shared_target)
        .current_dir(&wrapper_crate_root)
        .status()
        .expect("Failed to run cargo-component");
    assert!(status.success(), "cargo-component build failed");

    Utf8Path::new("tmp")
        .join("rt-target")
        .join("wasm32-wasip1")
        .join("debug")
        .join(format!("{}.wasm", name.to_snake_case()))
}

async fn measure_first_call(
    wasm_path: &Utf8Path,
    interface_name: Option<&str>,
    function_name: &str,
    args: &[Val],
    iterations: usize,
) -> (Duration, Duration, Duration) {
    let mut instantiate_times = Vec::new();
    let mut first_call_times = Vec::new();

    for _ in 0..iterations {
        let mut config = Config::new();
        config.wasm_component_model(true);
        let engine = Engine::new(&config).unwrap();

        let component = Component::from_file(&engine, wasm_path.as_std_path()).unwrap();

        let mut linker: Linker<Host> = Linker::new(&engine);
        wasmtime_wasi::p2::add_to_linker_with_options_async(
            &mut linker,
            &wasmtime_wasi::p2::bindings::LinkOptions::default(),
        )
        .unwrap();
        wasmtime_wasi_http::add_only_http_to_linker_async(&mut linker).unwrap();

        // Stub wasi:logging/logging
        {
            let mut logging = linker.instance("wasi:logging/logging").unwrap();
            logging
                .func_wrap(
                    "log",
                    |_ctx: StoreContextMut<'_, Host>,
                     (_level, _context, _message): (LogLevel, String, String)|
                     -> Result<(), wasmtime::Error> { Ok(()) },
                )
                .unwrap();
        }

        let stdout_file = camino_tempfile::NamedUtf8TempFile::new().unwrap();
        let stderr_file = camino_tempfile::NamedUtf8TempFile::new().unwrap();

        let ctx = WasiCtx::builder()
            .stdout(OutputFile::new(stdout_file.reopen().unwrap()))
            .stderr(OutputFile::new(stderr_file.reopen().unwrap()))
            .build();
        let host = Host {
            table: Arc::new(Mutex::new(ResourceTable::new())),
            wasi: Arc::new(Mutex::new(ctx)),
            wasi_http: Arc::new(WasiHttpCtx::new()),
            started_at: Instant::now(),
            timeout: Duration::from_secs(120),
        };

        let mut store = Store::new(&engine, host);
        store.set_epoch_deadline(0);
        store.epoch_deadline_callback(|cx| {
            let data = cx.data();
            if data.started_at.elapsed() >= data.timeout {
                Ok(UpdateDeadline::Interrupt)
            } else {
                Ok(UpdateDeadline::YieldCustom(
                    1,
                    futures::FutureExt::boxed(tokio::task::yield_now()),
                ))
            }
        });

        let t0 = Instant::now();
        let instance = linker
            .instantiate_async(&mut store, &component)
            .await
            .unwrap();
        let instantiate_time = t0.elapsed();

        // Find and call the function
        let func = if let Some(iface) = interface_name {
            let (_, exported_instance_id) = instance
                .get_export(&mut store, None, iface)
                .expect("Interface not found");
            let (_, func_id) = instance
                .get_export(&mut store, Some(&exported_instance_id), function_name)
                .expect("Function not found in interface");
            instance
                .get_func(&mut store, func_id)
                .expect("Function not found")
        } else {
            instance
                .get_func(&mut store, function_name)
                .expect("Function not found")
        };

        let mut results = (0..func.ty(&store).results().len())
            .map(|_| Val::Bool(false))
            .collect::<Vec<_>>();

        let t1 = Instant::now();
        func.call_async(&mut store, args, &mut results)
            .await
            .unwrap();
        let first_call_time = t1.elapsed();

        instantiate_times.push(instantiate_time);
        first_call_times.push(first_call_time);
    }

    let avg_instantiate = instantiate_times.iter().sum::<Duration>() / iterations as u32;
    let avg_first_call = first_call_times.iter().sum::<Duration>() / iterations as u32;
    let avg_total = avg_instantiate + avg_first_call;
    (avg_instantiate, avg_first_call, avg_total)
}

#[tokio::main]
async fn main() {
    let example_name = "example1";
    let iterations = 3;

    // Build the component
    let wasm_path = build_example(example_name);
    eprintln!("\nComponent built at: {wasm_path}");

    // Optimize with full pre-init (call library function directly)
    let optimized_path = Utf8PathBuf::from(format!(
        "tmp/{example_name}-wizer-bench/{example_name}-optimized.wasm"
    ));
    wasm_rquickjs::optimize_component(&wasm_path, &optimized_path, "wizer-initialize")
        .await
        .expect("optimize failed");

    // Report sizes
    let original_size = fs::metadata(wasm_path.as_std_path()).unwrap().len();
    let optimized_size = fs::metadata(optimized_path.as_std_path()).unwrap().len();

    eprintln!("\n=== Size Comparison ===");
    eprintln!("Original:          {:.1} KB", original_size as f64 / 1024.0);
    eprintln!(
        "Fully optimized:   {:.1} KB",
        optimized_size as f64 / 1024.0
    );

    // example1 exports freestanding functions (no interface)
    let interface: Option<&str> = None;

    // Benchmark: original
    eprintln!("\n=== Performance ({iterations} iterations) ===");

    let (inst_orig, call_orig, total_orig) = measure_first_call(
        &wasm_path,
        interface,
        "hello",
        &[Val::String("World".into())],
        iterations,
    )
    .await;
    eprintln!(
        "Original:        instantiate={:>8.2}ms  first_call={:>8.2}ms  total={:>8.2}ms",
        inst_orig.as_secs_f64() * 1000.0,
        call_orig.as_secs_f64() * 1000.0,
        total_orig.as_secs_f64() * 1000.0,
    );

    let (inst_full, call_full, total_full) = measure_first_call(
        &optimized_path,
        interface,
        "hello",
        &[Val::String("World".into())],
        iterations,
    )
    .await;
    eprintln!(
        "Fully optimized: instantiate={:>8.2}ms  first_call={:>8.2}ms  total={:>8.2}ms",
        inst_full.as_secs_f64() * 1000.0,
        call_full.as_secs_f64() * 1000.0,
        total_full.as_secs_f64() * 1000.0,
    );

    eprintln!("\n=== Speedup ===");
    if total_full.as_nanos() > 0 {
        eprintln!(
            "Fully optimized vs Original: {:.2}x faster",
            total_orig.as_secs_f64() / total_full.as_secs_f64()
        );
    }
}
