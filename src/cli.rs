use camino::{Utf8Path, Utf8PathBuf};
use clap::{Parser, Subcommand};
use std::str::FromStr;
use wasm_rquickjs::{EmbeddingMode, JsModuleSpec};

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
    /// Scan a JavaScript module and report which skeleton built-ins it appears to use.
    /// This is a research/diagnostic tool for the per-app trimming work.
    ScanCapabilities {
        /// Path(s) to JavaScript entry-point files to scan. Each file is scanned
        /// recursively (relative imports are followed transitively); the union of
        /// all results is reported.
        #[arg(long, required = true)]
        js: Vec<Utf8PathBuf>,

        /// Force-include a capability by its marker name (e.g. `fs`, `node_http`).
        /// Repeatable.
        #[arg(long = "include")]
        include: Vec<String>,

        /// Force-exclude a capability by its marker name (e.g. `vm`, `sqlite`).
        /// Repeatable. Excludes that conflict with a transitively-required
        /// capability are reported as ineffective and remain enabled.
        #[arg(long = "exclude")]
        exclude: Vec<String>,

        /// When set, trim aggressively even if the JS contains dynamic patterns
        /// (`require(varName)`, `import(expr)`, `eval`, `new Function`, `vm.run*`).
        /// Default behavior is conservative: any dynamic pattern → enable
        /// every known capability.
        #[arg(long = "trim-unknown", default_value_t = false)]
        trim_unknown: bool,
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

        /// Force-include a capability by its marker name when patching the
        /// capability-gates slot (e.g. `fs`, `node_http`). Repeatable.
        ///
        /// Implies enabling per-capability gate patching: when neither
        /// `--include`, `--exclude`, nor `--auto-trim` is set, the gates slot
        /// is left untouched and every capability stays enabled.
        #[arg(long = "include")]
        include: Vec<String>,

        /// Force-exclude a capability by its marker name. Repeatable.
        /// Excludes that conflict with a transitively-required capability are
        /// reported as ineffective and remain enabled.
        #[arg(long = "exclude")]
        exclude: Vec<String>,

        /// Scan the JS sources, then patch the capability-gates slot to enable
        /// only the capabilities the scanner reports as needed (after
        /// dependency closure). `--include` / `--exclude` further refine the
        /// scanner's result.
        #[arg(long = "auto-trim", default_value_t = false)]
        auto_trim: bool,

        /// When set with `--auto-trim`, also trim aggressively even if the JS
        /// contains dynamic patterns (`require(varName)`, `import(expr)`,
        /// `eval`, `new Function`, `vm.run*`). Default behavior is conservative.
        #[arg(long = "trim-unknown", default_value_t = false)]
        trim_unknown: bool,
    },
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
