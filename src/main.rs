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
        Command::ScanCapabilities {
            js: js_paths,
            include,
            exclude,
            trim_unknown,
        } => {
            use std::collections::BTreeSet;
            use wasm_rquickjs::capability_scan::{
                ALL_CAPABILITIES, Capability, Policy, ScanResult, apply_policy, scan_entry_point,
            };

            // Parse --include / --exclude as capability marker names.
            let parse_caps = |label: &str, raw: &[String]| -> BTreeSet<Capability> {
                raw.iter()
                    .map(|name| {
                        Capability::from_marker_name(name).unwrap_or_else(|| {
                            eprintln!(
                                "Unknown capability '{name}' for --{label}.\nKnown capabilities:"
                            );
                            for c in ALL_CAPABILITIES {
                                eprintln!("  {}", c.marker_name());
                            }
                            std::process::exit(2);
                        })
                    })
                    .collect()
            };

            let policy = Policy {
                include: parse_caps("include", include),
                exclude: parse_caps("exclude", exclude),
                trim_unknown: *trim_unknown,
            };

            // Union scans across all entry points.
            let mut combined = ScanResult::default();
            for path in js_paths {
                let r = scan_entry_point(path.as_path());
                combined.used.extend(r.used);
                combined.unknown_specifiers.extend(r.unknown_specifiers);
                combined.wit_specifiers.extend(r.wit_specifiers);
                for w in r.warnings {
                    combined.warnings.push(w);
                }
                combined.has_dynamic |= r.has_dynamic;
            }

            println!(
                "Capabilities directly used by JS ({}):",
                combined.used.len()
            );
            for cap in &combined.used {
                println!("  - {} ({:?})", cap.marker_name(), cap);
            }

            if !combined.wit_specifiers.is_empty() {
                println!(
                    "\nWIT-style component imports ({}):",
                    combined.wit_specifiers.len()
                );
                for s in &combined.wit_specifiers {
                    println!("  - {s}");
                }
            }

            if !combined.unknown_specifiers.is_empty() {
                println!(
                    "\nUnknown bare specifiers ({}):",
                    combined.unknown_specifiers.len()
                );
                for s in &combined.unknown_specifiers {
                    println!("  - {s}");
                }
            }

            if !combined.warnings.is_empty() {
                println!("\nWarnings ({}):", combined.warnings.len());
                for w in &combined.warnings {
                    println!("  [{}:{}] {:?} — {}", w.line, w.column, w.kind, w.source);
                }
            }

            println!(
                "\nDynamic patterns affecting analysis precision: {}",
                combined.has_dynamic
            );

            let outcome = apply_policy(&combined, &policy);
            let total = ALL_CAPABILITIES.len();
            let kept = outcome.enabled.len();

            println!(
                "\nEnabled after policy ({} of {} = {:.0}%):",
                kept,
                total,
                100.0 * kept as f64 / total as f64
            );
            for cap in &outcome.enabled {
                let direct = combined.used.contains(cap);
                let included = policy.include.contains(cap);
                let tag = match (direct, included) {
                    (true, _) => "(used)",
                    (false, true) => "(forced via --include)",
                    (false, false) => "(transitive dep)",
                };
                println!("  - {} {tag}", cap.marker_name());
            }

            if outcome.conservative_fallback {
                println!(
                    "\nNOTE: dynamic patterns triggered the conservative fallback \
                     (enable everything). Pass --trim-unknown to override."
                );
            }

            if !outcome.ineffective_excludes.is_empty() {
                println!("\nIneffective --exclude flags (re-added by transitive closure):");
                for c in &outcome.ineffective_excludes {
                    println!("  - {}", c.marker_name());
                }
            }

            let trimmed: Vec<_> = ALL_CAPABILITIES
                .iter()
                .filter(|c| !outcome.enabled.contains(c))
                .collect();
            println!("\nTrimmable capabilities ({} of {}):", trimmed.len(), total);
            for c in &trimmed {
                println!("  - {}", c.marker_name());
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

            // Decide whether to patch the capability-gates slot.
            let want_patch = *auto_trim || !include.is_empty() || !exclude.is_empty();

            if want_patch {
                use std::collections::BTreeSet;
                use wasm_rquickjs::capability_scan::{
                    ALL_CAPABILITIES, Capability, Policy, ScanResult, apply_policy,
                    enabled_bits, scan_entry_point,
                };

                // Helper to parse capability marker names from `--include`/`--exclude`
                // with the same error reporting as `scan-capabilities`.
                let parse_caps = |label: &str, raw: &[String]| -> BTreeSet<Capability> {
                    raw.iter()
                        .map(|name| {
                            Capability::from_marker_name(name).unwrap_or_else(|| {
                                eprintln!(
                                    "Unknown capability '{name}' for --{label}.\nKnown capabilities:"
                                );
                                for c in ALL_CAPABILITIES {
                                    eprintln!("  {}", c.marker_name());
                                }
                                std::process::exit(2);
                            })
                        })
                        .collect()
                };

                // Starting set:
                //   --auto-trim → scan the JS and use the (closed) used set.
                //   no --auto-trim → start from "everything enabled" so that
                //     `--exclude X` removes a single capability and `--include`
                //     is a no-op on the always-on baseline.
                let scan = if *auto_trim {
                    let mut combined = ScanResult::default();
                    for path in js_paths {
                        let s = scan_entry_point(path);
                        combined.used.extend(s.used);
                        combined.unknown_specifiers.extend(s.unknown_specifiers);
                        combined.wit_specifiers.extend(s.wit_specifiers);
                        combined.warnings.extend(s.warnings);
                        combined.has_dynamic |= s.has_dynamic;
                    }
                    combined
                } else {
                    let mut all_on = ScanResult::default();
                    all_on.used.extend(ALL_CAPABILITIES.iter().copied());
                    all_on
                };

                let policy = Policy {
                    include: parse_caps("include", include),
                    exclude: parse_caps("exclude", exclude),
                    trim_unknown: *trim_unknown,
                };
                let outcome = apply_policy(&scan, &policy);

                if outcome.conservative_fallback {
                    eprintln!(
                        "Note: dynamic JS patterns detected; falling back to enabling all \
                         capabilities. Pass --trim-unknown to override (use with care)."
                    );
                }
                if !outcome.ineffective_excludes.is_empty() {
                    eprintln!(
                        "Note: ignored --exclude entries that are transitive dependencies \
                         of an enabled capability:"
                    );
                    for c in &outcome.ineffective_excludes {
                        eprintln!("  - {}", c.marker_name());
                    }
                }

                let bits = enabled_bits(outcome.enabled.iter().copied());

                eprintln!(
                    "Patching capability gates: enabling {} of {} capabilities",
                    outcome.enabled.len(),
                    ALL_CAPABILITIES.len()
                );

                // Stage to the output path, then patch + inject in two steps so
                // the user gets a single output even when both happen.
                let staging = output.with_extension("wasm.staging");
                if let Err(err) =
                    wasm_rquickjs::patch_capability_gates(input, &staging, bits)
                {
                    eprintln!("Error patching capability gates: {err:#}");
                    std::process::exit(1);
                }
                if let Err(err) =
                    wasm_rquickjs::inject_js_into_component(&staging, output, &js_refs)
                {
                    eprintln!("Error injecting JS: {err:#}");
                    let _ = std::fs::remove_file(staging.as_std_path());
                    std::process::exit(1);
                }
                let _ = std::fs::remove_file(staging.as_std_path());
            } else if let Err(err) =
                wasm_rquickjs::inject_js_into_component(input, output, &js_refs)
            {
                eprintln!("Error injecting JS: {err:#}");
                std::process::exit(1);
            }
        }
    };
}
