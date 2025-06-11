use camino::Utf8PathBuf;
use clap::{Parser, Subcommand};

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
        #[arg(long)]
        js: Utf8PathBuf,

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
    }
}
