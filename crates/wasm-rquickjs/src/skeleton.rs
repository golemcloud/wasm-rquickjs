use crate::GeneratorContext;
use anyhow::anyhow;
use camino::Utf8Path;
use include_dir::{Dir, include_dir};
use toml_edit::{DocumentMut, value};

static SKELETON: Dir<'_> = include_dir!("$CARGO_MANIFEST_DIR/skeleton");

/// Generates a `Cargo.toml` file for the wrapper crate in the `context.output` directory,
/// based on `skeleton/Cargo.toml`.
///
/// Changes applied to the skeleton toml file:
/// - Changing the package name to `crate_name` (which is the name of the chosen WIT world).
pub fn generate_cargo_toml(context: &GeneratorContext<'_>) -> anyhow::Result<()> {
    // Loading the skeleton Cargo.toml file
    let cargo_toml = SKELETON
        .get_file("Cargo.toml_")
        .or_else(|| SKELETON.get_file("Cargo.toml"))
        .ok_or_else(|| anyhow!("Missing Cargo.toml skeleton"))?
        .contents_utf8()
        .ok_or_else(|| anyhow!("Cargo.toml skeleton is not valid UTF-8"))?;

    let mut doc = cargo_toml
        .parse::<DocumentMut>()
        .map_err(|err| anyhow!("Cargo.toml skeleton is not a valid TOML: {err}"))?;

    change_package_name(context, &mut doc);

    // Writing the result
    let output_path = context.output.join("Cargo.toml");
    crate::write_if_changed(output_path, doc.to_string())?;
    Ok(())
}

/// Changes the crate's package name to the selected WIT world's name
fn change_package_name(context: &GeneratorContext, doc: &mut DocumentMut) {
    let crate_name = &context.world_name;
    doc["package"]["name"] = value(crate_name);
}

/// Files in the skeleton `src/` directory that are always overwritten by code generation.
/// Skipping them avoids unnecessary timestamp changes that would trigger recompilation.
const GENERATED_FILES: &[&str] = &["src/lib.rs"];

/// Copies the skeleton's `Cargo.lock` to the output directory so that dependency
/// resolution is instant instead of resolving 300+ crates from scratch each time.
pub fn copy_skeleton_lock(output: &Utf8Path) -> anyhow::Result<()> {
    if let Some(lock_file) = SKELETON.get_file("Cargo.lock") {
        let dest = output.join("Cargo.lock");
        crate::write_if_changed(dest, lock_file.contents())?;
    }
    Ok(())
}

/// Copies all source files from the skeleton directory to `<output>/src`.
pub fn copy_skeleton_sources(output: &Utf8Path) -> anyhow::Result<()> {
    if let Some(src) = SKELETON.get_dir("src") {
        for file in src.files() {
            let src_path = Utf8Path::from_path(file.path())
                .ok_or_else(|| anyhow!("Unexpected non-UTF-8 path in skeleton"))?;
            if GENERATED_FILES.contains(&src_path.as_str()) {
                continue;
            }
            let dest_path = output.join(src_path);
            crate::write_if_changed(dest_path, file.contents())?;
        }

        recursive_copy_sources(
            src.get_dir("src/builtin")
                .ok_or_else(|| anyhow!("Missing builtin module in skeleton"))?,
            output,
        )?;
    }

    Ok(())
}

fn recursive_copy_sources(dir: &Dir, output: &Utf8Path) -> anyhow::Result<()> {
    let dir_path = Utf8Path::from_path(dir.path())
        .ok_or_else(|| anyhow!("Unexpected non-UTF-8 path in skeleton"))?;
    std::fs::create_dir_all(output.join(dir_path))?;

    for file in dir.files() {
        let src_path = Utf8Path::from_path(file.path())
            .ok_or_else(|| anyhow!("Unexpected non-UTF-8 path in skeleton"))?;
        let dest_path = output.join(src_path);
        crate::write_if_changed(dest_path, file.contents())?;
    }

    for dir in dir.dirs() {
        recursive_copy_sources(dir, output)?;
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    fn compact_whitespace(source: &str) -> String {
        source.split_whitespace().collect::<Vec<_>>().join(" ")
    }

    fn rust_string_array_after(source: &str, marker: &str) -> Vec<String> {
        let marker_pos = source
            .find(marker)
            .unwrap_or_else(|| panic!("missing array marker {marker}"));
        let initializer_pos = source[marker_pos..]
            .find('=')
            .unwrap_or_else(|| panic!("missing array initializer after {marker}"))
            + marker_pos;
        let array_start = source[initializer_pos..]
            .find('[')
            .unwrap_or_else(|| panic!("missing array start after {marker}"))
            + initializer_pos
            + 1;
        let array_end = source[array_start..]
            .find("];")
            .unwrap_or_else(|| panic!("missing array terminator after {marker}"))
            + array_start;

        source[array_start..array_end]
            .split(',')
            .map(str::trim)
            .filter(|entry| !entry.is_empty())
            .map(|entry| {
                entry
                    .strip_prefix('"')
                    .and_then(|entry| entry.strip_suffix('"'))
                    .unwrap_or_else(|| {
                        panic!("unsupported string array entry {entry:?} after {marker}")
                    })
                    .to_string()
            })
            .collect()
    }

    #[test]
    fn package_condition_sets_are_rust_owned() {
        let module_js = include_str!("../skeleton/src/builtin/module.js");
        let internal_rs = include_str!("../skeleton/src/internal.rs");
        let internal_rs_compact = compact_whitespace(internal_rs);

        assert!(
            !module_js.contains("fallbackDefaultPackageConditions"),
            "package default conditions must not have a JS fallback copy"
        );
        assert!(
            !module_js.contains("DefaultPackageConditions = ["),
            "package default conditions must not be duplicated as JS arrays"
        );
        assert!(
            !module_js.contains("emitPackageDeprecationWarning")
                && !module_js.contains("package_deprecation_warning_seen")
                && !module_js.contains("mark_package_deprecation_warning_seen"),
            "package deprecation warning emission must stay on the Rust resolver side"
        );
        assert!(
            module_js.contains("__wasm_rquickjs_package_default_conditions(mode)"),
            "module.js must request package condition defaults from the Rust provider"
        );
        assert!(
            module_js.contains("defaultPackageConditions('cjs-analysis')"),
            "CJS package conditions must request Rust's cjs-analysis defaults"
        );
        assert!(
            module_js.contains("defaultPackageConditions('import')"),
            "ESM package conditions must request Rust's import defaults"
        );
        assert!(
            module_js.contains("defaultPackageConditions('loader')"),
            "loader hook conditions must request Rust's loader defaults"
        );
        assert!(
            internal_rs.contains("\"__wasm_rquickjs_package_default_conditions\""),
            "internal.rs must register the Rust package condition provider"
        );
        assert_eq!(
            rust_string_array_after(internal_rs, "const ESM_CONDITIONS:"),
            ["golem", "node", "module-sync", "import", "default"]
        );
        assert_eq!(
            rust_string_array_after(internal_rs, "const CJS_ANALYSIS_CONDITIONS:"),
            ["golem", "node", "require", "module-sync", "default"]
        );
        assert_eq!(
            rust_string_array_after(internal_rs, "const LOADER_CONDITIONS:"),
            ["node", "import", "module-sync", "node-addons"]
        );
        assert!(
            internal_rs_compact.contains(r#""import" => Some(Self::EsmImport),"#),
            "Rust provider must map import mode to ESM defaults"
        );
        assert!(
            internal_rs_compact
                .contains(r#""cjs-analysis" | "require" => Some(Self::CjsAnalysis),"#),
            "Rust provider must map cjs-analysis and require to CJS defaults"
        );
        assert!(
            internal_rs_compact.contains(r#""loader" => Some(Self::Loader),"#),
            "Rust provider must map loader mode to loader defaults"
        );
        assert!(
            internal_rs.contains("NodePackageConditionMode::from_js_mode(&mode)")
                && internal_rs.contains("Unknown internal package condition mode")
                && internal_rs_compact.contains(r#""loader" => Some(Self::Loader),"#)
                && internal_rs_compact.contains(r#"_ => None,"#),
            "Rust provider must fail closed for unknown package condition modes"
        );
        assert!(
            internal_rs.contains("NodePackageResolveMode::from_js_mode(mode)")
                && internal_rs.contains("Unknown internal package resolution mode")
                && internal_rs.contains("NodePackageResolveMode::CjsAnalysis.condition_mode()")
                && internal_rs.contains("NodePackageResolveMode::EsmImport.condition_mode()"),
            "Rust package resolution mode parser must fail closed for unknown modes"
        );
        assert!(
            internal_rs.contains(
                "fn conditions_from_global(ctx: &Ctx<'_>, mode: NodePackageConditionMode)"
            ) && !internal_rs.contains("NodePackageResolveMode::EsmImport.default_conditions()")
                && !internal_rs
                    .contains("NodePackageResolveMode::CjsAnalysis.default_conditions()"),
            "Rust package condition collection must use condition modes instead of raw default arrays"
        );
    }

    #[test]
    fn package_map_primitives_are_rust_owned() {
        let module_js = compact_whitespace(include_str!("../skeleton/src/builtin/module.js"));
        let internal_rs = compact_whitespace(include_str!("../skeleton/src/internal.rs"));

        assert!(
            !module_js.contains("function packagePatternKeyMatch(")
                && !module_js.contains("function findPackageMapTarget(")
                && !module_js.contains("function packagePatternCompare(")
                && !module_js.contains("function resolvePackageTargetValue(")
                && !module_js.contains("function resolvePackageExports(")
                && !module_js.contains("function isInvalidPackageTargetSegment(")
                && !module_js.contains("function emitDeprecatedPackageTargetWarning("),
            "JS must not regain package-map/target resolver primitives now owned by Rust"
        );
        assert!(
            internal_rs.contains(
                "fn package_pattern_key_match(pattern_key: &str, key: &str) -> Option<String>"
            ) && internal_rs
                .contains("if key.len() <= prefix.len() + suffix.len() { return None; }"),
            "Rust package pattern matching must reject empty wildcard substitutions"
        );
        assert!(
            internal_rs
                .contains("fn package_pattern_compare(a: &str, b: &str) -> std::cmp::Ordering")
                && internal_rs.contains("match b_star.cmp(&a_star)")
                && internal_rs.contains("match b_trailer.cmp(&a_trailer)")
                && internal_rs.contains("match b.len().cmp(&a.len())"),
            "Rust package pattern precedence must stay guarded"
        );
        assert!(
            internal_rs.contains(
                "fn find_package_map_target<'a>( map: &'a IndexMap<String, PackageTarget>, specifier: &str,"
            )
                && internal_rs.contains("if let Some(target) = map.get(specifier)")
                && internal_rs.contains("Self::find_best_package_pattern(map, specifier)"),
            "Rust package map target selection must check exact keys before patterns"
        );
        assert!(
            internal_rs.contains(
                "Self::is_invalid_package_pattern_substitution(&pattern_substitution)"
            )
                && internal_rs.contains("NodePackageResolveError::InvalidPackagePatternMatch")
                && internal_rs.contains(
                    "Self::invalid_package_pattern_substitution_message( &pattern_substitution, invalid_pattern_message,"
                ),
            "Rust package map target selection must reject invalid pattern substitutions"
        );
        assert!(
            internal_rs.contains("fn has_encoded_slash_or_backslash(value: &str) -> bool")
                && internal_rs.contains("lower.contains(\"%2f\") || lower.contains(\"%5c\")"),
            "Rust encoded slash/backslash checks must stay guarded"
        );
        assert!(
            internal_rs.contains(
                "let decoded = percent_decode(segment).unwrap_or_else(|| segment.to_string());"
            ) && internal_rs.contains(
                "matches!(decoded.to_ascii_lowercase().as_str(), \".\" | \"..\" | \"node_modules\")"
            ),
            "Rust invalid package target segment checks must stay guarded"
        );
    }

    #[test]
    fn cjs_package_imports_resolution_is_rust_owned() {
        let module_js = compact_whitespace(include_str!("../skeleton/src/builtin/module.js"));
        let internal_rs = compact_whitespace(include_str!("../skeleton/src/internal.rs"));
        let function_start = module_js
            .find("function resolvePackageImports(id, parentDir, conditions)")
            .expect("resolvePackageImports function must exist");
        let function_end = module_js[function_start..]
            .find("function resolveCjsPackageImportOrNodeModules")
            .expect("resolvePackageImports must precede CJS package-import fallback helper")
            + function_start;
        let resolve_package_imports = &module_js[function_start..function_end];

        assert!(
            resolve_package_imports.contains("__wasm_rquickjs_loader_default_resolve_package(")
                && resolve_package_imports.contains("'cjs-analysis'")
                && resolve_package_imports.contains("makeCjsModuleNotFoundFromErrModuleNotFound")
                && resolve_package_imports
                    .contains("const resolvedFile = resolvePackageFileFromRustResult(resolved);")
                && resolve_package_imports.contains("return resolvedFile;")
                && !resolve_package_imports.contains("findPackageScope(")
                && !resolve_package_imports.contains("findPackageMapTarget(")
                && !resolve_package_imports.contains("resolveCjsPackageFallbacks(")
                && !resolve_package_imports.contains("loadAsFile(")
                && !resolve_package_imports.contains("loadAsDirectory(")
                && !module_js.contains("function validatePackageImportSpecifier("),
            "CJS package imports must delegate package-map resolution to Rust cjs-analysis mode and read the exact resolved file"
        );
        let fallback_start = function_end;
        let fallback_end = module_js[fallback_start..]
            .find("function resolveFilename(id, parentDir)")
            .expect("CJS package-import fallback helper must precede resolveFilename")
            + fallback_start;
        let cjs_package_import_fallback = &module_js[fallback_start..fallback_end];
        assert!(
            cjs_package_import_fallback
                .contains("function resolveCjsPackageImportOrNodeModules(")
                && cjs_package_import_fallback.contains("resolvePackageImports(id, parentDir, cjsPackageConditions())")
                && cjs_package_import_fallback.contains("resolveFromNodeModules(id, parentDir, parentFilename, undefined, parentLookupPaths)")
                && cjs_package_import_fallback.contains("throw makeModuleNotFoundError(id);"),
            "CJS require() and require.resolve() must share package-import fallback behavior"
        );
        assert!(
            module_js.matches("resolveCjsPackageImportOrNodeModules(id, parentDir, parentFilename, parentLookupPaths)").count() == 3,
            "CJS package-import fallback helper should have exactly the definition plus require and require.resolve call sites"
        );
        assert!(
            internal_rs.contains("fn try_resolve_package_import_with_context(")
                && internal_rs.contains("no_imports_field: bool")
                && internal_rs.contains("\"__wasmNoImportsField\"")
                && internal_rs.contains("Self::validate_package_import_specifier(name)?")
                && internal_rs.contains(
                    "nested_bare_target_resolution_mode: NodePackageResolveMode::EsmImport"
                ),
            "Rust package imports must preserve CJS fallback metadata, validation ownership, and ESM nested bare-target semantics"
        );
    }

    #[test]
    fn cjs_package_exports_resolution_is_rust_owned() {
        let module_js = compact_whitespace(include_str!("../skeleton/src/builtin/module.js"));
        let internal_rs = compact_whitespace(include_str!("../skeleton/src/internal.rs"));
        let function_start = module_js
            .find("function resolvePackageExportsEntry(parts, packageDir, pkg, pkgJsonPath, conditions)")
            .expect("resolvePackageExportsEntry function must exist");
        let function_end = module_js[function_start..]
            .find("function resolvePackageSelfReference(parts, parentDir, conditions)")
            .expect("resolvePackageExportsEntry must precede resolvePackageSelfReference")
            + function_start;
        let resolve_package_exports_entry = &module_js[function_start..function_end];

        assert!(
            resolve_package_exports_entry.contains("__wasm_rquickjs_cjs_resolve_package_exports(")
                && resolve_package_exports_entry
                    .contains("resolved = resolvePackageFileFromRustResult(resolved);")
                && resolve_package_exports_entry
                    .contains("makeCjsModuleNotFoundFromErrModuleNotFound")
                && !module_js.contains("function resolvePackageExports(")
                && !module_js.contains("function resolvePackageTargetWithContext(")
                && !module_js.contains("function validatePackageExportsMap("),
            "CJS package exports must delegate package-map resolution to Rust and keep JS exact-file loading"
        );
        assert!(
            module_js.contains("function resolvePackageFileFromRustResult(resolved, resolution)")
                && module_js.contains("return resolveExactPackageFile(nodeUrl.fileURLToPath(String(resolved.url)), resolution);"),
            "CJS package imports and exports must share Rust-result-to-exact-file shaping"
        );
        assert!(
            internal_rs.contains("fn cjs_resolve_package_exports<'js>(")
                && internal_rs.contains("\"__wasm_rquickjs_cjs_resolve_package_exports\"")
                && internal_rs.contains("NodePackageResolveMode::CjsAnalysis")
                && internal_rs.contains("NodeModulesResolver::resolve_package_exports("),
            "Rust package exports bridge must own CJS package-map resolution"
        );
    }

    #[test]
    fn rust_package_bridge_results_share_url_and_keep_loader_format_separate() {
        let internal_rs = compact_whitespace(include_str!("../skeleton/src/internal.rs"));

        assert!(
            internal_rs.contains(
                "fn package_resolved_url_object<'js>( ctx: &Ctx<'js>, resolved: &str, ) -> rquickjs::Result<Object<'js>>"
            ) && internal_rs.contains("result.set(\"url\", path_to_file_url(resolved))?;"),
            "Rust package bridge URL result object construction must stay centralized"
        );
        assert!(
            internal_rs.contains(
                "fn loader_package_result_format(resolved: &str, mode: NodePackageResolveMode) -> Option<&'static str>"
            ) && internal_rs.contains(
                "Some(\"mjs\") if mode == NodePackageResolveMode::EsmImport => Some(\"module\"),"
            ) && internal_rs.contains("Some(\"cjs\") | Some(\"mjs\") => Some(\"commonjs\"),")
                && internal_rs.contains("_ if mode == NodePackageResolveMode::CjsAnalysis => Some(\"commonjs\"),"),
            "registered-loader package bridge format mapping must stay mode-specific"
        );

        let loader_start = internal_rs
            .find("fn loader_default_resolve_package<'js>(")
            .expect("loader_default_resolve_package must exist");
        let loader_end = internal_rs[loader_start..]
            .find("fn cjs_resolve_package_exports<'js>(")
            .expect("loader package bridge must precede CJS package exports bridge")
            + loader_start;
        let loader_bridge = &internal_rs[loader_start..loader_end];
        assert!(
            loader_bridge.contains("let result = package_resolved_url_object(&ctx, &resolved)?;")
                && loader_bridge.contains(
                    "if let Some(format) = loader_package_result_format(&resolved, mode) { result.set(\"format\", format)?; }"
                ),
            "registered-loader package bridge must share URL object construction and own format attachment"
        );

        let cjs_start = loader_end;
        let cjs_end = internal_rs[cjs_start..]
            .find("fn throw_cjs_invalid_package_config_while_importing")
            .expect("CJS package exports bridge must precede invalid-package-config helper")
            + cjs_start;
        let cjs_bridge = &internal_rs[cjs_start..cjs_end];
        assert!(
            cjs_bridge.contains("package_resolved_url_object(&ctx, &resolved).map(Some)")
                && !cjs_bridge.contains("loader_package_result_format(")
                && !cjs_bridge.contains("\"format\""),
            "CJS package exports bridge must share URL object construction without attaching loader format"
        );
    }

    #[test]
    fn cjs_package_directory_results_preserve_owning_package_metadata() {
        let module_js = compact_whitespace(include_str!("../skeleton/src/builtin/module.js"));
        let internal_rs = compact_whitespace(include_str!("../skeleton/src/internal.rs"));

        assert!(
            module_js.contains("__wasm_rquickjs_cjs_resolve_package_fallback(")
                && module_js.contains("cjsPackageExtensionKeys()")
                && module_js.contains("readCjsPackageCandidate(String(resolved.filename), String(resolved.packageDir || pkgDir))")
                && !module_js.contains("function resolveCjsPackageDirectory(")
                && !module_js.contains("function resolveCjsPackageMain(")
                && !module_js.contains("function readCjsPackageFileCandidates(")
                && !module_js.contains("function readCjsPackageIndexCandidates("),
            "runtime CJS package fallback must delegate probing to Rust with live require.extensions keys"
        );
        assert!(
            internal_rs.contains("fn resolve_runtime_cjs_package_directory(")
                && internal_rs.contains("fn resolve_runtime_cjs_package_fallback(")
                && internal_rs.contains("fn join_package_subpath(")
                && internal_rs.contains("Self::join_package_subpath(package_dir, subpath)")
                && internal_rs.contains("CjsEvalResolver::normalize_path(fallback_package_dir)")
                && internal_rs.contains("\"__wasm_rquickjs_cjs_resolve_package_fallback\""),
            "nested package.json main fallback must keep the owning bare package metadata for findPackageJSON"
        );
    }

    #[test]
    fn require_esm_graph_scans_are_cached_per_graph_file() {
        let module_js = compact_whitespace(include_str!("../skeleton/src/builtin/module.js"));

        assert!(
            module_js.contains(
                "function esmGraphStaticSpecifiers(fileInfo) { if (!Object.prototype.hasOwnProperty.call(fileInfo, 'staticSpecifiers'))"
            ) && module_js.contains(
                "function esmGraphRequireSpecifiers(fileInfo) { if (!Object.prototype.hasOwnProperty.call(fileInfo, 'requireSpecifiers'))"
            ) && module_js.contains(
                "function esmGraphCreateRequireSpecifiers(fileInfo) { if (!Object.prototype.hasOwnProperty.call(fileInfo, 'createRequireSpecifiers'))"
            ),
            "require(esm) graph specifier scans must be cached on the per-graph file info"
        );

        let reaches_start = module_js
            .find("function esmGraphReachesAny(filename, stack, seen, fileInfoCache)")
            .expect("esmGraphReachesAny function must exist");
        let reaches_end = module_js[reaches_start..]
            .find("function scanRequireEsmGraph(filename, marked, seen, stack, fileInfoCache)")
            .expect("esmGraphReachesAny must precede scanRequireEsmGraph")
            + reaches_start;
        let reaches_any = &module_js[reaches_start..reaches_end];
        assert!(
            reaches_any.contains("esmGraphStaticSpecifiers(fileInfo)")
                && reaches_any.contains("esmGraphRequireSpecifiers(fileInfo)")
                && reaches_any.contains("esmGraphCreateRequireSpecifiers(fileInfo)")
                && !reaches_any.contains("collectStaticEsmSpecifiers(source)")
                && !reaches_any.contains("collectLiteralRequireSpecifiers(source)")
                && !reaches_any.contains("collectCreateRequireFactoryNames(source)"),
            "cycle reachability checks must reuse per-file graph scanner results"
        );

        let scan_start = reaches_end;
        let scan_end = module_js[scan_start..]
            .find("function markRequireEsmGraph(filename)")
            .expect("scanRequireEsmGraph must precede markRequireEsmGraph")
            + scan_start;
        let scan_graph = &module_js[scan_start..scan_end];
        assert!(
            scan_graph.contains("esmGraphStaticSpecifiers(fileInfo)")
                && scan_graph.contains("esmGraphRequireSpecifiers(fileInfo)")
                && scan_graph.contains("esmGraphCreateRequireSpecifiers(fileInfo)")
                && !scan_graph.contains("collectStaticEsmSpecifiers(source)")
                && !scan_graph.contains("collectLiteralRequireSpecifiers(source)")
                && !scan_graph.contains("collectCreateRequireFactoryNames(source)"),
            "require(esm) graph traversal must reuse per-file scanner results"
        );
    }

    #[test]
    fn registered_loader_next_context_merge_is_shared() {
        let module_js = compact_whitespace(include_str!("../skeleton/src/builtin/module.js"));

        assert!(
            module_js.contains(
                "function registeredLoaderNextContext(context, contextForNext) { return contextForNext === undefined ? context : Object.assign({}, context, contextForNext); }"
            ),
            "registered-loader next context merging must stay centralized"
        );
        assert_eq!(
            module_js
                .matches("registeredLoaderNextContext(context, contextForNext)")
                .count(),
            5,
            "async/sync registered-loader resolve/load paths must all use the shared context merge helper"
        );
        assert_eq!(
            module_js
                .matches(
                    "contextForNext === undefined ? context : Object.assign({}, context, contextForNext)"
                )
                .count(),
            1,
            "registered-loader next context merging must only appear inside the shared helper"
        );
        assert!(
            module_js.contains(
                "function registeredLoaderNextSpecifier(currentSpecifier, specifierForNext) { return specifierForNext === undefined ? currentSpecifier : specifierForNext; }"
            ) && module_js.contains(
                "function registeredLoaderNextUrl(currentUrl, urlForNext) { return urlForNext === undefined ? currentUrl : String(urlForNext); }"
            ),
            "registered-loader next specifier and URL normalization must stay centralized"
        );
        assert_eq!(
            module_js.matches("registeredLoaderNextSpecifier(").count(),
            3,
            "async and sync registered-loader resolve paths must use the shared next-specifier normalizer"
        );
        assert_eq!(
            module_js.matches("registeredLoaderNextUrl(").count(),
            3,
            "async and sync registered-loader load paths must use the shared next-URL normalizer"
        );
        assert_eq!(
            module_js
                .matches("specifierForNext === undefined ?")
                .count(),
            1,
            "registered-loader next specifier fallback must only appear inside the shared helper"
        );
        assert_eq!(
            module_js.matches("urlForNext === undefined ?").count(),
            1,
            "registered-loader next URL fallback must only appear inside the shared helper"
        );
    }

    #[test]
    fn registered_loader_default_resolve_inputs_are_shared() {
        let module_js = compact_whitespace(include_str!("../skeleton/src/builtin/module.js"));

        assert!(
            module_js.contains(
                "function registeredLoaderResolveInputs(nextSpecifier, context, fallbackParentURL) { return { specifier: String(nextSpecifier), parentURL: context && context.parentURL ? String(context.parentURL) : fallbackParentURL, }; }"
            ),
            "registered-loader default-resolve input coercion must stay centralized"
        );
        assert_eq!(
            module_js.matches("registeredLoaderResolveInputs(").count(),
            3,
            "async and sync registered-loader default resolve paths must use the shared input helper"
        );
        assert_eq!(
            module_js.matches("String(nextSpecifier)").count(),
            1,
            "registered-loader default-resolve specifier coercion must only appear inside the shared helper"
        );
        assert_eq!(
            module_js
                .matches("context && context.parentURL ? String(context.parentURL)")
                .count(),
            1,
            "registered-loader default-resolve parentURL fallback must only appear inside the shared helper"
        );
        assert!(
            module_js.contains(
                "const inputs = registeredLoaderResolveInputs(nextSpecifier, context, String(baseUrl)); return resolveEsmDefaultForLoader(inputs.specifier, inputs.parentURL, context, baseUrl, false, true);"
            ) && module_js.contains(
                "const inputs = registeredLoaderResolveInputs(nextSpecifier, context, baseContext.parentURL);"
            ),
            "registered-loader async and sync default resolve paths must pass their mode-specific parent fallbacks"
        );
    }

    #[test]
    fn registered_loader_hook_entries_are_shared() {
        let module_js = compact_whitespace(include_str!("../skeleton/src/builtin/module.js"));

        assert!(
            module_js.contains(
                "function registeredLoaderHookEntry(loader) { return loader.module ? { module: loader.module, url: loader.url } : undefined; }"
            ),
            "registered-loader hook module and URL pairing must stay centralized"
        );
        assert_eq!(
            module_js.matches("registeredLoaderHookEntry(").count(),
            3,
            "async and sync registered-loader paths must build hook entries through the shared helper"
        );
        assert_eq!(
            module_js.matches("const entries = [];").count(),
            2,
            "async and sync registered-loader paths must each maintain one ordered hook-entry list"
        );
        assert!(
            !module_js.contains("const modules = [];")
                && !module_js.contains("const moduleUrls = [];")
                && !module_js.contains("moduleUrls[index]"),
            "registered-loader hook state must not split modules and loader URLs into drift-prone parallel arrays"
        );
        assert_eq!(
            module_js.matches("entries.length - 1").count(),
            4,
            "registered-loader resolve and load chains must use the shared entry list for async and sync modes"
        );
        assert_eq!(
            module_js.matches("entry.url").count(),
            2,
            "registered-loader resolve URL validation must read the loader URL from the paired hook entry"
        );
    }

    #[test]
    fn registered_loader_chain_completion_is_shared() {
        let module_js = compact_whitespace(include_str!("../skeleton/src/builtin/module.js"));

        assert!(
            module_js.contains(
                "function assertRegisteredLoaderChainComplete(hookName, result, nextCalled) { if (!nextCalled && (!result || result.shortCircuit !== true)) { throw makeLoaderChainError(hookName); } }"
            ),
            "registered-loader chain completion check must stay centralized"
        );
        assert_eq!(
            module_js
                .matches("assertRegisteredLoaderChainComplete(")
                .count(),
            3,
            "registered-loader resolve/load result helpers must own chain-completion checks"
        );
        assert!(
            module_js.contains("function registeredLoaderResolveResult(hookResult, context, loaderUrl, nextCalled, allowUndefinedFromNext)")
                && module_js.contains("function registeredLoaderLoadResult(hookResult, context, nextCalled)"),
            "registered-loader hook result validation and chain completion must stay centralized"
        );
        assert!(
            module_js.contains("if (!nextCalled()) throw makeLoaderChainError('resolve');")
                && module_js.contains(
                    "assertRegisteredLoaderChainComplete('resolve', result, nextCalled());"
                )
                && module_js
                    .contains("assertRegisteredLoaderChainComplete('load', result, nextCalled());"),
            "registered-loader result helpers must observe next-called state after validation reads hook results"
        );
        assert_eq!(
            module_js.matches("registeredLoaderResolveResult(").count(),
            3,
            "async and sync registered-loader resolve paths must use the shared resolve-result helper"
        );
        assert_eq!(
            module_js.matches("registeredLoaderLoadResult(").count(),
            3,
            "async and sync registered-loader load paths must use the shared load-result helper"
        );
        assert_eq!(
            module_js
                .matches("if (!nextCalled && (!result || result.shortCircuit !== true))")
                .count(),
            1,
            "registered-loader chain-completion predicate must only appear inside the shared helper"
        );
        assert!(
            module_js.contains("if (!nextCalled()) throw makeLoaderChainError('resolve');"),
            "sync registered-loader undefined resolve result must keep its next-called special case"
        );
        assert!(
            module_js.contains(
                "registeredLoaderResolveResult(await module.resolve(nextSpecifier, context, nextResolve), context, entry.url, () => nextCalled, false)"
            ) && module_js.contains(
                "registeredLoaderResolveResult(hookResult, context, entry.url, () => nextCalled, true)"
            ),
            "registered-loader undefined resolve-result carve-out must stay sync-only"
        );
    }

    #[test]
    fn registered_loader_source_presence_is_shared() {
        let module_js = compact_whitespace(include_str!("../skeleton/src/builtin/module.js"));

        assert!(
            module_js.contains(
                "function registeredLoaderHasSource(result) { return result && Object.prototype.hasOwnProperty.call(result, 'source') && result.source !== null && result.source !== undefined; }"
            ),
            "registered-loader source presence checks must stay centralized"
        );
        assert_eq!(
            module_js.matches("registeredLoaderHasSource(").count(),
            4,
            "async/sync/static registered-loader load paths must use the shared source-presence helper"
        );
        assert!(
            module_js.contains("? loaded.source : resolved.source"),
            "sync registered-loader source fallback must preserve loaded-source-over-resolved-source precedence"
        );
        assert!(
            module_js.contains("!Object.prototype.hasOwnProperty.call(loaded, 'source')"),
            "static JSON edge handling must keep checking source property presence separately from usable source"
        );
    }

    #[test]
    fn registered_loader_source_returns_are_shared() {
        let module_js = compact_whitespace(include_str!("../skeleton/src/builtin/module.js"));

        assert!(
            module_js.contains(
                "function registeredLoaderModuleSourceReturn(source) { return 'data:text/javascript,' + encodeURIComponent(loaderSourceToString(source)); }"
            ),
            "registered-loader module source return conversion must stay centralized"
        );
        assert!(
            module_js.contains(
                "function registeredLoaderJsonSourceReturn(source) { return globalThis.__wasm_rquickjs_register_import_attr_rewrite( 'data:application/json,' + encodeURIComponent(loaderSourceToString(source)), 'json', ); }"
            ),
            "registered-loader JSON source return conversion must stay centralized"
        );
        assert_eq!(
            module_js
                .matches("registeredLoaderModuleSourceReturn(")
                .count(),
            4,
            "dynamic source, dynamic file-backed, and static registered-loader module source paths must use the shared converter"
        );
        assert_eq!(
            module_js
                .matches("registeredLoaderJsonSourceReturn(")
                .count(),
            3,
            "dynamic and static registered-loader JSON source paths must use the shared converter"
        );
        assert_eq!(
            module_js
                .matches("'data:text/javascript,' + encodeURIComponent(loaderSourceToString(")
                .count(),
            1,
            "registered-loader module source data URL construction must only appear inside the shared converter"
        );
        assert_eq!(
            module_js
                .matches("'data:application/json,' + encodeURIComponent(loaderSourceToString(")
                .count(),
            1,
            "registered-loader JSON source data URL construction must only appear inside the shared converter"
        );
    }

    #[test]
    fn registered_loader_path_or_url_returns_are_shared() {
        let module_js = compact_whitespace(include_str!("../skeleton/src/builtin/module.js"));

        assert!(
            module_js.contains(
                "function registeredLoaderPathOrUrlReturn(url) { url = String(url); return url.startsWith('file://') ? nodeUrl.fileURLToPath(url) : url; }"
            ),
            "registered-loader URL/path return conversion must stay centralized"
        );
        assert_eq!(
            module_js
                .matches("registeredLoaderPathOrUrlReturn(")
                .count(),
            5,
            "registered-loader require.resolve and static return paths must use the shared URL/path converter"
        );
        assert!(
            module_js.contains(
                "if (String(loaded.url).startsWith('node:')) return String(loaded.url).slice(5);"
            ),
            "registered-loader require.resolve must preserve Node's bare builtin return shape"
        );

        let static_start = module_js
            .find("function staticRegisteredLoaderReturn(loaded)")
            .expect("staticRegisteredLoaderReturn function must exist");
        let edge_end = module_js[static_start..]
            .find("function staticRegisteredLoaderSourceForUrl(")
            .expect("staticRegisteredLoaderReturnForEdge must precede source helper")
            + static_start;
        let static_return_helpers = &module_js[static_start..edge_end];
        assert!(
            !static_return_helpers.contains("nodeUrl.fileURLToPath("),
            "static registered-loader return helpers must route file URL conversion through registeredLoaderPathOrUrlReturn"
        );
    }

    #[test]
    fn cjs_registered_loader_file_results_are_shared() {
        let module_js = compact_whitespace(include_str!("../skeleton/src/builtin/module.js"));

        assert!(
            module_js.contains("function cjsLoaderFileFormat(filename, format) {")
                && module_js
                    .contains("function cjsLoaderFileResult(filename, source, format, url) {")
                && module_js.contains("format: cjsLoaderFileFormat(filename, format),"),
            "registered-loader CJS file results must use one format/source adapter"
        );

        let package_start = module_js
            .find("function cjsPackageResolutionForLoaderResult(resolved)")
            .expect("cjsPackageResolutionForLoaderResult function must exist");
        let package_end = module_js[package_start..]
            .find("function resolvePackageDefaultForLoader(")
            .expect("package result helper must precede package default resolver")
            + package_start;
        let package_result = &module_js[package_start..package_end];
        assert!(
            package_result.contains("return cjsLoaderFileResult(filename, source, packageResolved.format, packageResolved.url);"),
            "registered-loader package CJS result must use the shared file adapter"
        );

        let default_start = module_js
            .find("function resolveCjsDefaultForLoader(specifier, parentURL, context)")
            .expect("resolveCjsDefaultForLoader function must exist");
        let default_end = module_js[default_start..]
            .find("function resultForRelativeOrAbsoluteSpecifier(")
            .expect("resolveCjsDefaultForLoader must precede ESM relative resolver")
            + default_start;
        let default_resolver = &module_js[default_start..default_end];
        assert!(
            default_resolver.contains("return cjsLoaderFileResult(filename, source);")
                && default_resolver
                    .contains("return cjsLoaderFileResult(resolved.filename, resolved.content);"),
            "registered-loader CJS file URL and relative paths must use the shared file adapter"
        );
    }

    #[test]
    fn cjs_require_id_validation_is_shared() {
        let module_js = compact_whitespace(include_str!("../skeleton/src/builtin/module.js"));

        assert!(
            module_js.contains(
                "function validateRequireId(id) { if (typeof id !== 'string') { throw new ERR_INVALID_ARG_TYPE('id', 'string', id); } if (id === '') { const argErr = new TypeError(\"The argument 'id' must be a non-empty string. Received ''\"); argErr.code = 'ERR_INVALID_ARG_VALUE'; throw argErr; } }"
            ),
            "ordinary and loader-created CJS require() must share id validation"
        );
        assert_eq!(
            module_js.matches("validateRequireId(id);").count(),
            2,
            "ordinary and loader-created CJS require() must both use the shared id validator"
        );
        assert_eq!(
            module_js
                .matches("The argument 'id' must be a non-empty string. Received ''")
                .count(),
            1,
            "empty require id error construction must not be duplicated"
        );

        let loader_require_start = module_js
            .find("function loaderRequire(id) {")
            .expect("loader-created CJS require function must exist");
        let loader_require_end = module_js[loader_require_start..]
            .find("loaderRequire.resolve = function resolve(id, options)")
            .expect("loader-created CJS require must precede its resolve helper")
            + loader_require_start;
        let loader_require = &module_js[loader_require_start..loader_require_end];
        assert!(
            loader_require.find("validateRequireId(id);")
                < loader_require.find("__wasm_rquickjs_run_registered_loaders_sync"),
            "loader-created CJS require must validate id before registered-loader hooks"
        );

        let local_require_start = module_js
            .find("function localRequire(id) {")
            .expect("ordinary CJS require function must exist");
        let local_require_end = module_js[local_require_start..]
            .find("localRequire.cache = moduleCache;")
            .expect("ordinary CJS require must precede require property setup")
            + local_require_start;
        let local_require = &module_js[local_require_start..local_require_end];
        assert!(
            local_require.find("validateRequireId(id);")
                < local_require.find("return traceModuleRequire(id, parentFilename"),
            "ordinary CJS require must validate id before tracing or resolution"
        );
    }

    #[test]
    fn cjs_require_resolve_request_validation_is_shared() {
        let module_js = compact_whitespace(include_str!("../skeleton/src/builtin/module.js"));

        assert!(
            module_js.contains(
                "function validateRequireRequest(request) { if (typeof request !== 'string') { throw new ERR_INVALID_ARG_TYPE('request', 'string', request); } }"
            ),
            "require.resolve request validation must stay centralized"
        );
        assert_eq!(
            module_js.matches("validateRequireRequest(").count(),
            4,
            "loader require.resolve, ordinary require.resolve, and require.resolve.paths must use the shared request validator"
        );
        assert_eq!(
            module_js
                .matches("new ERR_INVALID_ARG_TYPE('request', 'string'")
                .count(),
            1,
            "request argument type error construction must not be duplicated"
        );

        let loader_resolve_start = module_js
            .find("loaderRequire.resolve = function resolve(id, options)")
            .expect("loader-created require.resolve function must exist");
        let loader_resolve_end = module_js[loader_resolve_start..]
            .find("loaderRequire.main = fallbackRequire.main;")
            .expect("loader-created require.resolve must precede require.main setup")
            + loader_resolve_start;
        let loader_resolve = &module_js[loader_resolve_start..loader_resolve_end];
        assert!(
            loader_resolve.find("validateRequireRequest(id);")
                < loader_resolve.find("__wasm_rquickjs_run_registered_loaders_sync"),
            "loader-created require.resolve must validate request before registered-loader hooks"
        );

        let resolve_for_require_start = module_js
            .find("function resolveForRequire(id, options, parentDir, parentFilename, parentLookupPaths)")
            .expect("ordinary require.resolve helper must exist");
        let resolve_for_require_end = module_js[resolve_for_require_start..]
            .find("function currentRequireMain()")
            .expect("ordinary require.resolve helper must precede currentRequireMain")
            + resolve_for_require_start;
        let resolve_for_require = &module_js[resolve_for_require_start..resolve_for_require_end];
        assert!(
            resolve_for_require.find("validateRequireRequest(id);")
                < resolve_for_require.find("if (isBuiltin(id))"),
            "ordinary require.resolve must validate request before resolution"
        );

        let resolve_paths_start = module_js
            .find("localRequire.resolve.paths = function paths(request)")
            .expect("require.resolve.paths function must exist");
        let resolve_paths_end = module_js[resolve_paths_start..]
            .find("Object.defineProperty(localRequire, 'main'")
            .expect("require.resolve.paths must precede require.main setup")
            + resolve_paths_start;
        let resolve_paths = &module_js[resolve_paths_start..resolve_paths_end];
        assert!(
            resolve_paths.find("validateRequireRequest(request);")
                < resolve_paths.find("if (isBuiltinResolveTarget(request))"),
            "require.resolve.paths must validate request before builtin handling"
        );
    }

    #[test]
    fn loader_cjs_function_header_parser_is_shared() {
        let module_js = compact_whitespace(include_str!("../skeleton/src/builtin/module.js"));

        assert!(
            module_js.contains("function readLoaderFunctionParamsOpen(source, pos) {")
                && module_js
                    .matches("readLoaderFunctionParamsOpen(source,")
                    .count()
                    == 3,
            "loader CJS function header parsing must stay centralized"
        );

        let descriptor_start = module_js
            .find("function loaderDescriptorFunctionGetterBody(")
            .expect("loaderDescriptorFunctionGetterBody function must exist");
        let descriptor_end = module_js[descriptor_start..]
            .find("function loaderDescriptorFunctionGetterEnd(")
            .expect("descriptor body parser must precede descriptor end parser")
            + descriptor_start;
        let descriptor_parser = &module_js[descriptor_start..descriptor_end];
        assert!(
            descriptor_parser
                .contains("const paramsOpen = readLoaderFunctionParamsOpen(source, pos);")
                && !descriptor_parser
                    .contains("readLoaderNamedIdentifier(source, pos, 'function')"),
            "descriptor getter parser must use the shared function-header helper"
        );

        let object_keys_start = module_js
            .find("function readLoaderObjectKeysReexport(")
            .expect("readLoaderObjectKeysReexport function must exist");
        let object_keys_end = module_js[object_keys_start..]
            .find("function scanLoaderCjsTopLevelPositions(")
            .expect("Object.keys reexport parser must precede top-level scanner")
            + object_keys_start;
        let object_keys_parser = &module_js[object_keys_start..object_keys_end];
        assert!(
            object_keys_parser.contains("i = readLoaderFunctionParamsOpen(source, i);")
                && !object_keys_parser.contains("readLoaderNamedIdentifier(source, i, 'function')"),
            "Object.keys(...).forEach parser must use the shared function-header helper"
        );
    }

    #[test]
    fn loader_cjs_optional_semicolon_parser_is_shared() {
        let module_js = compact_whitespace(include_str!("../skeleton/src/builtin/module.js"));

        assert!(
            module_js.contains(
                "function skipLoaderOptionalSemicolon(source, pos) { return source.charCodeAt(pos) === 0x3b ? skipWhitespaceAndComments(source, pos + 1) : pos; }"
            ),
            "loader CJS optional semicolon skipping must stay centralized"
        );

        let callback_start = module_js
            .find("function loaderCallbackHasReexport(")
            .expect("loaderCallbackHasReexport function must exist");
        let callback_end = module_js[callback_start..]
            .find("function readLoaderObjectKeysReexport(")
            .expect("loaderCallbackHasReexport must precede Object.keys parser")
            + callback_start;
        let callback_parser = &module_js[callback_start..callback_end];
        assert!(
            callback_parser
                .matches("skipLoaderOptionalSemicolon(source, i)")
                .count()
                == 2
                && !callback_parser.contains("source.charCodeAt(i) === 0x3b"),
            "loader reexport callback parser must share optional semicolon consumption after return guards"
        );

        let getter_kind_start = module_js
            .find("function readLoaderGetterReturnMemberKind(")
            .expect("readLoaderGetterReturnMemberKind function must exist");
        let getter_kind_end = module_js[getter_kind_start..]
            .find("function loaderSimpleGetterBody(")
            .expect("getter return parser must precede loaderSimpleGetterBody")
            + getter_kind_start;
        let getter_kind_parser = &module_js[getter_kind_start..getter_kind_end];
        assert!(
            getter_kind_parser.contains("i = skipLoaderOptionalSemicolon(source, i);")
                && !getter_kind_parser.contains("source.charCodeAt(i) === 0x3b"),
            "loader descriptor getter parser must share optional semicolon consumption"
        );

        let dynamic_getter_start = module_js
            .find("function loaderGetterReturnsBindingKey(")
            .expect("loaderGetterReturnsBindingKey function must exist");
        let dynamic_getter_end = module_js[dynamic_getter_start..]
            .find("function loaderDynamicReexportGetterBody(")
            .expect("dynamic getter parser must precede loaderDynamicReexportGetterBody")
            + dynamic_getter_start;
        let dynamic_getter_parser = &module_js[dynamic_getter_start..dynamic_getter_end];
        assert!(
            dynamic_getter_parser.contains("i = skipLoaderOptionalSemicolon(source, i);")
                && !dynamic_getter_parser.contains("source.charCodeAt(i) === 0x3b"),
            "loader dynamic reexport getter parser must share optional semicolon consumption"
        );
    }

    #[test]
    fn registered_loader_format_normalization_is_shared() {
        let module_js = compact_whitespace(include_str!("../skeleton/src/builtin/module.js"));

        assert!(
            module_js.contains("function loaderFormatOrUndefined(format) {")
                && module_js.contains(
                    "return format === undefined || format === null ? undefined : String(format);"
                ),
            "registered-loader result format normalization must stay centralized"
        );

        let package_start = module_js
            .find("function packageResolutionForLoaderResult(resolved)")
            .expect("packageResolutionForLoaderResult function must exist");
        let package_end = module_js[package_start..]
            .find("function cjsLoaderFileFormat(")
            .expect("package result helper must precede CJS file format helper")
            + package_start;
        let package_result = &module_js[package_start..package_end];
        assert!(
            package_result.contains("format: loaderFormatOrUndefined(resolved.format),"),
            "registered-loader package result shaping must use the shared format normalizer"
        );

        let resolved_start = module_js
            .find("function normalizeRegisteredLoaderResolvedResult(resolved)")
            .expect("normalizeRegisteredLoaderResolvedResult function must exist");
        let resolved_end = module_js[resolved_start..]
            .find("function registeredLoaderLoadContext(")
            .expect("resolved-result helper must precede load-context helper")
            + resolved_start;
        let resolved_result = &module_js[resolved_start..resolved_end];
        assert!(
            resolved_result.contains("format: loaderFormatOrUndefined(resolved.format),"),
            "registered-loader resolve results must use the shared format normalizer"
        );

        assert!(
            module_js.contains(
                "function registeredLoaderFinalLoadFormat(loaded, fallbackFormat) { return loaded && loaded.format !== undefined && loaded.format !== null ? validateRegisteredLoaderLoadFormat(loaded.format) : validateRegisteredLoaderLoadFormat(fallbackFormat); }"
            ),
            "registered-loader final load format selection must stay centralized"
        );
        assert_eq!(
            module_js
                .matches("registeredLoaderFinalLoadFormat(")
                .count(),
            3,
            "async and sync registered-loader load result paths must use the shared final-format helper"
        );
        assert_eq!(
            module_js
                .matches("loaded.format !== undefined && loaded.format !== null")
                .count(),
            1,
            "registered-loader final load format nullish check must only appear inside the shared helper"
        );

        let static_start = module_js
            .find("function staticRegisteredLoaderReturn(loaded)")
            .expect("staticRegisteredLoaderReturn function must exist");
        let static_end = module_js[static_start..]
            .find("function staticRegisteredLoaderReturnForEdge(")
            .expect("static registered-loader return helper must precede edge helper")
            + static_start;
        let static_return = &module_js[static_start..static_end];
        assert!(
            static_return.contains("const format = loaderFormatOrUndefined(loaded.format);"),
            "static registered-loader return shaping must use the shared format normalizer"
        );

        assert_eq!(
            module_js
                .matches("=== undefined || format === null ? undefined : String(format)")
                .count(),
            1,
            "format nullish/String coercion should exist only inside loaderFormatOrUndefined"
        );
    }

    #[test]
    fn registered_loader_resolve_result_validation_is_shared() {
        let module_js = compact_whitespace(include_str!("../skeleton/src/builtin/module.js"));

        assert!(
            module_js.contains(
                "function validateRegisteredLoaderResolveResult(hookResult, context, loaderUrl) { const result = validateRegisteredLoaderResult(hookResult, 'resolve', context); validateRegisteredLoaderResolveUrl(result.url, loaderUrl); return result; }"
            ),
            "registered-loader resolve-result validation must stay centralized"
        );
        assert_eq!(
            module_js
                .matches("validateRegisteredLoaderResolveResult(")
                .count(),
            2,
            "registered-loader resolve-result helper must be the only caller of the low-level validator"
        );
        assert_eq!(
            module_js
                .matches("validateRegisteredLoaderResolveUrl(result.url,")
                .count(),
            1,
            "registered-loader resolve URL boundary checks must only appear inside the shared helper"
        );
        assert!(
            module_js.contains("if (!nextCalled()) throw makeLoaderChainError('resolve');"),
            "sync registered-loader undefined resolve result must keep its next-called special case"
        );
    }

    #[test]
    fn registered_loader_default_load_is_shared() {
        let module_js = compact_whitespace(include_str!("../skeleton/src/builtin/module.js"));

        assert!(
            module_js.contains(
                "function registeredLoaderDefaultLoad(_nextUrl, context) { return { format: context && context.format }; }"
            ),
            "registered-loader default load fallback must stay centralized"
        );
        assert_eq!(
            module_js.matches("registeredLoaderDefaultLoad(").count(),
            3,
            "async and sync registered-loader load paths must use the shared default-load fallback"
        );
        assert_eq!(
            module_js
                .matches("return { format: context && context.format };")
                .count(),
            1,
            "registered-loader default load result shape must only appear inside the shared helper"
        );
    }

    #[test]
    fn registered_loader_load_result_format_validation_is_shared() {
        let module_js = compact_whitespace(include_str!("../skeleton/src/builtin/module.js"));

        assert!(
            module_js.contains(
                "function validateRegisteredLoaderLoadResultFormat(result) { if (result.format !== undefined && result.format !== null && result.format !== '') { validateRegisteredLoaderLoadFormat(result.format); } }"
            ),
            "registered-loader load-result format validation must stay centralized"
        );
        assert_eq!(
            module_js
                .matches("validateRegisteredLoaderLoadResultFormat(")
                .count(),
            2,
            "registered-loader load-result format validation must be shared by the full load-result validator"
        );
        assert!(
            module_js.contains("function validateRegisteredLoaderLoadResult(hookResult, context)")
                && module_js.contains(
                    "const result = validateRegisteredLoaderResult(hookResult, 'load', context);"
                )
                && module_js.contains("validateRegisteredLoaderLoadResultFormat(result);")
                && module_js.contains("return result;"),
            "registered-loader full load-result validation must stay centralized"
        );
        assert_eq!(
            module_js
                .matches("validateRegisteredLoaderLoadResult(")
                .count(),
            2,
            "registered-loader load-result helper must be the only caller of the low-level validator"
        );
        assert_eq!(
            module_js
                .matches(
                    "result.format !== undefined && result.format !== null && result.format !== ''"
                )
                .count(),
            1,
            "registered-loader load-result format predicate must only appear inside the shared helper"
        );
    }

    #[test]
    fn static_registered_loader_cache_fill_is_shared() {
        let module_js = compact_whitespace(include_str!("../skeleton/src/builtin/module.js"));

        assert!(
            module_js.contains(
                "function staticRegisteredLoaderCacheEntry(parentUrl, specifier, attrs, edgeReturn) {"
            ) && module_js.contains("return { cached: cache[key], created: false };")
                && module_js.contains("return { cached: cache[key], created: true };"),
            "static registered-loader cache fill must stay centralized and report cache-hit vs new-entry state"
        );

        let helper_start = module_js
            .find("function staticRegisteredLoaderCacheEntry(parentUrl, specifier, attrs, edgeReturn)")
            .expect("staticRegisteredLoaderCacheEntry function must exist");
        let helper_end = module_js[helper_start..]
            .find("async function prepareStaticRegisteredLoaderGraph(")
            .expect("static cache helper must precede graph preparation")
            + helper_start;
        let helper = &module_js[helper_start..helper_end];
        assert!(
            helper.contains(
                "const loaded = await globalThis.__wasm_rquickjs_run_registered_loaders(parentUrl, specifier, attrs, 'static-raw');"
            ) && helper.contains(
                "const value = edgeReturn ? staticRegisteredLoaderReturnForEdge(loaded, attrs) : staticRegisteredLoaderReturn(loaded);"
            ) && helper.contains("cache[key] = { error };"),
            "static registered-loader cache helper must own load invocation, edge-vs-entry return shaping, and error caching"
        );

        let graph_start = module_js
            .find("async function prepareStaticRegisteredLoaderGraph(parentUrl, seen)")
            .expect("prepareStaticRegisteredLoaderGraph function must exist");
        let graph_end = module_js[graph_start..]
            .find("globalThis.__wasm_rquickjs_prepare_static_registered_loader_graph")
            .expect("graph preparation must precede entry preparation")
            + graph_start;
        let graph = &module_js[graph_start..graph_end];
        assert!(
            graph.contains("staticRegisteredLoaderCacheEntry(parentUrl, specifier, attrs, true)")
                && graph
                    .contains("if (isLoaderThenable(cacheEntry)) cacheEntry = await cacheEntry;")
                && graph.contains("if (cached && cached.error) continue;"),
            "static graph preparation must use the shared cache helper and continue on cached or fresh edge errors"
        );

        let entry_start = module_js
            .find("globalThis.__wasm_rquickjs_prepare_static_registered_loader_graph")
            .expect("entry graph preparation function must exist");
        let entry_end = module_js[entry_start..]
            .find("globalThis.__wasm_rquickjs_resolve_static_registered_loader")
            .expect("entry graph preparation must precede static resolve")
            + entry_start;
        let entry = &module_js[entry_start..entry_end];
        assert!(
            entry.contains(
                "staticRegisteredLoaderCacheEntry(parentUrl, specifier, undefined, false)"
            ) && entry.contains("if (isLoaderThenable(cacheEntry)) cacheEntry = await cacheEntry;")
                && entry.contains("if (created && cached && cached.error) return;"),
            "entry graph preparation must use the shared cache helper and only abort on newly-created entry errors"
        );
    }

    #[test]
    fn rust_module_kind_detection_uses_shared_esm_helper() {
        let internal_rs = compact_whitespace(include_str!("../skeleton/src/internal.rs"));
        let module_js = compact_whitespace(include_str!("../skeleton/src/builtin/module.js"));

        assert!(
            internal_rs.contains(
                "let has_esm_syntax = force_module || source_looks_like_esm(&source) || has_cjs_wrapper_lexical_redeclaration(&source);",
            ),
            "Rust module-kind detection must use the shared ESM syntax helper"
        );
        assert!(
            internal_rs.contains("fn source_looks_like_esm(source: &str) -> bool {")
                && internal_rs.contains("source_has_static_import_or_export(source)")
                && internal_rs.contains("source_has_import_meta(source)")
                && internal_rs.contains("source_has_top_level_await(source)"),
            "Rust ESM syntax helper must include import/export, import.meta, and top-level await"
        );
        assert!(
            !internal_rs.contains("fn is_js_in_module_package_scope(")
                && !module_js.contains("function getPackageScopeType(")
                && !module_js.contains("function getPackageScopeExplicitType("),
            "module-kind package-scope checks must not keep unused parallel wrappers"
        );
    }

    #[test]
    fn cjs_esm_default_snapshot_state_is_loader_owned() {
        let module_js = compact_whitespace(include_str!("../skeleton/src/builtin/module.js"));
        let internal_rs = compact_whitespace(include_str!("../skeleton/src/internal.rs"));

        let install_start = module_js
            .find("function installCjsEsmDefaultSnapshotSlot(mod)")
            .expect("CJS-to-ESM snapshot slot installer must exist");
        let install_end = module_js[install_start..]
            .find("function cjsEsmDefaultSnapshotSlot(mod)")
            .expect("snapshot slot installer must precede slot reader")
            + install_start;
        let install_helper = &module_js[install_start..install_end];
        assert!(
            module_js.contains("const cjsEsmDefaultSnapshotSymbol = Symbol('wasm-rquickjs.cjs-esm-default-snapshot');")
                && module_js.contains("const cjsEsmDefaultSnapshotToken = {};"),
            "CJS-to-ESM default snapshot state must keep private symbol and token constants"
        );
        assert!(
            install_helper.contains("const state = { captured: false, value: undefined };")
                && install_helper.contains("Object.defineProperty(mod, cjsEsmDefaultSnapshotSymbol, { value: function cjsEsmDefaultSnapshotSlot(token, op, value)")
                && install_helper.contains("if (token !== cjsEsmDefaultSnapshotToken) return undefined;")
                && install_helper.contains("writable: false, configurable: false, enumerable: false,"),
            "CJS-to-ESM default snapshot slot must keep state behind a token-guarded non-configurable module property"
        );

        let capture_start = module_js
            .find("function captureCjsEsmDefaultSnapshot(mod)")
            .expect("CJS-to-ESM snapshot capture helper must exist");
        let capture_end = module_js[capture_start..]
            .find("function hasCjsEsmDefaultSnapshot(cache, filename)")
            .expect("snapshot capture helper must precede snapshot lookup")
            + capture_start;
        let capture_helper = &module_js[capture_start..capture_end];
        assert!(
            capture_helper.contains("installCjsEsmDefaultSnapshotSlot(mod);")
                && capture_helper
                    .contains("if (!slot || slot(cjsEsmDefaultSnapshotToken, 'has')) return;")
                && capture_helper.contains("slot(cjsEsmDefaultSnapshotToken, 'set', mod.exports);"),
            "snapshot capture helper must install the private slot and capture module.exports once"
        );

        let load_start = module_js
            .find("function loadModule(resolvedFilename, source, parentModule)")
            .expect("CJS loadModule function must exist");
        let load_end = module_js[load_start..]
            .find("function makeLoaderCommonJsRequire(")
            .expect("loadModule must precede loader require helper")
            + load_start;
        let load_module = &module_js[load_start..load_end];
        let cache_pos = load_module
            .find("moduleCache[filename] = mod;")
            .expect("CJS loader must cache module objects before execution");
        let compile_call_pos = load_module
            .find(
                "compiledFn.call(mod.exports, mod.exports, childRequire, mod, filename, dirname);",
            )
            .expect("CJS loader must execute the compiled wrapper");
        let capture_pos = load_module
            .find("if (cjsEsmDefaultSnapshotEligible) { captureCjsEsmDefaultSnapshot(mod); }")
            .expect("CJS loader must capture default snapshot after eligible loads");
        assert!(
            load_module[..cache_pos].contains("installCjsEsmDefaultSnapshotSlot(mod);")
                && cache_pos < compile_call_pos
                && compile_call_pos < capture_pos,
            "regular CJS load path must install the snapshot slot before caching and capture after wrapper execution"
        );
        assert!(
            module_js.contains("Object.defineProperty(globalThis, '__wasm_rquickjs_has_cjs_esm_default_snapshot', { value: hasCjsEsmDefaultSnapshot, writable: false, configurable: false,")
                && module_js.contains("Object.defineProperty(globalThis, '__wasm_rquickjs_get_cjs_esm_default_snapshot', { value: getCjsEsmDefaultSnapshot, writable: false, configurable: false,"),
            "generated CJS facades must call non-replaceable internal snapshot helpers"
        );
        assert!(
            internal_rs.contains("var __wasm_rquickjs_require = globalThis.__wasm_rquickjs_create_require(")
                && internal_rs.contains("var __wasm_rquickjs_resolved_filename = __wasm_rquickjs_require.resolve(__wasm_rquickjs_filename);")
                && internal_rs.contains("globalThis.__wasm_rquickjs_has_cjs_esm_default_snapshot( __wasm_rquickjs_require.cache, __wasm_rquickjs_resolved_filename )")
                && internal_rs.contains("globalThis.__wasm_rquickjs_get_cjs_esm_default_snapshot( __wasm_rquickjs_require.cache, __wasm_rquickjs_resolved_filename )")
                && internal_rs.contains(": __wasm_rquickjs_require(__wasm_rquickjs_filename);"),
            "CJS facades must use the internal require factory, canonical cache key, and loader-owned snapshot before falling back to require()"
        );
    }

    #[test]
    fn esm_file_resolution_realpaths_symlinks_by_default() {
        let internal_rs = compact_whitespace(include_str!("../skeleton/src/internal.rs"));

        assert!(
            internal_rs.contains("fn has_exec_argv_flag(ctx: &Ctx<'_>, flag: &str) -> bool")
                && internal_rs.contains("let prefixed = format!(\"{flag}=\");")
                && internal_rs.contains("arg == flag || arg.starts_with(&prefixed)"),
            "Rust ESM file resolver must mirror JS execArgv flag matching"
        );
        assert!(
            internal_rs.contains(
                "fn module_identity_path_for_existing_file( normalized: &str, preserve_symlinks: bool, ) -> String"
            ) && internal_rs.contains("let realpath_input = crate::builtin::realpath_for_module_resolution(normalized)")
                && internal_rs.contains("std::fs::canonicalize(&realpath_input)")
                && internal_rs.contains("crate::builtin::realpath_for_module_resolution(normalized)")
                && internal_rs.contains("CjsEvalResolver::normalize_path(&path)")
                && internal_rs
                    .contains("Self::has_exec_argv_flag(ctx, \"--preserve-symlinks\")")
                && internal_rs
                    .contains("Self::resolve_candidate(candidate, &suffix, preserve_symlinks)"),
            "Rust ESM file resolver must resolve emulated symlinks, canonicalize native symlinks, and honor --preserve-symlinks"
        );
        assert!(
            internal_rs
                .matches("module_identity_path_for_existing_file(")
                .count()
                >= 7,
            "file URL and package ESM resolution paths must share the module identity helper"
        );
        assert!(
            compact_whitespace(include_str!("../skeleton/src/builtin/mod.rs")).contains(
                "pub(crate) fn realpath_for_module_resolution(path: &str) -> Option<String> { fs::realpath_for_module_resolution(path) }"
            ) && compact_whitespace(include_str!("../skeleton/src/builtin/fs.rs")).contains(
                "pub(super) fn realpath_for_module_resolution(path: &str) -> Option<String>"
            ),
            "Rust ESM file resolver must share builtin fs realpath behavior"
        );
    }

    #[test]
    fn import_meta_resolve_honors_directory_file_url_bases() {
        let internal_rs = compact_whitespace(include_str!("../skeleton/src/internal.rs"));

        assert!(
            internal_rs.contains("fn file_url_resolution_base_path(base_path: &str) -> Option<std::path::PathBuf>")
                && internal_rs.contains("if base_path.ends_with('/') { Some(path.to_path_buf()) } else { path.parent().map(|parent| parent.to_path_buf()) }")
                && internal_rs.contains("let base_dir = FileUrlResolver::file_url_resolution_base_path(&base_path)?;"),
            "import.meta.resolve must treat trailing-slash file URLs as directory bases"
        );
        assert!(
            internal_rs
                .contains("fn file_url_package_resolution_base(base_path: String) -> String")
                && internal_rs
                    .contains("format!(\"{base_path}.wasm-rquickjs-import-meta-resolve-base\")")
                && internal_rs.contains(
                    "let base = FileUrlResolver::file_url_package_resolution_base(base);"
                ),
            "package import.meta.resolve must search from trailing-slash file URL directories"
        );
    }
}
