use crate::cli::{Args, Command};
use camino::Utf8PathBuf;
use clap::Parser;
use wasm_rquickjs::capability_scan::{
    ALL_CAPABILITIES, Capability, Policy, ScanResult, apply_policy, enabled_bits, scan_entry_point,
};
use wasm_rquickjs::{
    EmbeddingMode, JsModuleSpec, generate_dts_with_target, generate_wrapper_crate_with_target,
};

mod cli;

fn capability_policy(
    paths: &[Utf8PathBuf],
    scan_sources: bool,
    include: &[String],
    exclude: &[String],
    trim_unknown: bool,
) -> anyhow::Result<u64> {
    let parse = |names: &[String]| {
        names
            .iter()
            .map(|name| {
                Capability::from_marker_name(name)
                    .ok_or_else(|| anyhow::anyhow!("Unknown capability: {name}"))
            })
            .collect::<anyhow::Result<_>>()
    };
    let mut scan = ScanResult::default();
    if scan_sources {
        for path in paths {
            let result = scan_entry_point(path);
            scan.used.extend(result.used);
            scan.unknown_specifiers.extend(result.unknown_specifiers);
            scan.wit_specifiers.extend(result.wit_specifiers);
            scan.warnings.extend(result.warnings);
            scan.has_dynamic |= result.has_dynamic;
        }
    } else {
        scan.used.extend(ALL_CAPABILITIES.iter().copied());
    }
    let outcome = apply_policy(
        &scan,
        &Policy {
            include: parse(include)?,
            exclude: parse(exclude)?,
            trim_unknown,
        },
    );
    eprintln!(
        "Unknown modules: {:?}; host modules: {:?}",
        scan.unknown_specifiers, scan.wit_specifiers
    );
    for warning in &scan.warnings {
        eprintln!("{}:{}: {:?}", warning.line, warning.column, warning.kind);
    }
    eprintln!("Conservative fallback: {}", outcome.conservative_fallback);
    eprintln!("Ineffective excludes: {:?}", outcome.ineffective_excludes);
    eprintln!(
        "Enabled {}/{} capabilities: {}",
        outcome.enabled.len(),
        ALL_CAPABILITIES.len(),
        outcome
            .enabled
            .iter()
            .map(|cap| cap.marker_name())
            .collect::<Vec<_>>()
            .join(", ")
    );
    Ok(enabled_bits(outcome.enabled))
}

fn dce(bytes: &[u8]) -> anyhow::Result<Vec<u8>> {
    let result = wasm_eliminator::eliminate(bytes)?;
    eprintln!(
        "Strict DCE: {} -> {} bytes; root imports: {} -> {}; trusted assumptions: {}",
        bytes.len(),
        result.wasm.len(),
        result.report.root_imports_before.len(),
        result.report.root_imports_after.len(),
        result.report.trusted_assumptions
    );
    Ok(result.wasm)
}

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
        Command::Dce { input, output } => {
            let result = (|| -> anyhow::Result<()> {
                let optimized = dce(&std::fs::read(input)?)?;
                std::fs::write(output, optimized)?;
                Ok(())
            })();
            if let Err(err) = result {
                eprintln!("Error running strict DCE: {err:#}");
                std::process::exit(1);
            }
        }
        Command::ScanCapabilities {
            js,
            include,
            exclude,
            trim_unknown,
        } => {
            if let Err(err) = capability_policy(js, true, include, exclude, *trim_unknown) {
                eprintln!("Error scanning capabilities: {err:#}");
                std::process::exit(1);
            }
        }
        Command::InjectJs {
            input,
            output,
            js: js_paths,
            include,
            exclude,
            auto_trim,
            trim_unknown,
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
            if *auto_trim || !include.is_empty() || !exclude.is_empty() {
                let result = (|| -> anyhow::Result<()> {
                    let bits =
                        capability_policy(js_paths, *auto_trim, include, exclude, *trim_unknown)?;
                    let bytes = std::fs::read(output)?;
                    let patched = wasm_rquickjs::patch_capability_gates_in_bytes(&bytes, bits)?;
                    std::fs::write(output, dce(&patched)?)?;
                    Ok(())
                })();
                if let Err(err) = result {
                    eprintln!("Error specializing component (output remains unoptimized): {err:#}");
                    std::process::exit(1);
                }
            }
        }
    };
}
