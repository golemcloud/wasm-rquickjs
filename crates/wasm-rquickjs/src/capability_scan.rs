//! Static scan of a JavaScript source to determine the set of skeleton-builtin
//! "capabilities" it actually uses.
//!
//! This is the input side of the Layer-3 plan: the CLI runs this scan, then patches
//! `__wrjs_cap_<name>` marker functions in the prebuilt wasm so that registration of
//! unused builtins becomes dead code, which downstream DCE/import-strip tooling can
//! then eliminate.
//!
//! ## What the scan sees
//!
//! - `import` / `export` declarations with literal sources.
//! - Dynamic `import(<literal>)`.
//! - `require(<literal>)` calls (CJS bridge), regardless of nesting.
//! - Reads of well-known global identifiers (`Buffer`, `fetch`, `crypto`, `URL`,
//!   `TextEncoder`, `setTimeout`, `process`, …) and member-expression bases that
//!   start from one (`crypto.subtle`, `Intl.DateTimeFormat`).
//!
//! ## What the scan flags but cannot resolve
//!
//! - `require(varName)` / `import(expr)` with a non-literal argument.
//! - `eval(...)`, `new Function(...)`.
//! - `vm.runInThisContext` / `vm.runInNewContext` / `vm.compileFunction`.
//!
//! When any of these appear, the scanner sets `has_dynamic = true`. The CLI policy
//! is to keep all capabilities in that case unless the user opts in to aggressive
//! trimming via configuration / magic comments.
//!
//! ## What the scan deliberately does not do (yet)
//!
//! - **Scope tracking.** A user-defined local named `crypto` will be treated as
//!   touching `WebCrypto`. This is conservative (we may keep a capability we don't
//!   need) — never the other way around.
//! - **Cross-module analysis.** Each source unit is scanned independently. Relative
//!   imports between user-supplied JS files are not followed; their specifiers will
//!   surface as warnings of kind `RelativeImport`.

use std::collections::{BTreeSet, VecDeque};

use camino::{Utf8Path, Utf8PathBuf};
use oxc_allocator::Allocator;
use oxc_ast::ast::*;
use oxc_ast_visit::{Visit, walk};
use oxc_parser::Parser;
use oxc_span::{SourceType, Span};

/// One capability ≈ one skeleton built-in module (and the WIT imports it implies).
///
/// The variants intentionally mirror the modules registered in
/// `crates/wasm-rquickjs/skeleton/src/builtin/mod.rs` so the same identifier can be
/// reused later for `__wrjs_cap_<name>` marker-function names.
///
/// The explicit discriminants are also used as bit indices into the
/// `capability gates` slot patched by [`crate::patch_capability_gates_in_bytes`]
/// — they MUST stay in sync with the `Capability` enum in
/// `crates/wasm-rquickjs/skeleton/src/capabilities.rs`.
#[repr(u8)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
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

/// Every capability the scanner knows about, in declaration order.
/// Used by the policy layer when `has_dynamic` falls back to "enable everything".
pub const ALL_CAPABILITIES: &[Capability] = &[
    Capability::AbortController,
    Capability::Assert,
    Capability::AsyncHooks,
    Capability::Base64,
    Capability::Buffer,
    Capability::ChildProcess,
    Capability::Cluster,
    Capability::Console,
    Capability::Constants,
    Capability::Dgram,
    Capability::DiagnosticsChannel,
    Capability::Dns,
    Capability::Domain,
    Capability::Encoding,
    Capability::Events,
    Capability::FormDataNode,
    Capability::Fs,
    Capability::Gc,
    Capability::Http2,
    Capability::Https,
    Capability::Inspector,
    Capability::Intl,
    Capability::Module,
    Capability::Net,
    Capability::NodeFetch,
    Capability::NodeHttp,
    Capability::NodeTest,
    Capability::Os,
    Capability::Path,
    Capability::PerfHooks,
    Capability::Process,
    Capability::Punycode,
    Capability::Querystring,
    Capability::Readline,
    Capability::Repl,
    Capability::Sqlite,
    Capability::Stream,
    Capability::StringDecoder,
    Capability::StructuredClone,
    Capability::Timers,
    Capability::Tls,
    Capability::TraceEvents,
    Capability::Tty,
    Capability::Url,
    Capability::Util,
    Capability::V8,
    Capability::Vm,
    Capability::WebCrypto,
    Capability::Websocket,
    Capability::Webstreams,
    Capability::WorkerThreads,
    Capability::Zlib,
    Capability::FsModuleLoader,
];

impl Capability {
    /// Look up a capability by its marker name (the inverse of [`Capability::marker_name`]).
    pub fn from_marker_name(s: &str) -> Option<Capability> {
        ALL_CAPABILITIES
            .iter()
            .copied()
            .find(|c| c.marker_name() == s)
    }

    /// Bit index in the capability-gates slot (matches the variant's
    /// discriminant). Used by [`crate::patch_capability_gates_in_bytes`] to
    /// flip the bit corresponding to this capability.
    pub fn bit_index(self) -> u8 {
        self as u8
    }

    /// Stable lower-snake-case name used for marker symbols (`__wrjs_cap_<name>`).
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

/// Build the 64-bit `enabled_bits` value expected by
/// [`crate::patch_capability_gates_in_bytes`] from an iterable of enabled
/// capabilities.
pub fn enabled_bits<I: IntoIterator<Item = Capability>>(enabled: I) -> u64 {
    let mut bits = 0u64;
    for c in enabled {
        bits |= 1u64 << c.bit_index();
    }
    bits
}

/// Result of scanning one or more JS source units.
#[derive(Debug, Clone, Default)]
pub struct ScanResult {
    /// Capabilities the scanner is confident the JS uses.
    pub used: BTreeSet<Capability>,
    /// Bare specifiers that did not match any known builtin and that don't look
    /// like WIT-style component imports (e.g. npm packages, ad-hoc modules).
    /// Recorded for diagnostics; they don't drive trimming.
    pub unknown_specifiers: BTreeSet<String>,
    /// Fully-qualified WIT-style specifiers (`<ns>:<pkg>/<iface>(@<ver>)?`).
    /// These are component-model imports satisfied by the host, not skeleton
    /// builtins. Recorded so callers can distinguish them from real npm-style
    /// "unknown" specifiers.
    pub wit_specifiers: BTreeSet<String>,
    /// Diagnostic findings about patterns the scanner cannot fully resolve.
    pub warnings: Vec<Warning>,
    /// `true` if the scan encountered any pattern that could change the module
    /// graph at runtime (`require(varName)`, `import(expr)`, `eval`, `new Function`,
    /// `vm.run*`). When set, the CLI's default policy is to disable trimming.
    pub has_dynamic: bool,
}

#[derive(Debug, Clone)]
pub struct Warning {
    pub kind: WarningKind,
    pub source: String,
    pub line: u32,
    pub column: u32,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum WarningKind {
    /// `require(expr)` / `require(...nonStringLiteral...)`.
    DynamicRequire,
    /// `import(expr)` with a non-literal argument.
    DynamicImport,
    /// Direct `eval(...)` call.
    Eval,
    /// `new Function(...)`.
    NewFunction,
    /// `vm.runInThisContext`, `vm.runInNewContext`, `vm.runInContext`,
    /// `vm.compileFunction`. Implies `Capability::Vm` regardless.
    VmEval,
    /// A relative or absolute path import seen during single-file scanning.
    /// Disappears in `scan_entry_point` if the target file resolves and parses.
    RelativeImport(String),
    /// A relative/absolute import that could not be resolved on disk during
    /// transitive scanning.
    UnresolvableImport(String),
}

/// Scan a single source unit. Recognizes JavaScript and TypeScript files based
/// on the path extension (`.cjs` → CJS; `.ts`/`.cts`/`.mts`/`.tsx` → TS; others
/// → ESM JS).
pub fn scan_module(path: &Utf8Path, source: &str) -> ScanResult {
    let p = path.as_str();
    let source_type = if p.ends_with(".cjs") {
        SourceType::cjs()
    } else if p.ends_with(".tsx") {
        SourceType::tsx()
    } else if p.ends_with(".cts") || p.ends_with(".mts") || p.ends_with(".ts") {
        SourceType::ts()
    } else {
        SourceType::mjs()
    };
    let allocator = Allocator::default();
    let parsed = Parser::new(&allocator, source, source_type).parse();
    let mut scanner = Scanner::new(source);
    scanner.visit_program(&parsed.program);
    scanner.into_result()
}

/// Scan multiple source units and union their findings.
pub fn scan_modules<I>(units: I) -> ScanResult
where
    I: IntoIterator<Item = (Utf8PathSource, String)>,
{
    let mut combined = ScanResult::default();
    for (path, source) in units {
        let r = scan_module(path.as_ref(), &source);
        combined.used.extend(r.used);
        combined.unknown_specifiers.extend(r.unknown_specifiers);
        combined.wit_specifiers.extend(r.wit_specifiers);
        combined.warnings.extend(r.warnings);
        combined.has_dynamic |= r.has_dynamic;
    }
    combined
}

/// Helper newtype so callers can pass owned or borrowed paths into `scan_modules`.
pub struct Utf8PathSource(Utf8PathBuf);

impl Utf8PathSource {
    pub fn new(p: impl Into<Utf8PathBuf>) -> Self {
        Self(p.into())
    }
}

impl AsRef<Utf8Path> for Utf8PathSource {
    fn as_ref(&self) -> &Utf8Path {
        &self.0
    }
}

/// Scan an entry-point JS file and transitively follow its relative imports.
///
/// Each `import`/`export … from`/`require()`/`import()` whose specifier starts
/// with `./`, `../`, or `/` is resolved on disk (trying `<spec>`, `<spec>.js`,
/// `<spec>.mjs`, `<spec>.cjs`, `<spec>/index.js`, `<spec>/index.mjs`,
/// `<spec>/index.cjs`) and the target file is scanned recursively.
///
/// Bare specifiers (`node:fs`, `lodash`, `wasi:foo/bar`) are *not* followed;
/// they're handled by `record_specifier` as before.
///
/// Cycles and re-imports are deduplicated via a visited-paths set.
///
/// On any IO/parse failure for a relative target, an `UnresolvableImport` warning
/// is emitted but scanning continues.
pub fn scan_entry_point(entry: &Utf8Path) -> ScanResult {
    let mut combined = ScanResult::default();
    let mut visited: BTreeSet<Utf8PathBuf> = BTreeSet::new();
    let mut queue: VecDeque<Utf8PathBuf> = VecDeque::new();
    queue.push_back(entry.to_path_buf());

    while let Some(path) = queue.pop_front() {
        let canon = match path.canonicalize_utf8() {
            Ok(p) => p,
            Err(e) => {
                combined.warnings.push(Warning {
                    kind: WarningKind::UnresolvableImport(path.to_string()),
                    source: format!("{e}"),
                    line: 0,
                    column: 0,
                });
                continue;
            }
        };
        if !visited.insert(canon.clone()) {
            continue;
        }
        let source = match std::fs::read_to_string(canon.as_std_path()) {
            Ok(s) => s,
            Err(e) => {
                combined.warnings.push(Warning {
                    kind: WarningKind::UnresolvableImport(canon.to_string()),
                    source: format!("{e}"),
                    line: 0,
                    column: 0,
                });
                continue;
            }
        };

        let r = scan_module(canon.as_path(), &source);
        combined.used.extend(r.used);
        combined.unknown_specifiers.extend(r.unknown_specifiers);
        combined.wit_specifiers.extend(r.wit_specifiers);
        combined.has_dynamic |= r.has_dynamic;

        // Walk the warnings: try to resolve `RelativeImport` targets and queue them;
        // pass through everything else.
        let parent_dir = canon
            .parent()
            .unwrap_or_else(|| Utf8Path::new(""))
            .to_path_buf();
        for w in r.warnings {
            match &w.kind {
                WarningKind::RelativeImport(spec) => match resolve_relative(&parent_dir, spec) {
                    Some(resolved) => queue.push_back(resolved),
                    None => combined.warnings.push(Warning {
                        kind: WarningKind::UnresolvableImport(spec.clone()),
                        source: w.source,
                        line: w.line,
                        column: w.column,
                    }),
                },
                _ => combined.warnings.push(w),
            }
        }
    }

    combined
}

/// Try to resolve a relative-or-absolute `spec` (as it appeared in JS) against
/// the importing file's `parent_dir`, exhausting common Node.js extensions and
/// `index` lookups.
fn resolve_relative(parent_dir: &Utf8Path, spec: &str) -> Option<Utf8PathBuf> {
    // Absolute paths are taken as-is; relative ones join against parent_dir.
    let base = if spec.starts_with('/') {
        Utf8PathBuf::from(spec)
    } else {
        parent_dir.join(spec)
    };

    // Try literal first; then with each extension; then index.* under it.
    let candidates = [
        base.clone(),
        with_appended(&base, ".js"),
        with_appended(&base, ".mjs"),
        with_appended(&base, ".cjs"),
        with_appended(&base, ".json"),
        base.join("index.js"),
        base.join("index.mjs"),
        base.join("index.cjs"),
    ];
    candidates.into_iter().find(|c| c.is_file())
}

fn with_appended(p: &Utf8Path, suffix: &str) -> Utf8PathBuf {
    let mut s = p.as_str().to_string();
    s.push_str(suffix);
    Utf8PathBuf::from(s)
}

// -------------------------------------------------------------------------------------------------
// Specifier → Capability mapping
// -------------------------------------------------------------------------------------------------

/// Map a literal module specifier to a capability. Returns `None` for unknown
/// specifiers (npm packages, relative paths, etc.).
fn spec_to_cap(spec: &str) -> Option<Capability> {
    let stripped = spec.strip_prefix("node:").unwrap_or(spec);
    let head = stripped.split_once('/').map(|x| x.0).unwrap_or(stripped);
    use Capability::*;
    Some(match head {
        "abort_controller" => AbortController,
        "assert" => Assert,
        "async_hooks" => AsyncHooks,
        "buffer" | "base64-js" | "ieee754" => Buffer,
        "child_process" => ChildProcess,
        "cluster" => Cluster,
        "console" => Console,
        "constants" => Constants,
        "crypto" => WebCrypto,
        "dgram" => Dgram,
        "diagnostics_channel" => DiagnosticsChannel,
        "dns" => Dns,
        "domain" => Domain,
        "events" => Events,
        "formdata-node" => FormDataNode,
        "fs" => Fs,
        "http" | "_http_common" | "_http_agent" => NodeHttp,
        "http2" => Http2,
        "https" => Https,
        "inspector" => Inspector,
        "module" => Module,
        "net" => Net,
        "os" => Os,
        "path" => Path,
        "perf_hooks" => PerfHooks,
        "process" => Process,
        "punycode" => Punycode,
        "querystring" => Querystring,
        "readline" => Readline,
        "repl" => Repl,
        "sqlite" => Sqlite,
        "stream" | "web-streams-polyfill" => Stream,
        "string_decoder" => StringDecoder,
        "test" => NodeTest,
        "timers" => Timers,
        "tls" => Tls,
        "trace_events" => TraceEvents,
        "tty" => Tty,
        "url" => Url,
        "util" => Util,
        "v8" => V8,
        "vm" => Vm,
        "worker_threads" => WorkerThreads,
        "zlib" => Zlib,
        _ => return None,
    })
}

/// True for fully-qualified WIT-style specifiers like `wasi:random/random@0.2.3`
/// or `quickjs:example3/iface`. Shape: `<ns>:<pkg>/<iface>(@<ver>)?` where each
/// segment is an identifier-like token (alphanumerics with `-`/`_`/`.`).
///
/// Intentionally narrow so URL schemes (`data:`, `http://`, `file:`) don't match.
fn is_wit_style_specifier(spec: &str) -> bool {
    fn is_ident(s: &str) -> bool {
        !s.is_empty()
            && s.chars()
                .all(|c| c.is_ascii_alphanumeric() || matches!(c, '-' | '_' | '.'))
    }
    let Some((ns, rest)) = spec.split_once(':') else {
        return false;
    };
    if !is_ident(ns) {
        return false;
    }
    let Some((pkg, iface_and_ver)) = rest.split_once('/') else {
        return false;
    };
    if !is_ident(pkg) {
        return false;
    }
    let iface = iface_and_ver
        .split_once('@')
        .map(|(i, _ver)| i)
        .unwrap_or(iface_and_ver);
    is_ident(iface)
}

/// Map a global identifier name to the capability whose `WIRE_JS` installs it.
///
/// This table was audited against `crates/wasm-rquickjs/skeleton/src/builtin/*.rs`
/// — every entry corresponds to an actual `globalThis.X = …` line in some
/// builtin's wire script. We don't include QuickJS-native globals like
/// `queueMicrotask`, `Promise`, `Map`, etc. because they're always present
/// regardless of which capabilities are enabled.
///
/// Conservative bias: a user-defined local shadowing one of these names will
/// still trigger inclusion of the corresponding capability (no scope tracking).
fn global_to_cap(name: &str) -> Option<Capability> {
    use Capability::*;
    Some(match name {
        // abort_controller WIRE_JS
        "AbortController" | "AbortSignal" | "DOMException" => AbortController,
        // base64 WIRE_JS
        "atob" | "btoa" => Base64,
        // buffer WIRE_JS (note: also lowercase `buffer`)
        "Buffer" | "buffer" => Buffer,
        // console WIRE_JS
        "console" => Console,
        // encoding WIRE_JS
        "TextDecoder" | "TextEncoder" | "TextDecoderStream" | "TextEncoderStream" => Encoding,
        // events WIRE_JS
        "Event" | "EventTarget" | "CustomEvent" => Events,
        // gc WIRE_JS
        "gc" => Gc,
        // http (NodeFetch) WIRE_JS — fetch + DOM-ish surface + XHR + FormData/Blob/File globals
        "fetch" | "Headers" | "Request" | "Response" => NodeFetch,
        "Blob" | "File" | "FormData" | "XMLHttpRequest" => NodeFetch,
        // intl WIRE_JS
        "Intl" => Intl,
        // module WIRE_JS — `globalThis.require = require;`
        "require" => Module,
        // process WIRE_JS
        "process" => Process,
        // structured_clone WIRE_JS
        "structuredClone" => StructuredClone,
        // timeout WIRE_JS (we map to the `Timers` cap; `timers` and `timeout` JS
        // modules collapse into one capability for the user's purposes)
        "setTimeout" | "setInterval" | "setImmediate" | "clearTimeout" | "clearInterval"
        | "clearImmediate" => Timers,
        // url WIRE_JS
        "URL" | "URLSearchParams" => Url,
        // web_crypto WIRE_JS — only `crypto` is wired; Crypto/SubtleCrypto/CryptoKey
        // are class names that appear in user code referring to types but are not
        // installed as globals by skeleton. Including them would over-detect, so
        // we don't.
        "crypto" => WebCrypto,
        // webstreams WIRE_JS
        "ByteLengthQueuingStrategy"
        | "CountQueuingStrategy"
        | "ReadableByteStreamController"
        | "ReadableStream"
        | "ReadableStreamBYOBReader"
        | "ReadableStreamBYOBRequest"
        | "ReadableStreamDefaultController"
        | "ReadableStreamDefaultReader"
        | "TransformStream"
        | "TransformStreamDefaultController"
        | "WritableStream"
        | "WritableStreamDefaultController"
        | "WritableStreamDefaultWriter" => Webstreams,
        // websocket WIRE_JS (golem)
        "WebSocket" | "WebSocketStream" | "MessageEvent" | "CloseEvent" | "ErrorEvent" => Websocket,
        // worker_threads WIRE_JS
        "MessageChannel" | "MessagePort" => WorkerThreads,
        _ => return None,
    })
}

/// Static dependencies between capabilities, derived from the JS-level imports
/// in `crates/wasm-rquickjs/skeleton/src/builtin/*.js`. If capability X is
/// enabled, every cap returned here for X must also be enabled, otherwise X's
/// JS module will fail to load.
///
/// The list is intentionally narrow — it only includes edges between *user-
/// visible* capabilities, not edges into internal `__wasm_rquickjs_builtin/internal/*`
/// modules (those don't have caps).
pub fn dependencies(cap: Capability) -> &'static [Capability] {
    use Capability::*;
    match cap {
        AbortController => &[Events],
        Assert => &[Fs, Util],
        Buffer => &[StringDecoder],
        ChildProcess => &[Buffer, Events, Module, Path, Process],
        Console => &[Buffer, Process, Util],
        Constants => &[WebCrypto, Fs, Os],
        Dgram => &[Buffer, Dns, Events, Process],
        Dns => &[Net],
        Domain => &[Events],
        Encoding => &[Webstreams],
        FormDataNode => &[NodeFetch],
        Https => &[NodeHttp],
        Inspector => &[Events],
        Module => &[Vm],
        Net => &[Buffer, Dns, Events, Fs, Path],
        NodeFetch => &[
            AbortController,
            Base64,
            Buffer,
            Encoding,
            NodeHttp,
            Webstreams,
        ],
        NodeHttp => &[Buffer, DiagnosticsChannel, Events, Net, Timers, Url],
        NodeTest => &[Assert],
        Process => &[Events],
        Querystring => &[Buffer],
        Stream => &[Buffer, Process],
        StringDecoder => &[Buffer],
        Timers => &[AsyncHooks],
        Tls => &[Net],
        TraceEvents => &[Util],
        Tty => &[Net],
        Url => &[Querystring],
        Util => &[Encoding, WebCrypto],
        WebCrypto => &[AbortController, Base64, Buffer],
        Zlib => &[Buffer, Stream],
        // Caps with no inter-cap dependencies (only internal/native deps).
        AsyncHooks | Base64 | Cluster | DiagnosticsChannel | Events | Fs | FsModuleLoader | Gc
        | Http2 | Intl | Os | Path | PerfHooks | Punycode | Readline | Repl | Sqlite
        | StructuredClone | V8 | Vm | Websocket | Webstreams | WorkerThreads => &[],
    }
}

/// Compute the transitive closure of capabilities under [`dependencies`].
pub fn closure(seed: &BTreeSet<Capability>) -> BTreeSet<Capability> {
    let mut out = seed.clone();
    let mut frontier: Vec<Capability> = seed.iter().copied().collect();
    while let Some(c) = frontier.pop() {
        for &d in dependencies(c) {
            if out.insert(d) {
                frontier.push(d);
            }
        }
    }
    out
}

// -------------------------------------------------------------------------------------------------
// Policy: turn the raw scan result + user CLI flags into the final enabled set
// -------------------------------------------------------------------------------------------------

/// User-supplied policy applied on top of a raw scan result.
#[derive(Debug, Clone, Default)]
pub struct Policy {
    /// Force-include these capabilities regardless of what the scan found.
    pub include: BTreeSet<Capability>,
    /// Force-exclude these capabilities. An exclude that conflicts with a
    /// transitively-required capability is honored only insofar as it's not
    /// re-added by the closure step; conflicts surface in [`PolicyOutcome::ineffective_excludes`].
    pub exclude: BTreeSet<Capability>,
    /// When `true` and the scan flagged dynamic patterns, trim aggressively
    /// anyway. When `false` (the default), dynamic patterns force "enable
    /// every known capability" as the safety net.
    pub trim_unknown: bool,
}

#[derive(Debug, Clone)]
pub struct PolicyOutcome {
    /// Final set of capabilities to enable in the wasm.
    pub enabled: BTreeSet<Capability>,
    /// `true` if the conservative fallback (enable all) was triggered by
    /// `has_dynamic` and the absence of `trim_unknown`.
    pub conservative_fallback: bool,
    /// Excludes that survived even though the user asked to remove them
    /// (because some other enabled capability still requires them).
    pub ineffective_excludes: BTreeSet<Capability>,
}

/// Apply the policy: `(used or all) ∪ include - exclude` then closure, then report.
pub fn apply_policy(scan: &ScanResult, policy: &Policy) -> PolicyOutcome {
    let conservative = scan.has_dynamic && !policy.trim_unknown;
    let base: BTreeSet<Capability> = if conservative {
        ALL_CAPABILITIES.iter().copied().collect()
    } else {
        scan.used.clone()
    };
    let merged: BTreeSet<Capability> = base.union(&policy.include).copied().collect();
    let after_exclude: BTreeSet<Capability> = merged.difference(&policy.exclude).copied().collect();
    let enabled = closure(&after_exclude);
    let ineffective: BTreeSet<Capability> = policy
        .exclude
        .iter()
        .copied()
        .filter(|c| enabled.contains(c))
        .collect();
    PolicyOutcome {
        enabled,
        conservative_fallback: conservative,
        ineffective_excludes: ineffective,
    }
}

// -------------------------------------------------------------------------------------------------
// AST visitor
// -------------------------------------------------------------------------------------------------

struct Scanner<'src> {
    source: &'src str,
    out: ScanResult,
}

impl<'src> Scanner<'src> {
    fn new(source: &'src str) -> Self {
        Self {
            source,
            out: ScanResult::default(),
        }
    }

    fn into_result(self) -> ScanResult {
        self.out
    }

    fn record_specifier(&mut self, raw: &str, span: Span) {
        if raw.starts_with('.') || raw.starts_with('/') {
            self.out.used.insert(Capability::FsModuleLoader);
            self.warn(WarningKind::RelativeImport(raw.to_string()), span);
            return;
        }
        if raw.starts_with("file:") {
            self.out.used.insert(Capability::FsModuleLoader);
            return;
        }
        // `spec_to_cap` is checked first so `node:fs/promises` resolves to Fs
        // before the WIT-style check would mistakenly catch it on the `/`.
        if let Some(cap) = spec_to_cap(raw) {
            self.out.used.insert(cap);
            return;
        }
        if is_wit_style_specifier(raw) {
            self.out.wit_specifiers.insert(raw.to_string());
            return;
        }
        self.out.unknown_specifiers.insert(raw.to_string());
    }

    fn record_global(&mut self, name: &str) {
        if let Some(cap) = global_to_cap(name) {
            self.out.used.insert(cap);
        }
    }

    fn warn(&mut self, kind: WarningKind, span: Span) {
        let (line, column) = self.line_column(span);
        self.out.warnings.push(Warning {
            kind,
            source: self.snippet(span),
            line,
            column,
        });
    }

    fn snippet(&self, span: Span) -> String {
        let start = span.start as usize;
        let end = (span.end as usize).min(self.source.len());
        let mut s = self.source.get(start..end).unwrap_or("").trim().to_string();
        if s.len() > 80 {
            s.truncate(77);
            s.push_str("...");
        }
        s
    }

    fn line_column(&self, span: Span) -> (u32, u32) {
        let upto = self.source.get(..span.start as usize).unwrap_or("");
        let line = (upto.bytes().filter(|b| *b == b'\n').count() + 1) as u32;
        let column = (upto.rsplit('\n').next().map(|l| l.len()).unwrap_or(0) + 1) as u32;
        (line, column)
    }
}

impl<'a> Visit<'a> for Scanner<'_> {
    // Top-level `import x from 'spec'` and re-exports `export … from 'spec'`.
    fn visit_import_declaration(&mut self, decl: &ImportDeclaration<'a>) {
        self.record_specifier(decl.source.value.as_str(), decl.source.span);
        walk::walk_import_declaration(self, decl);
    }
    fn visit_export_named_declaration(&mut self, decl: &ExportNamedDeclaration<'a>) {
        if let Some(src) = &decl.source {
            self.record_specifier(src.value.as_str(), src.span);
        }
        walk::walk_export_named_declaration(self, decl);
    }
    fn visit_export_all_declaration(&mut self, decl: &ExportAllDeclaration<'a>) {
        self.record_specifier(decl.source.value.as_str(), decl.source.span);
        walk::walk_export_all_declaration(self, decl);
    }

    // Dynamic `import(<expr>)`.
    fn visit_import_expression(&mut self, expr: &ImportExpression<'a>) {
        match &expr.source {
            Expression::StringLiteral(s) => self.record_specifier(s.value.as_str(), s.span),
            _ => {
                self.has_dynamic_set();
                self.warn(WarningKind::DynamicImport, expr.span);
            }
        }
        walk::walk_import_expression(self, expr);
    }

    // `require('x')`, `eval(...)`, and `vm.*` — all surface as call expressions.
    fn visit_call_expression(&mut self, call: &CallExpression<'a>) {
        match &call.callee {
            // Direct call: identifier
            Expression::Identifier(id) => match id.name.as_str() {
                "require" => match call.arguments.first() {
                    Some(Argument::StringLiteral(s)) => {
                        self.record_specifier(s.value.as_str(), s.span)
                    }
                    Some(_) => {
                        self.has_dynamic_set();
                        self.warn(WarningKind::DynamicRequire, call.span);
                    }
                    None => {}
                },
                "eval" => {
                    self.has_dynamic_set();
                    self.warn(WarningKind::Eval, call.span);
                }
                _ => {}
            },
            // Member call: `vm.runInThisContext(...)`, `vm.compileFunction(...)`, etc.
            Expression::StaticMemberExpression(m) => {
                if let Expression::Identifier(obj) = &m.object
                    && obj.name == "vm"
                    && matches!(
                        m.property.name.as_str(),
                        "runInThisContext" | "runInNewContext" | "runInContext" | "compileFunction"
                    )
                {
                    self.out.used.insert(Capability::Vm);
                    self.has_dynamic_set();
                    self.warn(WarningKind::VmEval, call.span);
                }
            }
            _ => {}
        }
        walk::walk_call_expression(self, call);
    }

    // `new Function(...)`.
    fn visit_new_expression(&mut self, new: &NewExpression<'a>) {
        if let Expression::Identifier(id) = &new.callee
            && id.name == "Function"
        {
            self.has_dynamic_set();
            self.warn(WarningKind::NewFunction, new.span);
        }
        walk::walk_new_expression(self, new);
    }

    // Identifier reads → check global table.
    fn visit_identifier_reference(&mut self, id: &IdentifierReference<'a>) {
        self.record_global(id.name.as_str());
    }
}

impl Scanner<'_> {
    fn has_dynamic_set(&mut self) {
        self.out.has_dynamic = true;
    }
}

// -------------------------------------------------------------------------------------------------
// Tests
// -------------------------------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use camino::Utf8PathBuf;

    fn scan(src: &str) -> ScanResult {
        scan_module(Utf8PathBuf::from("test.mjs").as_ref(), src)
    }

    #[test]
    fn esm_import_node_fs() {
        let r = scan(r#"import { readFileSync } from "node:fs";"#);
        assert!(r.used.contains(&Capability::Fs));
        assert!(!r.has_dynamic);
        assert!(r.warnings.is_empty());
    }

    #[test]
    fn bare_specifier_alias() {
        let r = scan(r#"import fs from "fs";"#);
        assert!(r.used.contains(&Capability::Fs));
    }

    #[test]
    fn fs_promises_subpath() {
        let r = scan(r#"import * as p from "node:fs/promises";"#);
        assert!(r.used.contains(&Capability::Fs));
    }

    #[test]
    fn cjs_require_literal() {
        let r = scan(r#"const path = require("path");"#);
        assert!(r.used.contains(&Capability::Path));
        assert!(!r.has_dynamic);
    }

    #[test]
    fn cjs_require_dynamic_warns() {
        let r = scan(
            r#"
            const name = "fs";
            const x = require(name);
            "#,
        );
        assert!(r.has_dynamic);
        assert!(
            r.warnings
                .iter()
                .any(|w| matches!(w.kind, WarningKind::DynamicRequire))
        );
    }

    #[test]
    fn dynamic_import_literal_is_resolved() {
        let r = scan(r#"const m = await import("node:os");"#);
        assert!(r.used.contains(&Capability::Os));
        assert!(!r.has_dynamic);
    }

    #[test]
    fn dynamic_import_expression_warns() {
        let r = scan(r#"const m = await import(name);"#);
        assert!(r.has_dynamic);
        assert!(
            r.warnings
                .iter()
                .any(|w| matches!(w.kind, WarningKind::DynamicImport))
        );
    }

    #[test]
    fn eval_warns() {
        let r = scan(r#"eval("1+1");"#);
        assert!(r.has_dynamic);
        assert!(
            r.warnings
                .iter()
                .any(|w| matches!(w.kind, WarningKind::Eval))
        );
    }

    #[test]
    fn new_function_warns() {
        let r = scan(r#"const f = new Function("return 1");"#);
        assert!(r.has_dynamic);
        assert!(
            r.warnings
                .iter()
                .any(|w| matches!(w.kind, WarningKind::NewFunction))
        );
    }

    #[test]
    fn vm_runintthiscontext_warns_and_sets_vm_cap() {
        let r = scan(
            r#"
            import vm from "node:vm";
            vm.runInThisContext("1+1");
            "#,
        );
        assert!(r.used.contains(&Capability::Vm));
        assert!(r.has_dynamic);
        assert!(
            r.warnings
                .iter()
                .any(|w| matches!(w.kind, WarningKind::VmEval))
        );
    }

    #[test]
    fn global_buffer() {
        let r = scan(r#"const b = Buffer.from("hi");"#);
        assert!(r.used.contains(&Capability::Buffer));
    }

    #[test]
    fn global_fetch() {
        let r = scan(r#"const r = await fetch("https://example.com");"#);
        assert!(r.used.contains(&Capability::NodeFetch));
    }

    #[test]
    fn global_crypto() {
        let r = scan(r#"const id = crypto.randomUUID();"#);
        assert!(r.used.contains(&Capability::WebCrypto));
    }

    #[test]
    fn global_text_encoder() {
        let r = scan(r#"const enc = new TextEncoder();"#);
        assert!(r.used.contains(&Capability::Encoding));
    }

    #[test]
    fn global_set_timeout() {
        let r = scan(r#"setTimeout(() => {}, 100);"#);
        assert!(r.used.contains(&Capability::Timers));
    }

    #[test]
    fn unknown_specifier_recorded() {
        let r = scan(r#"import x from "lodash";"#);
        assert!(r.unknown_specifiers.contains("lodash"));
        assert!(r.used.is_empty());
    }

    #[test]
    fn relative_import_warns() {
        let r = scan(r#"import x from "./helper.js";"#);
        assert!(
            r.warnings
                .iter()
                .any(|w| matches!(&w.kind, WarningKind::RelativeImport(p) if p == "./helper.js"))
        );
    }

    #[test]
    fn export_from_specifier() {
        let r = scan(r#"export { foo } from "node:url";"#);
        assert!(r.used.contains(&Capability::Url));
    }

    #[test]
    fn export_all_specifier() {
        let r = scan(r#"export * from "node:events";"#);
        assert!(r.used.contains(&Capability::Events));
    }

    #[test]
    fn nested_require_in_block() {
        let r = scan(
            r#"
            function getFs() {
                if (true) {
                    return require("node:fs");
                }
            }
            "#,
        );
        assert!(r.used.contains(&Capability::Fs));
    }

    #[test]
    fn wit_specifier_recorded() {
        let r = scan(r#"import * as r from "wasi:random/random@0.2.3";"#);
        assert!(r.wit_specifiers.contains("wasi:random/random@0.2.3"));
        assert!(r.unknown_specifiers.is_empty());
        assert!(r.used.is_empty());
    }

    #[test]
    fn node_subpath_not_misclassified_as_wit() {
        let r = scan(r#"import * as p from "node:fs/promises";"#);
        assert!(r.used.contains(&Capability::Fs));
        assert!(r.wit_specifiers.is_empty());
    }

    #[test]
    fn relative_import_carries_location() {
        let r = scan("\n\nimport x from \"./helper.js\";");
        let w = r
            .warnings
            .iter()
            .find(|w| matches!(w.kind, WarningKind::RelativeImport(_)))
            .expect("relative import warning");
        assert_eq!(w.line, 3);
        assert!(w.column > 0);
    }

    #[test]
    fn url_scheme_not_misclassified_as_wit() {
        // data: and http: shouldn't be treated as WIT-style; they go to unknown.
        let r = scan(r#"const x = await import("data:text/javascript,export default 1");"#);
        assert!(r.unknown_specifiers.iter().any(|s| s.starts_with("data:")));
        assert!(r.wit_specifiers.is_empty());
    }

    #[test]
    fn http_alias_specifiers() {
        let r = scan(r#"import { Server } from "node:http";"#);
        assert!(r.used.contains(&Capability::NodeHttp));
        let r2 = scan(r#"import { Agent } from "node:_http_agent";"#);
        assert!(r2.used.contains(&Capability::NodeHttp));
    }

    // ----- audited globals -----

    #[test]
    fn global_form_data_maps_to_node_fetch() {
        // `globalThis.FormData` is wired by http (NodeFetch), not formdata_node.
        let r = scan(r#"const f = new FormData();"#);
        assert!(r.used.contains(&Capability::NodeFetch));
        assert!(!r.used.contains(&Capability::FormDataNode));
    }

    #[test]
    fn global_readable_stream_maps_to_webstreams() {
        let r = scan(r#"const stream = new ReadableStream({});"#);
        assert!(r.used.contains(&Capability::Webstreams));
    }

    #[test]
    fn global_event_target_maps_to_events() {
        let r = scan(r#"class X extends EventTarget {}"#);
        assert!(r.used.contains(&Capability::Events));
    }

    #[test]
    fn global_message_channel_maps_to_worker_threads() {
        let r = scan(r#"const ch = new MessageChannel();"#);
        assert!(r.used.contains(&Capability::WorkerThreads));
    }

    #[test]
    fn global_dom_exception_maps_to_abort_controller() {
        let r = scan(r#"throw new DOMException("x");"#);
        assert!(r.used.contains(&Capability::AbortController));
    }

    #[test]
    fn global_require_maps_to_module() {
        let r = scan(r#"const x = require;"#); // bare reference, not a call
        assert!(r.used.contains(&Capability::Module));
    }

    #[test]
    fn lowercase_buffer_global() {
        let r = scan(r#"const x = buffer.kMaxLength;"#);
        assert!(r.used.contains(&Capability::Buffer));
    }

    #[test]
    fn queue_microtask_is_not_a_capability() {
        // queueMicrotask is a QuickJS-native global; we shouldn't pull in Timers for it.
        let r = scan(r#"queueMicrotask(() => 1);"#);
        assert!(!r.used.contains(&Capability::Timers));
    }

    // ----- dependencies + closure -----

    #[test]
    fn closure_pulls_node_fetch_deps() {
        let mut seed = BTreeSet::new();
        seed.insert(Capability::NodeFetch);
        let c = closure(&seed);
        assert!(c.contains(&Capability::AbortController));
        assert!(c.contains(&Capability::Events)); // from AbortController
        assert!(c.contains(&Capability::Base64));
        assert!(c.contains(&Capability::Buffer));
        assert!(c.contains(&Capability::StringDecoder)); // from Buffer
        assert!(c.contains(&Capability::Encoding));
        assert!(c.contains(&Capability::NodeHttp));
        assert!(c.contains(&Capability::Net)); // from NodeHttp
        assert!(c.contains(&Capability::Webstreams));
    }

    #[test]
    fn closure_pulls_console_deps() {
        let mut seed = BTreeSet::new();
        seed.insert(Capability::Console);
        let c = closure(&seed);
        assert!(c.contains(&Capability::Buffer));
        assert!(c.contains(&Capability::Process));
        assert!(c.contains(&Capability::Util));
    }

    #[test]
    fn closure_pulls_web_crypto_deps() {
        let mut seed = BTreeSet::new();
        seed.insert(Capability::WebCrypto);
        let c = closure(&seed);
        assert!(c.contains(&Capability::AbortController));
        assert!(c.contains(&Capability::Base64));
        assert!(c.contains(&Capability::Buffer));
    }

    #[test]
    fn closure_node_http_pulls_net() {
        let mut seed = BTreeSet::new();
        seed.insert(Capability::NodeHttp);
        let c = closure(&seed);
        assert!(c.contains(&Capability::Net));
        assert!(c.contains(&Capability::Dns));
        assert!(c.contains(&Capability::Timers));
        assert!(c.contains(&Capability::Url));
    }

    #[test]
    fn closure_module_pulls_vm() {
        let mut seed = BTreeSet::new();
        seed.insert(Capability::Module);
        let c = closure(&seed);
        assert!(c.contains(&Capability::Vm));
    }

    #[test]
    fn closure_idempotent() {
        let mut seed = BTreeSet::new();
        seed.insert(Capability::Url);
        let c1 = closure(&seed);
        let c2 = closure(&c1);
        assert_eq!(c1, c2);
    }

    #[test]
    fn marker_name_roundtrip() {
        for &c in ALL_CAPABILITIES {
            assert_eq!(Capability::from_marker_name(c.marker_name()), Some(c));
        }
    }

    // ----- policy -----

    #[test]
    fn policy_no_dynamic_uses_scan_set() {
        let mut scan = ScanResult::default();
        scan.used.insert(Capability::Fs);
        let outcome = apply_policy(&scan, &Policy::default());
        assert!(outcome.enabled.contains(&Capability::Fs));
        assert!(!outcome.conservative_fallback);
        assert!(!outcome.enabled.contains(&Capability::WebCrypto));
    }

    #[test]
    fn policy_dynamic_falls_back_to_all() {
        let mut scan = ScanResult::default();
        scan.has_dynamic = true;
        let outcome = apply_policy(&scan, &Policy::default());
        assert!(outcome.conservative_fallback);
        assert!(outcome.enabled.len() >= ALL_CAPABILITIES.len());
    }

    #[test]
    fn policy_trim_unknown_overrides_dynamic_fallback() {
        let mut scan = ScanResult::default();
        scan.has_dynamic = true;
        scan.used.insert(Capability::Fs);
        let mut p = Policy::default();
        p.trim_unknown = true;
        let outcome = apply_policy(&scan, &p);
        assert!(!outcome.conservative_fallback);
        assert!(outcome.enabled.contains(&Capability::Fs));
        // Should not pull in WebCrypto unless something requires it.
        assert!(!outcome.enabled.contains(&Capability::WebCrypto));
    }

    #[test]
    fn policy_include_adds_capability() {
        let scan = ScanResult::default();
        let mut p = Policy::default();
        p.include.insert(Capability::Sqlite);
        let outcome = apply_policy(&scan, &p);
        assert!(outcome.enabled.contains(&Capability::Sqlite));
    }

    #[test]
    fn policy_exclude_removes_when_safe() {
        let mut scan = ScanResult::default();
        scan.used.insert(Capability::Fs);
        scan.used.insert(Capability::Sqlite);
        let mut p = Policy::default();
        p.exclude.insert(Capability::Sqlite);
        let outcome = apply_policy(&scan, &p);
        assert!(!outcome.enabled.contains(&Capability::Sqlite));
        assert!(outcome.ineffective_excludes.is_empty());
    }

    #[test]
    fn policy_exclude_re_added_via_closure_is_ineffective() {
        // User asks to exclude Buffer, but they also use NodeFetch which transitively
        // requires Buffer → exclude is reported as ineffective.
        let mut scan = ScanResult::default();
        scan.used.insert(Capability::NodeFetch);
        let mut p = Policy::default();
        p.exclude.insert(Capability::Buffer);
        let outcome = apply_policy(&scan, &p);
        assert!(outcome.enabled.contains(&Capability::Buffer));
        assert!(outcome.ineffective_excludes.contains(&Capability::Buffer));
    }

    // ----- transitive resolution via scan_entry_point -----

    #[test]
    fn entry_point_follows_relative_import() {
        let dir = camino_tempfile_workaround();
        let helper = dir.join("helper.js");
        std::fs::write(&helper, "import 'node:fs';\nexport const x = 1;").unwrap();
        let entry = dir.join("entry.js");
        std::fs::write(&entry, "import './helper.js';\n").unwrap();
        let r = scan_entry_point(&entry);
        assert!(r.used.contains(&Capability::Fs));
        assert!(r.used.contains(&Capability::FsModuleLoader));
        assert!(r.warnings.is_empty(), "warnings: {:?}", r.warnings);
    }

    #[test]
    fn file_url_import_uses_fs_module_loader_without_node_fs() {
        let r = scan_module(
            Utf8Path::new("entry.js"),
            "import 'file:///tmp/plugin.mjs';\n",
        );
        assert!(r.used.contains(&Capability::FsModuleLoader));
        assert!(!r.used.contains(&Capability::Fs));
    }

    #[test]
    fn entry_point_resolves_extensionless() {
        let dir = camino_tempfile_workaround();
        let helper = dir.join("util.js");
        std::fs::write(&helper, "import 'node:os';").unwrap();
        let entry = dir.join("a.js");
        std::fs::write(&entry, "import './util';\n").unwrap();
        let r = scan_entry_point(&entry);
        assert!(r.used.contains(&Capability::Os));
    }

    #[test]
    fn entry_point_resolves_index_js() {
        let dir = camino_tempfile_workaround();
        let sub = dir.join("lib");
        std::fs::create_dir_all(&sub).unwrap();
        std::fs::write(sub.join("index.js"), "import 'node:path';").unwrap();
        let entry = dir.join("a.js");
        std::fs::write(&entry, "import './lib';\n").unwrap();
        let r = scan_entry_point(&entry);
        assert!(r.used.contains(&Capability::Path));
    }

    #[test]
    fn entry_point_handles_cycles() {
        let dir = camino_tempfile_workaround();
        std::fs::write(dir.join("a.js"), "import './b.js';\nimport 'node:fs';").unwrap();
        std::fs::write(dir.join("b.js"), "import './a.js';\nimport 'node:os';").unwrap();
        let r = scan_entry_point(&dir.join("a.js"));
        assert!(r.used.contains(&Capability::Fs));
        assert!(r.used.contains(&Capability::Os));
    }

    #[test]
    fn entry_point_unresolvable_yields_warning() {
        let dir = camino_tempfile_workaround();
        let entry = dir.join("a.js");
        std::fs::write(&entry, "import './does-not-exist.js';").unwrap();
        let r = scan_entry_point(&entry);
        assert!(
            r.warnings
                .iter()
                .any(|w| matches!(&w.kind, WarningKind::UnresolvableImport(s) if s.contains("does-not-exist")))
        );
    }

    /// Make a unique temp directory for a single test. Avoids needing the
    /// camino-tempfile crate in normal deps; uses std::env::temp_dir.
    fn camino_tempfile_workaround() -> Utf8PathBuf {
        use std::sync::atomic::{AtomicU32, Ordering};
        static N: AtomicU32 = AtomicU32::new(0);
        let id = N.fetch_add(1, Ordering::Relaxed);
        let pid = std::process::id();
        let mut p = Utf8PathBuf::from_path_buf(std::env::temp_dir()).unwrap();
        p.push(format!("wasm-rquickjs-cap-scan-{pid}-{id}"));
        let _ = std::fs::remove_dir_all(&p);
        std::fs::create_dir_all(&p).unwrap();
        p
    }
}
