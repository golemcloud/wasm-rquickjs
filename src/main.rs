use crate::cli::{Args, Command};
use clap::Parser;
use wasm_rquickjs::{generate_dts, generate_wrapper_crate};

mod cli;

fn main() {
    let args = Args::parse();
    match &args.command {
        Command::GenerateWrapperCrate {
            js,
            wit,
            output,
            world,
        } => {
            if let Err(err) = generate_wrapper_crate(wit, js, output, world.as_deref()) {
                eprintln!("Error generating wrapper crate: {err:#}");
                std::process::exit(1);
            }
        }
        Command::GenerateDTS { wit, output, world } => {
            if let Err(err) = generate_dts(wit, output, world.as_deref()) {
                eprintln!("Error generating TypeScript .d.ts: {err:#}");
                std::process::exit(1);
            }
        }
    };
}
