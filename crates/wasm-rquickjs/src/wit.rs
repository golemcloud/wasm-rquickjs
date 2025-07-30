use anyhow::Context;
use camino::Utf8Path;
use wit_encoder::StandaloneFunc;
use wit_parser::Resolve;

pub fn add_get_script_import(wit_root: &Utf8Path, world: Option<&str>) -> anyhow::Result<()> {
    let mut resolve = Resolve::new();
    let (root_package_id, source_map) = resolve
        .push_path(wit_root)
        .context("Failed to resolve WIT package")?;
    let world_id = resolve
        .select_world(root_package_id, world)
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

    let mut get_source_func = StandaloneFunc::new("get-script", false);
    get_source_func.set_result(Some(wit_encoder::Type::String));

    world.function_import(get_source_func);

    std::fs::write(root_package_path[0], root_package.to_string()).context(format!(
        "Overwriting root WIT package at {:?}",
        root_package_path[0]
    ))?;

    Ok(())
}
