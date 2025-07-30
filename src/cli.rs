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
            path => EmbeddingMode::EmbedFile(Utf8Path::new(path).to_path_buf()),
        };
        Ok(JsModuleSpecArg { name, mode })
    }
}
