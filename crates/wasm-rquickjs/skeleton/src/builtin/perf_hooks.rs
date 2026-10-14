use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

// Unlike application-created timestamps, this cache is runtime-owned and must
// not carry the optimizer's clock origin into a deployed instance.
static TIME_ORIGIN: Mutex<Option<u64>> = Mutex::new(None);

pub(crate) fn reset_time_origin() {
    *TIME_ORIGIN.lock().unwrap() = None;
    // Establish the deployment origin before any JS reads its current time.
    native_module::time_origin();
}

#[rquickjs::module]
pub mod native_module {
    #[rquickjs::function]
    pub fn time_origin() -> f64 {
        let mut origin = super::TIME_ORIGIN.lock().unwrap();
        *origin.get_or_insert_with(|| {
            super::SystemTime::now()
                .duration_since(super::UNIX_EPOCH)
                .expect("wall clock before Unix epoch")
                .as_millis() as u64
        }) as f64
    }
}

pub const PERF_HOOKS_JS: &str = include_str!("perf_hooks.js");

// Re-export for aliases
pub const REEXPORT_JS: &str =
    r#"export * from 'node:perf_hooks'; export { default } from 'node:perf_hooks';"#;
