use crate::cli::{Args, Command};
use clap::Parser;
use wasm_rquickjs::{EmbeddingMode, JsModuleSpec, generate_dts, generate_wrapper_crate};

mod cli;

fn main() {
    let args = Args::parse();
    match &args.command {
        Command::GenerateWrapperCrate {
            js: maybe_js,
            js_modules,
            wit,
            output,
            world,
        } => {
            let modules = if let Some(js) = maybe_js {
                vec![JsModuleSpec {
                    name: "bundle/script_module".to_string(),
                    mode: EmbeddingMode::EmbedFile(js.clone()),
                }]
            } else {
                js_modules.iter().cloned().map(JsModuleSpec::from).collect()
            };

            if let Err(err) = generate_wrapper_crate(wit, &modules, output, world.as_deref()) {
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
