use anyhow::anyhow;
use camino::Utf8Path;
use wasmtime::component::{Component, Linker};
use wasmtime::{Config, Engine, Store, StoreContextMut};
use wasmtime_wasi::p2::bindings;
use wasmtime_wizer::Wizer;

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

struct WizerHost {
    table: wasmtime::component::ResourceTable,
    wasi: wasmtime_wasi::WasiCtx,
    wasi_http: wasmtime_wasi_http::WasiHttpCtx,
}

impl wasmtime_wasi::WasiView for WizerHost {
    fn ctx(&mut self) -> wasmtime_wasi::WasiCtxView<'_> {
        wasmtime_wasi::WasiCtxView {
            ctx: &mut self.wasi,
            table: &mut self.table,
        }
    }
}

impl wasmtime_wasi_http::WasiHttpView for WizerHost {
    fn ctx(&mut self) -> &mut wasmtime_wasi_http::WasiHttpCtx {
        &mut self.wasi_http
    }

    fn table(&mut self) -> &mut wasmtime::component::ResourceTable {
        &mut self.table
    }
}

/// Pre-initialize a WebAssembly component using Wizer.
///
/// Reads the component from `input`, runs the specified `init_func` to capture
/// the initialized state, and writes the pre-initialized component to `output`.
pub async fn optimize_component(
    input: &Utf8Path,
    output: &Utf8Path,
    init_func: &str,
) -> anyhow::Result<()> {
    eprintln!("Reading component from {input}...");
    let wasm_bytes = std::fs::read(input.as_std_path())
        .map_err(|e| anyhow!("Failed to read input component: {e}"))?;

    let mut config = Config::new();
    config.wasm_component_model(true);
    let engine = Engine::new(&config)?;

    let wasi = wasmtime_wasi::WasiCtxBuilder::new().build();

    let mut store = Store::new(
        &engine,
        WizerHost {
            table: wasmtime::component::ResourceTable::new(),
            wasi,
            wasi_http: wasmtime_wasi_http::WasiHttpCtx::new(),
        },
    );

    let init_func_name = init_func.to_string();

    eprintln!("Pre-initializing component (init_func={init_func_name})...");

    let mut wizer = Wizer::new();
    wizer.init_func(&init_func_name);
    // Must keep init func in output to avoid a wasmtime-wizer bug where
    // removing the export corrupts CoreInstance section references.
    wizer.keep_init_func(true);

    let optimized: Vec<u8> = wizer
        .run_component(
            &mut store,
            &wasm_bytes,
            async |store: &mut Store<WizerHost>, component: &Component| {
                let mut linker: Linker<WizerHost> = Linker::new(store.engine());
                wasmtime_wasi::p2::add_to_linker_with_options_async(
                    &mut linker,
                    &bindings::LinkOptions::default(),
                )?;
                wasmtime_wasi_http::add_only_http_to_linker_async(&mut linker)?;

                // Stub wasi:logging/logging (required by the logging feature)
                {
                    let mut logging = linker.instance("wasi:logging/logging")?;
                    logging.func_wrap(
                        "log",
                        |_ctx: StoreContextMut<'_, WizerHost>,
                         (_level, _context, _message): (LogLevel, String, String)|
                         -> Result<(), wasmtime::Error> { Ok(()) },
                    )?;
                }

                linker.instantiate_async(store, component).await
            },
        )
        .await?;

    eprintln!("Writing pre-initialized component to {output}...");
    std::fs::write(output.as_std_path(), &optimized)
        .map_err(|e| anyhow!("Failed to write output component: {e}"))?;

    let input_size = wasm_bytes.len();
    let output_size = optimized.len();
    eprintln!(
        "Done! Input: {:.1} KB, Output: {:.1} KB",
        input_size as f64 / 1024.0,
        output_size as f64 / 1024.0,
    );

    Ok(())
}
