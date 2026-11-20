use anyhow::Context;
use camino::Utf8Path;
use wit_encoder::StandaloneFunc;
use wit_parser::Resolve;

pub(crate) const WIZER_RESTORE_CAPABILITY: &str = "wasm-rquickjs-wizer-restore-v1";

/// The world-level import that supplies `@composition` JavaScript modules.
pub(crate) const GET_SCRIPT_IMPORT: &str = "get-script";

/// Adds the `get-script` import through which `@composition` JavaScript modules are loaded. It is
/// synchronous, so module loading needs no JavaScript promise or nested `block_on`.
pub fn add_get_script_import(wit_root: &Utf8Path, world: Option<&str>) -> anyhow::Result<()> {
    modify_world(wit_root, world, |world| {
        let mut get_script = StandaloneFunc::new(GET_SCRIPT_IMPORT, false);
        get_script.set_result(Some(wit_encoder::Type::String));
        world.function_import(get_script);
    })
}

pub fn add_wizer_init_export(wit_root: &Utf8Path, world: Option<&str>) -> anyhow::Result<()> {
    modify_world(wit_root, world, |world| {
        let wizer_init_func = StandaloneFunc::new("wizer-initialize", true);
        world.function_export(wizer_init_func);
        // Only templates with the matching runtime restore implementation opt in
        // to deterministic optimizer entropy and clocks.
        world.function_export(StandaloneFunc::new(WIZER_RESTORE_CAPABILITY, false));
    })
}

/// Rewrites the selected world of the root WIT package in `wit_root` in place.
fn modify_world(
    wit_root: &Utf8Path,
    world: Option<&str>,
    modify: impl FnOnce(&mut wit_encoder::World),
) -> anyhow::Result<()> {
    let mut resolve = Resolve::new();
    let (root_package_id, source_map) = resolve
        .push_path(wit_root)
        .context("Failed to resolve WIT package")?;
    let world_id = resolve
        .select_world(std::slice::from_ref(&root_package_id), world)
        .context("Failed to select WIT world")?;

    let root_package_name = resolve.packages[root_package_id].name.clone();
    let world_name = resolve.worlds[world_id].name.clone();

    let root_package_path = source_map
        .package_paths(root_package_id)
        .ok_or_else(|| anyhow::anyhow!("Failed to get package paths for root package"))?
        .collect::<Vec<_>>();

    if root_package_path.len() != 1 {
        return Err(anyhow::anyhow!(
            "Expected exactly one path for root package, found {root_package_path:?}",
        ));
    }

    let packages = wit_encoder::packages_from_parsed(&resolve);
    let mut root_package = packages
        .into_iter()
        .find(|pkg| pkg.name().to_string() == root_package_name.to_string())
        .ok_or_else(|| {
            anyhow::anyhow!(
                "Failed to find root package '{}' in the resolved packages",
                root_package_name
            )
        })?;

    let world = root_package
        .items_mut()
        .iter_mut()
        .find_map(|item| match item {
            wit_encoder::PackageItem::World(w) if w.name().raw_name() == world_name => Some(w),
            _ => None,
        })
        .ok_or_else(|| {
            anyhow::anyhow!(
                "Failed to find world '{}' in the root package '{}'",
                world_name,
                root_package_name
            )
        })?;

    modify(world);

    crate::write_if_changed(root_package_path[0], root_package.to_string()).context(format!(
        "Overwriting root WIT package at {:?}",
        root_package_path[0]
    ))?;

    Ok(())
}
