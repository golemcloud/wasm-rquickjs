use crate::GeneratorContext;
use crate::javascript::escape_js_ident;
use crate::types::get_function_name;
use anyhow::anyhow;
use camino::Utf8Path;
use heck::{ToLowerCamelCase, ToUpperCamelCase};
use std::collections::{BTreeMap, BTreeSet, VecDeque};
use wit_parser::{
    Docs, Function, FunctionKind, InterfaceId, Type, TypeDef, TypeDefKind, TypeId, TypeOwner,
    WorldItem, WorldKey,
};

pub fn generate_export_module(context: &GeneratorContext) -> anyhow::Result<()> {
    let mut result = DtsWriter::new();

    let world = &context.resolve.worlds[context.world];
    result.begin_declare_module(&world.name);

    let mut global_exports = Vec::new();
    let mut global_types = Vec::new();
    let mut interface_exports = Vec::new();

    // Enumerating all exports and separating them into global exports and interface exports.
    for (name, export) in &world.exports {
        let name = match name {
            WorldKey::Name(name) => name.clone(),
            WorldKey::Interface(id) => {
                let interface = &context.resolve.interfaces[*id];
                interface
                    .name
                    .clone()
                    .ok_or_else(|| anyhow!("Interface export does not have a name"))?
            }
        };
        match export {
            WorldItem::Interface { id, .. } => {
                let interface = &context.resolve.interfaces[*id];
                interface_exports.push((name, interface, *id));
            }
            WorldItem::Function(function) => {
                global_exports.push((name, function));
            }
            WorldItem::Type(typ) => {
                global_types.push(*typ);
            }
        }
    }

    // Each global export is directly exported as an async function.
    declare_functions_and_resources(
        &mut result,
        context,
        &global_exports,
        &global_types,
        true,
        &VecDeque::new(),
    )?;

    // Declaring each exported interface as a module
    for (name, interface, interface_id) in interface_exports {
        let interface_exports: Vec<_> = interface
            .functions
            .iter()
            .map(|(name, function)| (name.clone(), function))
            .collect();
        let interface_types: Vec<_> = interface
            .types
            .iter()
            .map(|(_, type_id)| *type_id)
            .collect();
        let interface_stack: VecDeque<_> = vec![interface_id].into_iter().collect();

        result.write_docs(&interface.docs);
        let js_name = escape_js_ident(name.to_lower_camel_case());
        result.begin_export_namespace(&js_name);
        declare_functions_and_resources(
            &mut result,
            context,
            &interface_exports,
            &interface_types,
            true,
            &interface_stack,
        )?;

        export_types(
            &mut result,
            context,
            &interface_types,
            &interface_exports
                .into_iter()
                .map(|(_, f)| f)
                .collect::<Vec<_>>(),
            &interface_stack,
        )?;

        result.end_export_module();
    }

    export_types(
        &mut result,
        context,
        &global_types,
        &global_exports
            .into_iter()
            .map(|(_, f)| f)
            .collect::<Vec<_>>(),
        &VecDeque::new(),
    )?;

    result.end_declare_module();
    result.finish(&context.output.join("exports.d.ts"))
}

pub fn generate_import_modules(context: &GeneratorContext) -> anyhow::Result<()> {
    let (_global, interfaces) = crate::imports::collect_imported_interfaces(context)?;

    for interface in &interfaces {
        let module_name = interface.module_name()?;
        let file_name = format!("{module_name}.d.ts");

        let mut result = DtsWriter::new();

        if let Some(docs) = &interface.interface.as_ref().map(|i| &i.docs) {
            result.write_docs(docs);
        }
        result.begin_declare_module(&interface.fully_qualified_interface_name());
        if let Some((_iface_name, iface)) = interface.name_and_interface() {
            let interface_imports = iface
                .functions
                .iter()
                .map(|(name, function)| (name.clone(), function))
                .collect::<Vec<_>>();
            let interface_types = iface
                .types
                .iter()
                .map(|(_, type_id)| *type_id)
                .collect::<Vec<_>>();
            let interface_stack = interface.interface_stack();

            declare_functions_and_resources(
                &mut result,
                context,
                &interface_imports,
                &interface_types,
                false,
                &interface_stack,
            )?;

            export_types(
                &mut result,
                context,
                &interface_types,
                &interface_imports
                    .into_iter()
                    .map(|(_, f)| f)
                    .collect::<Vec<_>>(),
                &interface_stack,
            )?;
        }
        result.end_declare_module();

        result.finish(&context.output.join(file_name))?;
    }

    Ok(())
}

fn declare_functions_and_resources(
    result: &mut DtsWriter,
    context: &GeneratorContext,
    functions: &[(String, &Function)],
    types: &[TypeId],
    async_: bool,
    interface_stack: &VecDeque<InterfaceId>,
) -> anyhow::Result<()> {
    let mut resource_functions = BTreeMap::new();

    // Preinitialize resource_functions from types to have entries for resources with no methods
    for type_id in types {
        let typ = context
            .resolve
            .types
            .get(*type_id)
            .ok_or_else(|| anyhow!("Unknown type id {type_id:?}"))?;
        if typ.kind == TypeDefKind::Resource {
            resource_functions.insert(type_id, Vec::new());
        }
    }

    for (name, function) in functions {
        match &function.kind {
            FunctionKind::Freestanding => {
                result.write_docs(&function.docs);
                let js_name = escape_js_ident(name.to_lower_camel_case());
                let mut exported_function = if async_ {
                    result.begin_export_async_function(&js_name)
                } else {
                    result.begin_export_function(&js_name)
                };
                for (param_name, param_type) in &function.params {
                    let js_param_name = escape_js_ident(param_name.to_lower_camel_case());
                    exported_function.param(
                        &js_param_name,
                        &ts_type_reference(context, param_type, interface_stack)?,
                    );
                }
                if let Some(result_type) = &function.result {
                    exported_function.result(&ts_type_reference(
                        context,
                        result_type,
                        interface_stack,
                    )?);
                }
            }
            FunctionKind::AsyncFreestanding
            | FunctionKind::AsyncMethod(_)
            | FunctionKind::AsyncStatic(_) => {
                Err(anyhow!("Async exported functions are not supported yet"))?
            }
            FunctionKind::Method(resource_id)
            | FunctionKind::Static(resource_id)
            | FunctionKind::Constructor(resource_id) => {
                resource_functions
                    .entry(resource_id)
                    .or_insert_with(Vec::new)
                    .push((name, function));
            }
        }
    }

    for (resource_type_id, resource_funcs) in resource_functions {
        let typ = context
            .resolve
            .types
            .get(*resource_type_id)
            .ok_or_else(|| anyhow!("Unknown resource type id"))?;

        let resource_name = typ
            .name
            .as_ref()
            .ok_or_else(|| anyhow!("Resource type has no name"))?;

        let js_resource_name = resource_name.to_upper_camel_case();

        result.begin_export_class(&js_resource_name);

        for (name, function) in resource_funcs {
            result.write_docs(&function.docs);
            let js_name = escape_js_ident(get_function_name(name, function)?.to_lower_camel_case());
            let mut fun = match &function.kind {
                FunctionKind::Method(_) if async_ => result.begin_async_method(&js_name),
                FunctionKind::Method(_) => result.begin_method(&js_name),
                FunctionKind::Static(_) if async_ => result.begin_static_async_method(&js_name),
                FunctionKind::Static(_) => result.begin_static_method(&js_name),
                FunctionKind::Constructor(_) => result.begin_constructor(),
                _ => unreachable!(),
            };
            let params = if matches!(
                &function.kind,
                FunctionKind::Method(_) | FunctionKind::AsyncMethod(_)
            ) {
                // Skipping `self`
                &function.params[1..]
            } else {
                &function.params
            };
            for (param_name, param_type) in params {
                let js_param_name = escape_js_ident(param_name.to_lower_camel_case());
                fun.param(
                    &js_param_name,
                    &ts_type_reference(context, param_type, interface_stack)?,
                );
            }
            if !matches!(&function.kind, FunctionKind::Constructor(_))
                && let Some(result_type) = &function.result
            {
                fun.result(&ts_type_reference(context, result_type, interface_stack)?);
            }
        }

        result.end_export_class();
    }

    Ok(())
}

fn export_types(
    result: &mut DtsWriter,
    context: &GeneratorContext,
    types: &[TypeId],
    functions: &[&Function],
    interface_stack: &VecDeque<InterfaceId>,
) -> anyhow::Result<()> {
    let mut visit_result = VisitResult::default();
    for type_id in types {
        visit_subtree(
            context,
            &Type::Id(*type_id),
            interface_stack,
            &mut visit_result,
        )?;
    }
    for function in functions {
        for (_, param_type) in &function.params {
            visit_subtree(context, param_type, interface_stack, &mut visit_result)?;
        }
        if let Some(result_type) = &function.result {
            visit_subtree(context, result_type, interface_stack, &mut visit_result)?;
        }
    }

    let mut visited_types = BTreeSet::new();
    for type_id in &visit_result.visited_types {
        export_type_definition(
            result,
            context,
            *type_id,
            &mut visited_types,
            interface_stack,
        )?;
    }

    if visit_result.has_result {
        result.export_type(
            "Result<T, E>",
            "{ tag: 'ok', val: T } | { tag: 'err', val: E }",
        );
    }

    Ok(())
}

fn export_type_definition(
    result: &mut DtsWriter,
    context: &GeneratorContext<'_>,
    type_id: TypeId,
    visited_types: &mut BTreeSet<TypeId>,
    interface_stack: &VecDeque<InterfaceId>,
) -> anyhow::Result<()> {
    if !visited_types.insert(type_id) {
        // Already processed this type, skip it
        return Ok(());
    }

    let typ = context
        .resolve
        .types
        .get(type_id)
        .ok_or_else(|| anyhow!("Unknown type id: {type_id:?}"))?;

    match &typ.name {
        Some(name) => {
            let js_name = name.to_upper_camel_case();

            if let TypeDefKind::Type(Type::Id(type_id)) = &typ.kind
                && !visited_types.contains(type_id)
            {
                let aliased_type = context
                    .resolve
                    .types
                    .get(*type_id)
                    .ok_or_else(|| anyhow!("Unknown aliased type id: {type_id:?}"))?;
                if let TypeOwner::Interface(interface_id) = &aliased_type.owner
                    && !interface_stack.contains(interface_id)
                {
                    // The type is defined in a different module, need to be imported
                    let imported_interface = context.get_imported_interface(interface_id)?;
                    let imported_module_name =
                        escape_js_ident(imported_interface.module_name()?.to_lower_camel_case());

                    result.import_module(
                        &imported_module_name,
                        &imported_interface.fully_qualified_interface_name(),
                    );
                }
            };

            let type_def = ts_type_definition(context, typ, interface_stack)?;
            result.write_docs(&typ.docs);
            result.export_type(&js_name, &type_def);
            Ok(())
        }
        None => Ok(()),
    }
}

fn ts_type_reference(
    context: &GeneratorContext,
    typ: &Type,
    interface_stack: &VecDeque<InterfaceId>,
) -> anyhow::Result<String> {
    match typ {
        Type::Bool => Ok("boolean".to_string()),
        Type::U8
        | Type::U16
        | Type::U32
        | Type::S8
        | Type::S16
        | Type::S32
        | Type::F32
        | Type::F64 => Ok("number".to_string()),
        Type::U64 | Type::S64 => Ok("bigint".to_string()),
        Type::Char => Ok("string".to_string()),
        Type::String => Ok("string".to_string()),
        Type::ErrorContext => Ok("ErrorContext".to_string()),
        Type::Id(type_id) => {
            let typ = context
                .resolve
                .types
                .get(*type_id)
                .ok_or_else(|| anyhow!("Unknown type id: {type_id:?}"))?;

            match &typ.name {
                None => ts_type_definition(context, typ, interface_stack),
                Some(name) => {
                    match &typ.owner {
                        TypeOwner::Interface(interface_id) => {
                            if !interface_stack.contains(interface_id) {
                                // The type is defined in a different module, need to be imported
                                let imported_interface =
                                    context.get_imported_interface(interface_id)?;
                                let imported_module_name = escape_js_ident(
                                    imported_interface.module_name()?.to_lower_camel_case(),
                                );

                                Ok(format!(
                                    "{}.{}",
                                    imported_module_name,
                                    name.to_upper_camel_case()
                                ))
                            } else {
                                Ok(name.to_upper_camel_case())
                            }
                        }
                        _ => Ok(name.to_upper_camel_case()),
                    }
                }
            }
        }
    }
}

#[derive(Default)]
struct VisitResult {
    visited_types: BTreeSet<TypeId>,
    has_result: bool,
}

fn visit_subtree<'a>(
    context: &'a GeneratorContext<'a>,
    typ: &Type,
    interface_stack: &VecDeque<InterfaceId>,
    result: &mut VisitResult,
) -> anyhow::Result<()> {
    if let Type::Id(type_id) = typ {
        let typ = context
            .resolve
            .types
            .get(*type_id)
            .ok_or_else(|| anyhow!("Unknown type id: {type_id:?}"))?;

        if !result.visited_types.contains(type_id) {
            if !matches!(typ.kind, TypeDefKind::Resource) {
                // Resource types are handled specially, we don't want them in the set of type IDs
                result.visited_types.insert(*type_id);
            }

            match &typ.kind {
                TypeDefKind::Record(record) => {
                    for field in &record.fields {
                        visit_subtree(context, &field.ty, interface_stack, result)?;
                    }
                }
                TypeDefKind::Tuple(tuple) => {
                    for field_type in &tuple.types {
                        visit_subtree(context, field_type, interface_stack, result)?;
                    }
                }
                TypeDefKind::Variant(variant) => {
                    for case in &variant.cases {
                        if let Some(ty) = &case.ty {
                            visit_subtree(context, ty, interface_stack, result)?;
                        }
                    }
                }
                TypeDefKind::Option(inner) => {
                    visit_subtree(context, inner, interface_stack, result)?;
                }
                TypeDefKind::Result(result_) => {
                    result.has_result = true;
                    if let Some(ok_type) = &result_.ok {
                        visit_subtree(context, ok_type, interface_stack, result)?;
                    }
                    if let Some(err_type) = &result_.err {
                        visit_subtree(context, err_type, interface_stack, result)?;
                    }
                }
                TypeDefKind::List(elem_type) => {
                    visit_subtree(context, elem_type, interface_stack, result)?;
                }
                TypeDefKind::FixedSizeList(elem_type, _) => {
                    visit_subtree(context, elem_type, interface_stack, result)?;
                }
                TypeDefKind::Type(Type::Id(type_id)) => {
                    let aliased_type = context
                        .resolve
                        .types
                        .get(*type_id)
                        .ok_or_else(|| anyhow!("Unknown aliased type id: {type_id:?}"))?;
                    if let TypeOwner::Interface(interface_id) = &aliased_type.owner
                        && !interface_stack.contains(interface_id)
                    {
                        // The type is defined in a different module. In this case we are not
                        // following the type reference, we will only generate an import
                    }
                }
                TypeDefKind::Type(typ) => {
                    visit_subtree(context, typ, interface_stack, result)?;
                }
                _ => {}
            }
        }
    }

    Ok(())
}

fn ts_type_definition(
    context: &GeneratorContext,
    typ: &TypeDef,
    interface_stack: &VecDeque<InterfaceId>,
) -> anyhow::Result<String> {
    match &typ.kind {
        TypeDefKind::Record(record) => {
            let mut record_def = String::new();
            record_def.push_str("{\n");
            for field in &record.fields {
                let js_name = escape_js_ident(field.name.to_lower_camel_case());
                let field_type = ts_type_reference(context, &field.ty, interface_stack)?;
                record_def.push_str(&format!("  {js_name}: {field_type};\n"));
            }
            record_def.push('}');
            Ok(record_def)
        }
        TypeDefKind::Handle(handle) => {
            let resource_type_id = match handle {
                wit_parser::Handle::Borrow(id) => *id,
                wit_parser::Handle::Own(id) => *id,
            };
            let resource_type = context
                .resolve
                .types
                .get(resource_type_id)
                .ok_or_else(|| anyhow!("Unknown type id: {resource_type_id:?}"))?;

            ts_resource_reference(context, resource_type, interface_stack)
        }
        TypeDefKind::Flags(flags) => {
            let mut flags_def = String::new();
            flags_def.push_str("{\n");
            for flag in &flags.flags {
                let flag_name = escape_js_ident(flag.name.to_lower_camel_case());
                flags_def.push_str(&format!("  {flag_name}: boolean;\n"));
            }
            flags_def.push('}');
            Ok(flags_def)
        }
        TypeDefKind::Tuple(tuple) => {
            let types: Vec<String> = tuple
                .types
                .iter()
                .map(|t| ts_type_reference(context, t, interface_stack))
                .collect::<Result<_, _>>()?;
            Ok(format!("[{}]", types.join(", ")))
        }
        TypeDefKind::Variant(variant) => {
            let mut case_defs = Vec::new();
            for case in &variant.cases {
                let case_name = &case.name;
                match &case.ty {
                    Some(ty) => {
                        let case_type = ts_type_reference(context, ty, interface_stack)?;
                        case_defs.push(format!("{{\n  tag: '{case_name}'\n  val: {case_type}\n}}"));
                    }
                    None => {
                        // No type means it's a unit variant
                        case_defs.push(format!("{{\n  tag: '{case_name}'\n}}"));
                    }
                }
            }
            let cases = case_defs.join(" |\n");
            Ok(cases)
        }
        TypeDefKind::Enum(r#enum) => {
            let cases = r#enum
                .cases
                .iter()
                .map(|case| format!("\"{}\"", case.name))
                .collect::<Vec<_>>();
            Ok(cases.join(" | "))
        }
        TypeDefKind::Option(inner_type) => Ok(format!(
            "{} | undefined",
            ts_type_reference(context, inner_type, interface_stack)?
        )),
        TypeDefKind::Result(result) => {
            let ok_type = result
                .ok
                .map(|t| ts_type_reference(context, &t, interface_stack))
                .transpose()?
                .unwrap_or("void".to_string());
            let err_type = result
                .err
                .map(|t| ts_type_reference(context, &t, interface_stack))
                .transpose()?
                .unwrap_or("Error".to_string());
            Ok(format!("Result<{ok_type}, {err_type}>"))
        }
        TypeDefKind::List(Type::U8) => Ok("Uint8Array".to_string()),
        TypeDefKind::List(elem_type) | TypeDefKind::FixedSizeList(elem_type, _) => Ok(format!(
            "{}[]",
            ts_type_reference(context, elem_type, interface_stack)?
        )),
        TypeDefKind::Type(aliased) => ts_type_reference(context, aliased, interface_stack),
        TypeDefKind::Future(_) => Err(anyhow!("Future types are not supported yet")),
        TypeDefKind::Stream(_) => Err(anyhow!("Stream types are not supported yet")),
        TypeDefKind::Resource => ts_resource_reference(context, typ, interface_stack),
        TypeDefKind::Unknown => Err(anyhow!("Unknown type definition kind")),
    }
}

fn ts_resource_reference(
    context: &GeneratorContext,
    resource_type: &TypeDef,
    interface_stack: &VecDeque<InterfaceId>,
) -> anyhow::Result<String> {
    let resource_name = resource_type
        .name
        .as_ref()
        .ok_or_else(|| anyhow!("Resource type has no name: {resource_type:?}"))?;
    let js_resource_name = resource_name.to_upper_camel_case();

    match &resource_type.owner {
        TypeOwner::Interface(interface_id) => {
            if !interface_stack.contains(interface_id) {
                // The type is defined in a different module, need to be imported
                let imported_interface = context.get_imported_interface(interface_id)?;
                let imported_module_name =
                    escape_js_ident(imported_interface.module_name()?.to_lower_camel_case());

                Ok(format!("{imported_module_name}.{js_resource_name}"))
            } else {
                Ok(js_resource_name)
            }
        }
        _ => Ok(js_resource_name),
    }
}

struct DtsModuleState {
    imports: BTreeSet<String>,
    content: String,
}

struct DtsWriter {
    content: String,
    current_indent: usize,
    module_stack: Vec<DtsModuleState>,
}

impl DtsWriter {
    pub fn new() -> Self {
        DtsWriter {
            content: String::new(),
            current_indent: 0,
            module_stack: Vec::new(),
        }
    }

    pub fn finish(self, target: &Utf8Path) -> anyhow::Result<()> {
        std::fs::write(target, self.content)
            .map_err(|e| anyhow!("Failed to write TypeScript definitions: {e}"))
    }

    pub fn begin_declare_module(&mut self, name: &str) {
        self.indented_write_line(format!("declare module '{name}' {{"));
        self.current_indent += 1;
        self.module_stack.push(DtsModuleState {
            imports: BTreeSet::new(),
            content: String::new(),
        })
    }

    pub fn begin_export_namespace(&mut self, name: &str) {
        self.indented_write_line(format!("export namespace {name} {{"));
        self.current_indent += 1;
    }

    pub fn end_declare_module(&mut self) {
        let module = self.module_stack.pop().expect("No module state to end");
        // Write all imports collected in this module
        for import in module.imports {
            self.indented_write_line(import);
        }
        // Write all lines collected in this module
        self.write(module.content);

        self.current_indent -= 1;
        self.indented_write_line("}");
    }

    pub fn end_export_module(&mut self) {
        self.current_indent -= 1;
        self.indented_write_line("}");
    }

    pub fn begin_export_function<'a>(&'a mut self, name: &str) -> DtsFunctionWriter<'a> {
        self.indented_write(format!("export function {name}("));
        DtsFunctionWriter {
            writer: self,
            param_count: 0,
            return_type: Some("void".to_string()),
            returns_promise: false,
        }
    }

    pub fn begin_export_async_function<'a>(&'a mut self, name: &str) -> DtsFunctionWriter<'a> {
        self.indented_write(format!("export function {name}("));
        DtsFunctionWriter {
            writer: self,
            param_count: 0,
            return_type: Some("void".to_string()),
            returns_promise: true,
        }
    }

    pub fn begin_method<'a>(&'a mut self, name: &str) -> DtsFunctionWriter<'a> {
        self.indented_write(format!("{name}("));
        DtsFunctionWriter {
            writer: self,
            param_count: 0,
            return_type: Some("void".to_string()),
            returns_promise: false,
        }
    }

    pub fn begin_async_method<'a>(&'a mut self, name: &str) -> DtsFunctionWriter<'a> {
        self.indented_write(format!("async {name}("));
        DtsFunctionWriter {
            writer: self,
            param_count: 0,
            return_type: Some("void".to_string()),
            returns_promise: true,
        }
    }

    pub fn begin_static_method<'a>(&'a mut self, name: &str) -> DtsFunctionWriter<'a> {
        self.indented_write(format!("static {name}("));
        DtsFunctionWriter {
            writer: self,
            param_count: 0,
            return_type: Some("void".to_string()),
            returns_promise: false,
        }
    }

    pub fn begin_static_async_method<'a>(&'a mut self, name: &str) -> DtsFunctionWriter<'a> {
        self.indented_write(format!("static async {name}("));
        DtsFunctionWriter {
            writer: self,
            param_count: 0,
            return_type: Some("void".to_string()),
            returns_promise: true,
        }
    }

    pub fn begin_constructor<'a>(&'a mut self) -> DtsFunctionWriter<'a> {
        self.indented_write("constructor(");
        DtsFunctionWriter {
            writer: self,
            param_count: 0,
            return_type: None,
            returns_promise: false,
        }
    }

    pub fn begin_export_class(&mut self, name: &str) {
        self.indented_write(format!("export class {name} {{\n"));
        self.current_indent += 1;
    }

    pub fn end_export_class(&mut self) {
        self.current_indent -= 1;
        self.indented_write_line("}");
    }

    pub fn export_type(&mut self, name: &str, definition: &str) {
        self.indented_write_line(format!("export type {name} = {definition};"));
    }

    pub fn import_module(&mut self, name: &str, from: &str) {
        let import_line = format!("import * as {name} from '{from}';");
        if let Some(module) = self.module_stack.last_mut() {
            module.imports.insert(import_line);
        } else {
            self.indented_write_line(import_line);
        }
    }

    pub fn write_docs(&mut self, docs: &Docs) {
        if let Some(contents) = &docs.contents {
            self.indented_write_line("/**");
            for line in contents.lines() {
                if !line.trim().is_empty() {
                    self.indented_write_line(format!(" * {line}"));
                }
            }
            self.indented_write_line(" */");
        }
    }

    fn indented_write_line(&mut self, line: impl AsRef<str>) {
        for line in line.as_ref().lines() {
            self.indented_write(line);
            self.write("\n");
        }
    }

    fn indented_write(&mut self, line: impl AsRef<str>) {
        let indent = "  ".repeat(self.current_indent);
        self.write(format!("{}{}", indent, line.as_ref()));
    }

    fn write(&mut self, content: impl AsRef<str>) {
        if let Some(module) = self.module_stack.last_mut() {
            module.content.push_str(content.as_ref());
        } else {
            self.content.push_str(content.as_ref());
        }
    }
}

struct DtsFunctionWriter<'a> {
    writer: &'a mut DtsWriter,
    param_count: usize,
    return_type: Option<String>,
    returns_promise: bool,
}

impl<'a> DtsFunctionWriter<'a> {
    pub fn param(&mut self, name: &str, typ: &str) {
        if self.param_count > 0 {
            self.writer.write(", ");
        }
        self.writer.write(format!("{name}: {typ}"));
        self.param_count += 1;
    }

    pub fn result(&mut self, typ: &str) {
        self.return_type = Some(typ.to_string());
    }
}

impl<'a> Drop for DtsFunctionWriter<'a> {
    fn drop(&mut self) {
        self.writer.write(")");
        if let Some(return_type) = &self.return_type {
            self.writer.write(": ");

            if self.returns_promise {
                self.writer.write("Promise<");
            }
            self.writer.write(return_type);
            if self.returns_promise {
                self.writer.write(">");
            }
        }
        self.writer.write(";\n");
    }
}
