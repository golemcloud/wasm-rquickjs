use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Clone, Copy)]
struct ClockOrigin {
    wall_time_ms: u64,
    monotonic_time_ns: u64,
}

// Unlike application-created timestamps, this cache is runtime-owned and must
// not carry the optimizer's clock origin into a deployed instance.
static CLOCK_ORIGIN: Mutex<Option<ClockOrigin>> = Mutex::new(None);

fn monotonic_time_ns() -> u64 {
    #[cfg(feature = "p2")]
    let now = wasip2::clocks::monotonic_clock::now();

    #[cfg(feature = "p3")]
    let now = wasip3::clocks::monotonic_clock::now();

    now
}

fn clock_origin() -> ClockOrigin {
    let mut origin = CLOCK_ORIGIN.lock().unwrap();
    *origin.get_or_insert_with(|| ClockOrigin {
        wall_time_ms: SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("wall clock before Unix epoch")
            .as_millis() as u64,
        monotonic_time_ns: monotonic_time_ns(),
    })
}

pub(crate) fn reset_time_origin() {
    *CLOCK_ORIGIN.lock().unwrap() = None;
    // Establish the paired deployment origins before any JS reads either clock.
    clock_origin();
}

#[rquickjs::module]
pub mod native_module {
    #[rquickjs::function]
    pub fn time_origin() -> f64 {
        super::clock_origin().wall_time_ms as f64
    }

    #[rquickjs::function]
    pub fn monotonic_now() -> f64 {
        let origin = super::clock_origin().monotonic_time_ns;
        super::monotonic_time_ns().saturating_sub(origin) as f64 / 1_000_000.0
    }
}

pub const PERF_HOOKS_JS: &str = include_str!("perf_hooks.js");

pub const WIRE_JS: &str = r#"
        import { performance } from 'node:perf_hooks';
        globalThis.performance = performance;
    "#;

// Re-export for aliases
pub const REEXPORT_JS: &str =
    r#"export * from 'node:perf_hooks'; export { default } from 'node:perf_hooks';"#;
