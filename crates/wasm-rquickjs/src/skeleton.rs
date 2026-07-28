use crate::GeneratorContext;
use anyhow::anyhow;
use camino::Utf8Path;
#[cfg(feature = "external-skeleton")]
use camino::Utf8PathBuf;
#[cfg(not(feature = "external-skeleton"))]
use include_dir::{Dir, include_dir};
use std::borrow::Cow;
use toml_edit::{Array, DocumentMut, value};

/// The single skeleton crate. It supports both WASI generation targets via the mutually
/// exclusive `p2` (default) and `p3` Cargo features, so the large Node.js builtin set is
/// shared rather than duplicated. The generation target only changes which feature is the
/// default and what the generated `src/lib.rs` looks like.
#[cfg(not(feature = "external-skeleton"))]
static SKELETON: Dir<'_> = include_dir!("$CARGO_MANIFEST_DIR/skeleton");

#[cfg(feature = "external-skeleton")]
fn skeleton_root() -> Utf8PathBuf {
    Utf8Path::new(env!("CARGO_MANIFEST_DIR")).join("skeleton")
}

#[cfg(not(feature = "external-skeleton"))]
fn skeleton_cargo_toml() -> anyhow::Result<Cow<'static, str>> {
    Ok(Cow::Borrowed(
        SKELETON
            .get_file("Cargo.toml_")
            .or_else(|| SKELETON.get_file("Cargo.toml"))
            .ok_or_else(|| anyhow!("Missing Cargo.toml skeleton"))?
            .contents_utf8()
            .ok_or_else(|| anyhow!("Cargo.toml skeleton is not valid UTF-8"))?,
    ))
}

#[cfg(feature = "external-skeleton")]
fn skeleton_cargo_toml() -> anyhow::Result<Cow<'static, str>> {
    let root = skeleton_root();
    let primary = root.join("Cargo.toml_");
    match std::fs::read_to_string(&primary) {
        Ok(contents) => Ok(Cow::Owned(contents)),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
            std::fs::read_to_string(root.join("Cargo.toml"))
                .map(Cow::Owned)
                .map_err(|error| anyhow!("Failed to read Cargo.toml skeleton: {error}"))
        }
        Err(error) => Err(anyhow!(
            "Failed to read Cargo.toml skeleton {primary}: {error}"
        )),
    }
}

/// Generates a `Cargo.toml` file for the wrapper crate in the `context.output` directory,
/// based on `skeleton/Cargo.toml_`.
///
/// Changes applied to the skeleton toml file:
/// - Changing the package name to `crate_name` (which is the name of the chosen WIT world).
/// - For the Preview 3 target, replacing the default feature set with `["p3"]` so the crate
///   compiles the async runtime spine instead of the Preview 2 path.
pub fn generate_cargo_toml(context: &GeneratorContext<'_>) -> anyhow::Result<()> {
    // Loading the skeleton Cargo.toml file
    let cargo_toml = skeleton_cargo_toml()?;

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

/// Replaces `[features] default` with `["p3", "normal-p3"]` for the Preview 3 target.
///
/// The skeleton defaults to the Preview 2 feature set (`["p2", "normal"]`); a Preview 3
/// wrapper crate must instead select the `p3` runtime spine (which pulls in the `wasip3` /
/// renamed `wit-bindgen` dependencies) together with the `normal-p3` capability tier. That
/// tier mirrors the Preview 2 `normal` tier exactly — `crypto`, `zlib`, `logging`, and
/// `encoding` — except for Preview 2 HTTP (`fetch` / `node-http`), which the `p3` path
/// replaces with its own built-in `wasi:http@0.3` based implementations. The heavier
/// capabilities remain available through the `full-p3` tier.
fn set_p3_default_features(doc: &mut DocumentMut) {
    let mut default = Array::new();
    default.push("p3");
    default.push("normal-p3");
    doc["features"]["default"] = value(default);
}

/// Files in the skeleton `src/` directory that are always overwritten by code generation.
/// Skipping them avoids unnecessary timestamp changes that would trigger recompilation.
const GENERATED_FILES: &[&str] = &["src/lib.rs"];

/// Copies the skeleton's `Cargo.lock` to the output directory so that dependency
/// resolution is instant instead of resolving 300+ crates from scratch each time.
#[cfg(not(feature = "external-skeleton"))]
pub fn copy_skeleton_lock(output: &Utf8Path) -> anyhow::Result<()> {
    if let Some(lock_file) = SKELETON.get_file("Cargo.lock") {
        let dest = output.join("Cargo.lock");
        crate::write_if_changed(dest, lock_file.contents())?;
    }
    Ok(())
}

#[cfg(feature = "external-skeleton")]
pub fn copy_skeleton_lock(output: &Utf8Path) -> anyhow::Result<()> {
    let source = skeleton_root().join("Cargo.lock");
    match std::fs::read(&source) {
        Ok(contents) => crate::write_if_changed(output.join("Cargo.lock"), contents)?,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {}
        Err(error) => {
            return Err(anyhow!(
                "Failed to read skeleton lockfile {source}: {error}"
            ));
        }
    }
    Ok(())
}

/// Copies all source files from the skeleton directory to `<output>/src`.
///
/// Every `src/` subdirectory (`builtin/`, `internal/`, ...) is copied recursively so that
/// the multi-file modules of the skeleton (e.g. the `p2`/`p3` split of `internal`) are all
/// present in the generated crate. Files listed in [`GENERATED_FILES`] are skipped because
/// code generation overwrites them.
#[cfg(not(feature = "external-skeleton"))]
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

#[cfg(not(feature = "external-skeleton"))]
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

#[cfg(feature = "external-skeleton")]
pub fn copy_skeleton_sources(output: &Utf8Path) -> anyhow::Result<()> {
    let root = skeleton_root();
    recursive_copy_external_sources(&root.join("src"), &root, output, false)
}

#[cfg(feature = "external-skeleton")]
fn recursive_copy_external_sources(
    source: &Utf8Path,
    root: &Utf8Path,
    output: &Utf8Path,
    remove_stale_sibling: bool,
) -> anyhow::Result<()> {
    let relative = source
        .strip_prefix(root)
        .map_err(|error| anyhow!("Invalid skeleton source path {source}: {error}"))?;
    std::fs::create_dir_all(output.join(relative))?;

    let mut entries = std::fs::read_dir(source)
        .map_err(|error| anyhow!("Failed to read skeleton directory {source}: {error}"))?
        .collect::<Result<Vec<_>, _>>()?;
    entries.sort_by_key(|entry| entry.file_name());

    if remove_stale_sibling
        && entries.iter().any(|entry| {
            entry.file_name() == "mod.rs"
                && entry
                    .file_type()
                    .map(|file_type| file_type.is_file())
                    .unwrap_or(false)
        })
    {
        let stale = output.join(format!("{relative}.rs"));
        if stale.exists() {
            std::fs::remove_file(&stale)
                .map_err(|error| anyhow!("Failed to remove stale module file {stale}: {error}"))?;
        }
    }

    for entry in entries {
        let path = Utf8PathBuf::from_path_buf(entry.path())
            .map_err(|path| anyhow!("Unexpected non-UTF-8 path in skeleton: {}", path.display()))?;
        let file_type = entry
            .file_type()
            .map_err(|error| anyhow!("Failed to inspect skeleton path {path}: {error}"))?;
        if file_type.is_dir() {
            recursive_copy_external_sources(&path, root, output, true)?;
        } else if file_type.is_file() {
            let relative = path
                .strip_prefix(root)
                .map_err(|error| anyhow!("Invalid skeleton source path {path}: {error}"))?;
            if !GENERATED_FILES.contains(&relative.as_str()) {
                crate::write_if_changed(output.join(relative), std::fs::read(&path)?)?;
            }
        }
    }

    Ok(())
}

#[cfg(test)]
mod module_loader_architecture;
