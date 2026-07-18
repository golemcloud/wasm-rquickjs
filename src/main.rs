use crate::cli::{Args, Command};
use clap::Parser;
use wasm_rquickjs::{
    EmbeddingMode, JsModuleSpec, generate_dts_with_target, generate_wrapper_crate_with_target,
};

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
            target,
        } => {
            let modules = if let Some(js) = maybe_js {
                vec![JsModuleSpec {
                    name: "bundle/script_module".to_string(),
                    mode: EmbeddingMode::EmbedFile(js.clone()),
                }]
            } else {
                js_modules.iter().cloned().map(JsModuleSpec::from).collect()
            };

            if let Err(err) = generate_wrapper_crate_with_target(
                wit,
                &modules,
                output,
                world.as_deref(),
                (*target).into(),
            ) {
                eprintln!("Error generating wrapper crate: {err:#}");
                std::process::exit(1);
            }
        }
        Command::GenerateDTS {
            wit,
            output,
            world,
            target,
        } => {
            if let Err(err) =
                generate_dts_with_target(wit, output, world.as_deref(), (*target).into())
            {
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
        Command::InjectJs {
            input,
            output,
            js: js_paths,
        } => {
            let js_sources: Vec<String> = js_paths
                .iter()
                .map(|path| {
                    std::fs::read_to_string(path.as_std_path()).unwrap_or_else(|err| {
                        eprintln!("Error reading JS file {path}: {err:#}");
                        std::process::exit(1);
                    })
                })
                .collect();
            let js_refs: Vec<&str> = js_sources.iter().map(|s| s.as_str()).collect();
            if let Err(err) = wasm_rquickjs::inject_js_into_component(input, output, &js_refs) {
                eprintln!("Error injecting JS: {err:#}");
                std::process::exit(1);
            }
        }
    };
}
