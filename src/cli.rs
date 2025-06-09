use camino::Utf8PathBuf;
use clap::Parser;

/// Wraps a JavaScript module as a WASM Component using Rust and the rquickjs crate
#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
pub struct Args {
    /// Path to the JavaScript module to wrap
    #[arg(long)]
    pub js: Utf8PathBuf,

    /// Path to the WIT package the JavaScript module implements
    #[arg(long)]
    pub wit: Utf8PathBuf,

    /// Path of the directory to generate the wrapper crate to
    #[arg(long)]
    pub output: Utf8PathBuf,

    /// The WIT world to use
    #[arg(long)]
    pub world: Option<String>,
}
