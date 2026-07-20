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
            module_js.contains("__wasm_rquickjs_package_global_conditions(mode)")
                && module_js
                    .contains("return globalThis.__wasm_rquickjs_package_global_conditions(mode);"),
            "module.js must request merged default and user package conditions from the Rust provider"
        );
        assert!(
            !module_js.contains("function defaultPackageConditions(")
                && !module_js.contains("function addPackageCondition(")
                && !module_js.contains(
                    "const userConditions = globalThis.__wasm_rquickjs_package_conditions"
                )
                && !module_js.contains(
                    "setFromArray(globalThis.__wasm_rquickjs_package_global_conditions(mode))"
                ),
            "module.js must not duplicate package user-condition filtering, de-duping, or Rust-provided condition array shaping"
        );
        assert!(
            module_js.contains("packageConditions('cjs-analysis')"),
            "CJS package conditions must request Rust's cjs-analysis global conditions"
        );
        assert!(
            module_js.contains("packageConditions('import')"),
            "ESM package conditions must request Rust's import global conditions"
        );
        assert!(
            module_js.contains("packageConditions('loader')"),
            "loader hook conditions must request Rust's loader global conditions"
        );
        assert!(
            internal_rs.contains("\"__wasm_rquickjs_package_global_conditions\"")
                && internal_rs.contains("fn package_global_conditions<'js>(")
                && internal_rs.contains("NodeModulesResolver::conditions_from_global(&ctx, mode)")
                && !internal_rs.contains("fn package_default_conditions<'js>(")
                && !internal_rs.contains("\"__wasm_rquickjs_package_default_conditions\""),
            "internal.rs must register the Rust package global condition provider without a default-only bridge"
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
            resolve_package_imports.contains("resolvePackageWithRustBridge(")
                && resolve_package_imports.contains("'cjs-analysis'")
                && resolve_package_imports.contains("Internal package resolver is not initialized")
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
        let js_error_start = module_js
            .find("function makePackageImportNotDefinedError(specifier)")
            .expect("JS package-import fallback error helper must exist");
        let js_error_end = module_js[js_error_start..]
            .find("function makeModuleNotFoundError(")
            .expect("JS package-import fallback error helper must precede MODULE_NOT_FOUND helper")
            + js_error_start;
        let js_package_import_error = &module_js[js_error_start..js_error_end];
        assert!(
            !js_package_import_error.contains("noImportsField")
                && !js_package_import_error.contains("__wasmNoImportsField")
                && module_js.contains(
                    "if (err.__wasmNoImportsField === true) { throw makeModuleNotFoundError(id); }"
                ),
            "CJS package-import no-imports metadata is Rust-owned; JS may consume it for CJS fallback but must not recreate it in fallback error shaping"
        );
    }

    #[test]
    fn package_resolver_bridge_call_is_shared_in_js() {
        let module_js = compact_whitespace(include_str!("../skeleton/src/builtin/module.js"));

        assert!(
            module_js.contains(
                "function resolvePackageWithRustBridge(parentURL, specifier, conditions, mode, missingProviderMessage)"
            ) && module_js.contains(
                "return globalThis.__wasm_rquickjs_loader_default_resolve_package( parentURL, specifier, conditions, mode, );"
            ),
            "JS package resolver bridge calls must go through one helper with caller-shaped condition arrays"
        );
        assert_eq!(
            module_js
                .matches("__wasm_rquickjs_loader_default_resolve_package(")
                .count(),
            1,
            "JS must not duplicate the raw Rust package resolver bridge call"
        );

        let cjs_imports_start = module_js
            .find("function resolvePackageImports(id, parentDir, conditions)")
            .expect("resolvePackageImports function must exist");
        let cjs_imports_end = module_js[cjs_imports_start..]
            .find("function resolveCjsPackageImportOrNodeModules")
            .expect("resolvePackageImports must precede CJS package-import fallback helper")
            + cjs_imports_start;
        let cjs_imports = &module_js[cjs_imports_start..cjs_imports_end];
        assert!(
            cjs_imports.contains("resolvePackageWithRustBridge(")
                && cjs_imports.contains("'cjs-analysis'")
                && cjs_imports.contains("makeCjsModuleNotFoundFromErrModuleNotFound"),
            "CJS package imports must keep their mode and error mapping around the shared bridge"
        );

        let loader_start = module_js
            .find("function resolvePackageDefaultForLoader(")
            .expect("resolvePackageDefaultForLoader function must exist");
        let loader_end = module_js[loader_start..]
            .find("function resolveEsmPackageDefaultForLoader(")
            .expect("loader package default resolver must precede ESM wrapper")
            + loader_start;
        let loader_resolver = &module_js[loader_start..loader_end];
        assert!(
            loader_resolver.contains("resolvePackageWithRustBridge(")
                && loader_resolver
                    .contains("packageConditionArrayForLoaderResolve(context, defaultConditions)")
                && loader_resolver
                    .contains("Internal package resolver provider is not initialized")
                && loader_resolver.contains(
                    "if (mapNotFoundToCjs && err && err.code === 'ERR_MODULE_NOT_FOUND')"
                ),
            "registered-loader package default resolution must keep loader conditions and CJS error mapping around the shared bridge"
        );
        assert!(
            module_js.contains(
                "function packageConditionArrayForLoaderResolve(context, defaultConditions) { if (context && Array.isArray(context.conditions)) { const conditions = setFromArray(context.conditions); conditions.add('default'); return Array.from(conditions); } return defaultConditions; }"
            ) && !module_js.contains("function packageConditionsForLoaderResolve("),
            "registered-loader package resolution must normalize only hook-provided conditions and pass Rust-owned default condition arrays through directly"
        );
        assert!(
            !module_js.contains(
                "__wasm_rquickjs_loader_default_resolve_package( parentURL, specifier, Array.from(conditions), mode,"
            ),
            "raw Rust package resolver bridge must not copy condition arrays after callers have shaped them"
        );
    }

    #[test]
    fn cjs_package_exports_resolution_is_rust_owned() {
        let module_js = compact_whitespace(include_str!("../skeleton/src/builtin/module.js"));
        let internal_rs = compact_whitespace(include_str!("../skeleton/src/internal.rs"));
        let function_start = module_js
            .find("function resolvePackageExportsEntry(parts, packageDir, pkg, conditions)")
            .expect("resolvePackageExportsEntry function must exist");
        let function_end = module_js[function_start..]
            .find("function resolvePackageSelfReference(parts, parentDir, conditions)")
            .expect("resolvePackageExportsEntry must precede resolvePackageSelfReference")
            + function_start;
        let resolve_package_exports_entry = &module_js[function_start..function_end];

        assert!(
            resolve_package_exports_entry.contains("__wasm_rquickjs_cjs_resolve_package_exports(")
                && resolve_package_exports_entry.contains("conditions || cjsPackageConditions(),")
                && !resolve_package_exports_entry
                    .contains("Array.from(conditions || cjsPackageConditions())")
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
            module_js.contains(
                "function readPackageDirectoryForExports(parts, packageDir, pkgJsonPath, conditions)"
            ) && module_js.contains(
                "return resolvePackageExportsEntry(parts, packageDir, packageJsonEntry.pkg, conditions);"
            ) && module_js.contains(
                "const exportsResolved = readPackageDirectoryForExports(parts, pkgDir, pkgJsonPath, conditions);"
            ) && module_js.contains("if (exportsResolved !== null) {")
                && module_js.contains("if (exportsResolved !== undefined) { return exportsResolved; }")
                && !module_js.contains("exportsResolved:")
                && !module_js.contains("packageEntry.exportsResolved")
                && !module_js.contains("resolvePackageExportsEntry(parts, packageDir, pkg, pkgJsonPath"),
            "CJS package-directory exports helper must not carry unused package data after Rust resolution"
        );
        let scope_start = module_js
            .find("function findPackageScope(startDir)")
            .expect("findPackageScope function must exist");
        let scope_end = module_js[scope_start..]
            .find("function resolvePackageImports(id, parentDir, conditions)")
            .expect("findPackageScope must precede resolvePackageImports")
            + scope_start;
        let package_scope = &module_js[scope_start..scope_end];
        assert!(
            package_scope.contains("const scope = { dir, pkg: packageJsonEntry.pkg };")
                && !package_scope.contains("scope.pkgJsonPath")
                && !package_scope.contains("pkg: packageJsonEntry.pkg, pkgJsonPath"),
            "CJS package self-reference scope cache must not retain unused package.json path state"
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
    fn package_map_error_strings_are_rust_owned() {
        let module_js = compact_whitespace(include_str!("../skeleton/src/builtin/module.js"));
        let internal_rs = compact_whitespace(include_str!("../skeleton/src/internal.rs"));

        assert!(
            internal_rs.contains("ERR_PACKAGE_PATH_NOT_EXPORTED")
                && internal_rs.contains("No \\\"exports\\\" main defined in package")
                && internal_rs.contains(
                    "Package subpath '{}' is not defined by \\\"exports\\\" in package {}"
                )
                && internal_rs.contains("ERR_INVALID_PACKAGE_TARGET")
                && internal_rs.contains("Invalid \\\"{}\\\" target '{}'")
                && internal_rs.contains("ERR_INVALID_MODULE_SPECIFIER")
                && internal_rs.contains(
                    "Invalid module \\\"{}\\\" is not a valid package name imported from {}"
                ),
            "package-map resolver errors must be shaped by the Rust resolver bridge"
        );
        assert!(
            !module_js.contains("ERR_PACKAGE_PATH_NOT_EXPORTED")
                && !module_js.contains("ERR_INVALID_PACKAGE_TARGET")
                && !module_js.contains("Invalid package target")
                && !module_js.contains("No \\\"exports\\\" main defined in package")
                && !module_js.contains("Package subpath")
                && !module_js.contains("is not defined by \\\"exports\\\"")
                && !module_js.contains("is not a valid package name imported from"),
            "JS CJS/loader paths must not regain package-map resolver error-string ownership"
        );
    }

    #[test]
    fn cjs_named_import_preflight_uses_esm_resolution_before_cjs_analysis() {
        let internal_rs = compact_whitespace(include_str!("../skeleton/src/internal.rs"));

        assert!(
            internal_rs.contains(
                "fn resolve_esm_named_import_candidate_path( filename: &str, specifier: &str, conditions: &[String], ) -> Option<String>"
            ) && internal_rs.contains(
                "let mut resolution = esm_import_resolution_context(conditions, &mut warnings);"
            ) && internal_rs.contains(
                "let mut resolution = cjs_analysis_resolution_context(conditions, &mut warnings);"
            ) && internal_rs.contains(
                "resolve_esm_named_import_candidate_path(filename, specifier, esm_conditions) .or_else(|| resolve_cjs_reexport_path(filename, specifier, cjs_conditions))?"
            ),
            "CJS named-import preflight must first resolve bare package specifiers as ESM imports before falling back to CJS analysis"
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
        assert!(
            internal_rs.contains(
                "fn loader_package_resolved_object<'js>( ctx: &Ctx<'js>, resolved: &str, mode: NodePackageResolveMode, ) -> rquickjs::Result<Object<'js>>"
            ) && internal_rs.contains("let result = package_resolved_url_object(ctx, resolved)?;")
                && internal_rs.contains(
                    "if let Some(format) = loader_package_result_format(resolved, mode) { result.set(\"format\", format)?; }"
                ),
            "registered-loader package result URL and format shaping must stay centralized"
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
            loader_bridge
                .contains("loader_package_resolved_object(&ctx, &resolved, mode).map(Some)")
                && !loader_bridge.contains("result.set(\"format\", format)?;"),
            "registered-loader package bridge must delegate URL and format shaping to the shared helper"
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
                && !cjs_bridge.contains("loader_package_resolved_object(")
                && !cjs_bridge.contains("\"format\""),
            "CJS package exports bridge must share URL object construction without attaching loader format"
        );
    }

    #[test]
    fn rust_js_condition_package_resolution_is_shared() {
        let module_js = compact_whitespace(include_str!("../skeleton/src/builtin/module.js"));
        let internal_rs = compact_whitespace(include_str!("../skeleton/src/internal.rs"));

        assert!(
            internal_rs.contains(
                "fn try_resolve_package_with_conditions<'js>( ctx: &Ctx<'js>, resolver: &NodeModulesResolver, base: &str, specifier: &str, conditions: &[String], mode: NodePackageResolveMode, emit_warnings: bool,"
            ) && internal_rs.contains("let mut resolution = NodePackageResolutionContext::new(mode, conditions, &mut warnings);")
                && internal_rs.contains("let result = resolver.try_resolve_with_context(base, specifier, &mut resolution);")
                && internal_rs.contains("if emit_warnings { emit_node_package_deprecation_warnings(ctx, &warnings)?; }")
                && internal_rs.contains("try_resolve_package_with_conditions(ctx, resolver, base, specifier, &conditions, mode, true)")
                && internal_rs.contains("let condition_vec = package_conditions_from_js_array(conditions);")
                && internal_rs.contains("try_resolve_package_with_conditions( ctx, &resolver, base, specifier, &condition_vec, mode, emit_warnings,")
                && !internal_rs.contains("let mut resolution = NodePackageResolutionContext::new(mode, &condition_vec, &mut warnings);"),
            "Rust package bridges must share resolver execution while keeping condition sources caller-owned"
        );
        assert!(
            internal_rs.contains(
                "fn cjs_analysis_resolution_context<'a, 'w>( conditions: &'a [String], warnings: &'w mut Vec<NodePackageWarning>, ) -> NodePackageResolutionContext<'a, 'w>"
            ) && internal_rs.contains(
                "NodePackageResolutionContext::new(NodePackageResolveMode::CjsAnalysis, conditions, warnings)"
            ) && internal_rs.contains(
                "fn esm_import_resolution_context<'a, 'w>( conditions: &'a [String], warnings: &'w mut Vec<NodePackageWarning>, ) -> NodePackageResolutionContext<'a, 'w>"
            ) && internal_rs.contains(
                "NodePackageResolutionContext::new(NodePackageResolveMode::EsmImport, conditions, warnings)"
            ),
            "Mode-specific package bridges must share their resolver context construction"
        );

        let directory_message_start = internal_rs
            .find("fn directory_import_message(")
            .expect("directory_import_message must exist");
        let directory_message_end = internal_rs[directory_message_start..]
            .find("fn format_importer(")
            .expect("directory_import_message must precede format_importer")
            + directory_message_start;
        let directory_message = &internal_rs[directory_message_start..directory_message_end];
        assert!(
            directory_message.contains(
                "let mut resolution = esm_import_resolution_context(&conditions, &mut warnings);"
            ) && !directory_message.contains("NodePackageResolutionContext::new("),
            "ESM directory-import suggestions must use the shared ESM resolver context"
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
            loader_bridge.contains("try_resolve_package_with_js_conditions(")
                && loader_bridge.contains("&base,")
                && loader_bridge.contains("&specifier,")
                && loader_bridge.contains("&conditions,")
                && loader_bridge.contains("true,"),
            "registered-loader package resolution must use the shared JS-condition resolver and emit package warnings"
        );

        let graph_start = internal_rs
            .find("fn require_esm_graph_resolve_package<'js>(")
            .expect("require_esm_graph_resolve_package must exist");
        let graph_end = internal_rs[graph_start..]
            .find("fn import_meta_trailing_slash_package_has_exports(")
            .expect("require(esm) graph resolver must precede import.meta helper")
            + graph_start;
        let graph_bridge = &internal_rs[graph_start..graph_end];
        assert!(
            graph_bridge.contains("try_resolve_package_with_js_conditions(")
                && graph_bridge.contains("&parent_filename,")
                && graph_bridge.contains("&specifier,")
                && graph_bridge.contains("&conditions,")
                && graph_bridge.contains("false,")
                && !graph_bridge.contains("emit_node_package_deprecation_warnings("),
            "require(esm) graph marking must share JS-condition resolution without emitting package warnings"
        );
        let js_graph_start = module_js
            .find("function resolveEsmGraphSpecifier(specifier, parentFilename, conditions, mode)")
            .expect("resolveEsmGraphSpecifier must exist");
        let js_graph_end = module_js[js_graph_start..]
            .find("function addRequireEsmGraphMark(")
            .expect("resolveEsmGraphSpecifier must precede require(esm) graph marking")
            + js_graph_start;
        let js_graph = &module_js[js_graph_start..js_graph_end];
        assert!(
            js_graph.contains("__wasm_rquickjs_require_esm_graph_resolve_package(")
                && js_graph.contains("parentFilename, specifier, conditions, mode,")
                && !js_graph.contains("Array.from(conditions)"),
            "require(esm) graph JS resolver must pass caller-shaped condition arrays to the Rust bridge"
        );

        let cjs_exports_start = internal_rs
            .find("fn cjs_resolve_package_exports<'js>(")
            .expect("CJS package exports bridge must exist");
        let cjs_exports_end = internal_rs[cjs_exports_start..]
            .find("fn throw_cjs_invalid_package_config_while_importing")
            .expect("CJS package exports bridge must precede invalid-package-config helper")
            + cjs_exports_start;
        let cjs_exports_bridge = &internal_rs[cjs_exports_start..cjs_exports_end];
        assert!(
            cjs_exports_bridge.contains(
                "let mut resolution = cjs_analysis_resolution_context(&condition_vec, &mut warnings);"
            ) && !cjs_exports_bridge.contains("NodePackageResolutionContext::new("),
            "CJS package exports bridge must use the shared CJS-analysis context helper with JS-provided conditions"
        );
        assert!(
            cjs_exports_bridge.contains("NodeModulesResolver::resolve_package_exports(")
                && cjs_exports_bridge
                    .contains("emit_node_package_deprecation_warnings(&ctx, &warnings)?;"),
            "CJS package exports bridge must preserve package warning emission after Rust package-map resolution"
        );

        let cjs_fallback_start = internal_rs
            .find("fn cjs_resolve_package_fallback<'js>(")
            .expect("CJS package fallback bridge must exist");
        let cjs_fallback_end = internal_rs[cjs_fallback_start..]
            .find("fn require_esm_graph_resolve_package<'js>(")
            .expect("CJS package fallback bridge must precede require(esm) graph resolver")
            + cjs_fallback_start;
        let cjs_fallback_bridge = &internal_rs[cjs_fallback_start..cjs_fallback_end];
        assert!(
            cjs_fallback_bridge.contains(
                "let mut resolution = cjs_analysis_resolution_context(&[], &mut warnings);"
            ) && !cjs_fallback_bridge.contains("NodePackageResolutionContext::new(")
                && !cjs_fallback_bridge.contains("emit_node_package_deprecation_warnings("),
            "CJS package fallback bridge must use the shared CJS-analysis context helper without JS conditions or package warning emission"
        );

        let target_value_start = internal_rs
            .find("fn resolve_package_target_value(")
            .expect("package target resolver must exist");
        let target_value_end = internal_rs[target_value_start..]
            .find("fn package_pattern_key_match(")
            .expect("package target resolver must precede pattern helpers")
            + target_value_start;
        let target_value = &internal_rs[target_value_start..target_value_end];
        assert!(
            internal_rs.contains(
                "fn with_mode<T>( &mut self, mode: NodePackageResolveMode, f: impl FnOnce(&mut Self) -> Result<T, NodePackageResolveError>, ) -> Result<T, NodePackageResolveError>"
            ) && target_value.contains(
                "resolution.with_mode( ctx.nested_bare_target_resolution_mode, |resolution| resolver.try_resolve_with_context(&base_str, &target_str, resolution), )?"
            ) && !target_value.contains("let mut nested_resolution"),
            "nested bare package targets must reuse the active resolution context and file-probe cache while switching mode explicitly"
        );
    }

    #[test]
    fn rust_global_condition_package_resolution_is_shared() {
        let internal_rs = compact_whitespace(include_str!("../skeleton/src/internal.rs"));

        assert!(
            internal_rs.contains(
                "fn try_resolve_package_with_global_conditions<'js>( ctx: &Ctx<'js>, resolver: &NodeModulesResolver, base: &str, specifier: &str, mode: NodePackageResolveMode,"
            ) && internal_rs.contains(
                "let conditions = NodeModulesResolver::conditions_from_global(ctx, mode.condition_mode());"
            ) && internal_rs.contains(
                "try_resolve_package_with_conditions(ctx, resolver, base, specifier, &conditions, mode, true)"
            ) && internal_rs.contains(
                "fn try_resolve_package_with_conditions<'js>( ctx: &Ctx<'js>, resolver: &NodeModulesResolver, base: &str, specifier: &str, conditions: &[String], mode: NodePackageResolveMode, emit_warnings: bool,"
            ) && internal_rs.contains(
                "let mut resolution = NodePackageResolutionContext::new(mode, conditions, &mut warnings);"
            ) && internal_rs.contains(
                "let result = resolver.try_resolve_with_context(base, specifier, &mut resolution);"
            ) && internal_rs.contains("if emit_warnings { emit_node_package_deprecation_warnings(ctx, &warnings)?; }"),
            "Rust ESM package resolution paths using global conditions must share condition loading, resolver execution, and warning emission"
        );

        let import_meta_start = internal_rs
            .find("fn import_meta_resolve_package(")
            .expect("import_meta_resolve_package must exist");
        let import_meta_end = internal_rs[import_meta_start..]
            .find("fn import_meta_resolve_path(")
            .expect("import.meta package resolver must precede path resolver")
            + import_meta_start;
        let import_meta = &internal_rs[import_meta_start..import_meta_end];
        assert!(
            import_meta.contains("try_resolve_package_with_global_conditions(")
                && import_meta.contains("&base,")
                && import_meta.contains("&specifier,")
                && import_meta.contains("NodePackageResolveMode::EsmImport")
                && import_meta.contains("Ok(Some(path_to_file_url(&resolved)))"),
            "import.meta.resolve package handling must share global-condition package resolution while keeping URL return shaping"
        );

        let resolver_start = internal_rs
            .find("impl Resolver for NodeModulesResolver")
            .expect("NodeModulesResolver Resolver impl must exist");
        let resolver_end = internal_rs[resolver_start..]
            .find("impl Loader for CjsCompatLoader")
            .expect("NodeModulesResolver Resolver impl must precede CJS compat loader")
            + resolver_start;
        let resolver_impl = &internal_rs[resolver_start..resolver_end];
        assert!(
            resolver_impl.contains("try_resolve_package_with_global_conditions(")
                && resolver_impl.contains("base,")
                && resolver_impl.contains("resolution_name,")
                && resolver_impl.contains("NodePackageResolveMode::EsmImport")
                && resolver_impl.contains(
                    "append_loader_realm_param(suffix, loader_realm_param(base).as_deref())"
                )
                && resolver_impl.contains("transfer_import_type_rewrite_token(name, &resolved);"),
            "ESM resolver package handling must share global-condition package resolution while keeping suffix and import-attribute token behavior"
        );
    }

    #[test]
    fn esm_package_identity_path_is_shared() {
        let internal_rs = compact_whitespace(include_str!("../skeleton/src/internal.rs"));

        assert!(
            internal_rs.contains("fn esm_package_identity_path(ctx: &Ctx<'_>, resolved: &str) -> String")
                && internal_rs.contains("let preserve_symlinks = NodeFileResolver::has_exec_argv_flag(ctx, \"--preserve-symlinks\");")
                && internal_rs.contains("NodeFileResolver::module_identity_path_for_existing_file(resolved, preserve_symlinks)"),
            "ESM package symlink identity normalization must be centralized"
        );

        let import_meta_start = internal_rs
            .find("fn import_meta_resolve_package(")
            .expect("import_meta_resolve_package must exist");
        let import_meta_end = internal_rs[import_meta_start..]
            .find("fn import_meta_resolve_path(")
            .expect("import.meta package resolver must precede path resolver")
            + import_meta_start;
        let import_meta = &internal_rs[import_meta_start..import_meta_end];
        assert!(
            import_meta.contains("let resolved = esm_package_identity_path(&ctx, &resolved);")
                && !import_meta.contains("has_exec_argv_flag(&ctx, \"--preserve-symlinks\")"),
            "import.meta.resolve package path must use the shared ESM package identity helper"
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
            loader_bridge.contains("esm_package_identity_path(&ctx, &resolved)")
                && !loader_bridge.contains("has_exec_argv_flag(&ctx, \"--preserve-symlinks\")"),
            "registered-loader ESM package path must use the shared ESM package identity helper"
        );

        let resolver_start = internal_rs
            .find("impl Resolver for NodeModulesResolver")
            .expect("NodeModulesResolver Resolver impl must exist");
        let resolver_end = internal_rs[resolver_start..]
            .find("impl Loader for CjsCompatLoader")
            .expect("NodeModulesResolver Resolver impl must precede CJS compat loader")
            + resolver_start;
        let resolver_impl = &internal_rs[resolver_start..resolver_end];
        assert!(
            resolver_impl.contains("let resolved = esm_package_identity_path(ctx, &resolved);")
                && !resolver_impl.contains("has_exec_argv_flag(ctx, \"--preserve-symlinks\")"),
            "ESM resolver package path must use the shared ESM package identity helper"
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
    fn registered_loader_base_context_is_shared() {
        let module_js = compact_whitespace(include_str!("../skeleton/src/builtin/module.js"));

        assert!(
            module_js.contains(
                "function registeredLoaderBaseContext(conditions, importAttributes, parentURL) { return { conditions, importAttributes, parentURL: String(parentURL), }; }"
            ),
            "registered-loader base context object construction must stay centralized"
        );
        assert_eq!(
            module_js.matches("registeredLoaderBaseContext(").count(),
            3,
            "async and sync registered-loader runners must use the shared base context helper"
        );
        assert_eq!(
            module_js.matches("parentURL: String(").count(),
            1,
            "registered-loader base-context parentURL coercion must only appear inside the shared helper"
        );

        let async_start = module_js
            .find("globalThis.__wasm_rquickjs_run_registered_loaders = async function runRegisteredLoaders(")
            .expect("async registered-loader runner must exist");
        let sync_start = module_js[async_start..]
            .find("globalThis.__wasm_rquickjs_run_registered_loaders_sync = function runRegisteredLoadersSync(")
            .expect("async runner must precede sync runner")
            + async_start;
        let async_runner = &module_js[async_start..sync_start];
        assert!(
            async_runner.contains(
                "const baseContext = registeredLoaderBaseContext(loaderHookConditions(), importAttributes, baseUrl);"
            ) && !async_runner.contains("conditions: loaderHookConditions(),")
                && !async_runner.contains("parentURL: String(baseUrl)"),
            "async registered-loader runner must share base context shaping while preserving async conditions and import attributes"
        );

        let sync_end = module_js[sync_start..]
            .find("const defaultResolve = (nextSpecifier, context)")
            .expect("sync base context must precede sync default resolve")
            + sync_start;
        let sync_setup = &module_js[sync_start..sync_end];
        assert!(
            sync_setup.contains(
                "const baseContext = registeredLoaderBaseContext( isImportMode ? loaderHookConditions() : cjsPackageConditions(), {}, baseUrl || fileUrlForPath('/'), );"
            ) && !sync_setup.contains("conditions: isImportMode")
                && !sync_setup.contains("Array.from(cjsPackageConditions())")
                && !sync_setup.contains("importAttributes: {}")
                && !sync_setup.contains("parentURL: String(baseUrl || fileUrlForPath('/'))"),
            "sync registered-loader runner must share base context shaping while preserving import-vs-CJS conditions"
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
                "function registeredLoaderHasOwnSource(result) { return result && Object.prototype.hasOwnProperty.call(result, 'source'); }"
            ) && module_js.contains(
                "function registeredLoaderHasSource(result) { return registeredLoaderHasOwnSource(result) && result.source !== null && result.source !== undefined; }"
            ),
            "registered-loader source-property and usable-source checks must stay centralized"
        );
        let raw_source_property_checks = module_js
            .match_indices("Object.prototype.hasOwnProperty.call(")
            .filter(|(index, _)| {
                module_js[*index..]
                    .find(')')
                    .is_some_and(|end| module_js[*index..*index + end].contains("'source'"))
            })
            .count();
        assert_eq!(
            raw_source_property_checks, 1,
            "raw source-property presence must only be checked by the shared helper"
        );
        assert_eq!(
            module_js.matches("registeredLoaderHasOwnSource(").count(),
            4,
            "registered-loader validation, usable-source, and static JSON edge checks must share source-property presence"
        );
        assert_eq!(
            module_js.matches("registeredLoaderHasSource(").count(),
            5,
            "registered-loader source decision points must use the shared source-presence helper"
        );
        assert!(
            module_js.contains(
                "function registeredLoaderPreferredSource(result, fallbackSource) { return registeredLoaderHasSource(result) ? result.source : fallbackSource; }"
            ) && module_js.contains("let source = registeredLoaderPreferredSource(loaded, resolved.source);"),
            "sync registered-loader source fallback must preserve loaded-source-over-resolved-source precedence through the shared helper"
        );
        let sync_start = module_js
            .find("globalThis.__wasm_rquickjs_run_registered_loaders_sync = function runRegisteredLoadersSync(")
            .expect("sync registered-loader runner must exist");
        let sync_end = module_js[sync_start..]
            .find("function staticRegisteredLoaderCacheParts(")
            .expect("sync registered-loader runner must precede static cache helpers")
            + sync_start;
        let sync_runner = &module_js[sync_start..sync_end];
        assert!(
            sync_runner.contains("source = loaderFileUrlSource(normalizedResolved.url);")
                && !sync_runner.contains("tryReadFile(nodeUrl.fileURLToPath("),
            "sync registered-loader CommonJS file fallback must share loaderFileUrlSource with the normalized URL"
        );
        assert!(
            module_js.contains("!registeredLoaderHasOwnSource(loaded)"),
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
        assert!(
            module_js.contains(
                "function registeredLoaderCommonJsReturn(loaded, url, missingSourceReturn) { const source = registeredLoaderHasSource(loaded) ? loaded.source : loaderFileUrlSource(url); return source !== null && source !== undefined ? loaderCommonJsSourceModule(source, url) : missingSourceReturn; }"
            ),
            "registered-loader CommonJS source/file return conversion must stay centralized"
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
            module_js.matches("registeredLoaderCommonJsReturn(").count(),
            3,
            "dynamic and static registered-loader CommonJS paths must use the shared converter"
        );
        assert!(
            module_js.contains(
                "return registeredLoaderCommonJsReturn(loaded, normalizedResolved.url, undefined);"
            ) && module_js.contains(
                "return registeredLoaderCommonJsReturn(loaded, url, registeredLoaderPathOrUrlReturn(url, true));"
            ),
            "dynamic CommonJS loader returns must stay undefined on missing source while static returns preserve path/URL fallback"
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
        assert_eq!(
            module_js
                .matches("? loaderCommonJsSourceModule(source, url)")
                .count(),
            1,
            "registered-loader CommonJS source loading must only appear inside the shared converter"
        );
    }

    #[test]
    fn registered_loader_raw_result_objects_are_shared() {
        let module_js = compact_whitespace(include_str!("../skeleton/src/builtin/module.js"));

        assert!(
            module_js.contains("function registeredLoaderUrlResult(url) { return { url }; }")
                && module_js.contains(
                "function registeredLoaderUrlFormatResult(url, format) { return { url, format }; }"
            ) && module_js.contains(
                "function registeredLoaderUrlFormatSourceResult(url, format, source) { const result = registeredLoaderUrlFormatResult(url, format); result.source = source; return result; }"
            ),
            "registered-loader raw URL result object construction must stay centralized"
        );
        assert_eq!(
            module_js.matches("registeredLoaderUrlResult(").count(),
            4,
            "registered-loader URL-only results must use the shared helper across node:, data:, and import-meta fallback paths"
        );
        assert_eq!(
            module_js
                .matches("registeredLoaderUrlFormatResult(")
                .count(),
            10,
            "registered-loader URL/format results must use the shared helper across file, builtin, package, static-raw, and sync paths"
        );
        assert_eq!(
            module_js
                .matches("registeredLoaderUrlFormatSourceResult(")
                .count(),
            4,
            "registered-loader URL/format/source results must use the shared source result helper"
        );

        let async_start = module_js
            .find("globalThis.__wasm_rquickjs_run_registered_loaders = async function runRegisteredLoaders(")
            .expect("async registered-loader runner must exist");
        let sync_start = module_js[async_start..]
            .find("globalThis.__wasm_rquickjs_run_registered_loaders_sync = function runRegisteredLoadersSync(")
            .expect("async runner must precede sync runner")
            + async_start;
        let async_runner = &module_js[async_start..sync_start];
        assert!(
            async_runner.contains(
                "return loadedHasSource ? registeredLoaderUrlFormatSourceResult(normalizedResolved.url, loadedFormat, loaded.source) : registeredLoaderUrlFormatResult(normalizedResolved.url, loadedFormat);"
            ) && !async_runner.contains("raw.source =")
                && !async_runner.contains("const raw = { url: normalizedResolved.url"),
            "async static-raw loader results must share URL/format/source construction while preserving optional source attachment"
        );

        let sync_end = module_js[sync_start..]
            .find("function staticRegisteredLoaderCacheParts(")
            .expect("sync runner must precede static cache helpers")
            + sync_start;
        let sync_runner = &module_js[sync_start..sync_end];
        assert!(
            sync_runner.contains(
                "if (resolveOnly) return registeredLoaderUrlFormatResult(normalizedResolved.url, resolvedFormat);"
            ) && sync_runner.contains(
                "if (finalFormat === 'builtin') return registeredLoaderUrlFormatResult(normalizedResolved.url, finalFormat);"
            ) && sync_runner.contains(
                "return registeredLoaderUrlFormatResult(normalizedResolved.url, finalFormat);"
            ) && sync_runner.contains(
                "return registeredLoaderUrlFormatSourceResult(normalizedResolved.url, finalFormat, source);"
            ) && !sync_runner.contains("{ url: normalizedResolved.url, format:")
                && !sync_runner.contains("format: finalFormat, source"),
            "sync registered-loader raw result paths must share URL/format/source object construction"
        );
    }

    #[test]
    fn registered_loader_builtin_resolution_is_shared() {
        let module_js = compact_whitespace(include_str!("../skeleton/src/builtin/module.js"));

        let helper_start = module_js
            .find("function registeredLoaderBuiltinResolve(specifier, cjsMode)")
            .expect("registeredLoaderBuiltinResolve function must exist");
        let helper_end = module_js[helper_start..]
            .find("function resolveEsmDefaultForLoader(")
            .expect("builtin helper must precede ESM default resolver")
            + helper_start;
        let helper = &module_js[helper_start..helper_end];
        assert!(
            helper.contains(
                "return cjsMode ? registeredLoaderUrlFormatResult(specifier, 'builtin') : registeredLoaderUrlResult(specifier);"
            ) && helper.contains(
                "return registeredLoaderUrlFormatResult('node:' + specifier, 'builtin');"
            ),
            "registered-loader builtin helper must preserve node:-specifier and bare-builtin format differences"
        );
        assert_eq!(
            module_js.matches("registeredLoaderBuiltinResolve(").count(),
            3,
            "ESM and sync registered-loader default resolution must share builtin shaping without a duplicate CJS helper branch"
        );

        let sync_start = module_js
            .find("globalThis.__wasm_rquickjs_run_registered_loaders_sync = function runRegisteredLoadersSync(")
            .expect("sync registered-loader runner must exist");
        let sync_end = module_js[sync_start..]
            .find("function staticRegisteredLoaderCacheParts(")
            .expect("sync registered-loader runner must precede static cache helpers")
            + sync_start;
        let sync_runner = &module_js[sync_start..sync_end];
        assert!(
            sync_runner.contains("registeredLoaderBuiltinResolve(inputs.specifier, !isImportMode)")
                && !sync_runner.contains("inputs.specifier.startsWith('node:')")
                && !sync_runner.contains("isBuiltin(inputs.specifier)"),
            "sync registered-loader default resolution must not keep a second builtin result shaper"
        );
        let cjs_default_start = module_js
            .find("function resolveCjsDefaultForLoader(specifier, parentURL, context)")
            .expect("resolveCjsDefaultForLoader function must exist");
        let cjs_default_end = module_js[cjs_default_start..]
            .find("function resultForRelativeOrAbsoluteSpecifier(")
            .expect("CJS default resolver must precede ESM relative resolver")
            + cjs_default_start;
        let cjs_default = &module_js[cjs_default_start..cjs_default_end];
        assert!(
            !cjs_default.contains("registeredLoaderBuiltinResolve("),
            "sync registered-loader builtin shaping must stay in the shared default resolver, not the CJS helper"
        );
    }

    #[test]
    fn registered_loader_path_or_url_returns_are_shared() {
        let module_js = compact_whitespace(include_str!("../skeleton/src/builtin/module.js"));
        let internal_rs = include_str!("../skeleton/src/internal.rs");

        assert!(
            module_js.contains(
                "function registeredLoaderPathOrUrlReturn(url, preserveFileUrlSuffix) { url = String(url); if (!url.startsWith('file://')) return url; const path = nodeUrl.fileURLToPath(url); if (!preserveFileUrlSuffix) return path; if (/[?#]/.test(path)) return url; const suffixStart = url.search(/[?#]/); return suffixStart < 0 ? path : path + url.slice(suffixStart); }"
            ),
            "registered-loader URL/path return conversion must stay centralized and preserve static file URL identity when decoded path delimiters would make a path-shaped return ambiguous"
        );
        assert_eq!(
            module_js
                .matches("registeredLoaderPathOrUrlReturn(")
                .count(),
            6,
            "registered-loader require.resolve and static return paths must use the shared URL/path converter"
        );
        assert!(
            module_js.contains(
                "if (String(loaded.url).startsWith('node:')) return String(loaded.url).slice(5);"
            ),
            "registered-loader require.resolve must preserve Node's bare builtin return shape"
        );
        assert!(
            internal_rs.contains("const STATIC_REGISTERED_FILE_URL_PREFIX: &str")
                && internal_rs.contains("fn static_registered_file_url_id(url: &str) -> String")
                && internal_rs
                    .contains("fn static_registered_file_url_from_id(id: &str) -> Option<String>")
                && internal_rs.contains(".filter(|url| url.starts_with(\"file://\"))")
                && internal_rs.contains("struct StaticRegisteredFileUrlLoader;")
                && internal_rs.contains("static_registered_file_url_from_id(base)")
                && internal_rs.contains("static_registered_file_url_id(&resolved)"),
            "static registered-loader file URL returns must keep an internal identity that preserves original file URL parents"
        );
        assert!(
            internal_rs.contains("StaticRegisteredFileUrlLoader")
                && internal_rs.contains("(JsonFileLoader, CjsCompatLoader, ImportMetaLoader)"),
            "static registered-loader file URL loader must stay installed without exceeding rquickjs loader tuple arity"
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
        assert!(
            static_return_helpers.contains("registeredLoaderPathOrUrlReturn(url, true)")
                && module_js.contains("return registeredLoaderPathOrUrlReturn(loaded.url);"),
            "static registered-loader returns must preserve file URL suffixes while require.resolve keeps path-shaped results"
        );
    }

    #[test]
    fn json_module_source_generation_is_shared() {
        let internal_rs = compact_whitespace(include_str!("../skeleton/src/internal.rs"));

        assert!(
            internal_rs.contains("struct JsonModuleCjsCache")
                && internal_rs.contains(
                    "fn json_import_attribute_missing_module_source(path: &str) -> String"
                )
                && internal_rs.contains(
                    "fn json_module_source(source: &str, cjs_cache: Option<JsonModuleCjsCache<'_>>) -> String"
                ),
            "JSON file and data URL loaders must share import-attribute and JSON source/error module generation"
        );

        let data_loader_start = internal_rs
            .find("impl Loader for DataUrlLoader")
            .expect("DataUrlLoader must exist");
        let data_loader_end = internal_rs[data_loader_start..]
            .find("fn base64_decode")
            .expect("DataUrlLoader must precede base64 decoder")
            + data_loader_start;
        let data_loader = &internal_rs[data_loader_start..data_loader_end];
        assert!(
            data_loader
                .contains("let module_source = json_import_attribute_missing_module_source(path);")
                && data_loader.contains("let module_source = json_module_source(&source, None);")
                && !data_loader.contains("make_json_error_module(&source)"),
            "Data URL JSON loading must use the shared JSON module source helpers"
        );

        let json_loader_start = internal_rs
            .find("impl Loader for JsonFileLoader")
            .expect("JsonFileLoader must exist");
        let json_loader_end = internal_rs[json_loader_start..]
            .find("pub const RESOURCE_TABLE_NAME")
            .expect("JsonFileLoader must precede resource constants")
            + json_loader_start;
        let json_loader = &internal_rs[json_loader_start..json_loader_end];
        assert!(
            json_loader.contains("json_import_attribute_missing_module_source(path)")
                && json_loader.contains("Some(JsonModuleCjsCache")
                && json_loader.contains("json_module_source(&source, cjs_cache)")
                && !json_loader.contains("make_json_error_module(&source)")
                && !json_loader.contains("format!(\"export default JSON.parse"),
            "File JSON loading must share JSON source generation while preserving CJS cache interop for suffix-free files"
        );
    }

    #[test]
    fn virtual_builtin_import_meta_source_is_shared() {
        let internal_rs = compact_whitespace(include_str!("../skeleton/src/internal.rs"));

        assert!(
            internal_rs
                .contains("fn virtual_builtin_module_source(name: &str, source: &str) -> String"),
            "virtual builtin modules must share import.meta prologue setup"
        );

        let helper_start = internal_rs
            .find("fn virtual_builtin_module_source")
            .expect("virtual builtin module source helper must exist");
        let helper_end = internal_rs[helper_start..]
            .find("fn rewrite_import_meta_main")
            .expect("virtual builtin helper must precede import.meta.main rewrite")
            + helper_start;
        let helper = &internal_rs[helper_start..helper_end];

        assert!(
            helper.contains(
                "url_only_import_meta_init(format!(\"file:///__wasm_rquickjs_virtual__/{}.mjs\", name))"
            ),
            "virtual builtin module import.meta must preserve synthetic URL identity through the shared URL-only init helper"
        );

        let new_base_start = internal_rs
            .find("async fn new_base")
            .expect("JsState::new_base must exist");
        let new_base_end = internal_rs[new_base_start..]
            .find("rt.set_loader(resolver, loader).await;")
            .expect("new_base must install loaders")
            + new_base_start;
        let new_base = &internal_rs[new_base_start..new_base_end];

        assert!(
            new_base.matches("virtual_builtin_module_source(").count() == 2
                && !new_base.contains("__wasm_rquickjs_virtual__")
                && !new_base.contains("inject_import_meta_prologue("),
            "new_base must use the shared virtual builtin module source helper for all Rust-installed builtin modules"
        );
    }

    #[test]
    fn import_meta_init_construction_is_shared() {
        let internal_rs = compact_whitespace(include_str!("../skeleton/src/internal.rs"));

        assert!(
            internal_rs.contains("fn url_only_import_meta_init")
                && internal_rs.contains("fn file_import_meta_init")
                && internal_rs.matches("ImportMetaInit { url,").count() == 2,
            "URL-only and file-backed import.meta initialization must be centralized"
        );

        let url_only_start = internal_rs
            .find("fn url_only_import_meta_init")
            .expect("URL-only import.meta init helper must exist");
        let url_only_end = internal_rs[url_only_start..]
            .find("fn file_import_meta_init")
            .expect("URL-only helper must precede file-backed helper")
            + url_only_start;
        let url_only_helper = &internal_rs[url_only_start..url_only_end];

        let file_start = internal_rs
            .find("fn file_import_meta_init")
            .expect("file-backed import.meta init helper must exist");
        let file_end = internal_rs[file_start..]
            .find("fn module_filesystem_path")
            .expect("file-backed helper must precede module path helpers")
            + file_start;
        let file_helper = &internal_rs[file_start..file_end];

        assert!(
            url_only_helper.contains("url,")
                && url_only_helper.contains("filename: None")
                && url_only_helper.contains("dirname: None")
                && url_only_helper.contains("include_resolve: true"),
            "URL-only import.meta initialization must omit filesystem metadata and keep import.meta.resolve enabled"
        );

        assert!(
            file_helper.contains("filename: Some(filename)")
                && file_helper.contains("dirname,")
                && file_helper.contains("include_resolve: true"),
            "file-backed import.meta initialization must expose filesystem metadata and keep import.meta.resolve enabled"
        );

        assert_eq!(
            internal_rs.matches("ImportMetaInit { url,").count(),
            2,
            "all ImportMetaInit literals must stay inside the shared constructors"
        );

        let data_loader_start = internal_rs
            .find("impl Loader for DataUrlLoader")
            .expect("DataUrlLoader must exist");
        let data_loader_end = internal_rs[data_loader_start..]
            .find("fn base64_decode")
            .expect("DataUrlLoader must precede base64 decoder")
            + data_loader_start;
        let data_loader = &internal_rs[data_loader_start..data_loader_end];

        let cjs_loader_start = internal_rs
            .find("impl Loader for CjsCompatLoader")
            .expect("CjsCompatLoader must exist");
        let cjs_loader_end = internal_rs[cjs_loader_start..]
            .find("struct ImportMetaInit")
            .expect("CjsCompatLoader must precede import.meta initialization")
            + cjs_loader_start;
        let cjs_loader = &internal_rs[cjs_loader_start..cjs_loader_end];

        let esm_file_start = internal_rs
            .find("fn declare_esm_file_module_from_source")
            .expect("shared file ESM declaration must exist");
        let esm_file_end = internal_rs[esm_file_start..]
            .find("struct ImportMetaLoader")
            .expect("file ESM declaration must precede ImportMetaLoader")
            + esm_file_start;
        let esm_file = &internal_rs[esm_file_start..esm_file_end];

        assert!(
            data_loader.contains("let init = url_only_import_meta_init(path.to_string());")
                && cjs_loader
                    .contains("let init = file_import_meta_init(cjs_url, fs_abs_path.clone());")
                && esm_file.contains("let init = file_import_meta_init(url, fs_abs_path.clone());"),
            "data URL ESM, CJS facades, and file ESM declarations must share import.meta initialization helpers"
        );
    }

    #[test]
    fn cjs_registered_loader_file_results_are_shared() {
        let module_js = compact_whitespace(include_str!("../skeleton/src/builtin/module.js"));

        assert!(
            module_js.contains("function cjsLoaderFileFormat(filename, format) {")
                && module_js
                    .contains("function cjsLoaderFileResult(filename, source, format, url) {")
                && module_js.contains("function cjsLoaderFileUrlResult(url, format, resultUrl) {")
                && module_js.contains(
                    "return registeredLoaderUrlFormatSourceResult( url === undefined ? nodeUrl.pathToFileURL(filename).href : String(url), cjsLoaderFileFormat(filename, format), source, );"
                ),
            "registered-loader CJS file results must use one format/source adapter"
        );
        assert!(
            module_js.contains(
                "function cjsLoaderFileUrlResult(url, format, resultUrl) { const filename = nodeUrl.fileURLToPath(url); return cjsLoaderFileResult(filename, loaderFileUrlSource(url), format, resultUrl); }"
            ),
            "registered-loader CJS file URL results must centralize file URL conversion and use the shared file-URL source reader"
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
            package_result.contains(
                "return cjsLoaderFileUrlResult(packageResolved.url, packageResolved.format, packageResolved.url);"
            ) && !package_result.contains("nodeUrl.fileURLToPath(packageResolved.url)")
                && !package_result.contains("tryReadFile(filename)"),
            "registered-loader package CJS result must use the shared file URL adapter while preserving package URL identity"
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
            default_resolver.contains("return cjsLoaderFileUrlResult(specifier);")
                && default_resolver
                    .contains("return cjsLoaderFileResult(resolved.filename, resolved.content);"),
            "registered-loader CJS file URL and relative paths must use the shared file adapters"
        );
        assert!(
            !default_resolver.contains("tryReadFile(nodeUrl.fileURLToPath("),
            "registered-loader CJS file URL default resolution must not duplicate file URL source reads"
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
    fn cjs_module_record_initialization_is_shared() {
        let module_js = compact_whitespace(include_str!("../skeleton/src/builtin/module.js"));

        let initializer_start = module_js
            .find("function initializeCjsModuleRecord(")
            .expect("CJS module record initializer must exist");
        let initializer_end = module_js[initializer_start..]
            .find("function loadModule(")
            .expect("CJS module record initializer must precede loadModule")
            + initializer_start;
        let initializer = &module_js[initializer_start..initializer_end];
        assert!(
            initializer.contains("mod.id = id;")
                && initializer.contains("mod.filename = filename;")
                && initializer.contains("mod.path = dirname;")
                && initializer.contains("mod.exports = {};")
                && initializer.contains("mod.loaded = false;")
                && initializer.contains("mod.parent = parentModule || null;")
                && initializer.contains("mod.children = [];")
                && initializer.contains("mod.paths = _nodeModulePaths(pathsBase);")
                && initializer.contains("mod._compile = makeModuleCompile(mod);")
                && initializer.contains("mod.require = makeModuleRequire(mod);")
                && initializer.contains("installCjsEsmDefaultSnapshotSlot(mod);")
                && initializer.contains("return mod;"),
            "CJS module record shape and built-in methods must stay centralized"
        );
        assert_eq!(
            module_js.matches("initializeCjsModuleRecord(").count(),
            4,
            "main, ordinary, and loader-provided CJS module records must use the shared initializer"
        );
        assert_eq!(
            module_js
                .matches("installCjsEsmDefaultSnapshotSlot(mod);")
                .count(),
            2,
            "CJS default snapshot slot installation should be limited to record initialization and snapshot capture"
        );
        assert_eq!(
            module_js
                .matches("mod._compile = makeModuleCompile(mod);")
                .count(),
            1,
            "CJS _compile setup must only happen inside the shared initializer"
        );
        assert_eq!(
            module_js
                .matches("mod.require = makeModuleRequire(mod);")
                .count(),
            1,
            "default CJS require setup must only happen inside the shared initializer"
        );

        let load_module_start = module_js
            .find("function loadModule(resolvedFilename, source, parentModule)")
            .expect("ordinary CJS loadModule must exist");
        let load_module_end = module_js[load_module_start..]
            .find("function makeLoaderCommonJsRequire(")
            .expect("loadModule must precede loader-created require")
            + load_module_start;
        let load_module = &module_js[load_module_start..load_module_end];
        assert!(
            load_module.contains("initializeCjsModuleRecord(mod, '.', filename, dirname, null, dirname);")
                && load_module.contains(
                    "mod = initializeCjsModuleRecord({}, filename, filename, dirname, parentModule, dirname);"
                )
                && load_module.contains("globalThis.process.mainModule = mod;")
                && load_module.contains("if (parentModule && parentModule.children) { parentModule.children.push(mod); }"),
            "ordinary CJS loading must share record setup while keeping main-module and parent-child side effects outside it"
        );

        let loader_source_start = module_js
            .find("function loadCommonJsSourceModule(filename, source, sourceUrl, cacheKey)")
            .expect("loader CommonJS source module helper must exist");
        let loader_source_end = module_js[loader_source_start..]
            .find("if (typeof globalThis.__wasm_rquickjs_load_commonjs_loader_source")
            .expect("loader source helper must precede global bridge setup")
            + loader_source_start;
        let loader_source = &module_js[loader_source_start..loader_source_end];
        assert!(
            loader_source.contains(
                "const mod = initializeCjsModuleRecord( {}, filename, filename, dirname, null, pathModule.isAbsolute(filename) ? dirname : '/', );"
            ) && loader_source.contains("moduleCache[cacheKey] = mod;"),
            "loader-provided CommonJS source must share record setup while keeping its cache key behavior"
        );
    }

    #[test]
    fn cjs_load_failure_cleanup_is_shared() {
        let module_js = compact_whitespace(include_str!("../skeleton/src/builtin/module.js"));

        let cleanup_start = module_js
            .find("function discardCjsModuleLoad(")
            .expect("CJS load failure cleanup helper must exist");
        let cleanup_end = module_js[cleanup_start..]
            .find("function initializeCjsModuleRecord(")
            .expect("CJS load failure cleanup helper must precede CJS record initialization")
            + cleanup_start;
        let cleanup = &module_js[cleanup_start..cleanup_end];
        assert!(
            cleanup.contains("delete moduleCache[cacheKey];")
                && cleanup.contains("unlinkModuleFromParent(parentModule, mod);"),
            "CJS load failure cleanup must centralize cache removal and parent-child unlinking"
        );

        let load_module_start = module_js
            .find("function loadModule(resolvedFilename, source, parentModule)")
            .expect("ordinary CJS loadModule must exist");
        let load_module_end = module_js[load_module_start..]
            .find("function makeLoaderCommonJsRequire(")
            .expect("loadModule must precede loader-created require")
            + load_module_start;
        let load_module = &module_js[load_module_start..load_module_end];
        assert_eq!(
            load_module
                .matches("discardCjsModuleLoad(filename, parentModule, mod);")
                .count(),
            9,
            "ordinary CJS load failure paths must use the shared cleanup helper"
        );
        assert!(
            !load_module.contains("delete moduleCache[filename];")
                && !load_module.contains("unlinkModuleFromParent(parentModule, mod);"),
            "ordinary CJS load failure paths must not duplicate cleanup details"
        );
        assert!(
            load_module.contains(
                "discardCjsModuleLoad(filename, parentModule, mod); maybeSetArrowMessageOnSyntaxError(err, filename, source); throw err;"
            ) && load_module.contains(
                "discardCjsModuleLoad(filename, parentModule, mod); maybeSetArrowMessageOnSyntaxError(cjsSyntaxError, filename, source); throw cjsSyntaxError;"
            ),
            "CJS syntax and execution failures must clean cache and parent links before decorating and rethrowing errors"
        );

        let loader_source_start = module_js
            .find("function loadCommonJsSourceModule(filename, source, sourceUrl, cacheKey)")
            .expect("loader CommonJS source module helper must exist");
        let loader_source_end = module_js[loader_source_start..]
            .find("if (typeof globalThis.__wasm_rquickjs_load_commonjs_loader_source")
            .expect("loader source helper must precede global bridge setup")
            + loader_source_start;
        let loader_source = &module_js[loader_source_start..loader_source_end];
        assert!(
            loader_source.contains("discardCjsModuleLoad(cacheKey, null, mod);"),
            "loader-provided CommonJS source must share cache cleanup while preserving parentless loading"
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
    fn js_module_scanner_has_no_dead_plain_whitespace_helper() {
        let module_js = compact_whitespace(include_str!("../skeleton/src/builtin/module.js"));

        assert!(
            !module_js.contains("function skipWhitespace(source, start)"),
            "module.js scanner should not keep an unused plain-whitespace helper beside the comment-aware helpers"
        );
        assert!(
            module_js.contains(
                "function skipWhitespaceAndCommentsImpl(source, start, trackLineTerminator)"
            ) && module_js.contains("function skipWhitespaceAndComments(source, start)")
                && module_js.contains(
                    "function skipWhitespaceAndCommentsWithLineTerminator(source, start)"
                ),
            "module.js scanner whitespace handling must stay on the shared comment-aware helpers"
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
    fn cjs_reexport_recursion_is_shared() {
        let internal_rs = compact_whitespace(include_str!("../skeleton/src/internal.rs"));

        let helper_start = internal_rs
            .find("fn analyze_cjs_reexport_specifier_names(")
            .expect("shared CJS reexport recursion helper must exist");
        let helper_end = internal_rs[helper_start..]
            .find("fn analyze_cjs_exports_for_file(")
            .expect("shared CJS reexport recursion helper must precede file analyzer")
            + helper_start;
        let helper = &internal_rs[helper_start..helper_end];
        assert!(
            helper.contains("resolve_cjs_reexport_path(filename, &reexport, conditions)")
                && helper.contains("!seen.contains(&path)")
                && helper.contains("is_cjs_analysis_source_path(&path)")
                && helper.contains("std::fs::read_to_string(&path)")
                && helper
                    .contains("analyze_cjs_exports_for_file(&path, &source, seen, conditions)"),
            "shared CJS reexport recursion helper must own resolution, source filtering, source reads, and recursion"
        );

        let file_start = helper_end;
        let file_end = internal_rs[file_start..]
            .find("struct PackageScopeInfo")
            .expect("file analyzer must precede package scope info")
            + file_start;
        let file_analyzer = &internal_rs[file_start..file_end];
        assert!(
            file_analyzer.contains(
                "analyze_cjs_reexport_specifier_names(filename, reexports, seen, conditions)"
            ) && !file_analyzer.contains("resolve_cjs_reexport_path(")
                && !file_analyzer.contains("std::fs::read_to_string(&path)"),
            "on-disk CJS analyzer must use the shared reexport recursion helper"
        );

        let loader_start = internal_rs
            .find("fn analyze_loader_cjs_reexport_names(")
            .expect("loader CJS reexport analyzer must exist");
        let loader_end = internal_rs[loader_start..]
            .find("impl Loader for CjsCompatLoader")
            .expect("loader CJS reexport analyzer must precede CJS compat loader")
            + loader_start;
        let loader_analyzer = &internal_rs[loader_start..loader_end];
        assert!(
            loader_analyzer.contains(
                "analyze_cjs_reexport_specifier_names(&filename, reexport_specifiers, &mut seen, &cjs_conditions)"
            ) && !loader_analyzer.contains("resolve_cjs_reexport_path(")
                && !loader_analyzer.contains("std::fs::read_to_string(&path)"),
            "loader-provided CJS analyzer must use the shared reexport recursion helper"
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
            package_result.contains(
                "return registeredLoaderUrlFormatResult(String(resolved.url), loaderFormatOrUndefined(resolved.format));"
            ),
            "registered-loader package result shaping must use the shared URL/format result helper and format normalizer"
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
            (resolved_result.contains("url: normalizeLoaderResolvedUrl(String(resolved.url)),")
                || resolved_result
                    .contains("url:normalizeLoaderResolvedUrl(String(resolved.url)),"))
                && resolved_result.contains("format: loaderFormatOrUndefined(resolved.format),")
                && !resolved_result.contains("resolved.url = normalizeLoaderResolvedUrl(")
                && !resolved_result.contains("resolved.url=normalizeLoaderResolvedUrl("),
            "registered-loader resolve normalization must return a normalized URL/format pair without mutating the hook result"
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
    fn static_registered_loader_source_reads_are_shared() {
        let module_js = compact_whitespace(include_str!("../skeleton/src/builtin/module.js"));

        let source_start = module_js
            .find("function staticRegisteredLoaderSourceForUrl(url)")
            .expect("static registered-loader source helper must exist");
        let source_end = module_js[source_start..]
            .find("function staticRegisteredLoaderChildUrl(")
            .expect("source helper must precede child URL helper")
            + source_start;
        let source_helper = &module_js[source_start..source_end];
        assert!(
            source_helper
                .contains("if (url.startsWith('file://')) { return loaderFileUrlSource(url); }")
                && source_helper.contains("if (url.startsWith('/')) { return tryReadFile(url); }")
                && !source_helper.contains("tryReadFile(url); } catch"),
            "static registered-loader file and path source reads must share existing null-on-failure helpers"
        );
        assert!(
            source_helper.contains("if (url.startsWith('data:'))")
                && source_helper.contains(
                    "return meta.indexOf(';base64') >= 0 ? atob(body) : decodeURIComponent(body);"
                )
                && source_helper.contains("return null;"),
            "static registered-loader source helper must keep data URL decoding and null fallback behavior"
        );

        let child_start = module_js
            .find("function staticRegisteredLoaderChildUrl(loaded, fallback)")
            .expect("static registered-loader child URL helper must exist");
        let child_end = module_js[child_start..]
            .find("function staticRegisteredLoaderParentAliases(")
            .expect("child URL helper must precede parent alias helper")
            + child_start;
        let child_helper = &module_js[child_start..child_end];
        assert!(
            child_helper.contains("if (fallback.startsWith('data:')) return fallback;")
                && child_helper.contains("if (loaded && loaded.url) return String(loaded.url);")
                && child_helper.contains("return normalizeLoaderResolvedUrl(fallback);")
                && !child_helper.contains("nodeUrl.pathToFileURL(fallback)"),
            "static registered-loader child graph traversal must share loader URL normalization while preserving data URL and loaded URL precedence"
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
        let cjs_loader_start = internal_rs
            .find("impl Loader for CjsCompatLoader")
            .expect("CjsCompatLoader must exist");
        let cjs_loader_end = internal_rs[cjs_loader_start..]
            .find("struct ImportMetaInit")
            .expect("CjsCompatLoader must precede ImportMetaInit")
            + cjs_loader_start;
        let cjs_loader = &internal_rs[cjs_loader_start..cjs_loader_end];
        assert!(
            internal_rs.contains("enum EsmFilePreflightMode")
                && internal_rs.contains("fn read_module_source_or_throw")
                && internal_rs.contains("fn esm_file_preflight_error_module_source(")
                && cjs_loader.contains("EsmFilePreflightMode::PackageTypeModuleJs")
                && cjs_loader.contains("EsmFilePreflightMode::RequireOnly")
                && cjs_loader.contains("let source = read_module_source_or_throw(ctx, path, &source_path)?;")
                && cjs_loader.contains(
                    "return declare_esm_file_module_from_source(ctx, path, fs_path, source, url, preflight_mode);"
                )
                && !cjs_loader.contains("ErrorKind::NotFound")
                && !cjs_loader.contains("let injected = inject_import_meta_prologue(&init, &module_source);"),
            "CjsCompatLoader must route .js files classified as ESM through the shared filesystem ESM declaration helper while preserving package type-module preflight"
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
        let initializer_pos = load_module
            .find("initializeCjsModuleRecord(")
            .expect("CJS loader must initialize module records through the shared helper");
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
            initializer_pos < cache_pos
                && module_js.contains(
                    "function initializeCjsModuleRecord(mod, id, filename, dirname, parentModule, pathsBase)"
                )
                && module_js.contains("installCjsEsmDefaultSnapshotSlot(mod);")
                && cache_pos < compile_call_pos
                && compile_call_pos < capture_pos,
            "regular CJS load path must initialize the snapshot slot before caching and capture after wrapper execution"
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
