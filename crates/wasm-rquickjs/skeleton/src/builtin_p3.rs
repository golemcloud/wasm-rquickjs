//! Minimal builtin-module registry for the WASI Preview 3 (`p3`) generation path.
//!
//! The Preview 2 path ships the full Node.js-compatible builtin set in
//! [`crate::builtin`](../builtin/index.html) (the `builtin/` directory). That tree
//! is large and currently coupled to `wstd` / `wasip2` / `golem-wasi-http`, so it is
//! intentionally **not** compiled in the `p3` path: the generated `src/lib.rs` binds
//! `mod builtin` to *this* file instead of `builtin/mod.rs` when targeting Preview 3.
//!
//! Phase 1 of the Preview 3 path therefore registers **zero** Node.js builtins,
//! matching the Phase 0 spike. This module only exists so that `internal/p3.rs` can
//! call the same `add_module_resolvers` / `module_loader` entry points the Preview 2
//! `builtin` module exposes.
//!
//! ## Promoting a builtin to the Preview 3 path
//!
//! Later phases can enable individual builtins here *without moving any files* by
//! declaring them with a `#[path]` attribute pointing back into `builtin/`, e.g.:
//!
//! ```ignore
//! #[path = "builtin/buffer.rs"]
//! mod buffer;
//! ```
//!
//! and then adding that module's resolver/loader entries to the two functions
//! below. Only modules that are free of P2-only dependencies (or that are made
//! `cfg`-portable) should be promoted this way.

/// Registers builtin native module names with the resolver.
///
/// No builtins are shipped in the Preview 3 Phase 1 path, so the resolver is
/// returned unchanged.
pub fn add_module_resolvers(
    resolver: rquickjs::loader::BuiltinResolver,
) -> rquickjs::loader::BuiltinResolver {
    resolver
}

/// Returns the loader for builtin native modules. Empty in the Preview 3 Phase 1
/// path.
pub fn module_loader() -> rquickjs::loader::ModuleLoader {
    rquickjs::loader::ModuleLoader::default()
}
