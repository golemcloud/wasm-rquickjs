use crate::exports::generate_export_impls;
use crate::skeleton::{copy_skeleton_sources, generate_cargo_toml};
use anyhow::Context;
use camino::Utf8Path;
use fs_extra::dir::CopyOptions;
use wit_parser::{PackageId, Resolve, WorldId};

mod exports;
mod skeleton;
mod types;

pub fn generate_wrapper_crate(
    wit: &Utf8Path,
    js: &Utf8Path,
    output: &Utf8Path,
    world: Option<&str>,
) -> anyhow::Result<()> {
    // Making sure the target directories exists
    std::fs::create_dir_all(output).context("Failed to create output directory")?;
    std::fs::create_dir_all(output.join("src")).context("Failed to create output/src directory")?;

    // Resolving the WIT package
    let context = GeneratorContext::new(output, wit, world)?;

    // Generating the Cargo.toml file
    generate_cargo_toml(&context.world_name(), context.output)?;

    // Copying the skeleton files
    copy_skeleton_sources(&context.output).context("Failed to copy skeleton sources")?;

    // Copying the WIT package to the output directory
    copy_wit_directory(&wit, &context.output)
        .context("Failed to copy WIT package to output directory")?;

    // Copying the JavaScript module to the output directory
    copy_js_module(js, &context.output)
        .context("Failed to copy JavaScript module to output directory")?;

    // Generating the lib.rs file implementing the component exports
    generate_export_impls(&context)
        .context("Failed to generate the component export implementations")?;

    Ok(())
}

struct GeneratorContext<'a> {
    output: &'a Utf8Path,
    resolve: Resolve,
    root_package: PackageId,
    world: WorldId,
}

impl<'a> GeneratorContext<'a> {
    fn new(output: &'a Utf8Path, wit: &Utf8Path, world: Option<&str>) -> anyhow::Result<Self> {
        let mut resolve = Resolve::default();
        let (root_package, _source_map) = resolve
            .push_path(wit)
            .context("Failed to resolve WIT package")?;
        let world = resolve
            .select_world(root_package, world)
            .context("Failed to select WIT world")?;

        Ok(Self {
            output,
            resolve,
            root_package,
            world,
        })
    }

    fn world_name(&self) -> String {
        self.resolve.worlds[self.world].name.clone()
    }
}

fn copy_wit_directory(wit: &Utf8Path, output: &Utf8Path) -> anyhow::Result<()> {
    let options = CopyOptions {
        overwrite: true,
        ..Default::default()
    };

    fs_extra::copy_items(&[wit], output, &options).context("Failed to copy WIT directory")?;

    Ok(())
}

fn copy_js_module(js: &Utf8Path, output: &Utf8Path) -> anyhow::Result<()> {
    let js_dest = output.join("src").join("module.js");
    std::fs::copy(js, js_dest).context("Failed to copy JavaScript module")?;
    Ok(())
}
