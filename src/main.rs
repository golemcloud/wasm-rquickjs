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
        Command::Optimize {
            input,
            output,
            init_func,
        } => {
            let rt = tokio::runtime::Builder::new_current_thread()
                .enable_all()
                .build()
                .expect("Failed to create tokio runtime");
            if let Err(err) =
                rt.block_on(wasm_rquickjs::optimize_component(input, output, init_func))
            {
                eprintln!("Error optimizing component: {err:#}");
                std::process::exit(1);
            }
        }
        Command::InjectJs { input, output, js } => {
            let js_source = std::fs::read_to_string(js.as_std_path()).unwrap_or_else(|err| {
                eprintln!("Error reading JS file: {err:#}");
                std::process::exit(1);
            });
            if let Err(err) = wasm_rquickjs::inject_js_into_component(input, output, &js_source) {
                eprintln!("Error injecting JS: {err:#}");
                std::process::exit(1);
            }
        }
    };
}
