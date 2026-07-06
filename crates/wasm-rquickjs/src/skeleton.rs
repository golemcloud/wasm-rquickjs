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
            .find("function resolveFilename(id, parentDir)")
            .expect("resolvePackageImports must precede resolveFilename")
            + function_start;
        let resolve_package_imports = &module_js[function_start..function_end];

        assert!(
            resolve_package_imports.contains("__wasm_rquickjs_loader_default_resolve_package(")
                && resolve_package_imports.contains("'cjs-analysis'")
                && resolve_package_imports.contains("makeCjsModuleNotFoundFromErrModuleNotFound")
                && resolve_package_imports.contains("return resolveExactPackageFile(")
                && !resolve_package_imports.contains("findPackageScope(")
                && !resolve_package_imports.contains("findPackageMapTarget(")
                && !resolve_package_imports.contains("resolveCjsPackageFallbacks(")
                && !resolve_package_imports.contains("loadAsFile(")
                && !resolve_package_imports.contains("loadAsDirectory(")
                && !module_js.contains("function validatePackageImportSpecifier("),
            "CJS package imports must delegate package-map resolution to Rust cjs-analysis mode and read the exact resolved file"
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
                && resolve_package_exports_entry.contains("resolveExactPackageFile(")
                && resolve_package_exports_entry
                    .contains("makeCjsModuleNotFoundFromErrModuleNotFound")
                && !module_js.contains("function resolvePackageExports(")
                && !module_js.contains("function resolvePackageTargetWithContext(")
                && !module_js.contains("function validatePackageExportsMap("),
            "CJS package exports must delegate package-map resolution to Rust and keep JS exact-file loading"
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
