//! Per-capability runtime gates.
//!
//! The skeleton ships with all builtins compiled in. Each builtin's registration
//! and global wiring is gated by a tiny exported helper function. By default each
//! helper reads a bit in [`CAPABILITY_GATES_SLOT`], so every capability is wired
//! up and behaves as if no trimming were taking place.
//!
//! After the skeleton has been compiled to wasm, the `wasm-rquickjs` host tooling
//! can lower calls to those helper functions into immutable wasm `i32` globals
//! initialized to `0` or `1` (see `wasm_rquickjs::inject`). Once a global is
//! cleared, the corresponding native module is not registered, the wrapper JS is
//! not loaded, and the global wiring code is skipped. Combined with a downstream
//! wasm-level dead-code-elimination pass that folds immutable globals and drops
//! unreferenced WIT imports, this lets a precompiled base image shed the WASI
//! surface (filesystem, sockets, http, ...) of any builtin that the user app does
//! not actually use.
//!
//! ## Slot layout
//!
//! The slot is a fixed 40-byte structure embedded as a `#[link_section]` static
//! so it ends up in a data segment that the patch tool can locate by magic:
//!
//! ```text
//! [MAGIC 16 bytes]
//! [GATES u64 LE  8 bytes]   ← patchable bitset, bit `i` = capability with index `i`
//! [END_MAGIC 16 bytes]
//! ```
//!
//! All reads of the bitset go through `core::ptr::read_volatile` to defeat
//! constant-folding: the value is decided post-compile, not at LLVM time.
//! The slot remains as a fallback for tools that have not yet adopted the
//! helper-to-global lowering pass.
//!
//! ## Adding capabilities
//!
//! The gates use a `u64`, giving us 64 slots. The [`Capability`] enum is `repr(u8)`
//! with explicit discriminants so adding/removing variants does not silently shift
//! the meaning of existing bits. The discriminants are kept in sync with the
//! `Capability` enum exposed by the host-side `wasm-rquickjs::capability_scan`
//! module by name.

use core::sync::atomic::{AtomicBool, Ordering};

/// Magic prefix identifying the capability-gates slot in the wasm data section.
pub const CAPABILITY_GATES_MAGIC: &[u8; 16] = b"WASM_RQJS_CAPS\x01\x00";

/// Magic suffix used to validate slot integrity after patching.
pub const CAPABILITY_GATES_END_MAGIC: &[u8; 16] = b"WASM_RQJS_CAPSND";

/// Total slot size: MAGIC(16) + GATES(8) + END_MAGIC(16).
pub const CAPABILITY_GATES_SLOT_SIZE: usize = 40;

/// Default value of every gate bit before patching: all 64 capabilities enabled.
const DEFAULT_GATES: u64 = u64::MAX;

/// Build the capability-gates slot literal at compile time.
const fn build_capability_gates_slot() -> [u8; CAPABILITY_GATES_SLOT_SIZE] {
    let mut slot = [0u8; CAPABILITY_GATES_SLOT_SIZE];
    let mut i = 0;
    while i < 16 {
        slot[i] = CAPABILITY_GATES_MAGIC[i];
        i += 1;
    }
    let bytes = DEFAULT_GATES.to_le_bytes();
    let mut j = 0;
    while j < 8 {
        slot[16 + j] = bytes[j];
        j += 1;
    }
    let mut k = 0;
    while k < 16 {
        slot[24 + k] = CAPABILITY_GATES_END_MAGIC[k];
        k += 1;
    }
    slot
}

/// The patchable gate slot. Lives in a dedicated link section so that the
/// host-side patch tool can locate it inside the data section by magic and
/// flip individual bits before the wasm component is shipped.
///
/// `#[unsafe(no_mangle)]` keeps the symbol stable; `static` (not `const`)
/// guarantees the bytes end up in a data segment instead of being inlined.
#[unsafe(no_mangle)]
#[unsafe(link_section = ".wasm_rquickjs_capability_gates")]
pub static CAPABILITY_GATES_SLOT: [u8; CAPABILITY_GATES_SLOT_SIZE] = build_capability_gates_slot();

/// Read the patched gate bitset from the slot via volatile reads to prevent
/// LLVM from constant-folding the default value into callers.
fn read_gates() -> u64 {
    let ptr = CAPABILITY_GATES_SLOT.as_ptr();
    let mut bytes = [0u8; 8];
    // SAFETY: `CAPABILITY_GATES_SLOT` is a static array of length
    // `CAPABILITY_GATES_SLOT_SIZE`, so reading 8 bytes starting at offset 16 is
    // in bounds and properly aligned for `u8`.
    unsafe {
        let mut i = 0;
        while i < 8 {
            bytes[i] = core::ptr::read_volatile(ptr.add(16 + i));
            i += 1;
        }
    }
    u64::from_le_bytes(bytes)
}

/// Cached snapshot of the gates: we read the slot via volatile loads exactly
/// once, then cache the resulting bitset because the value is fixed for the
/// lifetime of the wasm instance (the slot is patched offline, before the wasm
/// is instantiated). The cache is purely a performance hint; correctness comes
/// from the volatile read inside [`read_gates`].
fn cached_gates() -> u64 {
    static INIT: AtomicBool = AtomicBool::new(false);
    static mut GATES: u64 = 0;
    // SAFETY: `INIT` and `GATES` are accessed only by the runtime at startup,
    // before any other thread can touch the QuickJS context. We are wasm,
    // single-threaded.
    unsafe {
        if !INIT.load(Ordering::Relaxed) {
            GATES = read_gates();
            INIT.store(true, Ordering::Relaxed);
        }
        GATES
    }
}

/// Returns `true` if the bit corresponding to `cap` is set in the gates slot.
#[inline]
pub fn is_enabled(cap: Capability) -> bool {
    let bit = cap as u8;
    (cached_gates() >> bit) & 1 == 1
}

macro_rules! capability_gate_helpers {
    ($($variant:ident => $fn_name:ident, $export_name:literal;)*) => {
        $(
            #[inline(never)]
            #[unsafe(export_name = $export_name)]
            pub extern "C" fn $fn_name() -> bool {
                is_enabled(Capability::$variant)
            }
        )*
    };
}

capability_gate_helpers! {
    AbortController => cap_abort_controller, "__wrjs_cap_abort_controller";
    Assert => cap_assert, "__wrjs_cap_assert";
    AsyncHooks => cap_async_hooks, "__wrjs_cap_async_hooks";
    Base64 => cap_base64, "__wrjs_cap_base64";
    Buffer => cap_buffer, "__wrjs_cap_buffer";
    ChildProcess => cap_child_process, "__wrjs_cap_child_process";
    Cluster => cap_cluster, "__wrjs_cap_cluster";
    Console => cap_console, "__wrjs_cap_console";
    Constants => cap_constants, "__wrjs_cap_constants";
    Dgram => cap_dgram, "__wrjs_cap_dgram";
    DiagnosticsChannel => cap_diagnostics_channel, "__wrjs_cap_diagnostics_channel";
    Dns => cap_dns, "__wrjs_cap_dns";
    Domain => cap_domain, "__wrjs_cap_domain";
    Encoding => cap_encoding, "__wrjs_cap_encoding";
    Events => cap_events, "__wrjs_cap_events";
    FormDataNode => cap_formdata_node, "__wrjs_cap_formdata_node";
    Fs => cap_fs, "__wrjs_cap_fs";
    Gc => cap_gc, "__wrjs_cap_gc";
    Http2 => cap_http2, "__wrjs_cap_http2";
    Https => cap_https, "__wrjs_cap_https";
    Inspector => cap_inspector, "__wrjs_cap_inspector";
    Intl => cap_intl, "__wrjs_cap_intl";
    Module => cap_module, "__wrjs_cap_module";
    Net => cap_net, "__wrjs_cap_net";
    NodeFetch => cap_node_fetch, "__wrjs_cap_node_fetch";
    NodeHttp => cap_node_http, "__wrjs_cap_node_http";
    NodeTest => cap_node_test, "__wrjs_cap_node_test";
    Os => cap_os, "__wrjs_cap_os";
    Path => cap_path, "__wrjs_cap_path";
    PerfHooks => cap_perf_hooks, "__wrjs_cap_perf_hooks";
    Process => cap_process, "__wrjs_cap_process";
    Punycode => cap_punycode, "__wrjs_cap_punycode";
    Querystring => cap_querystring, "__wrjs_cap_querystring";
    Readline => cap_readline, "__wrjs_cap_readline";
    Repl => cap_repl, "__wrjs_cap_repl";
    Sqlite => cap_sqlite, "__wrjs_cap_sqlite";
    Stream => cap_stream, "__wrjs_cap_stream";
    StringDecoder => cap_string_decoder, "__wrjs_cap_string_decoder";
    StructuredClone => cap_structured_clone, "__wrjs_cap_structured_clone";
    Timers => cap_timers, "__wrjs_cap_timers";
    Tls => cap_tls, "__wrjs_cap_tls";
    TraceEvents => cap_trace_events, "__wrjs_cap_trace_events";
    Tty => cap_tty, "__wrjs_cap_tty";
    Url => cap_url, "__wrjs_cap_url";
    Util => cap_util, "__wrjs_cap_util";
    V8 => cap_v8, "__wrjs_cap_v8";
    Vm => cap_vm, "__wrjs_cap_vm";
    WebCrypto => cap_web_crypto, "__wrjs_cap_web_crypto";
    Websocket => cap_websocket, "__wrjs_cap_websocket";
    Webstreams => cap_webstreams, "__wrjs_cap_webstreams";
    WorkerThreads => cap_worker_threads, "__wrjs_cap_worker_threads";
    Zlib => cap_zlib, "__wrjs_cap_zlib";
    FsModuleLoader => cap_fs_module_loader, "__wrjs_cap_fs_module_loader";
}

/// Identifiers for each builtin capability the skeleton can be asked to enable
/// or disable at runtime.
///
/// Discriminants are explicit and **must remain stable**: each value is also a
/// bit index into the gates bitset patched into the wasm by the host tooling.
/// Keep this in sync with `wasm_rquickjs::capability_scan::Capability` (same
/// names, same set, same discriminants up to ordering — the host tool uses
/// [`Capability::from_marker_name`] to resolve names rather than relying on
/// numeric ordering across crates).
#[repr(u8)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
#[allow(dead_code)]
pub enum Capability {
    AbortController = 0,
    Assert = 1,
    AsyncHooks = 2,
    Base64 = 3,
    Buffer = 4,
    ChildProcess = 5,
    Cluster = 6,
    Console = 7,
    Constants = 8,
    Dgram = 9,
    DiagnosticsChannel = 10,
    Dns = 11,
    Domain = 12,
    Encoding = 13,
    Events = 14,
    FormDataNode = 15,
    Fs = 16,
    Gc = 17,
    Http2 = 18,
    Https = 19,
    Inspector = 20,
    Intl = 21,
    Module = 22,
    Net = 23,
    NodeFetch = 24,
    NodeHttp = 25,
    NodeTest = 26,
    Os = 27,
    Path = 28,
    PerfHooks = 29,
    Process = 30,
    Punycode = 31,
    Querystring = 32,
    Readline = 33,
    Repl = 34,
    Sqlite = 35,
    Stream = 36,
    StringDecoder = 37,
    StructuredClone = 38,
    Timers = 39,
    Tls = 40,
    TraceEvents = 41,
    Tty = 42,
    Url = 43,
    Util = 44,
    V8 = 45,
    Vm = 46,
    WebCrypto = 47,
    Websocket = 48,
    Webstreams = 49,
    WorkerThreads = 50,
    Zlib = 51,
    FsModuleLoader = 52,
}

impl Capability {
    /// Stable lower-snake-case name used by the host scanner / CLI.
    #[allow(dead_code)]
    pub fn marker_name(self) -> &'static str {
        use Capability::*;
        match self {
            AbortController => "abort_controller",
            Assert => "assert",
            AsyncHooks => "async_hooks",
            Base64 => "base64",
            Buffer => "buffer",
            ChildProcess => "child_process",
            Cluster => "cluster",
            Console => "console",
            Constants => "constants",
            Dgram => "dgram",
            DiagnosticsChannel => "diagnostics_channel",
            Dns => "dns",
            Domain => "domain",
            Encoding => "encoding",
            Events => "events",
            FormDataNode => "formdata_node",
            Fs => "fs",
            Gc => "gc",
            Http2 => "http2",
            Https => "https",
            Inspector => "inspector",
            Intl => "intl",
            Module => "module",
            Net => "net",
            NodeFetch => "node_fetch",
            NodeHttp => "node_http",
            NodeTest => "node_test",
            Os => "os",
            Path => "path",
            PerfHooks => "perf_hooks",
            Process => "process",
            Punycode => "punycode",
            Querystring => "querystring",
            Readline => "readline",
            Repl => "repl",
            Sqlite => "sqlite",
            Stream => "stream",
            StringDecoder => "string_decoder",
            StructuredClone => "structured_clone",
            Timers => "timers",
            Tls => "tls",
            TraceEvents => "trace_events",
            Tty => "tty",
            Url => "url",
            Util => "util",
            V8 => "v8",
            Vm => "vm",
            WebCrypto => "web_crypto",
            Websocket => "websocket",
            Webstreams => "webstreams",
            WorkerThreads => "worker_threads",
            Zlib => "zlib",
            FsModuleLoader => "fs_module_loader",
        }
    }
}
