use crate::conversions::generate_conversions;
use crate::exports::generate_export_impls;
use crate::imports::generate_import_modules;
use crate::skeleton::{copy_skeleton_sources, generate_app_manifest, generate_cargo_toml};
use crate::wit::add_get_script_import;
use anyhow::{Context, anyhow};
use camino::{Utf8Path, Utf8PathBuf};
use fs_extra::dir::CopyOptions;
use heck::{ToSnakeCase, ToUpperCamelCase};
use proc_macro2::{Ident, Span};
use std::cell::RefCell;
use std::collections::{BTreeSet, VecDeque};
use wit_parser::{
    Function, Interface, InterfaceId, PackageId, PackageName, PackageSourceMap, Resolve, TypeId,
    TypeOwner, WorldId, WorldItem,
};

mod conversions;
mod exports;
mod imports;
mod javascript;
mod rust_bindgen;
mod skeleton;
mod types;
mod typescript;
mod wit;

/// Specifies how a given user-defined JS module gets embedded into the generated Rust crate.
#[derive(Debug, Clone)]
pub enum EmbeddingMode {
    /// Points to a JS module file that is going to be embedded into the generated Rust crate
    EmbedFile(Utf8PathBuf),
    /// The JS module is going to be fetched run-time through an imported WIT interface
    Composition,
}

/// Specifies a JS module to be evaluated in the generated component.
#[derive(Debug, Clone)]
pub struct JsModuleSpec {
    pub name: String,
    pub mode: EmbeddingMode,
}

impl JsModuleSpec {
    pub fn file_name(&self) -> String {
        self.name.replace('/', "_") + ".js"
    }
}

/// Generates a Rust wrapper crate for a combination of a WIT package and a JavaScript module.
///
/// The `wit` parameter should point to a WIT root (holding the WIT package of the component, with
/// optionally a `deps` subdirectory with an arbitrary number of dependencies).
///
/// The `js_modules` parameter must point to at least one JavaScript module that implements the WIT package,
/// and optionally additional modules that get imported during the initialization of the component. It is
/// always the first in the list that is considered the one containing the implementation of the WIT exports.
///
/// The `output` parameter is the root directory where the generated Rust crate's source code and
/// Cargo manifest is placed.
///
/// If `world` is `None`, the default world is selected and used, otherwise the specified one.
pub fn generate_wrapper_crate(
    wit: &Utf8Path,
    js_modules: &[JsModuleSpec],
    output: &Utf8Path,
    world: Option<&str>,
) -> anyhow::Result<()> {
    // Making sure the target directories exists
    std::fs::create_dir_all(output).context("Failed to create output directory")?;
    std::fs::create_dir_all(output.join("src")).context("Failed to create output/src directory")?;
    std::fs::create_dir_all(output.join("src").join("modules"))
        .context("Failed to create output/src/modules directory")?;

    // Resolving the WIT package
    let context = GeneratorContext::new(output, wit, world)?;

    // Generating the Cargo.toml file
    generate_cargo_toml(&context)?;

    // Generating a Golem App Manifest file (for debugging)
    generate_app_manifest(&context)?;

    // Copying the skeleton files
    copy_skeleton_sources(context.output).context("Failed to copy skeleton sources")?;

    // Copying the WIT package to the output directory
    copy_wit_directory(wit, &context.output.join("wit"))
        .context("Failed to copy WIT package to output directory")?;

    if uses_composition(js_modules) {
        add_get_script_import(&context.output.join("wit"), world)
            .context("Failed to add get-script import to the WIT world")?;
    }

    // Copying the JavaScript module to the output directory
    copy_js_modules(js_modules, context.output)
        .context("Failed to copy JavaScript module to output directory")?;

    // Generating the lib.rs file implementing the component exports
    generate_export_impls(&context, js_modules)
        .context("Failed to generate the component export implementations")?;

    // Generating the native modules implementing the component imports
    generate_import_modules(&context).context("Failed to generate the component import modules")?;

    // Generating the conversions.rs file implementing the IntoJs and FromJs typeclass instances
    // This step must be done after `generate_export_impls` to ensure all visited types are registered.
    generate_conversions(&context)
        .context("Failed to generate the IntoJs and FromJs typeclass instances")?;

    Ok(())
}

/// Generates TypeScript module definitions for a given (or default) world of a WIT package.
pub fn generate_dts(wit: &Utf8Path, output: &Utf8Path, world: Option<&str>) -> anyhow::Result<()> {
    // Making sure the target directories exists
    std::fs::create_dir_all(output).context("Failed to create output directory")?;

    // Resolving the WIT package
    let context = GeneratorContext::new(output, wit, world)?;

    typescript::generate_export_module(&context)
        .context("Failed to generate the TypeScript module definition for the exports")?;

    // Generating the native modules implementing the component imports
    typescript::generate_import_modules(&context)
        .context("Failed to generate the TypeScript module definitions for the imported modules")?;

    Ok(())
}

struct GeneratorContext<'a> {
    output: &'a Utf8Path,
    wit_source_path: &'a Utf8Path,
    resolve: Resolve,
    root_package: PackageId,
    world: WorldId,
    source_map: PackageSourceMap,
    visited_types: RefCell<BTreeSet<TypeId>>,
    world_name: String,
    types: wit_bindgen_core::Types,
}

impl<'a> GeneratorContext<'a> {
    fn new(output: &'a Utf8Path, wit: &'a Utf8Path, world: Option<&str>) -> anyhow::Result<Self> {
        let mut resolve = Resolve::default();
        let (root_package, source_map) = resolve
            .push_path(wit)
            .context("Failed to resolve WIT package")?;
        let world = resolve
            .select_world(root_package, world)
            .context("Failed to select WIT world")?;

        let world_name = resolve.worlds[world].name.clone();

        let mut types = wit_bindgen_core::Types::default();
        types.analyze(&resolve);

        Ok(Self {
            output,
            wit_source_path: wit,
            resolve,
            root_package,
            world,
            source_map,
            visited_types: RefCell::new(BTreeSet::new()),
            world_name,
            types,
        })
    }

    fn root_package_name(&self) -> String {
        self.resolve.packages[self.root_package].name.to_string()
    }

    fn record_visited_type(&self, type_id: TypeId) {
        self.visited_types.borrow_mut().insert(type_id);
    }

    fn is_exported_interface(&self, interface_id: InterfaceId) -> bool {
        let world = &self.resolve.worlds[self.world];
        world
            .exports
            .iter()
            .any(|(_, item)| matches!(item, WorldItem::Interface { id, .. } if id == &interface_id))
    }

    fn is_exported_type(&self, type_id: TypeId) -> bool {
        if let Some(typ) = self.resolve.types.get(type_id) {
            match &typ.owner {
                TypeOwner::World(world_id) => {
                    if world_id == &self.world {
                        let world = &self.resolve.worlds[self.world];
                        world
                            .exports
                            .iter()
                            .any(|(_, item)| matches!(item, WorldItem::Type(id) if id == &type_id))
                    } else {
                        false
                    }
                }
                TypeOwner::Interface(interface_id) => self.is_exported_interface(*interface_id),
                TypeOwner::None => false,
            }
        } else {
            false
        }
    }

    fn bindgen_type_info(&self, type_id: TypeId) -> wit_bindgen_core::TypeInfo {
        self.types.get(type_id)
    }

    fn get_imported_interface(
        &self,
        interface_id: &InterfaceId,
    ) -> anyhow::Result<ImportedInterface<'_>> {
        let interface = &self.resolve.interfaces[*interface_id];
        let name = interface
            .name
            .as_ref()
            .ok_or_else(|| anyhow!("Interface import does not have a name"))?
            .as_str();

        let functions = interface
            .functions
            .iter()
            .map(|(name, f)| (name.as_str(), f))
            .collect();

        let package_id = interface
            .package
            .ok_or_else(|| anyhow!("Anonymous interface imports are not supported yet"))?;
        let package = self
            .resolve
            .packages
            .get(package_id)
            .ok_or_else(|| anyhow!("Could not find package of imported interface {name}"))?;
        let package_name = &package.name;

        Ok(ImportedInterface {
            package_name: Some(package_name),
            name: name.to_string(),
            functions,
            interface: Some(interface),
            interface_id: Some(*interface_id),
        })
    }
}

pub struct ImportedInterface<'a> {
    package_name: Option<&'a PackageName>,
    name: String,
    functions: Vec<(&'a str, &'a Function)>,
    interface: Option<&'a Interface>,
    interface_id: Option<InterfaceId>,
}

impl<'a> ImportedInterface<'a> {
    pub fn module_name(&self) -> anyhow::Result<String> {
        let package_name = self
            .package_name
            .ok_or_else(|| anyhow!("imported interface has no package name"))?;
        let interface_name = &self.name;

        Ok(format!(
            "{}_{}",
            package_name.to_string().to_snake_case(),
            interface_name.to_snake_case()
        ))
    }

    pub fn rust_interface_name(&self) -> Ident {
        let interface_name = format!("Js{}Module", self.name.to_upper_camel_case());
        Ident::new(&interface_name, Span::call_site())
    }

    pub fn name_and_interface(&self) -> Option<(&str, &Interface)> {
        self.interface
            .map(|interface| (self.name.as_str(), interface))
    }

    pub fn fully_qualified_interface_name(&self) -> String {
        if let Some(package_name) = &self.package_name {
            package_name.interface_id(&self.name)
        } else {
            self.name.clone()
        }
    }

    pub fn interface_stack(&self) -> VecDeque<InterfaceId> {
        self.interface_id.iter().cloned().collect()
    }
}

/// Recursively copies a WIT directory to `<output>/wit`.
fn copy_wit_directory(wit: &Utf8Path, output: &Utf8Path) -> anyhow::Result<()> {
    fs_extra::dir::create(output, true)
        .context("Failed to create and erase output WIT directory")?;
    fs_extra::dir::copy(wit, output, &CopyOptions::new().content_only(true))
        .context("Failed to copy WIT directory")?;

    Ok(())
}

/// Copies the JS module files to `<output>/src/<name>.js`.
fn copy_js_modules(js_modules: &[JsModuleSpec], output: &Utf8Path) -> anyhow::Result<()> {
    for module in js_modules {
        if let EmbeddingMode::EmbedFile(source) = &module.mode {
            let filename = module.file_name();
            let js_dest = output.join("src").join(filename);
            std::fs::copy(source, js_dest)
                .context(format!("Failed to copy JavaScript module {}", module.name))?;
        }
    }
    Ok(())
}

/// Checks if any of the provided JS modules uses composition mode.
fn uses_composition(js_module_spec: &[JsModuleSpec]) -> bool {
    js_module_spec
        .iter()
        .any(|m| matches!(m.mode, EmbeddingMode::Composition))
}
