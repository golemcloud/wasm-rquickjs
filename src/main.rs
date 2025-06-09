use crate::cli::Args;
use clap::Parser;
use wasm_rquickjs::generate_wrapper_crate;

mod cli;

fn main() {
    let args = Args::parse();
    if let Err(err) =
        generate_wrapper_crate(&args.wit, &args.js, &args.output, args.world.as_deref())
    {
        eprintln!("Error generating wrapper crate: {err:#}");
        std::process::exit(1);
    }
}
