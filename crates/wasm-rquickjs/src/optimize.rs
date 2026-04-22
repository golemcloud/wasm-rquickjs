use anyhow::anyhow;
use camino::Utf8Path;
use wasmtime::component::types::ComponentItem;
use wasmtime::component::{Component, Linker, LinkerInstance, ResourceType};
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

impl std::fmt::Display for LogLevel {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            LogLevel::Trace => write!(f, "TRACE"),
            LogLevel::Debug => write!(f, "DEBUG"),
            LogLevel::Info => write!(f, "INFO"),
            LogLevel::Warn => write!(f, "WARN"),
            LogLevel::Error => write!(f, "ERROR"),
            LogLevel::Critical => write!(f, "CRITICAL"),
        }
    }
}

struct WizerHost {
    table: wasmtime::component::ResourceTable,
    wasi: wasmtime_wasi::WasiCtx,
    wasi_http: wasmtime_wasi_http::WasiHttpCtx,
    #[cfg(feature = "use-golem-wasmtime")]
    io_ctx: wasmtime_wasi::IoCtx,
}

impl wasmtime_wasi::WasiView for WizerHost {
    fn ctx(&mut self) -> wasmtime_wasi::WasiCtxView<'_> {
        wasmtime_wasi::WasiCtxView {
            ctx: &mut self.wasi,
            table: &mut self.table,
            #[cfg(feature = "use-golem-wasmtime")]
            io_ctx: &mut self.io_ctx,
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
///
/// Known imports (WASI, HTTP, logging) are provided with real or logging
/// implementations. Any remaining unknown imports are automatically stubbed
/// with trapping functions — if the init code calls them, pre-initialization
/// will fail with an error identifying the unexpected import call.
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

    let mut wasi_builder = wasmtime_wasi::WasiCtxBuilder::new();
    // Forward guest stdout/stderr so Wizer failures preserve the original JS/Rust
    // diagnostics instead of collapsing into a bare trap.
    wasi_builder.inherit_stdout().inherit_stderr();

    #[cfg(feature = "use-golem-wasmtime")]
    let (wasi, io_ctx) = wasi_builder.build();
    #[cfg(not(feature = "use-golem-wasmtime"))]
    let wasi = wasi_builder.build();

    let mut store = Store::new(
        &engine,
        WizerHost {
            table: wasmtime::component::ResourceTable::new(),
            wasi,
            wasi_http: wasmtime_wasi_http::WasiHttpCtx::new(),
            #[cfg(feature = "use-golem-wasmtime")]
            io_ctx,
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

                // Add real WASI and HTTP implementations
                wasmtime_wasi::p2::add_to_linker_with_options_async(
                    &mut linker,
                    &bindings::LinkOptions::default(),
                )?;
                wasmtime_wasi_http::add_only_http_to_linker_async(&mut linker)?;

                // Implement wasi:logging/logging with actual log output
                {
                    let mut logging = linker.instance("wasi:logging/logging")?;
                    logging.func_wrap(
                        "log",
                        |_ctx: StoreContextMut<'_, WizerHost>,
                         (level, context, message): (LogLevel, String, String)|
                         -> Result<(), wasmtime::Error> {
                            if context.is_empty() {
                                eprintln!("[wizer] [{level}] {message}");
                            } else {
                                eprintln!("[wizer] [{level}] [{context}] {message}");
                            }
                            Ok(())
                        },
                    )?;
                }

                // Stub any remaining unknown imports (e.g. golem:api/host,
                // user-defined WIT interfaces) with trapping functions.
                // We skip wasi: prefixed imports to preserve wasmtime's
                // semver version aliasing for WASI interfaces.
                stub_unknown_imports(&mut linker, component)?;

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

/// Prefixes for imports that are handled by real implementations
/// and should not be stubbed with traps. Only list the specific WASI
/// namespaces that wasmtime-wasi, wasmtime-wasi-http, and the logging
/// stub actually register — not all `wasi:*` (e.g. `wasi:blobstore`
/// and `wasi:keyvalue` are NOT provided and must be stubbed).
const KNOWN_IMPORT_PREFIXES: &[&str] = &[
    "wasi:io/",
    "wasi:clocks/",
    "wasi:filesystem/",
    "wasi:random/",
    "wasi:cli/",
    "wasi:sockets/",
    "wasi:http/",
    "wasi:logging/",
];

/// Collect resource types that appear in WASI imports.
///
/// Non-WASI interfaces (like `golem:agent/host`) can re-export WASI resource
/// types (e.g. `pollable`). When stubbing those interfaces we must skip
/// resources already registered by wasmtime-wasi, otherwise the linker will
/// reject the type identity mismatch.
///
/// The component type system uses the same `ResourceType` value for the same
/// underlying WIT resource definition regardless of which interface references
/// it, so we can compare them with `==`.
fn collect_wasi_resource_types(component: &Component, engine: &Engine) -> Vec<ResourceType> {
    let mut known = Vec::new();
    let component_type = component.component_type();

    for (import_name, item) in component_type.imports(engine) {
        if KNOWN_IMPORT_PREFIXES
            .iter()
            .any(|prefix| import_name.starts_with(prefix))
        {
            collect_resource_types_from_item(&item, engine, &mut known);
        }
    }

    known
}

fn collect_resource_types_from_item(
    item: &ComponentItem,
    engine: &Engine,
    known: &mut Vec<ResourceType>,
) {
    match item {
        ComponentItem::ComponentInstance(inst) => {
            for (_name, export_item) in inst.exports(engine) {
                collect_resource_types_from_item(&export_item, engine, known);
            }
        }
        ComponentItem::Resource(res_ty) if !known.contains(res_ty) => {
            known.push(*res_ty);
        }
        _ => {}
    }
}

/// Stub unknown component imports with trapping functions.
///
/// Iterates over the component's imports using the public `component_type()` API
/// and registers trap stubs for any imports not matching known prefixes.
/// This preserves wasmtime's semver version aliasing for WASI interfaces
/// while ensuring unknown imports (e.g. `golem:api/host`) don't cause
/// instantiation failures.
///
/// Resource types that were already registered by wasmtime-wasi are skipped
/// to avoid "mismatched resource types" errors when non-WASI interfaces
/// re-export WASI resources (e.g. `pollable`).
fn stub_unknown_imports(
    linker: &mut Linker<WizerHost>,
    component: &Component,
) -> wasmtime::Result<()> {
    let engine = linker.engine().clone();
    let component_type = component.component_type();

    let wasi_resources = collect_wasi_resource_types(component, &engine);

    for (import_name, item) in component_type.imports(&engine) {
        if KNOWN_IMPORT_PREFIXES
            .iter()
            .any(|prefix| import_name.starts_with(prefix))
        {
            continue;
        }

        stub_component_item(
            &mut linker.root(),
            import_name,
            &item,
            &engine,
            &wasi_resources,
        )?;
    }

    Ok(())
}

fn stub_component_item(
    linker_instance: &mut LinkerInstance<'_, WizerHost>,
    name: &str,
    item: &ComponentItem,
    engine: &Engine,
    wasi_resources: &[ResourceType],
) -> wasmtime::Result<()> {
    match item {
        ComponentItem::ComponentInstance(inst) => {
            let mut nested = linker_instance.instance(name)?;
            for (export_name, export_item) in inst.exports(engine) {
                stub_component_item(
                    &mut nested,
                    export_name,
                    &export_item,
                    engine,
                    wasi_resources,
                )?;
            }
        }
        ComponentItem::ComponentFunc(_) => {
            let fqn = name.to_string();
            linker_instance.func_new(name, move |_ctx, _ty, _args, _results| {
                Err(wasmtime::Error::msg(format!(
                    "wizer pre-initialization called unknown import `{fqn}` — \
                     this import is not available during pre-initialization"
                )))
            })?;
        }
        ComponentItem::Resource(res_ty) => {
            if wasi_resources.contains(res_ty) {
                // This resource type is already registered by wasmtime-wasi
                // (e.g. pollable). Skip it to avoid type identity mismatches.
            } else {
                let ty = ResourceType::host::<()>();
                linker_instance.resource(name, ty, |_, _| Ok(()))?;
            }
        }
        _ => {}
    }
    Ok(())
}
