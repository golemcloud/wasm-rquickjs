use camino::{Utf8Path, Utf8PathBuf};
use clap::{Parser, Subcommand, ValueEnum};
use std::str::FromStr;
use wasm_rquickjs::{
    DependencySpec, EmbeddingMode, GenerationTarget, JsModuleSpec, NativeModuleSpec,
};

/// The WASI generation target selectable on the command line.
#[derive(ValueEnum, Debug, Clone, Copy, Default, PartialEq, Eq)]
pub enum WasiTarget {
    /// WASI Preview 2 (default): synchronous exports, full Node.js builtins.
    #[default]
    #[value(name = "wasi-p2")]
    WasiP2,
    /// WASI Preview 3 (opt-in): component-model async support and the Preview 3 runtime spine.
    #[value(name = "wasi-p3")]
    WasiP3,
}

impl From<WasiTarget> for GenerationTarget {
    fn from(value: WasiTarget) -> Self {
        match value {
            WasiTarget::WasiP2 => GenerationTarget::WasiP2,
            WasiTarget::WasiP3 => GenerationTarget::WasiP3,
        }
    }
}

/// Wraps a JavaScript module as a WASM Component using Rust and the rquickjs crate
#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
pub struct Args {
    #[command(subcommand)]
    pub command: Command,
}

#[derive(Subcommand, Debug)]
pub enum Command {
    /// Generate the wrapper crate for a JavaScript module
    GenerateWrapperCrate {
        /// Path to the JavaScript module to wrap
        #[arg(long, conflicts_with = "js_modules")]
        js: Option<Utf8PathBuf>,

        /// Advanced list of pairs consisting JS module names and how they should be loaded.
        /// The format should be `name=from`, where `from` is either `@composition` or a path to
        /// a JS module to be embedded
        #[arg(long, conflicts_with = "js")]
        js_modules: Vec<JsModuleSpecArg>,

        /// Path to the WIT package the JavaScript module implements
        #[arg(long)]
        wit: Utf8PathBuf,

        /// Path of the directory to generate the wrapper crate to
        #[arg(long)]
        output: Utf8PathBuf,

        /// The WIT world to use
        #[arg(long)]
        world: Option<String>,

        /// The WASI generation target. `wasi-p2` (default) generates the historical
        /// synchronous Preview 2 wrapper; `wasi-p3` generates the opt-in Preview 3 wrapper.
        #[arg(long, value_enum, default_value_t = WasiTarget::WasiP2)]
        target: WasiTarget,

        /// A Rust module JavaScript can import, as `name=rust::path::Type`, where the type
        /// implements `rquickjs::module::ModuleDef`. Add its crate with `--dependency`. It takes
        /// precedence over a schemeless builtin alias with the same name, such as `fs`
        #[arg(long)]
        native_module: Vec<NativeModuleSpecArg>,

        /// A `[dependencies]` entry of the generated crate, as `key=<TOML value>`, for example
        /// `my-crate={ path = "../my-crate" }`. It replaces an entry with the same key. A
        /// relative `path` is resolved against the current directory. With any dependency, the
        /// skeleton's `Cargo.lock` is not copied
        #[arg(long)]
        dependency: Vec<DependencySpecArg>,
    },
    /// Generate TypeScript module definitions
    GenerateDTS {
        /// Path to the WIT package the JavaScript module implements
        #[arg(long)]
        wit: Utf8PathBuf,

        /// Path of the directory to generate the wrapper crate to
        #[arg(long)]
        output: Utf8PathBuf,

        /// The WIT world to use
        #[arg(long)]
        world: Option<String>,

        /// The WASI generation target whose JavaScript export contract is described.
        #[arg(long, value_enum, default_value_t = WasiTarget::WasiP2)]
        target: WasiTarget,
    },
    /// Pre-initialize a WebAssembly component using Wizer to speed up startup
    Optimize {
        /// Path to the input WebAssembly component
        #[arg(long)]
        input: Utf8PathBuf,

        /// Path for the pre-initialized output WebAssembly component
        #[arg(long)]
        output: Utf8PathBuf,

        /// Initialization function name
        #[arg(long, default_value = "wizer-initialize")]
        init_func: String,
    },
    /// Inject JavaScript source into a compiled WASM component template
    InjectJs {
        /// Path to the template WASM component (compiled with --js-modules name=@slot)
        #[arg(long)]
        input: Utf8PathBuf,

        /// Path for the output WASM component with injected JS
        #[arg(long)]
        output: Utf8PathBuf,

        /// Path(s) to JavaScript source file(s) to inject. Order must match the
        /// BinarySlot module order used during crate generation (primary module first,
        /// then additional modules in order).
        #[arg(long, required = true)]
        js: Vec<Utf8PathBuf>,
    },
}

#[derive(Debug, Clone)]
pub struct NativeModuleSpecArg(pub NativeModuleSpec);

impl FromStr for NativeModuleSpecArg {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let (name, module_def) = s
            .split_once('=')
            .ok_or_else(|| format!("Invalid native module spec: {s}"))?;
        Ok(NativeModuleSpecArg(NativeModuleSpec {
            name: name.to_string(),
            module_def: module_def.to_string(),
        }))
    }
}

#[derive(Debug, Clone)]
pub struct DependencySpecArg(pub DependencySpec);

impl FromStr for DependencySpecArg {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let (key, value) = s
            .split_once('=')
            .ok_or_else(|| format!("Invalid dependency spec: {s}"))?;
        Ok(DependencySpecArg(DependencySpec {
            key: key.trim().to_string(),
            value: value.trim().to_string(),
        }))
    }
}

#[derive(Debug, Clone)]
pub struct JsModuleSpecArg {
    pub name: String,
    pub mode: EmbeddingMode,
}

impl From<JsModuleSpecArg> for JsModuleSpec {
    fn from(value: JsModuleSpecArg) -> Self {
        JsModuleSpec {
            name: value.name,
            mode: value.mode,
        }
    }
}

impl FromStr for JsModuleSpecArg {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let parts: Vec<&str> = s.splitn(2, '=').collect();
        if parts.len() != 2 {
            return Err(format!("Invalid JS module spec: {s}"));
        }
        let name = parts[0].to_string();
        let mode = match parts[1] {
            "@composition" => EmbeddingMode::Composition,
            "@slot" => EmbeddingMode::BinarySlot,
            path => EmbeddingMode::EmbedFile(Utf8Path::new(path).to_path_buf()),
        };
        Ok(JsModuleSpecArg { name, mode })
    }
}
