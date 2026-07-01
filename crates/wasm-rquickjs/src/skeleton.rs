use crate::GeneratorContext;
use anyhow::anyhow;
use camino::Utf8Path;
use include_dir::{Dir, include_dir};
use toml_edit::{Array, DocumentMut, value};

/// The single skeleton crate. It supports both WASI generation targets via the mutually
/// exclusive `p2` (default) and `p3` Cargo features, so the large Node.js builtin set is
/// shared rather than duplicated. The generation target only changes which feature is the
/// default and what the generated `src/lib.rs` looks like.
static SKELETON: Dir<'_> = include_dir!("$CARGO_MANIFEST_DIR/skeleton");

/// Generates a `Cargo.toml` file for the wrapper crate in the `context.output` directory,
/// based on `skeleton/Cargo.toml_`.
///
/// Changes applied to the skeleton toml file:
/// - Changing the package name to `crate_name` (which is the name of the chosen WIT world).
/// - For the Preview 3 target, replacing the default feature set with `["p3"]` so the crate
///   compiles the async runtime spine instead of the Preview 2 path.
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

    if context.target.is_p3() {
        set_p3_default_features(&mut doc);
    }

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

/// Replaces `[features] default` with `["p3"]` for the Preview 3 target.
///
/// The skeleton defaults to the Preview 2 feature set (`["p2", "normal"]`); a Preview 3
/// wrapper crate must instead enable only the `p3` feature, which selects the async runtime
/// spine and the `wasip3` / renamed `wit-bindgen` dependencies.
fn set_p3_default_features(doc: &mut DocumentMut) {
    let mut default = Array::new();
    default.push("p3");
    doc["features"]["default"] = value(default);
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
///
/// Every `src/` subdirectory (`builtin/`, `internal/`, ...) is copied recursively so that
/// the multi-file modules of the skeleton (e.g. the `p2`/`p3` split of `internal`) are all
/// present in the generated crate. Files listed in [`GENERATED_FILES`] are skipped because
/// code generation overwrites them.
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

        // Recursively copy every source subdirectory (builtin/, internal/, ...).
        for dir in src.dirs() {
            recursive_copy_sources(dir, output)?;
        }
    }

    Ok(())
}

fn recursive_copy_sources(dir: &Dir, output: &Utf8Path) -> anyhow::Result<()> {
    let dir_path = Utf8Path::from_path(dir.path())
        .ok_or_else(|| anyhow!("Unexpected non-UTF-8 path in skeleton"))?;
    std::fs::create_dir_all(output.join(dir_path))?;

    // Migration: if this directory is a module (contains `mod.rs`), remove any stale sibling
    // `<dir>.rs` file from a previous generation that used the single-file module layout (e.g.
    // `internal.rs` was split into `internal/mod.rs`). Leaving both behind makes `mod <dir>;`
    // ambiguous and breaks recompilation when regenerating into an existing crate.
    let has_mod_rs = dir
        .files()
        .any(|f| f.path().file_name().and_then(|n| n.to_str()) == Some("mod.rs"));
    if has_mod_rs {
        let stale = output.join(format!("{dir_path}.rs"));
        if stale.exists() {
            std::fs::remove_file(&stale)
                .map_err(|e| anyhow!("Failed to remove stale module file {stale}: {e}"))?;
        }
    }

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
