use crate::{DependencySpec, GenerationTarget, GeneratorContext};
use anyhow::{Context, anyhow};
use camino::{Utf8Path, Utf8PathBuf};
#[cfg(not(feature = "external-skeleton"))]
use include_dir::{Dir, include_dir};
use std::borrow::Cow;
use toml_edit::{DocumentMut, value};

/// The skeleton crate copied into every generated wrapper crate.
#[cfg(not(feature = "external-skeleton"))]
static SKELETON: Dir<'_> = include_dir!("$CARGO_MANIFEST_DIR/skeleton");

const COMPONENT_LICENSES_P3: &[u8] =
    include_bytes!("../licenses/THIRD_PARTY_COMPONENT_LICENSES_P3.txt");

/// Copies the reviewed dependency attribution for the component.
///
/// This file is deliberately a sidecar rather than a custom Wasm section: it does not affect
/// component bytes, and downstream distributors can combine it with their own application
/// notices while keeping the audited dependency closure visible.
pub fn copy_component_licenses(output: &Utf8Path, target: GenerationTarget) -> anyhow::Result<()> {
    let contents = match target {
        GenerationTarget::WasiP3 => COMPONENT_LICENSES_P3,
    };
    crate::write_if_changed(output.join("THIRD_PARTY_COMPONENT_LICENSES.txt"), contents)?;
    Ok(())
}

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
/// - Removing skeleton-only publication and license metadata; the generated crate embeds
///   user-owned JavaScript, so its package policy must be chosen by that user.
/// - Adding the caller's `dependencies`, each replacing a skeleton entry with the same key.
pub fn generate_cargo_toml(
    context: &GeneratorContext<'_>,
    dependencies: &[DependencySpec],
) -> anyhow::Result<()> {
    // Loading the skeleton Cargo.toml file
    let cargo_toml = skeleton_cargo_toml()?;

    let mut doc = cargo_toml
        .parse::<DocumentMut>()
        .map_err(|err| anyhow!("Cargo.toml skeleton is not a valid TOML: {err}"))?;

    change_package_name(context, &mut doc);

    add_dependencies(&mut doc, context.output, dependencies)?;

    // Writing the result
    let output_path = context.output.join("Cargo.toml");
    crate::write_if_changed(output_path, doc.to_string())?;
    Ok(())
}

fn add_dependencies(
    doc: &mut DocumentMut,
    output: &Utf8Path,
    dependencies: &[DependencySpec],
) -> anyhow::Result<()> {
    for dependency in dependencies {
        let mut parsed = dependency
            .value
            .parse::<toml_edit::Value>()
            .map_err(|error| {
                anyhow!(
                    "dependency `{}` is not a TOML value: {error}",
                    dependency.key
                )
            })?;
        if let Some(table) = parsed.as_inline_table_mut() {
            if let Some(path) = table.get("path").and_then(|path| path.as_str()) {
                let relative =
                    relative_dependency_path(Utf8Path::new(path), output).with_context(|| {
                        format!("dependency `{}` has an unusable path", dependency.key)
                    })?;
                table.insert("path", relative.as_str().into());
            }
        } else if !parsed.is_str() {
            anyhow::bail!(
                "dependency `{}` must be a version string or an inline table",
                dependency.key
            );
        }
        parsed.decor_mut().clear();
        doc["dependencies"]
            .as_table_mut()
            .ok_or_else(|| anyhow!("Cargo.toml skeleton has no [dependencies] table"))?
            .insert(&dependency.key, toml_edit::Item::Value(parsed));
    }
    Ok(())
}

/// Resolves `path` against the current working directory and expresses it relative to the
/// generated crate, so the crate stays valid when its checkout moves.
fn relative_dependency_path(path: &Utf8Path, output: &Utf8Path) -> anyhow::Result<Utf8PathBuf> {
    let target = Utf8PathBuf::try_from(std::fs::canonicalize(path)?)?;
    let base = Utf8PathBuf::try_from(std::fs::canonicalize(output)?)?;
    let mut target_components = target.components().peekable();
    let mut base_components = base.components().peekable();
    let mut shared = 0;
    while let (Some(left), Some(right)) = (target_components.peek(), base_components.peek()) {
        if left != right {
            break;
        }
        target_components.next();
        base_components.next();
        shared += 1;
    }
    if shared == 0 {
        // Different roots, such as Windows drives, have no relative form.
        return Ok(target);
    }
    let mut relative = Utf8PathBuf::new();
    for _ in base_components {
        relative.push("..");
    }
    for component in target_components {
        relative.push(component);
    }
    if relative.as_str().is_empty() {
        relative.push(".");
    }
    Ok(relative)
}

/// Changes the crate's package name to the selected WIT world's name
fn change_package_name(context: &GeneratorContext, doc: &mut DocumentMut) {
    set_generated_package_metadata(&context.world_name, doc);
}

fn set_generated_package_metadata(crate_name: &str, doc: &mut DocumentMut) {
    doc["package"]["name"] = value(crate_name);
    let package = doc["package"]
        .as_table_mut()
        .expect("validated Cargo manifest package must be a table");
    package.remove("license");
    package.remove("publish");
}

/// Files in the skeleton `src/` directory that are always overwritten by code generation.
/// Skipping them avoids unnecessary timestamp changes that would trigger recompilation.
const GENERATED_FILES: &[&str] = &["src/lib.rs"];

/// Copies the skeleton's `Cargo.lock` to the output directory so that dependency
/// resolution is instant instead of resolving 300+ crates from scratch each time.
#[cfg(not(feature = "external-skeleton"))]
pub fn copy_skeleton_lock(output: &Utf8Path, package_name: &str) -> anyhow::Result<()> {
    if let Some(lock_file) = SKELETON.get_file("Cargo.lock") {
        let dest = output.join("Cargo.lock");
        let contents = lock_file
            .contents_utf8()
            .ok_or_else(|| anyhow!("Embedded skeleton Cargo.lock contains invalid UTF-8"))?;
        let skeleton_package = skeleton_package_name()?;
        crate::write_if_changed(
            dest,
            generated_lock(contents, &skeleton_package, package_name)?.as_bytes(),
        )?;
    }
    Ok(())
}

#[cfg(feature = "external-skeleton")]
pub fn copy_skeleton_lock(output: &Utf8Path, package_name: &str) -> anyhow::Result<()> {
    let source = skeleton_root().join("Cargo.lock");
    match std::fs::read_to_string(&source) {
        Ok(contents) => {
            let skeleton_package = skeleton_package_name()?;
            crate::write_if_changed(
                output.join("Cargo.lock"),
                generated_lock(&contents, &skeleton_package, package_name)?.as_bytes(),
            )?
        }
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {}
        Err(error) => {
            return Err(anyhow!(
                "Failed to read skeleton lockfile {source}: {error}"
            ));
        }
    }
    Ok(())
}

fn skeleton_package_name() -> anyhow::Result<String> {
    let manifest = skeleton_cargo_toml()?
        .parse::<DocumentMut>()
        .map_err(|error| anyhow!("Failed to parse skeleton Cargo.toml: {error}"))?;
    manifest["package"]["name"]
        .as_str()
        .map(ToOwned::to_owned)
        .ok_or_else(|| anyhow!("Missing package.name in skeleton Cargo.toml"))
}

fn generated_lock(
    contents: &str,
    skeleton_package_name: &str,
    package_name: &str,
) -> anyhow::Result<String> {
    let skeleton_package = format!("name = \"{skeleton_package_name}\"");
    let matches = contents.match_indices(&skeleton_package).count();
    if matches != 1 {
        return Err(anyhow!(
            "Expected exactly one {skeleton_package:?} entry in the skeleton lockfile, found {matches}"
        ));
    }

    Ok(contents.replacen(&skeleton_package, &format!("name = \"{package_name}\""), 1))
}

/// Copies all source files from the skeleton directory to `<output>/src`.
///
/// Every `src/` subdirectory (`builtin/`, `internal/`, ...) is copied recursively so that
/// the multi-file modules of the skeleton (e.g. `internal/`) are all
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

#[cfg(test)]
mod tests {
    use super::{
        COMPONENT_LICENSES_P3, copy_component_licenses, generated_lock,
        set_generated_package_metadata,
    };
    use crate::GenerationTarget;
    use camino_tempfile::Utf8TempDir;

    #[test]
    fn component_license_notice_names_its_target() {
        let p3 = std::str::from_utf8(COMPONENT_LICENSES_P3).unwrap();
        assert!(p3.contains("WASI Preview 3"));
        assert!(!p3.contains("<year>"));
        assert!(!p3.contains("GB18030_2022_OVERRIDE_PUA"));
    }

    #[test]
    fn generated_package_does_not_inherit_skeleton_only_metadata() {
        let mut manifest =
            "[package]\nname = \"rquickjs-component\"\nlicense = \"Apache-2.0\"\npublish = false\n"
                .parse::<toml_edit::DocumentMut>()
                .unwrap();

        set_generated_package_metadata("generated-world", &mut manifest);

        assert_eq!(
            manifest["package"]["name"].as_str(),
            Some("generated-world")
        );
        assert!(manifest["package"].get("license").is_none());
        assert!(manifest["package"].get("publish").is_none());
    }

    #[test]
    fn copies_the_component_notice() {
        let output = Utf8TempDir::new().unwrap();
        let path = output.path().join("THIRD_PARTY_COMPONENT_LICENSES.txt");

        copy_component_licenses(output.path(), GenerationTarget::WasiP3).unwrap();
        assert_eq!(std::fs::read(path).unwrap(), COMPONENT_LICENSES_P3);
    }

    #[test]
    fn generated_lock_requires_exactly_one_skeleton_package() {
        let lock = "[[package]]\nname = \"rquickjs-component\"\nversion = \"0.0.0\"\n";
        assert_eq!(
            generated_lock(lock, "rquickjs-component", "generated-world").unwrap(),
            "[[package]]\nname = \"generated-world\"\nversion = \"0.0.0\"\n"
        );
        assert!(
            generated_lock(
                "[[package]]\nname = \"other\"\n",
                "rquickjs-component",
                "generated-world"
            )
            .is_err()
        );
        assert!(
            generated_lock(
                &format!("{lock}{lock}"),
                "rquickjs-component",
                "generated-world"
            )
            .is_err()
        );
    }
}
