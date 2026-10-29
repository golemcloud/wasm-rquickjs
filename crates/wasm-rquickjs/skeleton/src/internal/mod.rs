//! Runtime spine for the generated rquickjs component.
//!
//! This is a single skeleton that supports two generation targets selected by a
//! Cargo feature flag:
//!
//! * `p2` (default) — the historical WASI Preview 2 path: synchronous exports
//!   driven by `wstd::block_on`, the full Node.js builtin set, resource tables and
//!   Wizer pre-initialization. Implemented in [`p2`].
//! * `p3` — the opt-in WASI Preview 3 path: `async` exports/imports driven directly
//!   on the component-model async executor, depending only on `rquickjs` and
//!   `wasip3` (no `wstd`, no `wasip2`, no P2 pollables). Implemented in [`p3`].
//!
//! Exactly one of the two features must be enabled. The generated code always
//! refers to `crate::internal::*`, so each target re-exports the public surface its
//! generated code expects.

#[cfg(all(feature = "p2", feature = "p3"))]
compile_error!(
    "features `p2` and `p3` are mutually exclusive; enable exactly one WASI generation target"
);

#[cfg(not(any(feature = "p2", feature = "p3")))]
compile_error!(
    "enable exactly one of the `p2` or `p3` features to select the WASI generation target"
);

pub(crate) mod module_loading;
pub(crate) mod preinit;
pub(crate) mod runtime_services;
#[cfg(feature = "typescript-runtime")]
pub(crate) mod typescript;
pub(crate) use module_loading::{
    mark_node_package_deprecation_warning_seen, node_package_deprecation_warning_seen,
};
pub use runtime_services::variant_case_tag;

/// Capability declaration for templates whose restore paths refresh entropy
/// and runtime-owned clock origins. Kept separate from JS export dispatch.
pub fn wizer_restore_v1() {}

fn restore_runtime_state() {
    // ThreadRng's ChaCha state and buffered bytes are part of the snapshot.
    // Fail closed before JS (including process.env Proxy callbacks) can observe
    // the deterministic pre-init stream. Both P2 and P3 restore here.
    rand::rng()
        .reseed()
        .expect("Failed to reseed runtime randomness after Wizer restoration");
    crate::builtin::perf_hooks::reset_time_origin();

    refresh_component_cwd();
}

/// Set the component's ambient cwd once, before application JS. Owned jobs keep
/// their separate ProcessServices cwd and never change this ambient state.
fn refresh_component_cwd() {
    if preinit::is_active() {
        return;
    }
    // wasi-libc also retains its process cwd in linear memory. The JS logical
    // pre-init root does not reset that native snapshot. Refresh from the
    // deployment host before updating process.cwd or resolving relative I/O.
    #[cfg(feature = "p2")]
    let cwd = wasip2::cli::environment::initial_cwd();
    #[cfg(feature = "p3")]
    let cwd = wasip3::cli::environment::get_initial_cwd();
    if let Some(cwd) = cwd {
        let cwd = std::path::Path::new(&cwd);
        if std::env::current_dir().as_deref().ok() != Some(cwd) {
            std::env::set_current_dir(cwd)
                .expect("Failed to initialize runtime cwd from deployment host");
        }
    }
}

#[cfg(feature = "p2")]
mod p2;
#[cfg(feature = "p2")]
pub use p2::*;

#[cfg(feature = "p3")]
mod p3;
#[cfg(feature = "p3")]
pub use p3::*;
