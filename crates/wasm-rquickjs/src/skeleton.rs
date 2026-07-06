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
    fn package_map_primitives_stay_cross_language_aligned() {
        let module_js = compact_whitespace(include_str!("../skeleton/src/builtin/module.js"));
        let internal_rs = compact_whitespace(include_str!("../skeleton/src/internal.rs"));

        assert!(
            module_js.contains("function packagePatternKeyMatch(patternKey, key)")
                && module_js
                    .contains("if (key.length <= prefix.length + suffix.length) return null;")
                && internal_rs.contains(
                    "fn package_pattern_key_match(pattern_key: &str, key: &str) -> Option<String>"
                )
                && internal_rs
                    .contains("if key.len() <= prefix.len() + suffix.len() { return None; }"),
            "JS and Rust package pattern matching must both reject empty wildcard substitutions"
        );
        assert!(
            module_js.contains("function packagePatternCompare(a, b)")
                && module_js.contains("if (aBase !== bBase) return bBase - aBase;")
                && module_js.contains("if (aTrailer !== bTrailer) return bTrailer - aTrailer;")
                && module_js.contains("if (a.length !== b.length) return b.length - a.length;")
                && internal_rs
                    .contains("fn package_pattern_compare(a: &str, b: &str) -> std::cmp::Ordering")
                && internal_rs.contains("match b_star.cmp(&a_star)")
                && internal_rs.contains("match b_trailer.cmp(&a_trailer)")
                && internal_rs.contains("match b.len().cmp(&a.len())"),
            "JS and Rust package pattern precedence must stay mechanically aligned"
        );
        assert!(
            module_js.contains("function findPackageMapTarget(map, specifier, invalidPatternMessage)")
                && module_js.contains("Object.prototype.hasOwnProperty.call(map, specifier)")
                && module_js.contains("const pattern = findBestPackagePattern(map, specifier);")
                && internal_rs.contains(
                    "fn find_package_map_target<'a>( map: &'a IndexMap<String, PackageTarget>, specifier: &str,"
                )
                && internal_rs.contains("if let Some(target) = map.get(specifier)")
                && internal_rs.contains("Self::find_best_package_pattern(map, specifier)"),
            "JS and Rust package map target selection must check exact keys before patterns"
        );
        assert!(
            module_js.contains("isInvalidPackagePatternSubstitution(pattern.substitution)")
                && module_js.contains(
                    "invalidPackagePatternSubstitutionMessage(pattern.substitution, invalidPatternMessage)"
                )
                && internal_rs.contains(
                    "Self::is_invalid_package_pattern_substitution(&pattern_substitution)"
                )
                && internal_rs.contains("NodePackageResolveError::InvalidPackagePatternMatch")
                && internal_rs.contains(
                    "Self::invalid_package_pattern_substitution_message( &pattern_substitution, invalid_pattern_message,"
                ),
            "JS and Rust package map target selection must reject invalid pattern substitutions"
        );
        assert!(
            module_js.contains("function hasEncodedSlashOrBackslash(value)")
                && module_js.contains("/%(?:2f|5c)/i.test(value)")
                && internal_rs.contains("fn has_encoded_slash_or_backslash(value: &str) -> bool")
                && internal_rs.contains("lower.contains(\"%2f\") || lower.contains(\"%5c\")"),
            "JS and Rust encoded slash/backslash checks must stay aligned"
        );
        assert!(
            module_js.contains("decoded = decodeURIComponent(segment);")
                && module_js.contains("decoded = decoded.toLowerCase();")
                && module_js
                    .contains("decoded === '.' || decoded === '..' || decoded === 'node_modules'")
                && internal_rs.contains(
                    "let decoded = percent_decode(segment).unwrap_or_else(|| segment.to_string());"
                )
                && internal_rs
                    .contains("matches!(decoded.to_ascii_lowercase().as_str(), \".\" | \"..\" | \"node_modules\")"),
            "JS and Rust invalid package target segment checks must stay aligned"
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
                && !resolve_package_imports.contains("findPackageScope(")
                && !resolve_package_imports.contains("findPackageMapTarget(")
                && !module_js.contains("function validatePackageImportSpecifier("),
            "CJS package imports must delegate package-map resolution to Rust cjs-analysis mode"
        );
        assert!(
            internal_rs.contains("fn try_resolve_package_import_with_context(")
                && internal_rs.contains("no_imports_field: bool")
                && internal_rs.contains("\"__wasmNoImportsField\"")
                && internal_rs.contains("Self::validate_package_import_specifier(name)?"),
            "Rust package imports must preserve CJS fallback metadata and validation ownership"
        );
    }
}
