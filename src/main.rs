use crate::cli::{Args, Command};
use anyhow::Context;
use clap::Parser;
use camino::Utf8Path;
use std::collections::{BTreeMap, BTreeSet};
use wasm_rquickjs::capability_scan::ALL_CAPABILITIES;
use wasm_rquickjs::{EmbeddingMode, JsModuleSpec, generate_dts, generate_wrapper_crate};

mod cli;

const CAPABILITY_ROOTS_SECTION: &str = "wasm-rquickjs.capability-roots";
const CAPABILITY_ROOTS_MAGIC: &[u8; 8] = b"WRQJSCAP";
const CAPABILITY_ROOTS_VERSION: u8 = 1;
const ROOT_KIND_INDIRECT_ANY: u8 = 0;
const ROOT_KIND_DIRECT_SCRUB: u8 = 1;

fn auto_trim_dce_in_place(path: &Utf8Path, enabled_bits: u64) -> anyhow::Result<()> {
    let before = std::fs::read(path.as_std_path())
        .with_context(|| format!("Failed to read injected component: {path}"))?;
    let component_options = component_dce_options_from_capability_roots(&before, enabled_bits)
        .context("building wasm-eliminator options from capability metadata")?;
    let options = wasm_eliminator::DceOptions {
        component: component_options,
        ..Default::default()
    };
    let after = wasm_eliminator::dce_with_options(&before, &options)
        .context("running wasm-eliminator after capability gate patching")?;
    std::fs::write(path.as_std_path(), &after)
        .with_context(|| format!("Failed to write DCE'd component: {path}"))?;
    eprintln!(
        "wasm-eliminator auto-trim: {} B -> {} B",
        before.len(),
        after.len()
    );
    Ok(())
}

fn component_dce_options_from_capability_roots(
    bytes: &[u8],
    enabled_bits: u64,
) -> anyhow::Result<wasm_eliminator::component::DceOptions> {
    let ir = wasm_eliminator::component::ir::parse(bytes)
        .context("parsing component to locate embedded core modules")?;
    component_dce_options_from_ir(&ir, enabled_bits)
}

fn component_dce_options_from_ir(
    ir: &wasm_eliminator::component::ir::ComponentIr<'_>,
    enabled_bits: u64,
) -> anyhow::Result<wasm_eliminator::component::DceOptions> {
    let mut options = wasm_eliminator::component::DceOptions::default();

    for (module_idx, module) in ir.module_entries.iter().enumerate() {
        if let Some(hints) = producer_hints_from_capability_roots(module, enabled_bits)? {
            options.module_hints.insert(module_idx as u32, hints);
        }
    }

    for (component_idx, component) in ir.nested_components.iter().enumerate() {
        let child = component_dce_options_from_ir(component, enabled_bits)?;
        if child != wasm_eliminator::component::DceOptions::default() {
            options.nested_components.insert(component_idx as u32, child);
        }
    }

    Ok(options)
}

fn producer_hints_from_capability_roots(
    module: &[u8],
    enabled_bits: u64,
) -> anyhow::Result<Option<wasm_eliminator::core::analyze::ProducerHints>> {
    let mut hints = wasm_eliminator::core::analyze::ProducerHints::default();
    let mut saw_metadata = false;
    hints.foldable_globals = capability_foldable_globals(module, enabled_bits)?;

    for payload in wasmparser_encoder::Parser::new(0).parse_all(module) {
        let payload = payload.context("parsing embedded core module")?;
        let wasmparser_encoder::Payload::CustomSection(section) = payload else {
            continue;
        };
        if section.name() != CAPABILITY_ROOTS_SECTION {
            continue;
        }
        saw_metadata = true;
        apply_capability_roots_section(section.data(), enabled_bits, &mut hints)?;
    }

    if saw_metadata || !hints.foldable_globals.is_empty() {
        Ok(Some(hints))
    } else {
        Ok(None)
    }
}

fn capability_foldable_globals(
    module: &[u8],
    enabled_bits: u64,
) -> anyhow::Result<std::collections::BTreeMap<u32, wasm_eliminator::core::const_fold::ConstValue>> {
    let mut imported_globals = 0u32;
    let mut defined_i32_consts = Vec::new();

    for payload in wasmparser_encoder::Parser::new(0).parse_all(module) {
        match payload.context("parsing embedded core module")? {
            wasmparser_encoder::Payload::ImportSection(section) => {
                for imports in section {
                    imported_globals += imported_global_count_for_imports(imports?)?;
                }
            }
            wasmparser_encoder::Payload::GlobalSection(section) => {
                for (defined_idx, global) in section.into_iter().enumerate() {
                    let global = global?;
                    if global.ty.mutable {
                        continue;
                    }
                    let mut reader = global.init_expr.get_operators_reader();
                    let value = match (reader.read(), reader.read()) {
                        (
                            Ok(wasmparser_encoder::Operator::I32Const { value }),
                            Ok(wasmparser_encoder::Operator::End),
                        ) => value,
                        _ => continue,
                    };
                    defined_i32_consts.push((imported_globals + defined_idx as u32, value));
                }
            }
            _ => {}
        }
    }

    let count = ALL_CAPABILITIES.len();
    if defined_i32_consts.len() < count {
        return Ok(Default::default());
    }
    let Some(window_start) = defined_i32_consts.windows(count).position(|window| {
        window.iter().enumerate().all(|(idx, (_, value))| {
            *value == ((enabled_bits >> ALL_CAPABILITIES[idx].bit_index()) & 1) as i32
        })
    }) else {
        return Ok(Default::default());
    };
    let capability_globals = &defined_i32_consts[window_start..window_start + count];

    Ok(capability_globals
        .iter()
        .map(|(global_idx, value)| {
            (
                *global_idx,
                wasm_eliminator::core::const_fold::ConstValue::I32(*value),
            )
        })
        .collect())
}

fn imported_global_count_for_imports(imports: wasmparser_encoder::Imports<'_>) -> anyhow::Result<u32> {
    Ok(match imports {
        wasmparser_encoder::Imports::Single(_, import) => {
            imported_global_count_for_type_ref(import.ty, 1)
        }
        wasmparser_encoder::Imports::Compact1 { items, .. } => {
            let mut count = 0;
            for item in items {
                count += imported_global_count_for_type_ref(item?.ty, 1);
            }
            count
        }
        wasmparser_encoder::Imports::Compact2 { ty, names, .. } => {
            imported_global_count_for_type_ref(ty, names.count())
        }
    })
}

fn imported_global_count_for_type_ref(ty: wasmparser_encoder::TypeRef, names_count: u32) -> u32 {
    match ty {
        wasmparser_encoder::TypeRef::Global(_) => names_count,
        _ => 0,
    }
}

fn apply_capability_roots_section(
    data: &[u8],
    enabled_bits: u64,
    hints: &mut wasm_eliminator::core::analyze::ProducerHints,
) -> anyhow::Result<()> {
    anyhow::ensure!(
        data.len() >= CAPABILITY_ROOTS_MAGIC.len() + 1 + 4,
        "malformed {CAPABILITY_ROOTS_SECTION}: header is too short"
    );
    anyhow::ensure!(
        &data[..CAPABILITY_ROOTS_MAGIC.len()] == CAPABILITY_ROOTS_MAGIC,
        "malformed {CAPABILITY_ROOTS_SECTION}: bad magic"
    );
    let version = data[CAPABILITY_ROOTS_MAGIC.len()];
    anyhow::ensure!(
        version == CAPABILITY_ROOTS_VERSION,
        "unsupported {CAPABILITY_ROOTS_SECTION} version {version}"
    );

    let mut offset = CAPABILITY_ROOTS_MAGIC.len() + 1;
    let count = u32::from_le_bytes(data[offset..offset + 4].try_into().unwrap()) as usize;
    offset += 4;
    anyhow::ensure!(
        data.len() == offset + count * 6,
        "malformed {CAPABILITY_ROOTS_SECTION}: wrong payload length"
    );

    let mut roots: BTreeMap<(u32, u8), BTreeSet<u8>> = BTreeMap::new();
    for _ in 0..count {
        let func = u32::from_le_bytes(data[offset..offset + 4].try_into().unwrap());
        let capability_bit = data[offset + 4];
        let kind = data[offset + 5];
        offset += 6;

        match kind {
            ROOT_KIND_INDIRECT_ANY | ROOT_KIND_DIRECT_SCRUB => {}
            other => anyhow::bail!(
                "unsupported {CAPABILITY_ROOTS_SECTION} root kind {other}"
            ),
        }

        roots.entry((func, kind)).or_default().insert(capability_bit);
    }

    for ((func, kind), capability_bits) in roots {
        let all_disabled = capability_bits
            .iter()
            .all(|capability_bit| ((enabled_bits >> *capability_bit) & 1) == 0);
        if !all_disabled {
            continue;
        }

        match kind {
            ROOT_KIND_INDIRECT_ANY => {
                hints.suppress_any_targets.insert(func);
            }
            ROOT_KIND_DIRECT_SCRUB => {
                hints.suppress_any_targets.insert(func);
                hints.scrub_direct_targets.insert(func);
            }
            _ => unreachable!("validated capability root kind while decoding"),
        }
    }

    Ok(())
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

                if let Err(err) = auto_trim_dce_in_place(output, bits) {
                    eprintln!("Error running wasm-eliminator auto-trim: {err:#}");
                    std::process::exit(1);
                }
            } else if let Err(err) =
                wasm_rquickjs::inject_js_into_component(input, output, &js_refs)
            {
                eprintln!("Error injecting JS: {err:#}");
                std::process::exit(1);
            }
        }
    };
}
