use crate::GeneratorContext;
use anyhow::anyhow;
use camino::Utf8Path;
use heck::ToSnakeCase;
use include_dir::{Dir, include_dir};
use std::collections::BTreeSet;
use std::path::Path;
use toml_edit::{DocumentMut, Item, Table, Value, value};

static SKELETON: Dir<'_> = include_dir!("$CARGO_MANIFEST_DIR/skeleton");

/// Generates a `Cargo.toml` file for the wrapper crate in the `context.output` directory,
/// based on `skeleton/Cargo.toml`.
///
/// Changes applied to the skeleton toml file:
/// - Changing the package name to `crate_name` (which is the name of the chosen WIT world).
/// - Adding a `[package.metadata.component.target.dependencies]` section with all the WIT
///   dependencies of the WIT package.
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
    add_wit_dependencies(&context, &mut doc)?;

    // Writing the result
    let output_path = context.output.join("Cargo.toml");
    std::fs::write(output_path, doc.to_string())?;
    Ok(())
}

pub fn generate_app_manifest(context: &GeneratorContext<'_>) -> anyhow::Result<()> {
    // Load the source YAML from the skeleton
    let raw_yaml = SKELETON
        .get_file("golem.yaml")
        .ok_or_else(|| anyhow!("Missing golem.yaml skeleton"))?
        .contents_utf8()
        .ok_or_else(|| anyhow!("golem.yaml skeleton is not valid UTF-8"))?;

    // Replacing `component_name` with the crate's name
    let raw_yaml = raw_yaml
        .replace("component_name", &context.world_name.to_snake_case())
        .replace("root:package", &context.root_package_name());

    // Writing the result
    let output_path = context.output.join("golem.yaml");
    std::fs::write(output_path, &raw_yaml)?;
    Ok(())
}

/// Changes the crate's package name to the selected WIT world's name
fn change_package_name(context: &GeneratorContext, doc: &mut DocumentMut) {
    let crate_name = &context.world_name;
    doc["package"]["name"] = value(crate_name);
}

/// Lists all the WIT dependencies for cargo-component in the `[package.metadata.component.target.dependencies]`
/// section
fn add_wit_dependencies(context: &&GeneratorContext, doc: &mut DocumentMut) -> anyhow::Result<()> {
    let dependencies = doc
        .entry("package")
        .or_insert(toml_edit::Item::Table(toml_edit::Table::new()))
        .as_table_mut()
        .and_then(|table| {
            table
                .entry("metadata")
                .or_insert(toml_edit::Item::Table(toml_edit::Table::new()))
                .as_table_mut()
        })
        .and_then(|table| {
            table
                .entry("component")
                .or_insert(toml_edit::Item::Table(toml_edit::Table::new()))
                .as_table_mut()
        })
        .and_then(|table| {
            table
                .entry("target")
                .or_insert(toml_edit::Item::Table(toml_edit::Table::new()))
                .as_table_mut()
        })
        .and_then(|table| {
            table
                .entry("dependencies")
                .or_insert(toml_edit::Item::Table(toml_edit::Table::new()))
                .as_table_mut()
        })
        .ok_or_else(|| {
            anyhow!("Failed to create the package.metadata.component.target.dependencies table")
        })?;

    for (package_id, package) in &context.resolve.packages {
        if let Some(paths) = context.source_map.package_paths(package_id) {
            let mut parents = BTreeSet::new();
            for path in paths {
                let path = Utf8Path::from_path(path).ok_or_else(|| anyhow!("Invalid path"))?;
                let relative_path = path.strip_prefix(context.wit_source_path).unwrap_or(path);
                if let Some(parent) = relative_path.parent() {
                    parents.insert(parent);
                }
            }

            if parents.len() > 1 {
                return Err(anyhow!(
                    "Package {:?} has multiple source directories: {:?}",
                    package.name,
                    parents
                ));
            } else if let Some(parent) = parents.first() {
                if *parent != Path::new("") {
                    let mut package_name_without_version = package.name.clone();
                    package_name_without_version.version = None;

                    // Adding the package as a dependency
                    let mut target = Table::new();
                    target.insert("path", Item::Value(Value::from(format!("wit/{parent}"))));

                    dependencies.insert(
                        &package_name_without_version.to_string(),
                        Item::Table(target),
                    );
                }
            } else {
                return Err(anyhow!(
                    "Package {:?} has no source directories",
                    package.name
                ));
            }
        }
    }

    Ok(())
}

/// Copies all source files from the skeleton directory to `<output>/src`.
pub fn copy_skeleton_sources(output: &Utf8Path) -> anyhow::Result<()> {
    if let Some(src) = SKELETON.get_dir("src") {
        for file in src.files() {
            let src_path = Utf8Path::from_path(file.path())
                .ok_or_else(|| anyhow!("Unexpected non-UTF-8 path in skeleton"))?;
            let dest_path = output.join(src_path);
            std::fs::write(dest_path, file.contents())?;
        }

        std::fs::create_dir_all(output.join("src/builtin"))?;
        for file in src
            .get_dir("src/builtin")
            .ok_or_else(|| anyhow!("Missing builtin module in skeleton"))?
            .files()
        {
            let src_path = Utf8Path::from_path(file.path())
                .ok_or_else(|| anyhow!("Unexpected non-UTF-8 path in skeleton"))?;
            let dest_path = output.join(src_path);
            std::fs::write(dest_path, file.contents())?;
        }
    }
    Ok(())
}
