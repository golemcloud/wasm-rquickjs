//! Runtime spine for the generated rquickjs component.
//!
//! The component targets WASI Preview 3: `async` exports/imports are driven directly on the
//! component-model async executor. Implemented in [`p3`]. The generated code always refers to
//! `crate::internal::*`, so this module re-exports the public surface its generated code
//! expects.

pub(crate) mod error_formatting;
pub(crate) mod module_loading;
pub(crate) mod preinit;
pub(crate) mod runtime_services;
#[cfg(feature = "typescript-runtime")]
pub(crate) mod typescript;
pub use error_formatting::{
    format_caught_error, format_js_exception, try_format_js_error, try_format_tagged_error,
};
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
    // the deterministic pre-init stream.
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
    let cwd = wasip3::cli::environment::get_initial_cwd();
    if let Some(cwd) = cwd {
        let cwd = std::path::Path::new(&cwd);
        if std::env::current_dir().as_deref().ok() != Some(cwd) {
            std::env::set_current_dir(cwd)
                .expect("Failed to initialize runtime cwd from deployment host");
        }
    }
}

mod p3;
pub use p3::*;
