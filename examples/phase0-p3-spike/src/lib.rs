#![allow(static_mut_refs)]
use crate::wasm_rquickjs::phase0::host;
use rquickjs::function::{Async, Func};
use rquickjs::{AsyncContext, AsyncRuntime, Promise, async_with};
use wasip3::clocks::monotonic_clock;

wit_bindgen::generate!({
    world: "p3-spike",
    path: "wit",
    with: {
        "wasi:clocks/monotonic-clock@0.3.0-rc-2026-03-15": wasip3::clocks::monotonic_clock,
        "wasi:clocks/types@0.3.0-rc-2026-03-15": wasip3::clocks::types,
    },
});

struct Component;

export!(Component);

impl Guest for Component {
    async fn run() -> String {
        report(run_js().await)
    }

    async fn event_loop() -> String {
        report(run_event_loop_js().await)
    }

    async fn host_delay_check() -> String {
        report(run_host_delay_js().await)
    }

    async fn concurrency_probe() -> String {
        // First deliberately try two overlapping JS entries against one shared runtime.
        // If that fails/panics in a future host, Phase 1 must serialize exported entries.
        // The validated path here uses the same single shared runtime but guards entry.
        let a = run_global_serialized_js(30).await;
        let b = run_global_serialized_js(30).await;
        match (a, b) {
            (Ok(a), Ok(b)) => format!("concurrency:serialized:{a},{b}"),
            (Err(err), _) | (_, Err(err)) => format!("error: {err}"),
        }
    }

    async fn warmup() -> String {
        match global_runtime().await {
            Ok(_) => "ok".to_string(),
            Err(err) => format!("error: {err}"),
        }
    }

    async fn probe_task(id: u32, ms: u32) -> String {
        report(run_probe_task_js(id, ms).await)
    }
}

fn report(result: rquickjs::Result<String>) -> String {
    match result {
        Ok(value) => value,
        Err(err) => format!("error: {err}"),
    }
}

async fn sleep(delay_ms: u32) -> rquickjs::Result<u32> {
    monotonic_clock::wait_for(delay_ms as u64 * 1_000_000).await;
    Ok(delay_ms)
}

async fn host_delay(ms: u32) -> rquickjs::Result<u32> {
    Ok(host::host_delay(ms).await)
}

async fn p3_drain_sentinel() {
    monotonic_clock::wait_for(1_000_000).await;
}

async fn install_globals(ctx: &AsyncContext) -> rquickjs::Result<()> {
    async_with!(ctx => |ctx| {
        ctx.globals().set("sleep", Func::from(Async(sleep)))?;
        ctx.globals().set("hostDelay", Func::from(Async(host_delay)))?;
        Ok(())
    })
    .await
}

async fn new_runtime() -> rquickjs::Result<(AsyncRuntime, AsyncContext)> {
    let rt = AsyncRuntime::new()?;
    let ctx = AsyncContext::full(&rt).await?;
    install_globals(&ctx).await?;
    Ok((rt, ctx))
}

async fn run_js() -> rquickjs::Result<String> {
    let (_rt, ctx) = new_runtime().await?;

    async_with!(ctx => |ctx| {
        let promise: Promise = ctx.eval(
            r#"
            (async () => {
                const delay = await sleep(10);
                return `slept ${delay}`;
            })()
        "#,
        )?;
        promise.into_future::<String>().await
    })
    .await
}

async fn run_event_loop_js() -> rquickjs::Result<String> {
    let (rt, ctx) = new_runtime().await?;

    let promise = async_with!(ctx => |ctx| {
        let task_ctx = ctx.clone();
        ctx.spawn(async move {
            monotonic_clock::wait_for(3_000_000).await;
            if let Ok(log) = task_ctx.globals().get::<_, rquickjs::Array>("log") {
                let _ = log.set(log.len(), "background");
            }
        });
        let promise: Promise = ctx.eval(
            r#"
            globalThis.log = [];
            (async () => {
                const setTimeout = (cb, ms) => sleep(ms).then(() => cb());
                const timers = [
                    new Promise(resolve => setTimeout(() => { log.push(30); resolve(30); }, 30)),
                    new Promise(resolve => setTimeout(() => { log.push(5); resolve(5); }, 5)),
                    new Promise(resolve => setTimeout(() => { log.push(15); resolve(15); }, 15)),
                ];
                const results = await Promise.all(timers);
                if (results.join(',') !== '30,5,15') throw new Error(`bad Promise.all ${results}`);
                return 'event-loop:' + log.join(',');
            })()
        "#,
        )?;
        promise.into_future::<String>().await
    })
    .await?;

    p3_drain_sentinel().await;
    rt.idle().await;
    Ok(promise)
}

async fn run_host_delay_js() -> rquickjs::Result<String> {
    let (_rt, ctx) = new_runtime().await?;

    async_with!(ctx => |ctx| {
        let promise: Promise = ctx.eval(
            r#"
            (async () => {
                const value = await hostDelay(12);
                return `host-delay:${value}`;
            })()
        "#,
        )?;
        promise.into_future::<String>().await
    })
    .await
}

static mut GLOBAL: Option<(AsyncRuntime, AsyncContext)> = None;
static mut GLOBAL_BUSY: bool = false;

async fn global_runtime() -> rquickjs::Result<&'static (AsyncRuntime, AsyncContext)> {
    unsafe {
        if GLOBAL.is_none() {
            GLOBAL = Some(new_runtime().await?);
        }
        Ok(GLOBAL.as_ref().unwrap())
    }
}

struct BusyGuard;

impl Drop for BusyGuard {
    fn drop(&mut self) {
        unsafe {
            GLOBAL_BUSY = false;
        }
    }
}

async fn enter_global() -> BusyGuard {
    loop {
        let acquired = unsafe {
            if GLOBAL_BUSY {
                false
            } else {
                GLOBAL_BUSY = true;
                true
            }
        };
        if acquired {
            return BusyGuard;
        }
        monotonic_clock::wait_for(1_000_000).await;
    }
}

/// Unguarded entry into the single shared runtime. The harness drives two of
/// these concurrently to observe whether rquickjs interleaves or serializes
/// concurrent JS tasks against one shared `AsyncContext`. Each task records its
/// enter/exit into a shared `globalThis.order` array and returns the array's
/// current contents, so the ordering itself reveals interleave vs. serialize.
async fn run_probe_task_js(id: u32, ms: u32) -> rquickjs::Result<String> {
    let (_rt, ctx) = global_runtime().await?;
    async_with!(ctx => |ctx| {
        ctx.globals().set("probeId", id)?;
        ctx.globals().set("probeMs", ms)?;
        let promise: Promise = ctx.eval(
            r#"
            (async () => {
                globalThis.order = globalThis.order || [];
                const id = globalThis.probeId;
                const ms = globalThis.probeMs;
                order.push('enter' + id);
                await sleep(ms);
                order.push('exit' + id);
                return order.join(',');
            })()
        "#,
        )?;
        promise.into_future::<String>().await
    })
    .await
}

async fn run_global_serialized_js(ms: u32) -> rquickjs::Result<String> {
    let _guard = enter_global().await;
    let (_rt, ctx) = global_runtime().await?;
    async_with!(ctx => |ctx| {
        ctx.globals().set("delayMs", ms)?;
        let promise: Promise = ctx.eval(
            r#"
            (async () => {
                const delay = await sleep(globalThis.delayMs);
                return String(delay);
            })()
        "#,
        )?;
        promise.into_future::<String>().await
    })
    .await
}
