use crate::GeneratorContext;
use crate::types::get_function_name;
use anyhow::{Context, anyhow};
use camino::Utf8Path;
use heck::{ToLowerCamelCase, ToUpperCamelCase};
use std::collections::{BTreeMap, BTreeSet};
use wit_parser::{Function, FunctionKind, Type, TypeDef, TypeDefKind, TypeId, WorldItem, WorldKey};

pub fn generate_export_module(context: &GeneratorContext) -> anyhow::Result<()> {
    let mut result = DtsWriter::new();

    let world = &context.resolve.worlds[context.world];
    result.begin_declare_module(&world.name);

    let mut global_exports = Vec::new();
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
                interface_exports.push((name, interface));
            }
            WorldItem::Function(function) => {
                global_exports.push((name, function));
            }
            WorldItem::Type(_) => {}
        }
    }

    // Each global export is directly exported as an async function.
    declare_functions_and_resources(&mut result, context, &global_exports, true)?;

    // Declaring each exported interface as a module
    for (name, interface) in interface_exports {
        let interface_exports: Vec<_> = interface
            .functions
            .iter()
            .map(|(name, function)| (name.clone(), function))
            .collect();

        result.begin_export_module(&name);
        declare_functions_and_resources(&mut result, context, &interface_exports, true)?;
        result.end_export_module();
    }

    result.export_type(
        "Result<T, E>",
        "{ tag: 'ok', val: T } | { tag: 'err', val: E }",
    );

    export_types(&mut result, context)?;

    result.end_declare_module();
    result.finish(&context.output.join("exports.d.ts"))
}

pub fn generate_import_modules(context: &GeneratorContext) -> anyhow::Result<()> {
    let (_global, interfaces) = crate::imports::collect_imported_interfaces(context)?;

    for interface in &interfaces {
        let module_name = interface.module_name()?;
        let file_name = format!("{module_name}.d.ts");

        let mut result = DtsWriter::new();

        result.begin_declare_module(&interface.fully_qualified_interface_name());
        if let Some((iface_name, iface)) = interface.name_and_interface() {
            let interface_imports = iface
                .functions
                .iter()
                .map(|(name, function)| (name.clone(), function))
                .collect::<Vec<_>>();
            declare_functions_and_resources(&mut result, context, &interface_imports, false)?;

            result.export_type(
                "Result<T, E>",
                "{ tag: 'ok', val: T } | { tag: 'err', val: E }",
            );

            // TODO: define types
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
    async_: bool,
) -> anyhow::Result<()> {
    let mut resource_functions = BTreeMap::new();

    for (name, function) in functions {
        match &function.kind {
            FunctionKind::Freestanding => {
                let js_name = name.to_lower_camel_case();
                let mut exported_function = if async_ {
                    result.begin_export_async_function(&js_name)
                } else {
                    result.begin_export_function(&js_name)
                };
                for (param_name, param_type) in &function.params {
                    exported_function.param(param_name, &ts_type_reference(context, param_type)?);
                }
                if let Some(result_type) = &function.result {
                    exported_function.result(&ts_type_reference(context, result_type)?);
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
            let js_name = get_function_name(name, function)?.to_lower_camel_case();
            let mut fun = match &function.kind {
                FunctionKind::Method(_) if async_ => result.begin_async_method(&js_name),
                FunctionKind::Method(_) => result.begin_method(&js_name),
                FunctionKind::Static(_) if async_ => result.begin_static_async_method(&js_name),
                FunctionKind::Static(_) => result.begin_static_method(&js_name),
                FunctionKind::Constructor(_) => result.begin_constructor(),
                _ => unreachable!(),
            };
            for (param_name, param_type) in &function.params {
                fun.param(param_name, &ts_type_reference(context, param_type)?);
            }
            if !matches!(&function.kind, FunctionKind::Constructor(_)) {
                if let Some(result_type) = &function.result {
                    fun.result(&ts_type_reference(context, result_type)?);
                }
            }
        }

        result.end_export_class();
    }

    Ok(())
}

// TODO: this should not work on a global "visited types" here, but types must be collected per exported/imported interface
fn export_types(result: &mut DtsWriter, context: &GeneratorContext) -> anyhow::Result<()> {
    let types_to_process = context.visited_types.borrow().clone();
    let mut visited_types = BTreeSet::new();
    for type_id in &types_to_process {
        export_type_definition(result, context, *type_id, &mut visited_types)?;
    }

    Ok(())
}

fn export_type_definition(
    result: &mut DtsWriter,
    context: &GeneratorContext<'_>,
    type_id: TypeId,
    visited_types: &mut BTreeSet<TypeId>,
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

    if let TypeDefKind::Type(Type::Id(type_id)) = &typ.kind {
        export_type_definition(result, context, *type_id, visited_types)
    } else {
        match &typ.name {
            Some(name) => {
                let js_name = name.to_upper_camel_case();
                let type_def = ts_type_definition(context, &typ)?;
                result.export_type(&js_name, &type_def);
                Ok(())
            }
            None => Ok(()),
        }
    }
}

fn ts_type_reference(context: &GeneratorContext, typ: &Type) -> anyhow::Result<String> {
    match typ {
        Type::Bool => Ok("boolean".to_string()),
        Type::U8
        | Type::U16
        | Type::U32
        | Type::U64
        | Type::S8
        | Type::S16
        | Type::S32
        | Type::S64
        | Type::F32
        | Type::F64 => Ok("number".to_string()),
        Type::Char => Ok("string".to_string()),
        Type::String => Ok("string".to_string()),
        Type::ErrorContext => Ok("ErrorContext".to_string()),
        Type::Id(_) => {
            let typ = visit_subtree(context, typ)?.unwrap();

            match &typ.name {
                None => ts_type_definition(context, &typ),
                Some(name) => {
                    // TODO: check the owner of the type, may require an import?
                    Ok(name.to_upper_camel_case())
                }
            }
        }
    }
}

fn visit_subtree<'a>(
    context: &'a GeneratorContext<'a>,
    typ: &Type,
) -> anyhow::Result<Option<&'a TypeDef>> {
    if let Type::Id(type_id) = typ {
        let typ = context
            .resolve
            .types
            .get(*type_id)
            .ok_or_else(|| anyhow!("Unknown type id: {type_id:?}"))?;

        if !context.visited_types.borrow().contains(&type_id) {
            context.record_visited_type(*type_id);

            match &typ.kind {
                TypeDefKind::Record(record) => {
                    for field in &record.fields {
                        let _ = visit_subtree(context, &field.ty)?;
                    }
                }
                TypeDefKind::Tuple(tuple) => {
                    for field_type in &tuple.types {
                        let _ = visit_subtree(context, field_type)?;
                    }
                }
                TypeDefKind::Variant(variant) => {
                    for case in &variant.cases {
                        if let Some(ty) = &case.ty {
                            let _ = visit_subtree(context, ty)?;
                        }
                    }
                }
                TypeDefKind::Option(inner) => {
                    let _ = visit_subtree(context, inner)?;
                }
                TypeDefKind::Result(result) => {
                    if let Some(ok_type) = &result.ok {
                        let _ = visit_subtree(context, ok_type)?;
                    }
                    if let Some(err_type) = &result.err {
                        let _ = visit_subtree(context, err_type)?;
                    }
                }
                TypeDefKind::List(elem_type) => {
                    let _ = visit_subtree(context, elem_type)?;
                }
                TypeDefKind::FixedSizeList(elem_type, _) => {
                    let _ = visit_subtree(context, elem_type)?;
                }
                TypeDefKind::Type(type_id) => {
                    let _ = visit_subtree(context, type_id)?;
                }
                _ => {}
            }
        }

        Ok(Some(typ))
    } else {
        Ok(None)
    }
}

fn ts_type_definition(context: &GeneratorContext, typ: &&TypeDef) -> anyhow::Result<String> {
    match &typ.kind {
        TypeDefKind::Record(record) => {
            let mut record_def = String::new();
            record_def.push_str("{\n");
            for field in &record.fields {
                let js_name = field.name.to_lower_camel_case(); // TODO: escape JS/TS idents
                let field_type = ts_type_reference(context, &field.ty)?;
                record_def.push_str(&format!("  {js_name}: {field_type};\n"));
            }
            record_def.push_str("}");
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

            let resource_name = resource_type
                .name
                .as_ref()
                .ok_or_else(|| anyhow!("Resource type has no name: {resource_type_id:?}"))?;

            Ok(resource_name.to_upper_camel_case())
        }
        TypeDefKind::Flags(flags) => {
            let mut flags_def = String::new();
            flags_def.push_str("{\n");
            for flag in &flags.flags {
                let flag_name = flag.name.to_lower_camel_case();
                flags_def.push_str(&format!("  {flag_name}: boolean;\n"));
            }
            flags_def.push_str("}");
            Ok(flags_def)
        }
        TypeDefKind::Tuple(tuple) => {
            let types: Vec<String> = tuple
                .types
                .iter()
                .map(|t| ts_type_reference(context, t))
                .collect::<Result<_, _>>()?;
            Ok(format!("[{}]", types.join(", ")))
        }
        TypeDefKind::Variant(variant) => {
            let mut case_defs = Vec::new();
            for case in &variant.cases {
                let case_name = &case.name;
                match &case.ty {
                    Some(ty) => {
                        let case_type = ts_type_reference(context, ty)?;
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
            ts_type_reference(context, inner_type)?
        )),
        TypeDefKind::Result(result) => {
            let ok_type = result
                .ok
                .map(|t| ts_type_reference(context, &t))
                .transpose()?
                .unwrap_or("void".to_string());
            let err_type = result
                .err
                .map(|t| ts_type_reference(context, &t))
                .transpose()?
                .unwrap_or("Error".to_string());
            Ok(format!("Result<{ok_type}, {err_type}>"))
        }
        TypeDefKind::List(elem_type) | TypeDefKind::FixedSizeList(elem_type, _) => {
            Ok(format!("{}[]", ts_type_reference(context, elem_type)?))
        }
        TypeDefKind::Type(aliased) => ts_type_reference(context, aliased),
        TypeDefKind::Future(_) => Err(anyhow!("Future types are not supported yet")),
        TypeDefKind::Stream(_) => Err(anyhow!("Stream types are not supported yet")),
        TypeDefKind::Resource => Err(anyhow!(
            "Cannot generate TypeScript type definition for a Resource"
        )),
        TypeDefKind::Unknown => Err(anyhow!("Unknown type definition kind")),
    }
}

struct DtsWriter {
    content: String,
    current_indent: usize,
}

impl DtsWriter {
    pub fn new() -> Self {
        DtsWriter {
            content: String::new(),
            current_indent: 0,
        }
    }

    pub fn finish(self, target: &Utf8Path) -> anyhow::Result<()> {
        std::fs::write(target, self.content)
            .map_err(|e| anyhow!("Failed to write TypeScript definitions: {e}"))
    }

    pub fn begin_declare_module(&mut self, name: &str) {
        self.indented_write_line(format!("declare module '{name}' {{"));
        self.current_indent += 1;
    }

    pub fn begin_export_module(&mut self, name: &str) {
        self.indented_write_line(format!("export module {name} {{"));
        self.current_indent += 1;
    }

    pub fn end_declare_module(&mut self) {
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
        self.indented_write(format!("export async function {name}("));
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

    fn indented_write_line(&mut self, line: impl AsRef<str>) {
        for line in line.as_ref().lines() {
            self.indented_write(line);
            self.write("\n");
        }
    }

    fn indented_write(&mut self, line: impl AsRef<str>) {
        let indent = "  ".repeat(self.current_indent);
        self.write(&format!("{}{}", indent, line.as_ref()));
    }

    fn write(&mut self, content: impl AsRef<str>) {
        self.content.push_str(content.as_ref());
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
        self.writer.write(&format!("{name}: {typ}"));
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
