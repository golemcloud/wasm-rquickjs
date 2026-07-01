use anyhow::{Result, anyhow};
use wasmtime::component::{Component, HasSelf, Linker, bindgen};
use wasmtime::{Config, Engine, Store};
use wasmtime_wasi::{ResourceTable, WasiCtxBuilder, WasiCtxView};

bindgen!({
    world: "p3-spike",
    path: "../phase0-p3-spike/wit",
});

struct Host {
    wasi: wasmtime_wasi::WasiCtx,
    table: ResourceTable,
}

impl wasmtime_wasi::WasiView for Host {
    fn ctx(&mut self) -> WasiCtxView<'_> {
        WasiCtxView {
            ctx: &mut self.wasi,
            table: &mut self.table,
        }
    }
}

impl wasm_rquickjs::phase0::host::Host for Host {}

impl wasm_rquickjs::phase0::host::HostWithStore for HasSelf<Host> {
    async fn host_delay<T: Send>(
        _accessor: &wasmtime::component::Accessor<T, Self>,
        ms: u32,
    ) -> u32 {
        tokio::time::sleep(std::time::Duration::from_millis(ms as u64)).await;
        ms + 1000
    }
}

fn component_path() -> Result<String> {
    if let Ok(path) = std::env::var("PHASE0_P3_COMPONENT") {
        return Ok(path);
    }
    let manifest = "examples/phase0-p3-spike/Cargo.toml";
    let status = std::process::Command::new("cargo")
        .args([
            "build",
            "--manifest-path",
            manifest,
            "--target",
            "wasm32-wasip2",
        ])
        .status()?;
    if !status.success() {
        return Err(anyhow!("component build failed with {status}"));
    }
    let output = std::process::Command::new("cargo")
        .args([
            "metadata",
            "--no-deps",
            "--format-version",
            "1",
            "--manifest-path",
            manifest,
        ])
        .output()?;
    if !output.status.success() {
        return Err(anyhow!("cargo metadata failed"));
    }
    let json: serde_json::Value = serde_json::from_slice(&output.stdout)?;
    let target_dir = json["target_directory"]
        .as_str()
        .ok_or_else(|| anyhow!("missing target_directory"))?;
    Ok(format!(
        "{target_dir}/wasm32-wasip2/debug/phase0_p3_spike.wasm"
    ))
}

async fn instantiate() -> Result<(Store<Host>, P3Spike)> {
    let mut config = Config::new();
    config.wasm_component_model(true);
    config.wasm_component_model_async(true);
    config.consume_fuel(false);

    let engine = Engine::new(&config)?;
    let component = Component::from_file(&engine, component_path()?)
        .map_err(|e| anyhow!("load component: {e:#}"))?;
    let mut linker = Linker::<Host>::new(&engine);
    wasmtime_wasi::p2::add_to_linker_async(&mut linker)?;
    wasmtime_wasi::p3::add_to_linker(&mut linker)?;
    wasm_rquickjs::phase0::host::add_to_linker::<Host, HasSelf<Host>>(&mut linker, |h| h)?;

    let wasi = WasiCtxBuilder::new().inherit_stdio().build();
    let mut store = Store::new(
        &engine,
        Host {
            wasi,
            table: ResourceTable::new(),
        },
    );
    let bindings = P3Spike::instantiate_async(&mut store, &component, &linker).await?;
    Ok((store, bindings))
}

async fn call_run(label: &str) -> Result<String> {
    let (mut store, bindings) = instantiate().await?;
    let result = store
        .run_concurrent(async move |accessor| bindings.call_run(accessor).await)
        .await??;
    println!("{label}: {result}");
    Ok(result)
}

async fn call_named(label: &str, name: &str) -> Result<String> {
    let (mut store, bindings) = instantiate().await?;
    let result = match name {
        "event-loop" => {
            store
                .run_concurrent(async move |accessor| bindings.call_event_loop(accessor).await)
                .await??
        }
        "host-delay-check" => {
            store
                .run_concurrent(async move |accessor| {
                    bindings.call_host_delay_check(accessor).await
                })
                .await??
        }
        "concurrency-probe" => {
            store
                .run_concurrent(async move |accessor| {
                    bindings.call_concurrency_probe(accessor).await
                })
                .await??
        }
        other => return Err(anyhow!("unknown export {other}")),
    };
    println!("{label}: {result}");
    Ok(result)
}

/// Force two genuinely overlapping export invocations on ONE instance sharing a
/// single rquickjs runtime. `warmup` initializes the shared runtime once, then
/// two `probe-task` calls (each sleeps `ms`) are driven concurrently with
/// `tokio::join!`. Wall-clock total ~= ms  => interleaved; ~= 2*ms => serialized.
async fn call_overlap(ms: u32) -> Result<(String, String, u128)> {
    let (mut store, bindings) = instantiate().await?;
    let (a, b, total) = store
        .run_concurrent(async move |accessor| -> Result<(String, String, u128)> {
            bindings.call_warmup(accessor).await?;
            let start = std::time::Instant::now();
            let (ra, rb) = tokio::join!(
                bindings.call_probe_task(accessor, 1, ms),
                bindings.call_probe_task(accessor, 2, ms),
            );
            Ok((ra?, rb?, start.elapsed().as_millis()))
        })
        .await??;
    println!("overlap task1 returned: {a}");
    println!("overlap task2 returned: {b}");
    println!("overlap total_ms: {total} (sleep per task = {ms}ms)");
    let last = if a.len() >= b.len() { &a } else { &b };
    let verdict = if last.starts_with("enter1,enter2") || last.starts_with("enter2,enter1") {
        "INTERLEAVED (concurrent tasks share the context)"
    } else {
        "SERIALIZED (rquickjs serializes context access)"
    };
    println!("overlap verdict: {verdict}");
    Ok((a, b, total))
}

#[tokio::main]
async fn main() -> Result<()> {
    let mode = std::env::args().nth(1).unwrap_or_else(|| "all".to_string());
    match mode.as_str() {
        "run" => {
            assert_eq!(call_run("run").await?, "slept 10");
        }
        "event-loop" => {
            assert_eq!(
                call_named("event-loop", "event-loop").await?,
                "event-loop:background,5,15,30"
            );
        }
        "host-delay" => {
            assert_eq!(
                call_named("host-delay", "host-delay-check").await?,
                "host-delay:1012"
            );
        }
        "with-remap" => {
            assert_eq!(call_run("with-remap/run").await?, "slept 10");
        }
        "concurrency" => {
            assert_eq!(
                call_named("concurrency", "concurrency-probe").await?,
                "concurrency:serialized:30,30"
            );
        }
        "overlap" => {
            call_overlap(200).await?;
        }
        "all" => {
            assert_eq!(call_run("run").await?, "slept 10");
            assert_eq!(
                call_named("event-loop", "event-loop").await?,
                "event-loop:background,5,15,30"
            );
            assert_eq!(
                call_named("host-delay", "host-delay-check").await?,
                "host-delay:1012"
            );
            assert_eq!(
                call_named("concurrency", "concurrency-probe").await?,
                "concurrency:serialized:30,30"
            );
            call_overlap(200).await?;
        }
        other => return Err(anyhow!("unknown mode {other}")),
    }
    Ok(())
}
