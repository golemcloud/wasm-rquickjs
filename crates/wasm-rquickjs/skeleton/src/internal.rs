use futures::future::AbortHandle;
use futures_concurrency::future::Join;
use indexmap::IndexMap;
use rquickjs::function::{Args, Constructor};
use rquickjs::loader::{BuiltinLoader, BuiltinResolver, FileResolver, Loader, Resolver};
use rquickjs::{
    AsyncContext, AsyncRuntime, CatchResultExt, Ctx, Error, Filter, FromJs, Function, Module,
    Object, Promise, Value, async_with,
};
use rquickjs::{CaughtError, prelude::*};
use serde::Deserialize;
use std::cell::RefCell;
use std::collections::{HashMap, HashSet};
use std::future::Future;
use std::ops::ControlFlow;
use std::sync::atomic::AtomicUsize;
use wstd::runtime::block_on;

/// Resolver that passes `data:` URLs through as-is.
struct DataUrlResolver;

impl Resolver for DataUrlResolver {
    fn resolve<'js>(
        &mut self,
        _ctx: &Ctx<'js>,
        _base: &str,
        name: &str,
    ) -> rquickjs::Result<String> {
        if name.starts_with("data:") {
            Ok(name.to_string())
        } else {
            Err(Error::new_resolving(_base, name))
        }
    }
}

/// Loader for `data:` URL modules (e.g. `data:text/javascript,export default 42`).
struct DataUrlLoader;

impl DataUrlLoader {
    fn percent_decode(encoded: &str) -> Option<String> {
        let bytes = encoded.as_bytes();
        let mut decoded = Vec::with_capacity(bytes.len());
        let mut i = 0;
        while i < bytes.len() {
            if bytes[i] == b'%'
                && i + 2 < bytes.len()
                && let (Some(hi), Some(lo)) = (
                    FileUrlResolver::hex_val(bytes[i + 1]),
                    FileUrlResolver::hex_val(bytes[i + 2]),
                )
            {
                decoded.push(hi << 4 | lo);
                i += 3;
                continue;
            }
            decoded.push(bytes[i]);
            i += 1;
        }
        String::from_utf8(decoded).ok()
    }

    fn js_string_escape(s: &str) -> String {
        let mut result = String::with_capacity(s.len());
        for ch in s.chars() {
            match ch {
                '\'' => result.push_str("\\'"),
                '\\' => result.push_str("\\\\"),
                '\n' => result.push_str("\\n"),
                '\r' => result.push_str("\\r"),
                '\t' => result.push_str("\\t"),
                '\0' => result.push_str("\\0"),
                _ => result.push(ch),
            }
        }
        result
    }

    fn is_valid_json(s: &str) -> bool {
        let s = s.trim();
        if s.is_empty() {
            return false;
        }
        let bytes = s.as_bytes();
        let (ok, pos) = Self::skip_json_value(bytes, 0);
        if !ok {
            return false;
        }
        // Valid if we consumed the entire input
        let end = Self::skip_whitespace(bytes, pos);
        end == bytes.len()
    }

    fn skip_whitespace(bytes: &[u8], mut i: usize) -> usize {
        while i < bytes.len() && matches!(bytes[i], b' ' | b'\t' | b'\n' | b'\r') {
            i += 1;
        }
        i
    }

    fn skip_json_value(bytes: &[u8], i: usize) -> (bool, usize) {
        let i = Self::skip_whitespace(bytes, i);
        if i >= bytes.len() {
            return (false, i);
        }
        match bytes[i] {
            b'"' => Self::skip_json_string(bytes, i),
            b'{' => Self::skip_json_object(bytes, i),
            b'[' => Self::skip_json_array(bytes, i),
            b't' => Self::skip_literal(bytes, i, b"true"),
            b'f' => Self::skip_literal(bytes, i, b"false"),
            b'n' => Self::skip_literal(bytes, i, b"null"),
            b'-' | b'0'..=b'9' => Self::skip_json_number(bytes, i),
            _ => (false, i),
        }
    }

    fn skip_json_string(bytes: &[u8], mut i: usize) -> (bool, usize) {
        if i >= bytes.len() || bytes[i] != b'"' {
            return (false, i);
        }
        i += 1;
        while i < bytes.len() {
            match bytes[i] {
                b'\\' => {
                    i += 1;
                    if i >= bytes.len() {
                        return (false, i);
                    }
                    if bytes[i] == b'u' {
                        i += 1;
                        for _ in 0..4 {
                            if i >= bytes.len() || !bytes[i].is_ascii_hexdigit() {
                                return (false, i);
                            }
                            i += 1;
                        }
                    } else {
                        i += 1;
                    }
                }
                b'"' => return (true, i + 1),
                _ => i += 1,
            }
        }
        (false, i) // unterminated string
    }

    fn skip_json_object(bytes: &[u8], mut i: usize) -> (bool, usize) {
        i += 1; // skip '{'
        i = Self::skip_whitespace(bytes, i);
        if i < bytes.len() && bytes[i] == b'}' {
            return (true, i + 1);
        }
        loop {
            i = Self::skip_whitespace(bytes, i);
            let (ok, next) = Self::skip_json_string(bytes, i);
            if !ok {
                return (false, next);
            }
            i = Self::skip_whitespace(bytes, next);
            if i >= bytes.len() || bytes[i] != b':' {
                return (false, i);
            }
            i += 1;
            let (ok, next) = Self::skip_json_value(bytes, i);
            if !ok {
                return (false, next);
            }
            i = Self::skip_whitespace(bytes, next);
            if i >= bytes.len() {
                return (false, i);
            }
            if bytes[i] == b'}' {
                return (true, i + 1);
            }
            if bytes[i] != b',' {
                return (false, i);
            }
            i += 1;
        }
    }

    fn skip_json_array(bytes: &[u8], mut i: usize) -> (bool, usize) {
        i += 1; // skip '['
        i = Self::skip_whitespace(bytes, i);
        if i < bytes.len() && bytes[i] == b']' {
            return (true, i + 1);
        }
        loop {
            let (ok, next) = Self::skip_json_value(bytes, i);
            if !ok {
                return (false, next);
            }
            i = Self::skip_whitespace(bytes, next);
            if i >= bytes.len() {
                return (false, i);
            }
            if bytes[i] == b']' {
                return (true, i + 1);
            }
            if bytes[i] != b',' {
                return (false, i);
            }
            i += 1;
        }
    }

    fn skip_literal(bytes: &[u8], i: usize, expected: &[u8]) -> (bool, usize) {
        if i + expected.len() <= bytes.len() && &bytes[i..i + expected.len()] == expected {
            (true, i + expected.len())
        } else {
            (false, i)
        }
    }

    fn skip_json_number(bytes: &[u8], mut i: usize) -> (bool, usize) {
        if i < bytes.len() && bytes[i] == b'-' {
            i += 1;
        }
        if i >= bytes.len() || !bytes[i].is_ascii_digit() {
            return (false, i);
        }
        if bytes[i] == b'0' {
            i += 1;
        } else {
            while i < bytes.len() && bytes[i].is_ascii_digit() {
                i += 1;
            }
        }
        if i < bytes.len() && bytes[i] == b'.' {
            i += 1;
            if i >= bytes.len() || !bytes[i].is_ascii_digit() {
                return (false, i);
            }
            while i < bytes.len() && bytes[i].is_ascii_digit() {
                i += 1;
            }
        }
        if i < bytes.len() && (bytes[i] == b'e' || bytes[i] == b'E') {
            i += 1;
            if i < bytes.len() && (bytes[i] == b'+' || bytes[i] == b'-') {
                i += 1;
            }
            if i >= bytes.len() || !bytes[i].is_ascii_digit() {
                return (false, i);
            }
            while i < bytes.len() && bytes[i].is_ascii_digit() {
                i += 1;
            }
        }
        (true, i)
    }

    fn make_json_error_module(source: &str) -> String {
        let bytes = source.as_bytes();
        let msg = if bytes.is_empty() {
            "Unexpected end of JSON input".to_string()
        } else if bytes[0] == b'"' {
            let (ok, pos) = Self::skip_json_string(bytes, 0);
            if !ok {
                format!("Unterminated string in JSON at position {}", pos)
            } else {
                let (_, pos) = Self::skip_json_value(bytes, 0);
                if pos >= bytes.len() {
                    "Unexpected end of JSON input".to_string()
                } else {
                    format!(
                        "Unexpected token {} in JSON at position {}",
                        bytes[pos] as char, pos
                    )
                }
            }
        } else {
            let (_, pos) = Self::skip_json_value(bytes, 0);
            if pos >= bytes.len() {
                "Unexpected end of JSON input".to_string()
            } else {
                format!(
                    "Unexpected token {} in JSON at position {}",
                    bytes[pos] as char, pos
                )
            }
        };
        let escaped_msg = Self::js_string_escape(&msg);
        format!("await Promise.reject(new SyntaxError('{escaped_msg}'));\n")
    }
}

impl Loader for DataUrlLoader {
    fn load<'js>(
        &mut self,
        ctx: &Ctx<'js>,
        path: &str,
    ) -> rquickjs::Result<Module<'js, rquickjs::module::Declared>> {
        let rest = path
            .strip_prefix("data:")
            .ok_or_else(|| Error::new_loading(path))?;

        // Find the comma separating metadata from content
        let comma_pos = rest.find(',').ok_or_else(|| Error::new_loading(path))?;
        let metadata = &rest[..comma_pos];
        let raw_content = &rest[comma_pos + 1..];

        // Parse metadata: e.g. "text/javascript" or "text/javascript;base64"
        let is_base64 = metadata.ends_with(";base64");

        let source = if is_base64 {
            // Simple base64 decoder for ASCII content
            let decoded = base64_decode(raw_content).ok_or_else(|| Error::new_loading(path))?;
            String::from_utf8(decoded).map_err(|_| Error::new_loading(path))?
        } else {
            Self::percent_decode(raw_content).ok_or_else(|| Error::new_loading(path))?
        };

        // Extract base MIME type (before any parameters)
        let base_mime = metadata.split(';').next().unwrap_or(metadata).trim();

        if base_mime == "application/json" {
            // Validate JSON by attempting a simple parse check.
            // For valid JSON: embed directly as a JS literal.
            // For invalid JSON: throw a SyntaxError with V8-compatible message.
            let json_valid = Self::is_valid_json(&source);
            let module_source = if json_valid {
                let escaped = Self::js_string_escape(&source);
                format!("export default JSON.parse('{escaped}');\n")
            } else {
                Self::make_json_error_module(&source)
            };
            Module::declare(ctx.clone(), path, module_source.as_bytes().to_vec())
        } else if base_mime == "text/javascript" || base_mime == "application/javascript" {
            // Check for static import attributes (e.g., `import "spec" with { type: "json" }`)
            // QuickJS doesn't support import attributes syntax, so we preprocess:
            // - If `with { ... }` is found and attributes are invalid, generate an error module
            // - If valid, strip the `with { ... }` clause
            // - `assert { ... }` is left as-is (QuickJS will throw SyntaxError, as expected)
            let source = process_static_import_attrs(&source, path);
            if let Some(error_source) = esm_preflight_error_module_source(&source, false) {
                return Module::declare(ctx.clone(), path, error_source.as_bytes().to_vec());
            }
            if let Some(error_source) = data_url_simple_identifier_error_module_source(&source) {
                return Module::declare(ctx.clone(), path, error_source.as_bytes().to_vec());
            }

            let init = ImportMetaInit {
                url: path.to_string(),
                filename: None,
                dirname: None,
                include_resolve: true,
            };
            let injected = inject_import_meta_prologue(&init, &source);
            Module::declare(ctx.clone(), path, injected.as_bytes().to_vec())
        } else {
            let escaped_mime = Self::js_string_escape(base_mime);
            let escaped_path = Self::js_string_escape(path);
            let module_source = format!(
                "await Promise.reject(Object.assign(new TypeError('Unknown module format: {escaped_mime} for URL {escaped_path}'), {{code: 'ERR_UNKNOWN_MODULE_FORMAT'}}));\n"
            );
            Module::declare(ctx.clone(), path, module_source.as_bytes().to_vec())
        }
    }
}

fn base64_decode(input: &str) -> Option<Vec<u8>> {
    let mut buf = Vec::with_capacity(input.len() * 3 / 4);
    let mut accum: u32 = 0;
    let mut bits: u32 = 0;
    for b in input.bytes() {
        let val = match b {
            b'A'..=b'Z' => b - b'A',
            b'a'..=b'z' => b - b'a' + 26,
            b'0'..=b'9' => b - b'0' + 52,
            b'+' => 62,
            b'/' => 63,
            b'=' | b'\n' | b'\r' | b' ' => continue,
            _ => return None,
        };
        accum = (accum << 6) | val as u32;
        bits += 6;
        if bits >= 8 {
            bits -= 8;
            buf.push((accum >> bits) as u8);
            accum &= (1 << bits) - 1;
        }
    }
    Some(buf)
}

/// Process static import attributes in JavaScript module source code.
///
/// Handles patterns like `import "specifier" with { type: "json" }`.
/// - If `with { ... }` is found and attributes are invalid, returns an error module source.
/// - If valid, strips the `with { ... }` clause so QuickJS can parse it.
/// - `assert { ... }` is left unchanged (QuickJS will throw SyntaxError).
fn process_static_import_attrs(source: &str, module_path: &str) -> String {
    let bytes = source.as_bytes();
    let len = bytes.len();
    let mut result = String::with_capacity(len);
    let mut i = 0;

    while i < len {
        // Look for 'import' keyword
        if bytes[i] == b'i'
            && i + 6 <= len
            && &source[i..i + 6] == "import"
            && (i == 0 || !is_id_char(bytes[i - 1]))
            && (i + 6 >= len
                || !is_id_char(bytes[i + 6])
                || bytes[i + 6] == b'"'
                || bytes[i + 6] == b'\'')
        {
            let import_start = i;
            i += 6;

            // Skip whitespace
            while i < len && bytes[i].is_ascii_whitespace() {
                i += 1;
            }

            // Check for string literal (bare import: import "spec")
            if i < len && (bytes[i] == b'"' || bytes[i] == b'\'') {
                let quote = bytes[i];
                i += 1;
                let spec_start = i;
                while i < len && bytes[i] != quote {
                    if bytes[i] == b'\\' {
                        i += 1;
                    }
                    i += 1;
                }
                let spec_end = i;
                if i < len {
                    i += 1; // skip closing quote
                }
                let specifier = &source[spec_start..spec_end];

                // Skip whitespace
                let after_spec = i;
                while i < len && bytes[i].is_ascii_whitespace() {
                    i += 1;
                }

                // Check for 'with' keyword (not 'with(' which is a with-statement)
                if i + 4 <= len
                    && &source[i..i + 4] == "with"
                    && (i + 4 >= len || !is_id_char(bytes[i + 4]) || bytes[i + 4] == b'{')
                {
                    let with_start = i;
                    i += 4;
                    while i < len && bytes[i].is_ascii_whitespace() {
                        i += 1;
                    }
                    if i < len && bytes[i] == b'{' {
                        i += 1;
                        let attrs_start = i;
                        let mut depth = 1u32;
                        while i < len && depth > 0 {
                            match bytes[i] {
                                b'{' => depth += 1,
                                b'}' => depth -= 1,
                                b'"' | b'\'' => {
                                    let q = bytes[i];
                                    i += 1;
                                    while i < len && bytes[i] != q {
                                        if bytes[i] == b'\\' {
                                            i += 1;
                                        }
                                        i += 1;
                                    }
                                }
                                _ => {}
                            }
                            i += 1;
                        }
                        let attrs_content = &source[attrs_start..if i > 0 { i - 1 } else { i }];

                        // Parse the type value from attributes
                        let type_value = extract_attr_type_value(attrs_content);
                        let format = determine_data_url_format(specifier);

                        // Validate
                        if let Some(error_module) = validate_static_import_attrs(
                            type_value.as_deref(),
                            format,
                            specifier,
                            module_path,
                        ) {
                            return error_module;
                        }

                        // Valid: strip the with clause, keep everything else
                        result.push_str(&source[import_start..after_spec]);
                        // Skip any remaining content after the with block
                        // and append the rest of the source
                        while i < len && bytes[i].is_ascii_whitespace() {
                            i += 1;
                        }
                        result.push_str(&source[i..]);
                        return result;
                    } else {
                        // 'with' not followed by '{', not import attrs
                        i = with_start;
                        result.push_str(&source[import_start..i]);
                        continue;
                    }
                }
                // No 'with' keyword, output as-is
                result.push_str(&source[import_start..i]);
                continue;
            }

            // Not a bare import string - check for named/namespace imports with 'from'
            // For now, scan for 'from' followed by a string and then 'with'
            // Skip complex patterns and output as-is
            result.push_str(&source[import_start..i]);
            continue;
        }

        result.push(bytes[i] as char);
        i += 1;
    }

    result
}

fn is_id_char(b: u8) -> bool {
    b.is_ascii_alphanumeric() || b == b'_' || b == b'$'
}

/// Extract the value of the `type` key from a simple attributes string like `type:"json"`.
fn extract_attr_type_value(attrs: &str) -> Option<String> {
    // Look for `type` key followed by `:` and a string value
    let bytes = attrs.as_bytes();
    let len = bytes.len();
    let mut i = 0;

    while i < len {
        // Skip whitespace
        while i < len && (bytes[i].is_ascii_whitespace() || bytes[i] == b',') {
            i += 1;
        }
        if i >= len {
            break;
        }

        // Read key (identifier or quoted string)
        let key_start = i;
        if bytes[i] == b'"' || bytes[i] == b'\'' {
            let q = bytes[i];
            i += 1;
            while i < len && bytes[i] != q {
                if bytes[i] == b'\\' {
                    i += 1;
                }
                i += 1;
            }
            if i < len {
                i += 1;
            }
        } else {
            while i < len && is_id_char(bytes[i]) {
                i += 1;
            }
        }
        let key = attrs[key_start..i].trim_matches(|c: char| c == '"' || c == '\'');

        // Skip whitespace and colon
        while i < len && bytes[i].is_ascii_whitespace() {
            i += 1;
        }
        if i < len && bytes[i] == b':' {
            i += 1;
        }
        while i < len && bytes[i].is_ascii_whitespace() {
            i += 1;
        }

        // Read value (string)
        if i < len && (bytes[i] == b'"' || bytes[i] == b'\'') {
            let q = bytes[i];
            i += 1;
            let val_start = i;
            while i < len && bytes[i] != q {
                if bytes[i] == b'\\' {
                    i += 1;
                }
                i += 1;
            }
            let val = &attrs[val_start..i];
            if i < len {
                i += 1;
            }

            if key == "type" {
                return Some(val.to_string());
            }
        } else {
            // Skip non-string values
            while i < len && bytes[i] != b',' && bytes[i] != b'}' {
                i += 1;
            }
        }
    }
    None
}

/// Determine module format from a data URL specifier.
fn determine_data_url_format(specifier: &str) -> Option<&'static str> {
    if let Some(rest) = specifier.strip_prefix("data:") {
        if let Some(comma_pos) = rest.find(',') {
            let metadata = &rest[..comma_pos];
            let base_mime = metadata.split(';').next().unwrap_or(metadata).trim();
            return match base_mime {
                "application/json" => Some("json"),
                "text/javascript" | "application/javascript" => Some("module"),
                "text/css" => Some("css"),
                _ => None,
            };
        }
    } else if specifier.ends_with(".json") {
        return Some("json");
    }
    None
}

/// Validate static import attributes. Returns Some(error_module_source) if invalid, None if valid.
fn validate_static_import_attrs(
    type_value: Option<&str>,
    format: Option<&str>,
    specifier: &str,
    _module_path: &str,
) -> Option<String> {
    if let Some(tv) = type_value {
        match tv {
            "json" => {
                if format == Some("module") {
                    return Some(
                        "await Promise.reject(Object.assign(new TypeError('Cannot use import attributes to change the type of a JavaScript module'), {code: 'ERR_IMPORT_ATTRIBUTE_TYPE_INCOMPATIBLE'}));\n".to_string()
                    );
                }
            }
            "css" => {
                // CSS is a recognized type, let loader handle it
            }
            other => {
                let escaped_type = DataUrlLoader::js_string_escape(other);
                return Some(format!(
                    "await Promise.reject(Object.assign(new TypeError('Import attribute type \"{escaped_type}\" is not supported'), {{code: 'ERR_IMPORT_ATTRIBUTE_UNSUPPORTED'}}));\n"
                ));
            }
        }
    }

    // Check for missing required attributes (JSON without type: "json")
    if format == Some("json") && type_value != Some("json") {
        let escaped = DataUrlLoader::js_string_escape(specifier);
        return Some(format!(
            "await Promise.reject(Object.assign(new TypeError('Module \"{escaped}\" needs an import attribute of type: json'), {{code: 'ERR_IMPORT_ATTRIBUTE_MISSING'}}));\n"
        ));
    }

    None
}

fn esm_preflight_error_module_source(source: &str, package_type_module_js: bool) -> Option<String> {
    if package_type_module_js {
        let cjs_global = find_bare_cjs_global_in_esm(source);
        if !analyze_cjs_exports(source).is_cjs && cjs_global.is_none() {
            return None;
        }
        let name = cjs_global.unwrap_or("module");
        let message = format!(
            "{name} is not defined in ES module scope. This file is being treated as an ES module because it has a .js file extension and package.json contains \"type\": \"module\". To treat it as a CommonJS script, rename it to use the '.cjs' file extension."
        );
        let escaped = DataUrlLoader::js_string_escape(&message);
        return Some(format!(
            "await Promise.reject(new ReferenceError('{escaped}'));\n"
        ));
    }

    let Some(name) = find_bare_cjs_global_in_esm(source) else {
        return None;
    };
    let message = match name {
        "require" => "require is not defined in ES module scope, you can use import instead",
        "exports" => "exports is not defined in ES module scope",
        "module" => "module is not defined in ES module scope",
        "__filename" => "__filename is not defined in ES module scope",
        "__dirname" => "__dirname is not defined in ES module scope",
        _ => return None,
    };
    let escaped = DataUrlLoader::js_string_escape(message);
    Some(format!(
        "await Promise.reject(new ReferenceError('{escaped}'));\n"
    ))
}

fn find_bare_cjs_global_in_esm(source: &str) -> Option<&'static str> {
    const NAMES: [&str; 5] = ["require", "exports", "module", "__filename", "__dirname"];
    let bytes = source.as_bytes();
    let mut i = 0usize;
    let mut declared = Vec::<String>::new();
    while i < bytes.len() {
        if let Some(next) = parse_object_method_span(source, i) {
            i = next;
            continue;
        }

        match bytes[i] {
            b'\'' | b'"' | b'`' => {
                i = skip_string_or_template(source, i);
                continue;
            }
            b'/' if i + 1 < bytes.len() && bytes[i + 1] == b'/' => {
                i += 2;
                while i < bytes.len() && !matches!(bytes[i], b'\n' | b'\r') {
                    i += 1;
                }
                continue;
            }
            b'/' if i + 1 < bytes.len() && bytes[i + 1] == b'*' => {
                i += 2;
                while i + 1 < bytes.len() && !(bytes[i] == b'*' && bytes[i + 1] == b'/') {
                    i += 1;
                }
                i = (i + 2).min(bytes.len());
                continue;
            }
            b'/' if is_regex_literal_start(source, i) => {
                i = skip_regex_literal(source, i);
                continue;
            }
            _ => {}
        }

        if let Some((bindings, next)) = parse_import_declaration_bindings(source, i) {
            for name in bindings {
                if NAMES.contains(&name.as_str()) && !declared.iter().any(|existing| existing == &name) {
                    declared.push(name);
                }
            }
            i = next;
            continue;
        }

        if let Some(next) = parse_arrow_function_span(source, i) {
            i = next;
            continue;
        }

        if let Some((bindings, next)) = parse_declaration_span(source, i) {
            for name in bindings {
                if NAMES.contains(&name.as_str()) && !declared.iter().any(|existing| existing == &name) {
                    declared.push(name);
                }
            }
            i = next;
            continue;
        }

        for name in NAMES {
            if source[i..].starts_with(name)
                && is_ident_start_boundary(bytes, i)
                && is_ident_boundary(bytes, i + name.len())
                && previous_significant_byte(source, i) != Some(b'.')
                && !declared.iter().any(|declared| declared == name)
            {
                let next = skip_ws_comments(source, i + name.len());
                if next < bytes.len() && bytes[next] == b':' {
                    break;
                }
                return Some(name);
            }
        }
        i = next_char_boundary(source, i);
    }
    None
}

fn find_statement_end(source: &str, pos: usize) -> usize {
    let bytes = source.as_bytes();
    let mut i = pos;
    while i < bytes.len() {
        match bytes[i] {
            b'\'' | b'"' | b'`' => {
                i = skip_string_or_template(source, i);
                continue;
            }
            b'/' if i + 1 < bytes.len() && bytes[i + 1] == b'/' => {
                i += 2;
                while i < bytes.len() && !matches!(bytes[i], b'\n' | b'\r') {
                    i += 1;
                }
                continue;
            }
            b'/' if i + 1 < bytes.len() && bytes[i + 1] == b'*' => {
                i += 2;
                while i + 1 < bytes.len() && !(bytes[i] == b'*' && bytes[i + 1] == b'/') {
                    i += 1;
                }
                i = (i + 2).min(bytes.len());
                continue;
            }
            b';' | b'\n' | b'\r' => return i + 1,
            _ => i = next_char_boundary(source, i),
        }
    }
    i
}

fn parse_import_declaration_bindings(source: &str, pos: usize) -> Option<(Vec<String>, usize)> {
    let bytes = source.as_bytes();
    if !source[pos..].starts_with("import")
        || !is_ident_start_boundary(bytes, pos)
        || !is_ident_boundary(bytes, pos + 6)
    {
        return None;
    }
    let mut i = skip_ws_comments(source, pos + 6);
    if i < bytes.len() && (bytes[i] == b'(' || bytes[i] == b'\'' || bytes[i] == b'"') {
        return Some((Vec::new(), find_statement_end(source, i)));
    }

    let mut bindings = Vec::new();
    if i < bytes.len() && bytes[i] == b'*' {
        i = skip_ws_comments(source, i + 1);
        if source[i..].starts_with("as") && is_ident_boundary(bytes, i + 2) {
            i = skip_ws_comments(source, i + 2);
            let (name, _) = read_ident(source, i)?;
            bindings.push(name);
        }
        return Some((bindings, find_statement_end(source, i)));
    }

    if i < bytes.len() && bytes[i] == b'{' {
        collect_named_import_bindings(source, i, &mut bindings)?;
        return Some((bindings, find_statement_end(source, i)));
    }

    if let Some((name, next)) = read_ident(source, i) {
        bindings.push(name);
        i = skip_ws_comments(source, next);
        if i < bytes.len() && bytes[i] == b',' {
            i = skip_ws_comments(source, i + 1);
            if i < bytes.len() && bytes[i] == b'*' {
                i = skip_ws_comments(source, i + 1);
                if source[i..].starts_with("as") && is_ident_boundary(bytes, i + 2) {
                    i = skip_ws_comments(source, i + 2);
                    let (name, _) = read_ident(source, i)?;
                    bindings.push(name);
                }
            } else if i < bytes.len() && bytes[i] == b'{' {
                collect_named_import_bindings(source, i, &mut bindings)?;
            }
        }
        return Some((bindings, find_statement_end(source, i)));
    }

    Some((bindings, find_statement_end(source, i)))
}

fn collect_named_import_bindings(source: &str, start: usize, bindings: &mut Vec<String>) -> Option<()> {
    let bytes = source.as_bytes();
    let end = find_matching_brace(source, start)?;
    let mut i = start + 1;
    while i < end {
        i = skip_ws_comments(source, i);
        if i >= end {
            break;
        }
        let (mut name, next) = read_ident(source, i)?;
        i = skip_ws_comments(source, next);
        if source[i..].starts_with("as") && is_ident_boundary(bytes, i + 2) {
            i = skip_ws_comments(source, i + 2);
            let (alias, next) = read_ident(source, i)?;
            name = alias;
            i = next;
        }
        bindings.push(name);
        while i < end && bytes[i] != b',' {
            i = next_char_boundary(source, i);
        }
        if i < end && bytes[i] == b',' {
            i += 1;
        }
    }
    Some(())
}

fn parse_declaration_span(source: &str, pos: usize) -> Option<(Vec<String>, usize)> {
    if let Some((bindings, next)) = parse_variable_declaration_span(source, pos) {
        return Some((bindings, next));
    }
    if let Some((bindings, next)) = parse_function_declaration_span(source, pos) {
        return Some((bindings, next));
    }
    if let Some((bindings, next)) = parse_class_declaration_span(source, pos) {
        return Some((bindings, next));
    }
    None
}

fn parse_variable_declaration_span(source: &str, pos: usize) -> Option<(Vec<String>, usize)> {
    for keyword in ["const", "let", "var"] {
        if source[pos..].starts_with(keyword)
            && is_ident_start_boundary(source.as_bytes(), pos)
            && is_ident_boundary(source.as_bytes(), pos + keyword.len())
        {
            let start = skip_ws_comments(source, pos + keyword.len());
            let end = find_variable_declaration_end(source, start);
            return Some((collect_cjs_global_names_in_span(source, start, end), end));
        }
    }
    None
}

fn find_variable_declaration_end(source: &str, pos: usize) -> usize {
    let bytes = source.as_bytes();
    let mut i = pos;
    let mut paren = 0usize;
    let mut brace = 0usize;
    let mut bracket = 0usize;
    while i < bytes.len() {
        match bytes[i] {
            b'\'' | b'"' | b'`' => {
                i = skip_string_or_template(source, i);
                continue;
            }
            b'/' if i + 1 < bytes.len() && bytes[i + 1] == b'/' => {
                i += 2;
                while i < bytes.len() && !matches!(bytes[i], b'\n' | b'\r') {
                    i += 1;
                }
                continue;
            }
            b'/' if i + 1 < bytes.len() && bytes[i + 1] == b'*' => {
                i += 2;
                while i + 1 < bytes.len() && !(bytes[i] == b'*' && bytes[i + 1] == b'/') {
                    i += 1;
                }
                i = (i + 2).min(bytes.len());
                continue;
            }
            b'/' if is_regex_literal_start(source, i) => {
                i = skip_regex_literal(source, i);
                continue;
            }
            b'(' => paren += 1,
            b')' => paren = paren.saturating_sub(1),
            b'{' => brace += 1,
            b'}' => {
                if paren == 0 && brace == 0 && bracket == 0 {
                    return i;
                }
                brace = brace.saturating_sub(1);
            }
            b'[' => bracket += 1,
            b']' => bracket = bracket.saturating_sub(1),
            b';' if paren == 0 && brace == 0 && bracket == 0 => return i + 1,
            _ => {}
        }
        i = next_char_boundary(source, i);
    }
    i
}

fn parse_function_declaration_span(source: &str, pos: usize) -> Option<(Vec<String>, usize)> {
    let bytes = source.as_bytes();
    if !source[pos..].starts_with("function")
        || !is_ident_start_boundary(bytes, pos)
        || !is_ident_boundary(bytes, pos + 8)
    {
        return None;
    }
    let mut i = skip_ws_comments(source, pos + 8);
    if i < bytes.len() && bytes[i] == b'*' {
        i = skip_ws_comments(source, i + 1);
    }
    let mut bindings = Vec::new();
    if let Some((name, next)) = read_ident(source, i) {
        bindings.push(name);
        i = skip_ws_comments(source, next);
    }
    if i < bytes.len() && bytes[i] == b'(' {
        let params_end = find_matching_paren(source, i)?;
        bindings.extend(collect_cjs_global_names_in_span(source, i + 1, params_end));
        i = skip_ws_comments(source, params_end + 1);
        if i < bytes.len() && bytes[i] == b'{' {
            return Some((bindings, find_matching_brace(source, i)? + 1));
        }
    }
    Some((bindings, i))
}

fn parse_arrow_function_span(source: &str, pos: usize) -> Option<usize> {
    let bytes = source.as_bytes();
    let mut i;
    if pos < bytes.len() && bytes[pos] == b'(' {
        let params_end = find_matching_paren(source, pos)?;
        i = skip_ws_comments(source, params_end + 1);
    } else {
        let (_, next) = read_ident(source, pos)?;
        i = skip_ws_comments(source, next);
    }
    if i + 1 >= bytes.len() || bytes[i] != b'=' || bytes[i + 1] != b'>' {
        return None;
    }
    i = skip_ws_comments(source, i + 2);
    if i < bytes.len() && bytes[i] == b'{' {
        Some(find_matching_brace(source, i)? + 1)
    } else {
        Some(find_statement_end(source, i))
    }
}

fn parse_object_method_span(source: &str, pos: usize) -> Option<usize> {
    if !matches!(previous_significant_byte_before_method(source, pos), Some(b'{') | Some(b',')) {
        return None;
    }
    let bytes = source.as_bytes();
    let mut i = pos;
    if source[i..].starts_with("async") && is_ident_boundary(bytes, i + 5) {
        let next = skip_ws_comments(source, i + 5);
        if next < bytes.len() && bytes[next] != b':' {
            i = next;
        }
    }
    if i < bytes.len() && bytes[i] == b'*' {
        i = skip_ws_comments(source, i + 1);
    }
    if (source[i..].starts_with("get") && is_ident_boundary(bytes, i + 3))
        || (source[i..].starts_with("set") && is_ident_boundary(bytes, i + 3))
    {
        let next = skip_ws_comments(source, i + 3);
        if next < bytes.len() && bytes[next] != b':' {
            i = next;
        }
    }
    if i >= bytes.len() {
        return None;
    }
    if matches!(bytes[i], b'\'' | b'"') {
        let (_, next) = read_js_string(source, i)?;
        i = next;
    } else if bytes[i].is_ascii_digit() {
        while i < bytes.len() && bytes[i].is_ascii_digit() {
            i += 1;
        }
    } else {
        let (_, next) = read_ident(source, i)?;
        i = next;
    }
    i = skip_ws_comments(source, i);
    if i >= bytes.len() || bytes[i] != b'(' {
        return None;
    }
    let params_end = find_matching_paren(source, i)?;
    i = skip_ws_comments(source, params_end + 1);
    if i < bytes.len() && bytes[i] == b'{' {
        Some(find_matching_brace(source, i)? + 1)
    } else {
        None
    }
}

fn previous_significant_byte_before_method(source: &str, pos: usize) -> Option<u8> {
    let bytes = source.as_bytes();
    let mut end = pos;
    loop {
        while end > 0 && bytes[end - 1].is_ascii_whitespace() {
            end -= 1;
        }
        if end >= 2 && bytes[end - 2] == b'*' && bytes[end - 1] == b'/' {
            if let Some(start) = source[..end - 2].rfind("/*") {
                end = start;
                continue;
            }
        }
        return if end == 0 { None } else { Some(bytes[end - 1]) };
    }
}

fn parse_class_declaration_span(source: &str, pos: usize) -> Option<(Vec<String>, usize)> {
    let bytes = source.as_bytes();
    if !source[pos..].starts_with("class")
        || !is_ident_start_boundary(bytes, pos)
        || !is_ident_boundary(bytes, pos + 5)
    {
        return None;
    }
    let mut i = skip_ws_comments(source, pos + 5);
    let mut bindings = Vec::new();
    if let Some((name, next)) = read_ident(source, i) {
        bindings.push(name);
        i = skip_ws_comments(source, next);
    }
    while i < bytes.len() && bytes[i] != b'{' {
        i = next_char_boundary(source, i);
    }
    if i < bytes.len() && bytes[i] == b'{' {
        return Some((bindings, find_matching_brace(source, i)? + 1));
    }
    Some((bindings, i))
}

fn collect_cjs_global_names_in_span(source: &str, start: usize, end: usize) -> Vec<String> {
    const NAMES: [&str; 5] = ["require", "exports", "module", "__filename", "__dirname"];
    let bytes = source.as_bytes();
    let mut names = Vec::new();
    let mut i = start;
    while i < end && i < bytes.len() {
        match bytes[i] {
            b'\'' | b'"' | b'`' => {
                i = skip_string_or_template(source, i);
                continue;
            }
            b'/' if i + 1 < bytes.len() && bytes[i + 1] == b'/' => {
                i += 2;
                while i < end && i < bytes.len() && !matches!(bytes[i], b'\n' | b'\r') {
                    i += 1;
                }
                continue;
            }
            b'/' if i + 1 < bytes.len() && bytes[i + 1] == b'*' => {
                i += 2;
                while i + 1 < end && i + 1 < bytes.len() && !(bytes[i] == b'*' && bytes[i + 1] == b'/') {
                    i += 1;
                }
                i = (i + 2).min(end).min(bytes.len());
                continue;
            }
            b'/' if is_regex_literal_start(source, i) => {
                i = skip_regex_literal(source, i);
                continue;
            }
            _ => {}
        }

        for name in NAMES {
            if source[i..].starts_with(name)
                && is_ident_start_boundary(bytes, i)
                && is_ident_boundary(bytes, i + name.len())
                && !names.iter().any(|existing| existing == name)
            {
                names.push(name.to_string());
                break;
            }
        }
        i = next_char_boundary(source, i);
    }
    names
}

fn data_url_simple_identifier_error_module_source(source: &str) -> Option<String> {
    let ident = source.trim().strip_suffix(';').unwrap_or(source.trim()).trim();
    if ident.is_empty()
        || ["require", "exports", "module", "__filename", "__dirname"].contains(&ident)
        || !is_ascii_js_identifier(ident)
    {
        return None;
    }
    let escaped = DataUrlLoader::js_string_escape(&format!("{ident} is not defined"));
    Some(format!(
        "await Promise.reject(new ReferenceError('{escaped}'));\n"
    ))
}

fn has_cjs_wrapper_require_redeclaration(source: &str) -> bool {
    let bytes = source.as_bytes();
    let mut found = false;
    let mut brace_depth = 0usize;
    scan_code_positions(source, true, |i, byte| {
        match byte {
            b'{' => {
                brace_depth += 1;
                return ControlFlow::Continue(None);
            }
            b'}' => {
                brace_depth = brace_depth.saturating_sub(1);
                return ControlFlow::Continue(None);
            }
            _ => {}
        }

        if brace_depth == 0 {
            for keyword in ["const", "let"] {
                if source[i..].starts_with(keyword)
                    && is_ident_start_boundary(bytes, i)
                    && is_ident_boundary(bytes, i + keyword.len())
                {
                    let next = skip_ws_comments(source, i + keyword.len());
                    if source[next..].starts_with("require")
                        && is_ident_start_boundary(bytes, next)
                        && is_ident_boundary(bytes, next + 7)
                    {
                        found = true;
                        return ControlFlow::Break(());
                    }
                }
            }
        }
        ControlFlow::Continue(None)
    });
    found
}

fn is_ascii_js_identifier(value: &str) -> bool {
    let bytes = value.as_bytes();
    if bytes.is_empty() || !(bytes[0] == b'_' || bytes[0] == b'$' || bytes[0].is_ascii_alphabetic()) {
        return false;
    }
    bytes[1..]
        .iter()
        .all(|byte| *byte == b'_' || *byte == b'$' || byte.is_ascii_alphanumeric())
}

/// Resolver that strips `file://` URL prefixes so that `import('file:///path/to/mod.mjs')`
/// resolves to the filesystem path `/path/to/mod.mjs`.
struct FileUrlResolver;

impl FileUrlResolver {
    /// Decode a `file://` URL into a filesystem path, handling percent-encoding.
    fn file_url_to_path(url: &str) -> Option<String> {
        let encoded = url.strip_prefix("file://")?;
        let end = encoded
            .find(|ch| ch == '?' || ch == '#')
            .unwrap_or(encoded.len());
        let encoded_path = &encoded[..end];
        let suffix = &encoded[end..];
        let bytes = encoded_path.as_bytes();
        let mut decoded = Vec::with_capacity(bytes.len());
        let mut i = 0;
        while i < bytes.len() {
            if bytes[i] == b'%'
                && i + 2 < bytes.len()
                && let (Some(hi), Some(lo)) =
                    (Self::hex_val(bytes[i + 1]), Self::hex_val(bytes[i + 2]))
            {
                decoded.push(hi << 4 | lo);
                i += 3;
                continue;
            }
            decoded.push(bytes[i]);
            i += 1;
        }
        let mut path = String::from_utf8(decoded).ok()?;
        path.push_str(suffix);
        Some(path)
    }

    fn hex_val(b: u8) -> Option<u8> {
        match b {
            b'0'..=b'9' => Some(b - b'0'),
            b'A'..=b'F' => Some(b - b'A' + 10),
            b'a'..=b'f' => Some(b - b'a' + 10),
            _ => None,
        }
    }
}

impl Resolver for FileUrlResolver {
    fn resolve<'js>(
        &mut self,
        _ctx: &Ctx<'js>,
        _base: &str,
        name: &str,
    ) -> rquickjs::Result<String> {
        if let Some(path) = Self::file_url_to_path(name) {
            Ok(path)
        } else {
            Err(Error::new_resolving(_base, name))
        }
    }
}

/// Resolver that handles bare specifier imports by walking up the directory tree
/// looking for `node_modules/<name>/` directories, reading their `package.json`
/// to find the entry point.
/// Resolver that guards against dynamic import from contexts without a module referrer.
///
/// QuickJS currently reports `<input>` for both direct and indirect eval, so we
/// conservatively enforce Node's missing-callback error for `node:` specifiers.
/// This is enough for Node's `Promise.resolve(...).then(eval)` realm test case
/// while preserving successful direct-eval imports in CommonJS modules.
struct RealmGuardResolver;

impl Resolver for RealmGuardResolver {
    fn resolve<'js>(&mut self, ctx: &Ctx<'js>, base: &str, name: &str) -> rquickjs::Result<String> {
        if base != "<input>" {
            return Err(Error::new_resolving(base, name));
        }

        if !name.starts_with("node:") {
            return Err(Error::new_resolving(base, name));
        }

        let globals = ctx.globals();
        let current_module: Value = globals
            .get("__wasm_rquickjs_current_module")
            .unwrap_or_else(|_| Value::new_undefined(ctx.clone()));

        if !current_module.is_undefined() && !current_module.is_null() {
            return Err(Error::new_resolving(base, name));
        }

        let eval_script: Value = globals
            .get("__wasm_rquickjs_current_eval_script_name")
            .unwrap_or_else(|_| Value::new_undefined(ctx.clone()));
        if !eval_script.is_undefined() && !eval_script.is_null() {
            return Err(Error::new_resolving(base, name));
        }

        let type_error_ctor: Function = globals.get("TypeError")?;
        let error_obj: Object =
            type_error_ctor.call(("A dynamic import callback was not specified.",))?;
        error_obj.set("code", "ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING")?;
        Err(ctx.throw(error_obj.into_value()))
    }
}

/// Resolver that intercepts module resolution for mocked modules.
/// Checks `globalThis.__wasm_rquickjs_module_mocks` registry via JS helpers.
struct MockModuleResolver;

impl Resolver for MockModuleResolver {
    fn resolve<'js>(&mut self, ctx: &Ctx<'js>, base: &str, name: &str) -> rquickjs::Result<String> {
        let globals = ctx.globals();

        let canonical_key_fn: Function = globals
            .get::<_, Function>("__wasm_rquickjs_mock_canonical_key")
            .map_err(|_| Error::new_resolving(base, name))?;

        let key: Value = canonical_key_fn
            .call((name, base))
            .map_err(|_| Error::new_resolving(base, name))?;

        if key.is_null() || key.is_undefined() {
            return Err(Error::new_resolving(base, name));
        }

        let key_str: String = key
            .get::<String>()
            .map_err(|_| Error::new_resolving(base, name))?;

        let registry: Object = globals
            .get::<_, Object>("__wasm_rquickjs_module_mocks")
            .map_err(|_| Error::new_resolving(base, name))?;

        let entry: Value = registry
            .get::<_, Value>(&key_str as &str)
            .map_err(|_| Error::new_resolving(base, name))?;

        if entry.is_undefined() || entry.is_null() {
            return Err(Error::new_resolving(base, name));
        }

        let entry_obj: Object = entry
            .into_object()
            .ok_or_else(|| Error::new_resolving(base, name))?;

        let mock_id: i64 = entry_obj
            .get::<_, i64>("id")
            .map_err(|_| Error::new_resolving(base, name))?;

        let cache: bool = entry_obj.get::<_, bool>("cache").unwrap_or(false);

        if cache {
            Ok(format!("__wasm_rquickjs_mock__:{}", mock_id))
        } else {
            let seq_key = "__wasm_rquickjs_mock_seq";
            let seq: i64 = globals.get::<_, i64>(seq_key).unwrap_or(0);
            let next_seq = seq + 1;
            let _ = globals.set(seq_key, next_seq);
            Ok(format!("__wasm_rquickjs_mock__:{}:{}", mock_id, next_seq))
        }
    }
}

/// Loader that handles synthetic mock module IDs produced by MockModuleResolver.
/// Generates ESM source from the JS-side mock registry.
struct MockModuleLoader;

impl Loader for MockModuleLoader {
    fn load<'js>(
        &mut self,
        ctx: &Ctx<'js>,
        path: &str,
    ) -> rquickjs::Result<Module<'js, rquickjs::module::Declared>> {
        if !path.starts_with("__wasm_rquickjs_mock__:") {
            return Err(Error::new_loading(path));
        }

        let rest = &path["__wasm_rquickjs_mock__:".len()..];
        let mock_id_str = rest.split(':').next().unwrap_or(rest);
        let mock_id: i64 = mock_id_str.parse().map_err(|_| Error::new_loading(path))?;

        let globals = ctx.globals();
        let gen_fn: Function = globals
            .get::<_, Function>("__wasm_rquickjs_get_mock_module_source")
            .map_err(|_| Error::new_loading(path))?;

        let source: String = gen_fn
            .call::<_, String>((mock_id,))
            .map_err(|_| Error::new_loading(path))?;

        Module::declare(ctx.clone(), path, source.as_bytes().to_vec())
    }
}

/// Resolver that handles relative path imports from eval'd CJS code.
/// When base is `<input>` (from eval) and there's a CJS module context,
/// resolves relative paths against the module's directory.
struct CjsEvalResolver;

impl CjsEvalResolver {
    fn normalize_path(path: &std::path::Path) -> String {
        use std::path::Component;
        let mut parts: Vec<String> = Vec::new();
        let is_absolute = path.has_root();

        for component in path.components() {
            match component {
                Component::RootDir | Component::Prefix(_) => {}
                Component::CurDir => {}
                Component::ParentDir => {
                    parts.pop();
                }
                Component::Normal(part) => {
                    parts.push(part.to_string_lossy().into_owned());
                }
            }
        }

        if is_absolute {
            format!("/{}", parts.join("/"))
        } else {
            parts.join("/")
        }
    }
}

impl Resolver for CjsEvalResolver {
    fn resolve<'js>(&mut self, ctx: &Ctx<'js>, base: &str, name: &str) -> rquickjs::Result<String> {
        if base != "<input>" {
            return Err(Error::new_resolving(base, name));
        }

        if !name.starts_with("./") && !name.starts_with("../") {
            return Err(Error::new_resolving(base, name));
        }

        let globals = ctx.globals();
        let import_dir: Value = globals
            .get("__wasm_rquickjs_cjs_import_dir")
            .unwrap_or_else(|_| Value::new_undefined(ctx.clone()));

        if import_dir.is_undefined() || import_dir.is_null() {
            return Err(Error::new_resolving(base, name));
        }

        let dir_str: String = import_dir
            .get::<String>()
            .map_err(|_| Error::new_resolving(base, name))?;

        let module_dir = std::path::Path::new(&dir_str);
        let resolved = module_dir.join(name);
        let normalized = Self::normalize_path(&resolved);

        let candidates = [
            normalized.clone(),
            format!("{}.js", normalized),
            format!("{}.mjs", normalized),
        ];

        for candidate in &candidates {
            if std::path::Path::new(candidate).is_file() {
                return Ok(candidate.clone());
            }
        }

        Err(Error::new_resolving(base, name))
    }
}

/// Resolver for filesystem-backed ES modules.
///
/// QuickJS gives dynamic imports from CommonJS `eval()` a synthetic `<input>`
/// base (handled by `CjsEvalResolver` above), but normal ESM resolution still
/// needs Node-style filesystem handling for absolute paths and paths relative
/// to the referrer module. `rquickjs::FileResolver` is kept as a fallback, but
/// it does not reliably accept already-absolute guest paths in this WASI setup.
struct NodeFileResolver;

impl NodeFileResolver {
    fn resolve_candidate(candidate: std::path::PathBuf, suffix: &str) -> Option<String> {
        let normalized = CjsEvalResolver::normalize_path(&candidate);
        if std::path::Path::new(&normalized).is_file() {
            return Some(format!("{normalized}{suffix}"));
        }

        if std::path::Path::new(&normalized).extension().is_none() {
            for ext in ["js", "mjs", "json"] {
                let with_ext = format!("{}.{}", normalized, ext);
                if std::path::Path::new(&with_ext).is_file() {
                    return Some(format!("{with_ext}{suffix}"));
                }
            }
        }

        None
    }
}

impl Resolver for NodeFileResolver {
    fn resolve<'js>(
        &mut self,
        _ctx: &Ctx<'js>,
        base: &str,
        name: &str,
    ) -> rquickjs::Result<String> {
        if name.contains("://") || name.starts_with("node:") {
            return Err(Error::new_resolving(base, name));
        }

        let (name_path, suffix) = split_module_path_suffix(name);
        let candidate = if name_path.starts_with('/') {
            std::path::PathBuf::from(name_path)
        } else if name_path.starts_with("./") || name_path.starts_with("../") {
            let base_path = if let Some(path) = FileUrlResolver::file_url_to_path(base) {
                path
            } else {
                base.to_string()
            };
            let base_path = module_filesystem_path(&base_path);

            if base_path == "<input>" {
                return Err(Error::new_resolving(base, name));
            }

            let base_dir = std::path::Path::new(&base_path)
                .parent()
                .ok_or_else(|| Error::new_resolving(base, name))?;
            base_dir.join(name_path)
        } else {
            return Err(Error::new_resolving(base, name));
        };

        Self::resolve_candidate(candidate, suffix).ok_or_else(|| Error::new_resolving(base, name))
    }
}

/// Resolver that provides Node.js-style error codes for failed module resolution.
/// This should be the LAST resolver in the chain, catching everything that
/// preceding resolvers couldn't handle.
struct NodeModuleErrorResolver;

impl Resolver for NodeModuleErrorResolver {
    fn resolve<'js>(
        &mut self,
        ctx: &Ctx<'js>,
        _base: &str,
        name: &str,
    ) -> rquickjs::Result<String> {
        let globals = ctx.globals();

        if name.starts_with("node:") {
            let msg = format!("No such built-in module: {}", name);
            let type_error_ctor: Function = globals.get("TypeError")?;
            let error_obj: Object = type_error_ctor.call((&msg,))?;
            error_obj.set("code", "ERR_UNKNOWN_BUILTIN_MODULE")?;
            return Err(ctx.throw(error_obj.into_value()));
        }

        if let Some(scheme_end) = name.find("://") {
            let scheme = &name[..scheme_end];
            if scheme != "file" && scheme != "data" {
                let msg = format!(
                    "Only URLs with a scheme in: file, data, and node are supported by the default ESM loader. Received protocol '{}:'",
                    scheme
                );
                let error_ctor: Function = globals.get("Error")?;
                let error_obj: Object = error_ctor.call((&msg,))?;
                error_obj.set("code", "ERR_UNSUPPORTED_ESM_URL_SCHEME")?;
                return Err(ctx.throw(error_obj.into_value()));
            }
        }

        let msg = format!("Cannot find module '{}'", name);
        let error_ctor: Function = globals.get("Error")?;
        let error_obj: Object = error_ctor.call((&msg,))?;
        error_obj.set("code", "ERR_MODULE_NOT_FOUND")?;
        Err(ctx.throw(error_obj.into_value()))
    }
}

enum NodePackageResolveError {
    PackagePathNotExported { package_name: String, subpath: String },
    PackageImportNotDefined { specifier: String },
    InvalidPackageTarget { kind: &'static str, target: String },
    InvalidPackageConfig { path: String },
    ModuleNotFound { request: String },
}

enum PackageTargetResolution {
    Resolved(String),
    NoMatch,
    Blocked,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(untagged)]
enum PackageTarget {
    String(String),
    Array(Vec<PackageTarget>),
    Object(IndexMap<String, PackageTarget>),
    Bool(bool),
    Null,
    Invalid(serde_json::Value),
}

#[derive(Debug, Default, Deserialize)]
#[serde(default)]
struct PackageJson {
    main: Option<String>,
    exports: Option<PackageTarget>,
    imports: Option<PackageTarget>,
    #[serde(rename = "type")]
    package_type: Option<String>,
}

struct NodeModulesResolver;

impl NodeModulesResolver {
    const ESM_CONDITIONS: [&'static str; 5] = ["golem", "node", "module-sync", "import", "default"];
    const CJS_CONDITIONS: [&'static str; 5] = ["golem", "node", "require", "module-sync", "default"];

    fn try_resolve(
        &self,
        base: &str,
        name: &str,
    ) -> Result<Option<String>, NodePackageResolveError> {
        use std::path::{Path, PathBuf};

        if name.starts_with('#') {
            return self.try_resolve_package_import(base, name);
        }

        // Only handle bare specifiers (not relative, absolute, or URL)
        if name.starts_with('.') || name.starts_with('/') || name.contains("://") {
            return Ok(None);
        }

        let Some((package_name, subpath)) = Self::split_package_name(name) else {
            return Ok(None);
        };

        // Extract directory from base module path
        let Some(base_dir) = Path::new(base).parent() else {
            return Ok(None);
        };

        // Walk up directory tree looking for node_modules
        let mut dir = base_dir.to_path_buf();
        loop {
            let nm_dir = dir.join("node_modules").join(package_name);
            if nm_dir.is_dir() {
                let pkg_path = nm_dir.join("package.json");
                if let Ok(pkg_content) = std::fs::read_to_string(&pkg_path) {
                    let package: PackageJson = serde_json::from_str(&pkg_content).map_err(|_| {
                        NodePackageResolveError::InvalidPackageConfig {
                            path: pkg_path.to_string_lossy().into_owned(),
                        }
                    })?;

                    if let Some(exports_field) = package.exports.as_ref() {
                        return Self::resolve_package_exports(
                            package_name,
                            &nm_dir,
                            exports_field,
                            subpath,
                            &Self::ESM_CONDITIONS,
                        )
                        .map(Some);
                    }

                    if subpath.is_empty()
                        && let Some(main) = package.main.as_ref()
                        && let Some(resolved) = Self::resolve_package_target(&nm_dir, main)
                    {
                        return Ok(Some(resolved));
                    }
                }

                if !subpath.is_empty()
                    && let Some(resolved) = Self::resolve_package_target(&nm_dir, subpath)
                {
                    return Ok(Some(resolved));
                }

                // Fallback: index.mjs, index.js
                let fallbacks: [PathBuf; 2] = [nm_dir.join("index.mjs"), nm_dir.join("index.js")];
                for fallback in &fallbacks {
                    if fallback.is_file() {
                        return Ok(Some(fallback.to_string_lossy().into_owned()));
                    }
                }
            }

            if !dir.pop() {
                break;
            }
        }

        Ok(None)
    }

    fn try_resolve_for_cjs_analysis(
        &self,
        base: &str,
        name: &str,
    ) -> Result<Option<String>, NodePackageResolveError> {
        use std::path::Path;

        if name.starts_with('#') {
            return self.try_resolve_package_import_with_conditions(base, name, &Self::CJS_CONDITIONS);
        }

        if name.starts_with('.') || name.starts_with('/') || name.contains("://") {
            return Ok(None);
        }

        let Some((package_name, subpath)) = Self::split_package_name(name) else {
            return Ok(None);
        };
        let Some(base_dir) = Path::new(base).parent() else {
            return Ok(None);
        };

        let mut dir = base_dir.to_path_buf();
        loop {
            let package_path = dir.join("node_modules").join(package_name);
            if package_path.is_dir() {
                let pkg_path = package_path.join("package.json");
                if let Ok(pkg_content) = std::fs::read_to_string(&pkg_path) {
                    let package: PackageJson = serde_json::from_str(&pkg_content).map_err(|_| {
                        NodePackageResolveError::InvalidPackageConfig {
                            path: pkg_path.to_string_lossy().into_owned(),
                        }
                    })?;

                    if let Some(exports_field) = package.exports.as_ref() {
                        return Self::resolve_package_exports(
                            package_name,
                            &package_path,
                            exports_field,
                            subpath,
                            &Self::CJS_CONDITIONS,
                        )
                        .map(Some);
                    }

                    if subpath.is_empty()
                        && let Some(main) = package.main.as_ref()
                        && let Some(resolved) = Self::resolve_cjs_analysis_main(&package_path, main)
                    {
                        return Ok(Some(resolved));
                    }
                }

                if !subpath.is_empty()
                    && let Some(resolved) = Self::resolve_cjs_analysis_subpath(&package_path, subpath)
                {
                    return Ok(Some(resolved));
                }

                if subpath.is_empty()
                    && let Some(resolved) = Self::resolve_cjs_analysis_package_root(&package_path)
                {
                    return Ok(Some(resolved));
                }
            }

            if subpath.is_empty() {
                for candidate in [package_path.with_extension("js"), package_path.with_extension("json")] {
                    let normalized = CjsEvalResolver::normalize_path(&candidate);
                    if std::path::Path::new(&normalized).is_file() {
                        return Ok(Some(normalized));
                    }
                }
            }

            if !dir.pop() {
                break;
            }
        }

        Ok(None)
    }

    fn try_resolve_package_import(
        &self,
        base: &str,
        name: &str,
    ) -> Result<Option<String>, NodePackageResolveError> {
        self.try_resolve_package_import_with_conditions(base, name, &Self::ESM_CONDITIONS)
    }

    fn try_resolve_package_import_with_conditions(
        &self,
        base: &str,
        name: &str,
        conditions: &[&str],
    ) -> Result<Option<String>, NodePackageResolveError> {
        use std::path::Path;

        let Some(parent) = Path::new(base).parent() else {
            return Ok(None);
        };
        let mut dir = parent.to_path_buf();
        loop {
            if dir.file_name().is_some_and(|name| name == "node_modules") {
                return Err(NodePackageResolveError::PackageImportNotDefined {
                    specifier: name.to_string(),
                });
            }

            let pkg_path = dir.join("package.json");
            if let Ok(pkg_content) = std::fs::read_to_string(&pkg_path) {
                let package: PackageJson = serde_json::from_str(&pkg_content).map_err(|_| {
                    NodePackageResolveError::InvalidPackageConfig {
                        path: pkg_path.to_string_lossy().into_owned(),
                    }
                })?;
                let Some(imports) = package.imports.as_ref() else {
                    return Err(NodePackageResolveError::PackageImportNotDefined {
                        specifier: name.to_string(),
                    });
                };
                return Self::resolve_package_import(&dir, imports, name, conditions).map(Some);
            }

            if !dir.pop() {
                break;
            }
        }

        Err(NodePackageResolveError::PackageImportNotDefined {
            specifier: name.to_string(),
        })
    }

    fn split_package_name(name: &str) -> Option<(&str, &str)> {
        if name.starts_with('@') {
            let first = name.find('/')?;
            let rest = &name[first + 1..];
            if rest.is_empty() {
                return None;
            }
            if let Some(second_rel) = rest.find('/') {
                let second = first + 1 + second_rel;
                Some((&name[..second], &name[second + 1..]))
            } else {
                Some((name, ""))
            }
        } else if let Some(idx) = name.find('/') {
            Some((&name[..idx], &name[idx + 1..]))
        } else {
            Some((name, ""))
        }
    }

    fn resolve_package_target(package_dir: &std::path::Path, target: &str) -> Option<String> {
        let target_path = package_dir.join(target.strip_prefix("./").unwrap_or(target));
        let mut candidates = vec![target_path.clone()];
        if target_path.extension().is_none() {
            candidates.push(target_path.with_extension("mjs"));
            candidates.push(target_path.with_extension("js"));
            candidates.push(target_path.with_extension("cjs"));
            candidates.push(target_path.with_extension("json"));
        }
        candidates.push(target_path.join("index.mjs"));
        candidates.push(target_path.join("index.js"));
        candidates.push(target_path.join("index.cjs"));
        candidates.push(target_path.join("index.json"));

        for candidate in &candidates {
            if candidate.is_file() {
                return Some(candidate.to_string_lossy().into_owned());
            }
        }

        None
    }

    fn first_existing_normalized(candidates: Vec<std::path::PathBuf>) -> Option<String> {
        for candidate in candidates {
            let normalized = CjsEvalResolver::normalize_path(&candidate);
            if std::path::Path::new(&normalized).is_file() {
                return Some(normalized);
            }
        }

        None
    }

    fn resolve_cjs_analysis_main(package_dir: &std::path::Path, target: &str) -> Option<String> {
        let target_path = package_dir.join(target.strip_prefix("./").unwrap_or(target));
        Self::first_existing_normalized(vec![
            target_path.clone(),
            target_path.with_extension("js"),
            target_path.with_extension("json"),
            target_path.join("index.js"),
            target_path.join("index.json"),
        ])
    }

    fn resolve_cjs_analysis_subpath(package_dir: &std::path::Path, target: &str) -> Option<String> {
        let target_path = package_dir.join(target.strip_prefix("./").unwrap_or(target));
        Self::first_existing_normalized(vec![
            target_path.clone(),
            target_path.with_extension("js"),
            target_path.with_extension("mjs"),
            target_path.with_extension("json"),
            target_path.join("index.js"),
            target_path.join("index.json"),
        ])
    }

    fn resolve_cjs_analysis_package_root(package_dir: &std::path::Path) -> Option<String> {
        Self::first_existing_normalized(vec![package_dir.join("index.js"), package_dir.join("index.json")])
    }

    fn resolve_package_exports(
        package_name: &str,
        package_dir: &std::path::Path,
        exports: &PackageTarget,
        subpath: &str,
        conditions: &[&str],
    ) -> Result<String, NodePackageResolveError> {
        let key = if subpath.is_empty() {
            ".".to_string()
        } else {
            format!("./{}", subpath)
        };

        if matches!(exports, PackageTarget::String(_) | PackageTarget::Array(_))
            || Self::is_conditions_object(exports)
        {
            if key != "." {
                return Err(NodePackageResolveError::PackagePathNotExported {
                    package_name: package_name.to_string(),
                    subpath: subpath.to_string(),
                });
            }
            return Self::resolve_package_target_value(
                package_dir,
                exports,
                false,
                "exports",
                conditions,
                None,
            )
            .and_then(|resolution| {
                Self::target_resolution_to_export_result(resolution, package_name, subpath)
            });
        }

        if let PackageTarget::Object(map) = exports {
            if let Some(target) = map.get(&key) {
                return Self::resolve_package_target_value(
                    package_dir,
                    target,
                    false,
                    "exports",
                    conditions,
                    None,
                )
                .and_then(|resolution| {
                    Self::target_resolution_to_export_result(resolution, package_name, subpath)
                });
            }
            if let Some((pattern_key, pattern_substitution)) = Self::find_best_package_pattern(map, &key)
                && let Some(target) = map.get(pattern_key)
            {
                return Self::resolve_package_target_value(
                    package_dir,
                    target,
                    false,
                    "exports",
                    conditions,
                    Some(&pattern_substitution),
                )
                .and_then(|resolution| {
                    Self::target_resolution_to_export_result(resolution, package_name, subpath)
                });
            }
        }

        Err(NodePackageResolveError::PackagePathNotExported {
            package_name: package_name.to_string(),
            subpath: subpath.to_string(),
        })
    }

    fn resolve_package_import(
        package_dir: &std::path::Path,
        imports: &PackageTarget,
        specifier: &str,
        conditions: &[&str],
    ) -> Result<String, NodePackageResolveError> {
        if let PackageTarget::Object(map) = imports
        {
            let (target, pattern_substitution) = if let Some(target) = map.get(specifier) {
                (target, None)
            } else if let Some((pattern_key, pattern_substitution)) =
                Self::find_best_package_pattern(map, specifier)
            {
                let Some(target) = map.get(pattern_key) else {
                    return Err(NodePackageResolveError::PackageImportNotDefined {
                        specifier: specifier.to_string(),
                    });
                };
                (target, Some(pattern_substitution))
            } else {
                return Err(NodePackageResolveError::PackageImportNotDefined {
                    specifier: specifier.to_string(),
                });
            };
            return Self::resolve_package_target_value(
                package_dir,
                target,
                true,
                "imports",
                conditions,
                pattern_substitution.as_deref(),
            ).and_then(
                |resolution| Self::target_resolution_to_import_result(resolution, specifier),
            );
        }
        Err(NodePackageResolveError::PackageImportNotDefined {
            specifier: specifier.to_string(),
        })
    }

    fn is_conditions_object(value: &PackageTarget) -> bool {
        matches!(
            value,
            PackageTarget::Object(map) if !map.is_empty() && !map.iter().any(|(key, _)| key.starts_with('.'))
        )
    }

    fn resolve_package_target_value(
        package_dir: &std::path::Path,
        target: &PackageTarget,
        allow_bare_target: bool,
        kind: &'static str,
        conditions: &[&str],
        pattern_substitution: Option<&str>,
    ) -> Result<PackageTargetResolution, NodePackageResolveError> {
        match target {
            PackageTarget::Null | PackageTarget::Bool(false) => {
                return Ok(PackageTargetResolution::Blocked);
            }
            PackageTarget::Bool(true) => {
                return Err(NodePackageResolveError::InvalidPackageTarget {
                    kind,
                    target: "true".to_string(),
                });
            }
            PackageTarget::Invalid(value) => {
                return Err(NodePackageResolveError::InvalidPackageTarget {
                    kind,
                    target: value.to_string(),
                });
            }
            PackageTarget::String(target_str) => {
            let target_str = if let Some(pattern_substitution) = pattern_substitution {
                target_str.replace('*', pattern_substitution)
            } else {
                target_str.clone()
            };
            if allow_bare_target && Self::is_bare_package_specifier(&target_str) {
                let base = package_dir.join("package.json");
                let base_str = base.to_string_lossy();
                let resolver = NodeModulesResolver;
                if let Some(resolved) = resolver.try_resolve(&base_str, &target_str)? {
                    return Ok(PackageTargetResolution::Resolved(resolved));
                }
                return Err(NodePackageResolveError::ModuleNotFound {
                    request: target_str,
                });
            }
            if allow_bare_target && target_str.starts_with("node:") {
                return Ok(PackageTargetResolution::Resolved(target_str));
            }
            if !target_str.starts_with("./") {
                return Err(NodePackageResolveError::InvalidPackageTarget {
                    kind,
                    target: target_str,
                });
            }
            let Some(candidate) = Self::resolve_valid_package_target_path(package_dir, &target_str) else {
                return Err(NodePackageResolveError::InvalidPackageTarget {
                    kind,
                    target: target_str,
                });
            };
            if candidate.is_file() {
                return Ok(PackageTargetResolution::Resolved(
                    candidate.to_string_lossy().into_owned(),
                ));
            }
            return Err(NodePackageResolveError::ModuleNotFound {
                request: candidate.to_string_lossy().into_owned(),
            });
            }
            PackageTarget::Array(array) => {
            for item in array {
                match Self::resolve_package_target_value(package_dir, item, allow_bare_target, kind, conditions, pattern_substitution) {
                    Ok(PackageTargetResolution::Resolved(path)) => {
                        return Ok(PackageTargetResolution::Resolved(path));
                    }
                    Ok(PackageTargetResolution::Blocked) => {
                        return Ok(PackageTargetResolution::Blocked);
                    }
                    Ok(PackageTargetResolution::NoMatch) => continue,
                    Err(NodePackageResolveError::InvalidPackageTarget { .. })
                    | Err(NodePackageResolveError::ModuleNotFound { .. }) => continue,
                    Err(err) => return Err(err),
                }
            }
                return Ok(PackageTargetResolution::NoMatch);
            }
            PackageTarget::Object(map) => {
            for (condition, value) in map {
                if conditions.contains(&condition.as_str()) {
                    match Self::resolve_package_target_value(
                        package_dir,
                        value,
                        allow_bare_target,
                        kind,
                        conditions,
                        pattern_substitution,
                    )? {
                        PackageTargetResolution::NoMatch => continue,
                        resolution => return Ok(resolution),
                    }
                }
            }
                Ok(PackageTargetResolution::NoMatch)
            }
        }
    }

    fn package_pattern_key_match(pattern_key: &str, key: &str) -> Option<String> {
        let star = pattern_key.find('*')?;
        let prefix = &pattern_key[..star];
        let suffix = &pattern_key[star + 1..];
        if !key.starts_with(prefix) || !key.ends_with(suffix) {
            return None;
        }
        if key.len() < prefix.len() + suffix.len() {
            return None;
        }
        Some(key[prefix.len()..key.len() - suffix.len()].to_string())
    }

    fn find_best_package_pattern<'a>(
        map: &'a IndexMap<String, PackageTarget>,
        key: &str,
    ) -> Option<(&'a str, String)> {
        let mut best: Option<(&str, String)> = None;
        for pattern_key in map.keys() {
            if !pattern_key.contains('*') {
                continue;
            }
            let Some(substitution) = Self::package_pattern_key_match(pattern_key, key) else {
                continue;
            };
            if best
                .as_ref()
                .is_none_or(|(best_key, _)| Self::package_pattern_compare(pattern_key, best_key).is_lt())
            {
                best = Some((pattern_key.as_str(), substitution));
            }
        }
        best
    }

    fn package_pattern_compare(a: &str, b: &str) -> std::cmp::Ordering {
        let a_star = a.find('*').unwrap_or(a.len());
        let b_star = b.find('*').unwrap_or(b.len());
        match b_star.cmp(&a_star) {
            std::cmp::Ordering::Equal => {}
            ordering => return ordering,
        }
        let a_trailer = a.len().saturating_sub(a_star + 1);
        let b_trailer = b.len().saturating_sub(b_star + 1);
        match b_trailer.cmp(&a_trailer) {
            std::cmp::Ordering::Equal => {}
            ordering => return ordering,
        }
        match b.len().cmp(&a.len()) {
            std::cmp::Ordering::Equal => a.cmp(b),
            ordering => ordering,
        }
    }

    fn target_resolution_to_export_result(
        resolution: PackageTargetResolution,
        package_name: &str,
        subpath: &str,
    ) -> Result<String, NodePackageResolveError> {
        match resolution {
            PackageTargetResolution::Resolved(path) => Ok(path),
            PackageTargetResolution::NoMatch | PackageTargetResolution::Blocked => {
                Err(NodePackageResolveError::PackagePathNotExported {
                    package_name: package_name.to_string(),
                    subpath: subpath.to_string(),
                })
            }
        }
    }

    fn target_resolution_to_import_result(
        resolution: PackageTargetResolution,
        specifier: &str,
    ) -> Result<String, NodePackageResolveError> {
        match resolution {
            PackageTargetResolution::Resolved(path) => Ok(path),
            PackageTargetResolution::NoMatch | PackageTargetResolution::Blocked => {
                Err(NodePackageResolveError::PackageImportNotDefined {
                    specifier: specifier.to_string(),
                })
            }
        }
    }

    fn is_bare_package_specifier(target: &str) -> bool {
        !target.is_empty()
            && !target.starts_with('.')
            && !target.starts_with('/')
            && !target.starts_with('#')
            && !target.contains(':')
    }

    fn resolve_valid_package_target_path(
        package_dir: &std::path::Path,
        target: &str,
    ) -> Option<std::path::PathBuf> {
        let mut relative_parts = Vec::<&str>::new();
        for part in target.strip_prefix("./")?.split('/') {
            match part {
                "" => {}
                part if Self::is_invalid_package_target_segment(part) => return None,
                part => relative_parts.push(part),
            }
        }
        if relative_parts.is_empty() {
            return None;
        }
        let mut candidate = package_dir.to_path_buf();
        for part in relative_parts {
            candidate.push(part);
        }
        Some(candidate)
    }

    fn is_invalid_package_target_segment(segment: &str) -> bool {
        if matches!(segment, "." | ".." | "node_modules") {
            return true;
        }
        let decoded = percent_decode(segment).unwrap_or_else(|| segment.to_string());
        matches!(decoded.to_ascii_lowercase().as_str(), "." | ".." | "node_modules")
    }
}

fn percent_decode(input: &str) -> Option<String> {
    let bytes = input.as_bytes();
    let mut decoded = Vec::with_capacity(bytes.len());
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'%'
            && i + 2 < bytes.len()
            && let (Some(hi), Some(lo)) = (
                FileUrlResolver::hex_val(bytes[i + 1]),
                FileUrlResolver::hex_val(bytes[i + 2]),
            )
        {
            decoded.push(hi << 4 | lo);
            i += 3;
            continue;
        }
        decoded.push(bytes[i]);
        i += 1;
    }
    String::from_utf8(decoded).ok()
}

fn throw_node_package_resolve_error<'js>(
    ctx: &Ctx<'js>,
    err: NodePackageResolveError,
) -> rquickjs::Result<String> {
    let (code, message) = match err {
        NodePackageResolveError::PackagePathNotExported {
            package_name,
            subpath,
        } => {
            let subpath = if subpath.is_empty() {
                ".".to_string()
            } else {
                format!("./{}", subpath)
            };
            (
                "ERR_PACKAGE_PATH_NOT_EXPORTED",
                format!("Package subpath '{}' is not defined by \"exports\" in package {}", subpath, package_name),
            )
        }
        NodePackageResolveError::PackageImportNotDefined { specifier } => (
            "ERR_PACKAGE_IMPORT_NOT_DEFINED",
            format!("Package import specifier '{}' is not defined", specifier),
        ),
        NodePackageResolveError::InvalidPackageTarget { kind, target } => (
            "ERR_INVALID_PACKAGE_TARGET",
            format!("Invalid \"{}\" target '{}'", kind, target),
        ),
        NodePackageResolveError::InvalidPackageConfig { path } => (
            "ERR_INVALID_PACKAGE_CONFIG",
            format!("Invalid package config {}", path),
        ),
        NodePackageResolveError::ModuleNotFound { request } => (
            "ERR_MODULE_NOT_FOUND",
            format!("Cannot find module '{}'", request),
        ),
    };

    let globals = ctx.globals();
    let error_ctor: Function = globals.get("Error")?;
    let error_obj: Object = error_ctor.call((message,))?;
    error_obj.set("code", code)?;
    Err(ctx.throw(error_obj.into_value()))
}

impl Resolver for NodeModulesResolver {
    fn resolve<'js>(
        &mut self,
        ctx: &Ctx<'js>,
        base: &str,
        name: &str,
    ) -> rquickjs::Result<String> {
        match self.try_resolve(base, name) {
            Ok(Some(resolved)) => Ok(resolved),
            Ok(None) => Err(Error::new_resolving(base, name)),
            Err(err) => throw_node_package_resolve_error(ctx, err),
        }
    }
}

/// Loader that wraps CJS `.js` and `.cjs` files in ESM-compatible wrappers when loaded via `import()`.
/// This enables ESM modules to import CJS packages from `node_modules`.
struct CjsCompatLoader;

#[derive(Default)]
struct CjsExportAnalysis {
    exports: Vec<String>,
    reexports: Vec<String>,
    is_cjs: bool,
}

fn add_unique(items: &mut Vec<String>, item: String) {
    if !items.iter().any(|existing| existing == &item) {
        items.push(item);
    }
}

fn is_ident_start(byte: u8) -> bool {
    byte == b'_' || byte == b'$' || byte.is_ascii_alphabetic() || byte >= 0x80
}

fn is_ident_continue(byte: u8) -> bool {
    is_ident_start(byte) || byte.is_ascii_digit()
}

fn is_ident_boundary(source: &[u8], pos: usize) -> bool {
    pos >= source.len() || !is_ident_continue(source[pos])
}

fn is_ident_start_boundary(source: &[u8], pos: usize) -> bool {
    pos == 0 || !is_ident_continue(source[pos - 1])
}

fn is_free_ident_start(source: &[u8], pos: usize) -> bool {
    is_ident_start_boundary(source, pos) && (pos == 0 || source[pos - 1] != b'.')
}

fn skip_ws_comments(source: &str, mut pos: usize) -> usize {
    let bytes = source.as_bytes();
    loop {
        while pos < bytes.len() && bytes[pos].is_ascii_whitespace() {
            pos += 1;
        }
        if pos + 1 < bytes.len() && bytes[pos] == b'/' && bytes[pos + 1] == b'/' {
            pos += 2;
            while pos < bytes.len() && !matches!(bytes[pos], b'\n' | b'\r') {
                pos += 1;
            }
            continue;
        }
        if pos + 1 < bytes.len() && bytes[pos] == b'/' && bytes[pos + 1] == b'*' {
            pos += 2;
            while pos + 1 < bytes.len() && !(bytes[pos] == b'*' && bytes[pos + 1] == b'/') {
                pos += 1;
            }
            pos = (pos + 2).min(bytes.len());
            continue;
        }
        return pos;
    }
}

fn read_ident(source: &str, mut pos: usize) -> Option<(String, usize)> {
    let bytes = source.as_bytes();
    if pos >= bytes.len() || !is_ident_start(bytes[pos]) {
        return None;
    }
    let start = pos;
    pos += 1;
    while pos < bytes.len() && is_ident_continue(bytes[pos]) {
        pos += 1;
    }
    Some((source[start..pos].to_string(), pos))
}

fn read_js_string(source: &str, pos: usize) -> Option<(String, usize)> {
    let bytes = source.as_bytes();
    if pos >= bytes.len() || !matches!(bytes[pos], b'\'' | b'"') {
        return None;
    }
    let quote = bytes[pos];
    let mut units = Vec::<u16>::new();
    let mut i = pos + 1;
    while i < bytes.len() {
        let byte = bytes[i];
        if byte == quote {
            return String::from_utf16(&units).ok().map(|s| (s, i + 1));
        }
        if byte == b'\\' {
            i += 1;
            if i >= bytes.len() {
                return None;
            }
            match bytes[i] {
                b'n' => units.push(b'\n' as u16),
                b'r' => units.push(b'\r' as u16),
                b't' => units.push(b'\t' as u16),
                b'b' => units.push(8),
                b'f' => units.push(12),
                b'v' => units.push(11),
                b'x' if i + 2 < bytes.len()
                    && bytes[i + 1].is_ascii_hexdigit()
                    && bytes[i + 2].is_ascii_hexdigit() =>
                {
                    let value = hex_byte(bytes[i + 1])? * 16 + hex_byte(bytes[i + 2])?;
                    units.push(value as u16);
                    i += 2;
                }
                b'x' => return None,
                b'u' if i + 1 < bytes.len() && bytes[i + 1] == b'{' => {
                    let start = i + 2;
                    let end = source[start..].find('}')? + start;
                    let code = u32::from_str_radix(&source[start..end], 16).ok()?;
                    if code <= 0xFFFF {
                        units.push(code as u16);
                    } else {
                        let code = code - 0x1_0000;
                        units.push(0xD800 | ((code >> 10) as u16));
                        units.push(0xDC00 | ((code & 0x3FF) as u16));
                    }
                    i = end;
                }
                b'u' if i + 4 < bytes.len()
                    && bytes[i + 1].is_ascii_hexdigit()
                    && bytes[i + 2].is_ascii_hexdigit()
                    && bytes[i + 3].is_ascii_hexdigit()
                    && bytes[i + 4].is_ascii_hexdigit() =>
                {
                    let value = u16::from(hex_byte(bytes[i + 1])?) << 12
                        | u16::from(hex_byte(bytes[i + 2])?) << 8
                        | u16::from(hex_byte(bytes[i + 3])?) << 4
                        | u16::from(hex_byte(bytes[i + 4])?);
                    units.push(value);
                    i += 4;
                }
                b'u' => return None,
                other => units.push(other as u16),
            }
            i += 1;
            continue;
        }
        if byte == b'\n' || byte == b'\r' {
            return None;
        }
        let ch = source[i..].chars().next()?;
        let mut buf = [0u16; 2];
        units.extend_from_slice(ch.encode_utf16(&mut buf));
        i += ch.len_utf8();
    }
    None
}

fn hex_byte(byte: u8) -> Option<u8> {
    match byte {
        b'0'..=b'9' => Some(byte - b'0'),
        b'a'..=b'f' => Some(byte - b'a' + 10),
        b'A'..=b'F' => Some(byte - b'A' + 10),
        _ => None,
    }
}

fn skip_string_or_template(source: &str, pos: usize) -> usize {
    let bytes = source.as_bytes();
    if pos >= bytes.len() {
        return pos;
    }
    let quote = bytes[pos];
    let mut i = pos + 1;
    while i < bytes.len() {
        if bytes[i] == b'\\' {
            i += 2;
        } else if bytes[i] == quote {
            return i + 1;
        } else {
            i += 1;
        }
    }
    i
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
enum CjsExportTarget {
    Exports,
    ModuleExports,
}

fn parse_exports_target(source: &str, pos: usize) -> Option<(CjsExportTarget, usize)> {
    let bytes = source.as_bytes();
    if is_free_ident_start(bytes, pos)
        && source[pos..].starts_with("exports")
        && is_ident_boundary(bytes, pos + 7)
    {
        return Some((CjsExportTarget::Exports, pos + 7));
    }
    if is_free_ident_start(bytes, pos)
        && source[pos..].starts_with("module")
        && is_ident_boundary(bytes, pos + 6)
    {
        let mut i = skip_ws_comments(source, pos + 6);
        if i < bytes.len() && bytes[i] == b'.' {
            i = skip_ws_comments(source, i + 1);
            if source[i..].starts_with("exports") && is_ident_boundary(bytes, i + 7) {
                return Some((CjsExportTarget::ModuleExports, i + 7));
            }
        }
    }
    None
}

fn parse_export_member(source: &str, pos: usize) -> Option<(String, usize)> {
    let bytes = source.as_bytes();
    let (_, mut i) = parse_exports_target(source, pos)?;
    i = skip_ws_comments(source, i);
    let name;
    if i < bytes.len() && bytes[i] == b'.' {
        i = skip_ws_comments(source, i + 1);
        let (ident, next) = read_ident(source, i)?;
        name = ident;
        i = next;
    } else if i < bytes.len() && bytes[i] == b'[' {
        i = skip_ws_comments(source, i + 1);
        let (string_name, next) = read_js_string(source, i)?;
        i = skip_ws_comments(source, next);
        if i >= bytes.len() || bytes[i] != b']' {
            return None;
        }
        name = string_name;
        i += 1;
    } else {
        return None;
    }
    i = skip_ws_comments(source, i);
    if i < bytes.len()
        && bytes[i] == b'='
        && (i + 1 >= bytes.len() || !matches!(bytes[i + 1], b'=' | b'>'))
    {
        Some((name, i + 1))
    } else {
        None
    }
}

fn parse_require_string(source: &str, pos: usize) -> Option<(String, usize)> {
    let bytes = source.as_bytes();
    if !is_free_ident_start(bytes, pos)
        || !source[pos..].starts_with("require")
        || !is_ident_boundary(bytes, pos + 7)
    {
        return None;
    }
    let mut i = skip_ws_comments(source, pos + 7);
    if i >= bytes.len() || bytes[i] != b'(' {
        return None;
    }
    i = skip_ws_comments(source, i + 1);
    let (specifier, next) = read_js_string(source, i)?;
    i = skip_ws_comments(source, next);
    if i < bytes.len() && bytes[i] == b')' {
        Some((specifier, i + 1))
    } else {
        None
    }
}

fn parse_require_string_loose(source: &str, pos: usize) -> Option<(String, usize)> {
    let bytes = source.as_bytes();
    if !source[pos..].starts_with("require") || !is_ident_boundary(bytes, pos + 7) {
        return None;
    }
    let mut i = skip_ws_comments(source, pos + 7);
    if i >= bytes.len() || bytes[i] != b'(' {
        return None;
    }
    i = skip_ws_comments(source, i + 1);
    let (specifier, next) = read_js_string(source, i)?;
    i = skip_ws_comments(source, next);
    if i < bytes.len() && bytes[i] == b')' {
        Some((specifier, i + 1))
    } else {
        None
    }
}

fn parse_define_property_export(source: &str, pos: usize) -> Option<(String, usize)> {
    let bytes = source.as_bytes();
    if !is_free_ident_start(bytes, pos)
        || !source[pos..].starts_with("Object")
        || !is_ident_boundary(bytes, pos + 6)
    {
        return None;
    }
    let mut i = skip_ws_comments(source, pos + 6);
    if i >= bytes.len() || bytes[i] != b'.' {
        return None;
    }
    i = skip_ws_comments(source, i + 1);
    if !source[i..].starts_with("defineProperty") || !is_ident_boundary(bytes, i + 14) {
        return None;
    }
    i = skip_ws_comments(source, i + 14);
    if i >= bytes.len() || bytes[i] != b'(' {
        return None;
    }
    i = skip_ws_comments(source, i + 1);
    let (_, next) = parse_exports_target(source, i)?;
    i = next;
    i = skip_ws_comments(source, i);
    if i >= bytes.len() || bytes[i] != b',' {
        return None;
    }
    i = skip_ws_comments(source, i + 1);
    let (name, next) = read_js_string(source, i)?;
    i = skip_ws_comments(source, next);
    if i >= bytes.len() || bytes[i] != b',' {
        return None;
    }
    let descriptor_start = i + 1;
    let end = find_matching_paren(source, pos)?;
    let descriptor = &source[descriptor_start..end];
    if descriptor_has_value_property(descriptor) || is_safe_getter_descriptor(descriptor) {
        Some((name, end + 1))
    } else {
        None
    }
}

fn descriptor_has_value_property(descriptor: &str) -> bool {
    let bytes = descriptor.as_bytes();
    let mut i = 0usize;
    let mut depth = 0usize;
    while i < bytes.len() {
        match bytes[i] {
            b'\'' | b'"' | b'`' => {
                i = skip_string_or_template(descriptor, i);
                continue;
            }
            b'/' if i + 1 < bytes.len() && bytes[i + 1] == b'/' => {
                i += 2;
                while i < bytes.len() && !matches!(bytes[i], b'\n' | b'\r') {
                    i += 1;
                }
                continue;
            }
            b'/' if i + 1 < bytes.len() && bytes[i + 1] == b'*' => {
                i += 2;
                while i + 1 < bytes.len() && !(bytes[i] == b'*' && bytes[i + 1] == b'/') {
                    i += 1;
                }
                i = (i + 2).min(bytes.len());
                continue;
            }
            b'/' if is_regex_literal_start(descriptor, i) => {
                i = skip_regex_literal(descriptor, i);
                continue;
            }
            b'{' => {
                depth += 1;
                i += 1;
            }
            b'}' => {
                depth = depth.saturating_sub(1);
                i += 1;
            }
            b'v' if depth == 1
                && is_free_ident_start(bytes, i)
                && descriptor[i..].starts_with("value")
                && is_ident_boundary(bytes, i + 5) =>
            {
                let next = skip_ws_comments(descriptor, i + 5);
                return next < bytes.len() && bytes[next] == b':';
            }
            _ => i += 1,
        }
    }
    false
}

fn find_matching_paren(source: &str, start: usize) -> Option<usize> {
    let bytes = source.as_bytes();
    let mut i = source[start..].find('(')? + start;
    let mut depth = 0usize;
    while i < bytes.len() {
        match bytes[i] {
            b'\'' | b'"' | b'`' => i = skip_string_or_template(source, i),
            b'/' if i + 1 < bytes.len() && bytes[i + 1] == b'/' => {
                i += 2;
                while i < bytes.len() && !matches!(bytes[i], b'\n' | b'\r') {
                    i += 1;
                }
            }
            b'/' if i + 1 < bytes.len() && bytes[i + 1] == b'*' => {
                i += 2;
                while i + 1 < bytes.len() && !(bytes[i] == b'*' && bytes[i + 1] == b'/') {
                    i += 1;
                }
                i = (i + 2).min(bytes.len());
            }
            b'/' if is_regex_literal_start(source, i) => {
                i = skip_regex_literal(source, i);
            }
            b'(' => {
                depth += 1;
                i += 1;
            }
            b')' => {
                depth = depth.saturating_sub(1);
                if depth == 0 {
                    return Some(i);
                }
                i += 1;
            }
            _ => i += 1,
        }
    }
    None
}

fn find_matching_brace(source: &str, start: usize) -> Option<usize> {
    let bytes = source.as_bytes();
    let mut i = start;
    let mut depth = 0usize;
    while i < bytes.len() {
        match bytes[i] {
            b'\'' | b'"' | b'`' => i = skip_string_or_template(source, i),
            b'/' if i + 1 < bytes.len() && bytes[i + 1] == b'/' => {
                i += 2;
                while i < bytes.len() && !matches!(bytes[i], b'\n' | b'\r') {
                    i += 1;
                }
            }
            b'/' if i + 1 < bytes.len() && bytes[i + 1] == b'*' => {
                i += 2;
                while i + 1 < bytes.len() && !(bytes[i] == b'*' && bytes[i + 1] == b'/') {
                    i += 1;
                }
                i = (i + 2).min(bytes.len());
            }
            b'/' if is_regex_literal_start(source, i) => {
                i = skip_regex_literal(source, i);
            }
            b'{' => {
                depth += 1;
                i += 1;
            }
            b'}' => {
                depth = depth.saturating_sub(1);
                if depth == 0 {
                    return Some(i);
                }
                i += 1;
            }
            _ => i += 1,
        }
    }
    None
}


fn is_safe_getter_descriptor(descriptor: &str) -> bool {
    let Some((body_start, body_end)) = find_getter_body(descriptor) else {
        return false;
    };
    is_simple_getter_body(&descriptor[body_start..body_end])
}

fn find_getter_body(source: &str) -> Option<(usize, usize)> {
    let bytes = source.as_bytes();
    let mut i = 0usize;
    let mut depth = 0usize;
    while i < bytes.len() {
        match bytes[i] {
            b'\'' | b'"' | b'`' => {
                i = skip_string_or_template(source, i);
                continue;
            }
            b'/' if i + 1 < bytes.len() && bytes[i + 1] == b'/' => {
                i += 2;
                while i < bytes.len() && !matches!(bytes[i], b'\n' | b'\r') {
                    i += 1;
                }
                continue;
            }
            b'/' if i + 1 < bytes.len() && bytes[i + 1] == b'*' => {
                i += 2;
                while i + 1 < bytes.len() && !(bytes[i] == b'*' && bytes[i + 1] == b'/') {
                    i += 1;
                }
                i = (i + 2).min(bytes.len());
                continue;
            }
            b'/' if is_regex_literal_start(source, i) => {
                i = skip_regex_literal(source, i);
                continue;
            }
            b'{' => {
                depth += 1;
                i += 1;
                continue;
            }
            b'}' => {
                depth = depth.saturating_sub(1);
                i += 1;
                continue;
            }
            b'g' if depth == 1
                && is_free_ident_start(bytes, i)
                && source[i..].starts_with("get")
                && is_ident_boundary(bytes, i + 3) =>
            {
                let mut j = skip_ws_comments(source, i + 3);
                if j < bytes.len() && bytes[j] == b'(' {
                    let params_end = find_matching_paren(source, j)?;
                    j = skip_ws_comments(source, params_end + 1);
                    if j < bytes.len() && bytes[j] == b'{' {
                        let body_end = find_matching_brace(source, j)?;
                        return Some((j + 1, body_end));
                    }
                } else if j < bytes.len() && bytes[j] == b':' {
                    j = skip_ws_comments(source, j + 1);
                    if !source[j..].starts_with("function") || !is_ident_boundary(bytes, j + 8) {
                        i += 1;
                        continue;
                    }
                    j = skip_ws_comments(source, j + 8);
                    if let Some((_, next)) = read_ident(source, j) {
                        j = skip_ws_comments(source, next);
                    }
                    if j >= bytes.len() || bytes[j] != b'(' {
                        i += 1;
                        continue;
                    }
                    let params_end = find_matching_paren(source, j)?;
                    j = skip_ws_comments(source, params_end + 1);
                    if j < bytes.len() && bytes[j] == b'{' {
                        let body_end = find_matching_brace(source, j)?;
                        return Some((j + 1, body_end));
                    }
                }
            }
            _ => {}
        }
        i += 1;
    }
    None
}

fn is_simple_getter_body(body: &str) -> bool {
    let return_pos = skip_ws_comments(body, 0);
    if !body[return_pos..].starts_with("return")
        || !is_free_ident_start(body.as_bytes(), return_pos)
        || !is_ident_boundary(body.as_bytes(), return_pos + 6)
    {
        return false;
    }
    let mut i = skip_ws_comments(body, return_pos + 6);
    let Some((_, next)) = read_ident(body, i) else {
        return false;
    };
    i = skip_ws_comments(body, next);
    if i < body.len() && body.as_bytes()[i] == b'.' {
        i = skip_ws_comments(body, i + 1);
        let Some((_, next)) = read_ident(body, i) else {
            return false;
        };
        i = next;
    } else if i < body.len() && body.as_bytes()[i] == b'[' {
        i = skip_ws_comments(body, i + 1);
        let Some((_, next)) = read_js_string(body, i) else {
            return false;
        };
        i = skip_ws_comments(body, next);
        if i >= body.len() || body.as_bytes()[i] != b']' {
            return false;
        }
        i += 1;
    }
    i = skip_ws_comments(body, i);
    if i < body.len() && body.as_bytes()[i] == b';' {
        i = skip_ws_comments(body, i + 1);
    }
    i >= body.len()
}


fn parse_exports_assign_require_value(source: &str, pos: usize) -> Option<(String, usize)> {
    let bytes = source.as_bytes();
    if let Some((specifier, next)) = parse_require_string(source, pos) {
        return Some((specifier, next));
    }

    if !is_free_ident_start(bytes, pos)
        || !source[pos..].starts_with("_interopRequireWildcard")
        || !is_ident_boundary(bytes, pos + 23)
    {
        return None;
    }

    let mut i = skip_ws_comments(source, pos + 23);
    if i >= bytes.len() || bytes[i] != b'(' {
        return None;
    }
    i = skip_ws_comments(source, i + 1);
    let (specifier, next) = parse_require_string(source, i)?;
    i = skip_ws_comments(source, next);
    if i >= bytes.len() || bytes[i] != b')' {
        return None;
    }

    Some((specifier, i + 1))
}

fn parse_require_binding(source: &str, pos: usize) -> Option<(String, String, usize)> {
    for keyword in ["var", "let", "const"] {
        if is_free_ident_start(source.as_bytes(), pos)
            && source[pos..].starts_with(keyword)
            && is_ident_boundary(source.as_bytes(), pos + keyword.len())
        {
            let mut i = skip_ws_comments(source, pos + keyword.len());
            let (name, next) = read_ident(source, i)?;
            i = skip_ws_comments(source, next);
            if i >= source.len() || source.as_bytes()[i] != b'=' {
                return None;
            }
            i = skip_ws_comments(source, i + 1);
            let (specifier, next) = parse_exports_assign_require_value(source, i)?;
            let after_require = skip_ws_comments(source, next);
            if !is_statement_boundary(source, after_require) {
                return None;
            }
            return Some((name, specifier, next));
        }
    }
    None
}

fn is_statement_boundary(source: &str, pos: usize) -> bool {
    pos >= source.len() || matches!(source.as_bytes()[pos], b';' | b'}')
}

fn parse_module_exports_reexport(source: &str, pos: usize) -> Option<(String, usize)> {
    let (target, mut i) = parse_exports_target(source, pos)?;
    if target != CjsExportTarget::ModuleExports {
        return None;
    }
    i = skip_ws_comments(source, i);
    if i >= source.len() || source.as_bytes()[i] != b'=' {
        return None;
    }
    let (specifier, next) = parse_require_string(source, skip_ws_comments(source, i + 1))?;
    let after_require = skip_ws_comments(source, next);
    if is_statement_boundary(source, after_require) {
        Some((specifier, after_require.min(source.len())))
    } else {
        None
    }
}

fn parse_export_star_reexport(source: &str, pos: usize) -> Option<(String, usize)> {
    fn parse_export_star_callee(source: &str, pos: usize) -> Option<usize> {
        let bytes = source.as_bytes();
        let member_access = previous_significant_byte(source, pos) == Some(b'.');
        if is_free_ident_start(bytes, pos)
            && !member_access
            && source[pos..].starts_with("__exportStar")
            && is_ident_boundary(bytes, pos + 12)
        {
            return Some(pos + 12);
        }
        if is_free_ident_start(bytes, pos)
            && !member_access
            && source[pos..].starts_with("__export")
            && is_ident_boundary(bytes, pos + 8)
        {
            return Some(pos + 8);
        }
        if is_free_ident_start(bytes, pos)
            && source[pos..].starts_with("tslib")
            && is_ident_boundary(bytes, pos + 5)
        {
            let mut i = skip_ws_comments(source, pos + 5);
            if i >= bytes.len() || bytes[i] != b'.' {
                return None;
            }
            i = skip_ws_comments(source, i + 1);
            if source[i..].starts_with("__exportStar") && is_ident_boundary(bytes, i + 12) {
                return Some(i + 12);
            }
            if source[i..].starts_with("__export") && is_ident_boundary(bytes, i + 8) {
                return Some(i + 8);
            }
        }
        None
    }

    let bytes = source.as_bytes();
    let mut i = parse_export_star_callee(source, pos)?;
    i = skip_ws_comments(source, i);
    if i >= bytes.len() || bytes[i] != b'(' {
        return None;
    }

    i = skip_ws_comments(source, i + 1);
    let (specifier, next) = parse_require_string(source, i)?;
    i = skip_ws_comments(source, next);

    if i < bytes.len() && bytes[i] == b',' {
        i = skip_ws_comments(source, i + 1);
        let (_, next_target) = parse_exports_target(source, i)?;
        i = skip_ws_comments(source, next_target);
    }

    if i >= bytes.len() || bytes[i] != b')' {
        return None;
    }

    let after_call = skip_ws_comments(source, i + 1);
    if is_statement_boundary(source, after_call) {
        Some((specifier, after_call.min(source.len())))
    } else {
        None
    }
}

fn parse_module_exports_assignment(source: &str, pos: usize) -> Option<usize> {
    let bytes = source.as_bytes();
    let (target, mut i) = parse_exports_target(source, pos)?;
    if target != CjsExportTarget::ModuleExports {
        return None;
    }
    i = skip_ws_comments(source, i);
    if i < bytes.len()
        && bytes[i] == b'='
        && (i + 1 >= bytes.len() || !matches!(bytes[i + 1], b'=' | b'>'))
    {
        Some(i + 1)
    } else {
        None
    }
}

fn parse_exports_literal_key(source: &str, pos: usize) -> Option<(String, bool, usize)> {
    if let Some((ident, next)) = read_ident(source, pos) {
        return Some((ident, true, next));
    }
    let (name, next) = read_js_string(source, pos)?;
    Some((name, false, next))
}

fn skip_object_literal_value(source: &str, pos: usize, object_end: usize) -> usize {
    let bytes = source.as_bytes();
    let mut i = pos;
    let mut brace_depth = 0usize;
    let mut paren_depth = 0usize;
    let mut bracket_depth = 0usize;
    while i < object_end {
        match bytes[i] {
            b'\'' | b'"' | b'`' => {
                i = skip_string_or_template(source, i);
                continue;
            }
            b'/' if i + 1 < object_end && bytes[i + 1] == b'/' => {
                i += 2;
                while i < object_end && !matches!(bytes[i], b'\n' | b'\r') {
                    i += 1;
                }
                continue;
            }
            b'/' if i + 1 < object_end && bytes[i + 1] == b'*' => {
                i += 2;
                while i + 1 < object_end && !(bytes[i] == b'*' && bytes[i + 1] == b'/') {
                    i += 1;
                }
                i = (i + 2).min(object_end);
                continue;
            }
            b'/' if is_regex_literal_start(source, i) => {
                i = skip_regex_literal(source, i).min(object_end);
                continue;
            }
            b'{' => brace_depth += 1,
            b'}' => brace_depth = brace_depth.saturating_sub(1),
            b'(' => paren_depth += 1,
            b')' => paren_depth = paren_depth.saturating_sub(1),
            b'[' => bracket_depth += 1,
            b']' => bracket_depth = bracket_depth.saturating_sub(1),
            b',' if brace_depth == 0 && paren_depth == 0 && bracket_depth == 0 => return i,
            _ => {}
        }
        i = next_char_boundary(source, i);
    }
    object_end
}

fn parse_module_exports_object_literal(source: &str, pos: usize) -> Option<(Vec<String>, Vec<String>, usize)> {
    let bytes = source.as_bytes();
    let (target, mut i) = parse_exports_target(source, pos)?;
    if target != CjsExportTarget::ModuleExports {
        return None;
    }

    i = skip_ws_comments(source, i);
    if i >= bytes.len() || bytes[i] != b'=' || (i + 1 < bytes.len() && matches!(bytes[i + 1], b'=' | b'>')) {
        return None;
    }

    i = skip_ws_comments(source, i + 1);
    if i >= bytes.len() || bytes[i] != b'{' {
        return None;
    }
    let object_end = find_matching_brace(source, i)?;

    let mut exports = Vec::new();
    let mut reexports = Vec::new();
    let mut cursor = skip_ws_comments(source, i + 1);

    while cursor < object_end {
        if bytes[cursor] == b',' {
            cursor = skip_ws_comments(source, cursor + 1);
            continue;
        }

        if source[cursor..].starts_with("...") {
            let (specifier, next) = parse_require_string_loose(source, skip_ws_comments(source, cursor + 3))?;
            add_unique(&mut reexports, specifier);
            cursor = skip_ws_comments(source, next);
            if cursor < object_end {
                if bytes[cursor] != b',' {
                    return None;
                }
                cursor = skip_ws_comments(source, cursor + 1);
            }
            continue;
        }

        let Some((name, key_is_ident, key_end)) = parse_exports_literal_key(source, cursor) else {
            break;
        };
        let mut next = skip_ws_comments(source, key_end);
        if next < object_end && bytes[next] == b':' {
            next = skip_ws_comments(source, next + 1);
            add_unique(&mut exports, name);
            if let Some((specifier, _)) = parse_require_string_loose(source, next) {
                add_unique(&mut reexports, specifier);
                break;
            }
            cursor = skip_ws_comments(source, skip_object_literal_value(source, next, object_end));
        } else if key_is_ident {
            add_unique(&mut exports, name);
            cursor = next;
        } else {
            break;
        }

        if cursor < object_end {
            if bytes[cursor] != b',' {
                return None;
            }
            cursor = skip_ws_comments(source, cursor + 1);
        }
    }

    let after_object = skip_ws_comments(source, object_end + 1);
    if is_statement_boundary(source, after_object) {
        Some((exports, reexports, after_object.min(source.len())))
    } else {
        None
    }
}

fn parse_object_keys_reexport(source: &str, pos: usize, bindings: &HashMap<String, String>) -> Option<(String, usize)> {
    let bytes = source.as_bytes();
    if !is_free_ident_start(bytes, pos)
        || !source[pos..].starts_with("Object")
        || !is_ident_boundary(bytes, pos + 6)
    {
        return None;
    }
    let mut i = skip_ws_comments(source, pos + 6);
    if i >= bytes.len() || bytes[i] != b'.' {
        return None;
    }
    i = skip_ws_comments(source, i + 1);
    if !source[i..].starts_with("keys") || !is_ident_boundary(bytes, i + 4) {
        return None;
    }
    i = skip_ws_comments(source, i + 4);
    if i >= bytes.len() || bytes[i] != b'(' {
        return None;
    }
    i = skip_ws_comments(source, i + 1);
    let (binding, next) = read_ident(source, i)?;
    let specifier = bindings.get(&binding)?.clone();
    i = skip_ws_comments(source, next);
    if i >= bytes.len() || bytes[i] != b')' {
        return None;
    }
    let after_keys = skip_ws_comments(source, i + 1);
    if after_keys >= bytes.len() || bytes[after_keys] != b'.' {
        return None;
    }
    let for_each_pos = skip_ws_comments(source, after_keys + 1);
    if !source[for_each_pos..].starts_with("forEach") || !is_ident_boundary(bytes, for_each_pos + 7) {
        return None;
    }
    let end = find_matching_paren(source, for_each_pos + 7).unwrap_or(for_each_pos + 7);
    let callback = &source[for_each_pos..end];
    if callback_has_transpiler_reexport(callback, &binding) {
        Some((specifier, end + 1))
    } else {
        None
    }
}

fn callback_has_transpiler_reexport(callback: &str, binding: &str) -> bool {
    let mut found = false;
    scan_code_positions(callback, true, |i, _| {
        if parse_define_property_reexport(callback, i, binding).is_some() {
            found = true;
            return ControlFlow::Break(());
        }
        if parse_direct_exports_reexport_assignment(callback, i, binding).is_some() {
            found = true;
            return ControlFlow::Break(());
        }
        ControlFlow::Continue(None)
    });
    found
}

fn parse_direct_exports_reexport_assignment(source: &str, pos: usize, binding: &str) -> Option<usize> {
    let bytes = source.as_bytes();
    let (target, mut i) = parse_exports_target(source, pos)?;
    if target != CjsExportTarget::Exports {
        return None;
    }

    i = skip_ws_comments(source, i);
    if i >= bytes.len() || bytes[i] != b'[' {
        return None;
    }
    i = skip_ws_comments(source, i + 1);
    let (key, next) = read_ident(source, i)?;
    i = skip_ws_comments(source, next);
    if i >= bytes.len() || bytes[i] != b']' {
        return None;
    }
    i = skip_ws_comments(source, i + 1);
    if i >= bytes.len() || bytes[i] != b'=' || (i + 1 < bytes.len() && matches!(bytes[i + 1], b'=' | b'>')) {
        return None;
    }

    i = skip_ws_comments(source, i + 1);
    if !source[i..].starts_with(binding)
        || !is_free_ident_start(bytes, i)
        || !is_ident_boundary(bytes, i + binding.len())
    {
        return None;
    }
    i = skip_ws_comments(source, i + binding.len());
    if i >= bytes.len() || bytes[i] != b'[' {
        return None;
    }
    i = skip_ws_comments(source, i + 1);
    if !source[i..].starts_with(&key) || !is_free_ident_start(bytes, i) || !is_ident_boundary(bytes, i + key.len()) {
        return None;
    }
    i = skip_ws_comments(source, i + key.len());
    if i >= bytes.len() || bytes[i] != b']' {
        return None;
    }

    let after_rhs = skip_ws_comments(source, i + 1);
    if is_statement_boundary(source, after_rhs) {
        Some(after_rhs.min(source.len()))
    } else {
        None
    }
}

fn parse_define_property_reexport(source: &str, pos: usize, binding: &str) -> Option<usize> {
    let bytes = source.as_bytes();
    if !is_free_ident_start(bytes, pos)
        || !source[pos..].starts_with("Object")
        || !is_ident_boundary(bytes, pos + 6)
    {
        return None;
    }
    let mut i = skip_ws_comments(source, pos + 6);
    if i >= bytes.len() || bytes[i] != b'.' {
        return None;
    }
    i = skip_ws_comments(source, i + 1);
    if !source[i..].starts_with("defineProperty") || !is_ident_boundary(bytes, i + 14) {
        return None;
    }
    i = skip_ws_comments(source, i + 14);
    if i >= bytes.len() || bytes[i] != b'(' {
        return None;
    }
    i = skip_ws_comments(source, i + 1);
    let (target, next) = parse_exports_target(source, i)?;
    if target != CjsExportTarget::Exports {
        return None;
    }
    i = skip_ws_comments(source, next);
    if i >= bytes.len() || bytes[i] != b',' {
        return None;
    }
    i = skip_ws_comments(source, i + 1);
    let (key, next) = read_ident(source, i)?;
    i = skip_ws_comments(source, next);
    if i >= bytes.len() || bytes[i] != b',' {
        return None;
    }
    let descriptor_start = i + 1;
    let end = find_matching_paren(source, pos)?;
    let descriptor = &source[descriptor_start..end];
    if descriptor_getter_returns_binding_key(descriptor, binding, &key) {
        Some(end + 1)
    } else {
        None
    }
}

fn descriptor_getter_returns_binding_key(descriptor: &str, binding: &str, key: &str) -> bool {
    let Some((body_start, body_end)) = find_getter_body(descriptor) else {
        return false;
    };
    getter_body_returns_binding_key(&descriptor[body_start..body_end], binding, key)
}

fn getter_body_returns_binding_key(body: &str, binding: &str, key: &str) -> bool {
    let bytes = body.as_bytes();
    let mut i = skip_ws_comments(body, 0);
    if !body[i..].starts_with("return")
        || !is_free_ident_start(bytes, i)
        || !is_ident_boundary(bytes, i + 6)
    {
        return false;
    }
    i = skip_ws_comments(body, i + 6);
    if !body[i..].starts_with(binding)
        || !is_free_ident_start(bytes, i)
        || !is_ident_boundary(bytes, i + binding.len())
    {
        return false;
    }
    i = skip_ws_comments(body, i + binding.len());
    if i >= bytes.len() || bytes[i] != b'[' {
        return false;
    }
    i = skip_ws_comments(body, i + 1);
    if !body[i..].starts_with(key)
        || !is_free_ident_start(bytes, i)
        || !is_ident_boundary(bytes, i + key.len())
    {
        return false;
    }
    i = skip_ws_comments(body, i + key.len());
    if i >= bytes.len() || bytes[i] != b']' {
        return false;
    }
    i = skip_ws_comments(body, i + 1);
    if i < bytes.len() && bytes[i] == b';' {
        i = skip_ws_comments(body, i + 1);
    }
    i >= bytes.len()
}

fn next_char_boundary(source: &str, pos: usize) -> usize {
    if pos >= source.len() {
        return source.len();
    }
    pos + source[pos..].chars().next().map_or(1, char::len_utf8)
}

fn previous_significant_byte(source: &str, pos: usize) -> Option<u8> {
    let bytes = source.as_bytes();
    let mut i = pos;
    while i > 0 {
        i -= 1;
        if !bytes[i].is_ascii_whitespace() {
            return Some(bytes[i]);
        }
    }
    None
}

fn is_regex_literal_start(source: &str, pos: usize) -> bool {
    if matches!(
        previous_significant_byte(source, pos),
        None | Some(b'(' | b'{' | b'[' | b'=' | b':' | b',' | b';' | b'!' | b'?' | b'&' | b'|' | b'+' | b'-' | b'*' | b'~' | b'^' | b'%' | b'>')
    ) {
        return true;
    }

    let bytes = source.as_bytes();
    let mut end = pos;
    while end > 0 && bytes[end - 1].is_ascii_whitespace() {
        end -= 1;
    }
    let mut start = end;
    while start > 0 && is_ident_continue(bytes[start - 1]) {
        start -= 1;
    }
    matches!(&source[start..end], "return" | "throw" | "case" | "yield")
}

fn skip_regex_literal(source: &str, pos: usize) -> usize {
    let bytes = source.as_bytes();
    let mut i = pos + 1;
    let mut in_class = false;
    while i < bytes.len() {
        match bytes[i] {
            b'\\' => i += 2,
            b'[' => {
                in_class = true;
                i += 1;
            }
            b']' => {
                in_class = false;
                i += 1;
            }
            b'/' if !in_class => {
                i += 1;
                while i < bytes.len() && bytes[i].is_ascii_alphabetic() {
                    i += 1;
                }
                return i;
            }
            b'\n' | b'\r' => return pos + 1,
            _ => i += 1,
        }
    }
    pos + 1
}

fn skip_non_code(source: &str, pos: usize, skip_regex: bool) -> Option<usize> {
    let bytes = source.as_bytes();
    match bytes.get(pos).copied()? {
        b'\'' | b'"' | b'`' => Some(skip_string_or_template(source, pos)),
        b'/' if pos + 1 < bytes.len() && bytes[pos + 1] == b'/' => {
            let mut i = pos + 2;
            while i < bytes.len() && !matches!(bytes[i], b'\n' | b'\r') {
                i += 1;
            }
            Some(i)
        }
        b'/' if pos + 1 < bytes.len() && bytes[pos + 1] == b'*' => {
            let mut i = pos + 2;
            while i + 1 < bytes.len() && !(bytes[i] == b'*' && bytes[i + 1] == b'/') {
                i += 1;
            }
            Some((i + 2).min(bytes.len()))
        }
        b'/' if skip_regex && is_regex_literal_start(source, pos) => {
            Some(skip_regex_literal(source, pos))
        }
        _ => None,
    }
}

fn scan_code_positions<F>(source: &str, skip_regex: bool, mut visitor: F) -> ControlFlow<()>
where
    F: FnMut(usize, u8) -> ControlFlow<(), Option<usize>>,
{
    let bytes = source.as_bytes();
    let mut i = 0usize;
    while i < bytes.len() {
        if let Some(next) = skip_non_code(source, i, skip_regex) {
            i = next;
            continue;
        }

        match visitor(i, bytes[i]) {
            ControlFlow::Break(()) => return ControlFlow::Break(()),
            ControlFlow::Continue(Some(next)) => i = next,
            ControlFlow::Continue(None) => i = next_char_boundary(source, i),
        }
    }
    ControlFlow::Continue(())
}

fn scan_code_positions_with_brace_depth<F>(
    source: &str,
    skip_regex: bool,
    mut visitor: F,
) -> ControlFlow<()>
where
    F: FnMut(usize, u8, usize) -> ControlFlow<(), Option<usize>>,
{
    let bytes = source.as_bytes();
    let mut i = 0usize;
    let mut brace_depth = 0usize;
    while i < bytes.len() {
        if let Some(next) = skip_non_code(source, i, skip_regex) {
            i = next;
            continue;
        }

        let current = bytes[i];
        match visitor(i, current, brace_depth) {
            ControlFlow::Break(()) => return ControlFlow::Break(()),
            ControlFlow::Continue(Some(next)) => i = next,
            ControlFlow::Continue(None) => i = next_char_boundary(source, i),
        }

        match current {
            b'{' => brace_depth += 1,
            b'}' => brace_depth = brace_depth.saturating_sub(1),
            _ => {}
        }
    }
    ControlFlow::Continue(())
}

fn analyze_cjs_exports(source: &str) -> CjsExportAnalysis {
    let mut analysis = CjsExportAnalysis::default();
    let mut require_bindings = HashMap::<String, String>::new();
    scan_code_positions_with_brace_depth(source, true, |i, _, brace_depth| {
        if let Some((name, next)) = parse_export_member(source, i) {
            analysis.is_cjs = true;
            add_unique(&mut analysis.exports, name);
            return ControlFlow::Continue(Some(next));
        }
        if let Some((name, next)) = parse_define_property_export(source, i) {
            analysis.is_cjs = true;
            add_unique(&mut analysis.exports, name);
            return ControlFlow::Continue(Some(next));
        }
        if let Some((binding, specifier, next)) = parse_require_binding(source, i) {
            require_bindings.insert(binding, specifier);
            return ControlFlow::Continue(Some(next));
        }
        if brace_depth == 0
            && let Some((specifier, next)) = parse_export_star_reexport(source, i)
        {
            analysis.is_cjs = true;
            add_unique(&mut analysis.reexports, specifier);
            return ControlFlow::Continue(Some(next));
        }
        if let Some((specifier, next)) = parse_module_exports_reexport(source, i) {
            analysis.is_cjs = true;
            analysis.reexports.clear();
            add_unique(&mut analysis.reexports, specifier);
            return ControlFlow::Continue(Some(next));
        }
        if let Some((exports, reexports, next)) = parse_module_exports_object_literal(source, i) {
            analysis.is_cjs = true;
            analysis.reexports.clear();
            for name in exports {
                add_unique(&mut analysis.exports, name);
            }
            for specifier in reexports {
                add_unique(&mut analysis.reexports, specifier);
            }
            return ControlFlow::Continue(Some(next));
        }
        if let Some(next) = parse_module_exports_assignment(source, i) {
            analysis.is_cjs = true;
            return ControlFlow::Continue(Some(next));
        }
        if let Some((specifier, next)) = parse_object_keys_reexport(source, i, &require_bindings) {
            analysis.is_cjs = true;
            add_unique(&mut analysis.reexports, specifier);
            return ControlFlow::Continue(Some(next));
        }
        ControlFlow::Continue(None)
    });
    analysis
}

fn resolve_cjs_reexport_path(filename: &str, specifier: &str) -> Option<String> {
    if !specifier.starts_with("./") && !specifier.starts_with("../") && !specifier.starts_with('/') {
        let resolver = NodeModulesResolver;
        return resolver.try_resolve_for_cjs_analysis(filename, specifier).ok().flatten();
    }
    let base = if specifier.starts_with('/') {
        std::path::PathBuf::from(specifier)
    } else {
        std::path::Path::new(filename).parent()?.join(specifier)
    };
    let candidates = [
        base.clone(),
        base.with_extension("js"),
        base.with_extension("cjs"),
        base.join("index.js"),
        base.join("index.cjs"),
    ];
    for candidate in candidates {
        let normalized = CjsEvalResolver::normalize_path(&candidate);
        if std::path::Path::new(&normalized).is_file() {
            return Some(normalized);
        }
    }
    None
}

fn analyze_cjs_exports_for_file(filename: &str, source: &str, seen: &mut HashSet<String>) -> CjsExportAnalysis {
    let mut analysis = analyze_cjs_exports(source);
    if !seen.insert(filename.to_string()) {
        return analysis;
    }
    let reexports = analysis.reexports.clone();
    for reexport in reexports {
        if let Some(path) = resolve_cjs_reexport_path(filename, &reexport)
            && !seen.contains(&path)
            && let Ok(source) = std::fs::read_to_string(&path)
        {
            let child = analyze_cjs_exports_for_file(&path, &source, seen);
            for name in child.exports {
                add_unique(&mut analysis.exports, name);
            }
        }
    }
    analysis
}

fn package_scope_type(filename: &str) -> Option<String> {
    let mut dir = std::path::Path::new(filename).parent()?.to_path_buf();
    loop {
        if dir.file_name().is_some_and(|name| name == "node_modules") {
            return None;
        }
        let pkg_path = dir.join("package.json");
        if let Ok(pkg_content) = std::fs::read_to_string(&pkg_path)
            && let Ok(package) = serde_json::from_str::<PackageJson>(&pkg_content)
        {
            return package.package_type;
        }
        if !dir.pop() {
            break;
        }
    }
    None
}

fn is_js_in_module_package_scope(filename: &str) -> bool {
    filename.ends_with(".js") && package_scope_type(filename).as_deref() == Some("module")
}

fn cjs_named_export_source(names: &[String]) -> String {
    let mut out = String::new();
    for (index, name) in names.iter().enumerate() {
        if name == "default" {
            continue;
        }
        let local = format!("__cjs_export_{}", index);
        let escaped = escape_js_string(name);
        out.push_str(&format!(
            "var {local} = __cjs_default[\"{escaped}\"];\nexport {{ {local} as \"{escaped}\" }};\n"
        ));
    }
    out
}

impl Loader for CjsCompatLoader {
    fn load<'js>(
        &mut self,
        ctx: &Ctx<'js>,
        path: &str,
    ) -> rquickjs::Result<Module<'js, rquickjs::module::Declared>> {
        let fs_path = module_filesystem_path(path);
        let is_cjs_ext = fs_path.ends_with(".cjs");
        if !fs_path.ends_with(".js") && !is_cjs_ext {
            return Err(Error::new_loading(path));
        }

        let source = match std::fs::read_to_string(fs_path) {
            Ok(s) => s,
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
                let globals = ctx.globals();
                let msg = format!("Cannot find module '{}'", path);
                let error_ctor: Function = globals.get("Error")?;
                let error_obj: Object = error_ctor.call((&msg,))?;
                error_obj.set("code", "ERR_MODULE_NOT_FOUND")?;
                return Err(ctx.throw(error_obj.into_value()));
            }
            Err(_) => return Err(Error::new_loading(path)),
        };

        let fs_abs_path = ensure_absolute_path(fs_path);
        let filename = Some(fs_abs_path.clone());
        let url = path_to_file_url(path);

        let init = ImportMetaInit {
            url,
            filename,
            dirname: std::path::Path::new(&fs_abs_path)
                .parent()
                .map(|p| p.to_string_lossy().into_owned()),
            include_resolve: true,
        };

        let detected_analysis = analyze_cjs_exports_for_file(&fs_abs_path, &source, &mut HashSet::new());
        // .cjs files are always CommonJS; for .js files, use the analyzer so
        // comments, strings, templates, and regex literals do not force CJS.
        let is_cjs = is_cjs_ext
            || (!is_js_in_module_package_scope(&fs_abs_path)
                && !has_cjs_wrapper_require_redeclaration(&source)
                && (detected_analysis.is_cjs
                    || !detected_analysis.exports.is_empty()
                    || !detected_analysis.reexports.is_empty()));

        if !is_cjs {
            if fs_path.ends_with(".js")
                && is_js_in_module_package_scope(&fs_abs_path)
                && let Some(error_source) = esm_preflight_error_module_source(&source, true)
            {
                return Module::declare(ctx.clone(), path, error_source.as_bytes().to_vec());
            }
            // Treat as ESM — inject import.meta prologue (handles shebangs)
            let injected = inject_import_meta_prologue(&init, &source);
            return Module::declare(ctx.clone(), path, injected.as_bytes().to_vec());
        }

        let named_exports = cjs_named_export_source(&detected_analysis.exports);

        // Let the existing CommonJS loader execute and cache the module. The
        // facade only exposes the shared module.exports object to ESM.
        let prologue = inject_import_meta_prologue(&init, "");
        let wrapped = format!(
            r#"import {{ createRequire as __wasm_rquickjs_createRequire }} from 'node:module';
{}
var __wasm_rquickjs_require = __wasm_rquickjs_createRequire("{}");
var __cjs_default = __wasm_rquickjs_require("{}");
export default __cjs_default;
{}
"#,
            prologue.trim(),
            escape_js_string(&fs_abs_path),
            escape_js_string(&fs_abs_path),
            named_exports
        );

        Module::declare(ctx.clone(), path, wrapped.as_bytes().to_vec())
    }
}

struct ImportMetaInit {
    url: String,
    filename: Option<String>,
    dirname: Option<String>,
    include_resolve: bool,
}

/// Ensure a path is absolute. If relative, prepend `/` (WASI cwd is `/`).
fn ensure_absolute_path(path: &str) -> String {
    let (path, suffix) = split_module_path_suffix(path);
    let mut absolute = if path.starts_with('/') {
        path.to_string()
    } else {
        format!("/{}", path)
    };
    absolute.push_str(suffix);
    absolute
}

fn path_to_file_url(path: &str) -> String {
    let abs_path = ensure_absolute_path(path);
    let (abs_path, suffix) = split_module_path_suffix(&abs_path);
    let mut url = String::from("file://");
    for byte in abs_path.as_bytes() {
        match byte {
            b'%' => url.push_str("%25"),
            b' ' => url.push_str("%20"),
            b'#' => url.push_str("%23"),
            b'?' => url.push_str("%3F"),
            // Unreserved characters + path separators
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' | b'/' | b':' => {
                url.push(*byte as char)
            }
            _ if *byte > 0x7F => {
                // Non-ASCII: percent-encode each byte
                url.push_str(&format!("%{:02X}", byte));
            }
            _ => {
                // Other ASCII special chars: percent-encode
                url.push_str(&format!("%{:02X}", byte));
            }
        }
    }
    url.push_str(suffix);
    url
}

fn split_module_path_suffix(path: &str) -> (&str, &str) {
    let suffix_start = path.find(|ch| ch == '?' || ch == '#').unwrap_or(path.len());
    (&path[..suffix_start], &path[suffix_start..])
}

fn module_filesystem_path(path: &str) -> &str {
    split_module_path_suffix(path).0
}

fn escape_js_string(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for ch in s.chars() {
        match ch {
            '\\' => out.push_str("\\\\"),
            '"' => out.push_str("\\\""),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            '\u{0008}' => out.push_str("\\b"),
            '\u{000C}' => out.push_str("\\f"),
            c if c < '\u{0020}' => {
                out.push_str(&format!("\\u{:04x}", c as u32));
            }
            '\u{2028}' => out.push_str("\\u2028"),
            '\u{2029}' => out.push_str("\\u2029"),
            c => out.push(c),
        }
    }
    out
}

#[derive(Clone, Copy, PartialEq, Eq)]
enum JsBraceContext {
    Normal,
    Function,
    Class,
}

fn source_has_top_level_await(source: &str) -> bool {
    let bytes = source.as_bytes();
    let mut i = 0;
    let mut paren_depth = 0usize;
    let mut bracket_depth = 0usize;
    let mut function_depth = 0usize;
    let mut class_depth = 0usize;
    let mut braces = Vec::new();
    let mut pending_function_body = false;
    let mut pending_class_body = false;
    let mut after_arrow = false;
    let mut skip_arrow_expression: Option<(usize, usize, usize)> = None;

    while i < bytes.len() {
        let b = bytes[i];

        if b.is_ascii_whitespace() {
            i += 1;
            continue;
        }

        if b == b'/' && i + 1 < bytes.len() {
            if bytes[i + 1] == b'/' {
                i += 2;
                while i < bytes.len() && bytes[i] != b'\n' && bytes[i] != b'\r' {
                    i += 1;
                }
                continue;
            }
            if bytes[i + 1] == b'*' {
                i += 2;
                while i + 1 < bytes.len() && !(bytes[i] == b'*' && bytes[i + 1] == b'/') {
                    i += 1;
                }
                i = (i + 2).min(bytes.len());
                continue;
            }
        }

        if b == b'\'' || b == b'"' || b == b'`' {
            let quote = b;
            i += 1;
            while i < bytes.len() {
                if bytes[i] == b'\\' {
                    i = (i + 2).min(bytes.len());
                    continue;
                }
                if bytes[i] == quote {
                    i += 1;
                    break;
                }
                i += 1;
            }
            continue;
        }

        if after_arrow {
            after_arrow = false;
            if b == b'{' {
                pending_function_body = true;
            } else {
                skip_arrow_expression = Some((paren_depth, bracket_depth, braces.len()));
            }
        }

        if is_js_identifier_start(b) {
            let start = i;
            i += 1;
            while i < bytes.len() && is_js_identifier_continue(bytes[i]) {
                i += 1;
            }
            let ident = &source[start..i];
            if skip_arrow_expression.is_none() {
                match ident {
                    "await" if function_depth == 0 && class_depth == 0 => return true,
                    "function" => pending_function_body = true,
                    "class" => pending_class_body = true,
                    _ => {}
                }
            }
            continue;
        }

        if let Some((start_paren, start_bracket, start_brace)) = skip_arrow_expression
            && (b == b';'
                || b == b','
                || (b == b')' && paren_depth <= start_paren)
                || (b == b']' && bracket_depth <= start_bracket)
                || (b == b'}' && braces.len() <= start_brace))
        {
            skip_arrow_expression = None;
        }

        match b {
            b'(' => paren_depth += 1,
            b')' => paren_depth = paren_depth.saturating_sub(1),
            b'[' => bracket_depth += 1,
            b']' => bracket_depth = bracket_depth.saturating_sub(1),
            b'=' if i + 1 < bytes.len() && bytes[i + 1] == b'>' => {
                after_arrow = true;
                i += 1;
            }
            b'{' => {
                if pending_function_body {
                    braces.push(JsBraceContext::Function);
                    function_depth += 1;
                    pending_function_body = false;
                } else if pending_class_body {
                    braces.push(JsBraceContext::Class);
                    class_depth += 1;
                    pending_class_body = false;
                } else {
                    braces.push(JsBraceContext::Normal);
                }
            }
            b'}' => {
                if let Some(context) = braces.pop() {
                    match context {
                        JsBraceContext::Function => function_depth = function_depth.saturating_sub(1),
                        JsBraceContext::Class => class_depth = class_depth.saturating_sub(1),
                        JsBraceContext::Normal => {}
                    }
                }
            }
            _ => {}
        }
        i += 1;
    }

    false
}

fn is_js_identifier_start(byte: u8) -> bool {
    byte == b'_' || byte == b'$' || byte.is_ascii_alphabetic()
}

fn is_js_identifier_continue(byte: u8) -> bool {
    is_js_identifier_start(byte) || byte.is_ascii_digit()
}

fn inject_import_meta_prologue(init: &ImportMetaInit, source: &str) -> String {
    let mut props = Vec::new();

    if let Some(ref dirname) = init.dirname {
        props.push(format!(
            "dirname:{{value:\"{}\",writable:true,enumerable:true,configurable:true}}",
            escape_js_string(dirname)
        ));
    }

    if let Some(ref filename) = init.filename {
        props.push(format!(
            "filename:{{value:\"{}\",writable:true,enumerable:true,configurable:true}}",
            escape_js_string(filename)
        ));
    }

    if init.include_resolve {
        props.push(format!(
            "resolve:{{value:(s)=>globalThis.__wasm_rquickjs_import_meta_resolve(\"{}\",s),writable:true,enumerable:true,configurable:true}}",
            escape_js_string(&init.url)
        ));
    }

    props.push(format!(
        "url:{{value:\"{}\",writable:true,enumerable:true,configurable:true}}",
        escape_js_string(&init.url)
    ));

    // Define import.meta properties and also shim __filename/__dirname as
    // top-level variables. Many libraries (especially Rollup-bundled CJS→ESM)
    // reference bare __dirname/__filename which don't exist in ESM scope.
    let mut prologue = format!(
        "Object.defineProperties(import.meta,{{{}}});",
        props.join(",")
    );
    if let Some(ref filename) = init.filename {
        prologue.push_str(&format!(
            "var __filename=\"{}\";",
            escape_js_string(filename)
        ));
    }
    if let Some(ref dirname) = init.dirname {
        prologue.push_str(&format!("var __dirname=\"{}\";", escape_js_string(dirname)));
    }

    if let Some(rest) = source.strip_prefix("#!") {
        if let Some(newline_pos) = rest.find('\n') {
            let shebang_line = &source[..2 + newline_pos + 1];
            let remaining = &source[2 + newline_pos + 1..];
            format!("{}{}\n{}", shebang_line, prologue, remaining)
        } else {
            // Shebang with no newline — entire file is the shebang
            format!("{}\n{}", source, prologue)
        }
    } else {
        format!("{}\n{}", prologue, source)
    }
}

struct ImportMetaLoader;

impl Loader for ImportMetaLoader {
    fn load<'js>(
        &mut self,
        ctx: &Ctx<'js>,
        path: &str,
    ) -> rquickjs::Result<Module<'js, rquickjs::module::Declared>> {
        let fs_path = module_filesystem_path(path);
        let is_extensionless = std::path::Path::new(fs_path).extension().is_none();
        if !fs_path.ends_with(".mjs") && !is_extensionless {
            return Err(Error::new_loading(path));
        }

        let source = match std::fs::read_to_string(fs_path) {
            Ok(s) => s,
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
                let globals = ctx.globals();
                let msg = format!("Cannot find module '{}'", path);
                let error_ctor: Function = globals.get("Error")?;
                let error_obj: Object = error_ctor.call((&msg,))?;
                error_obj.set("code", "ERR_MODULE_NOT_FOUND")?;
                return Err(ctx.throw(error_obj.into_value()));
            }
            Err(_) => return Err(Error::new_loading(path)),
        };

        let fs_abs_path = ensure_absolute_path(fs_path);
        let module_abs_path = ensure_absolute_path(path);
        let std_path = std::path::Path::new(&fs_abs_path);
        let filename = Some(fs_abs_path.clone());
        let dirname = std_path.parent().map(|p| p.to_string_lossy().into_owned());
        let url = path_to_file_url(path);

        let init = ImportMetaInit {
            url,
            filename,
            dirname,
            include_resolve: true,
        };

        // Check if there's a cached compilation error for this module.
        // When a module fails to compile (e.g. SyntaxError), we cache the
        // error so subsequent imports throw the exact same error object,
        // matching Node.js/V8 behavior (ES spec §16.2.1.5.2).
        let globals = ctx.globals();
        if let Ok(cache) = globals.get::<_, Object>("__esm_error_cache")
            && let Ok(cached_error) = cache.get::<_, Value>(path)
            && !cached_error.is_undefined()
        {
            return Err(ctx.throw(cached_error));
        }

        let mut injected = inject_import_meta_prologue(&init, &source);
        if source_has_top_level_await(&source) {
            let escaped_path = escape_js_string(&module_abs_path);
            let escaped_url = escape_js_string(&init.url);
            let marker = format!(
                "globalThis.__wasm_rquickjs_async_esm_modules=globalThis.__wasm_rquickjs_async_esm_modules||Object.create(null);globalThis.__wasm_rquickjs_async_esm_modules[\"{}\"]=true;globalThis.__wasm_rquickjs_async_esm_modules[\"{}\"]=true;\n",
                escaped_path, escaped_url
            );
            injected = format!("{}{}", marker, injected);
        }
        match Module::declare(ctx.clone(), path, injected.as_bytes().to_vec()) {
            Ok(module) => Ok(module),
            Err(Error::Exception) => {
                let exception = ctx.catch();

                let cache: Object = match globals.get::<_, Value>("__esm_error_cache") {
                    Ok(v) if v.is_object() => v.into_object().unwrap(),
                    _ => {
                        let obj = Object::new(ctx.clone()).map_err(|_| Error::new_loading(path))?;
                        globals
                            .set("__esm_error_cache", obj.clone())
                            .map_err(|_| Error::new_loading(path))?;
                        obj
                    }
                };
                cache
                    .set(path, exception.clone())
                    .map_err(|_| Error::new_loading(path))?;

                Err(ctx.throw(exception))
            }
            Err(e) => Err(e),
        }
    }
}

/// Loader that handles `.json` files imported via `import()` with `type: 'json'`.
/// Wraps JSON content in a synthetic ESM module with a default export.
struct JsonFileLoader;

impl Loader for JsonFileLoader {
    fn load<'js>(
        &mut self,
        ctx: &Ctx<'js>,
        path: &str,
    ) -> rquickjs::Result<Module<'js, rquickjs::module::Declared>> {
        let fs_path = module_filesystem_path(path);
        if !fs_path.ends_with(".json") {
            return Err(Error::new_loading(path));
        }

        let source = std::fs::read_to_string(fs_path).map_err(|_| Error::new_loading(path))?;
        let module_source = if DataUrlLoader::is_valid_json(&source) {
            let escaped = DataUrlLoader::js_string_escape(&source);
            format!("export default JSON.parse('{escaped}');\n")
        } else {
            DataUrlLoader::make_json_error_module(&source)
        };
        Module::declare(ctx.clone(), path, module_source.as_bytes().to_vec())
    }
}

pub const RESOURCE_TABLE_NAME: &str = "__wasm_rquickjs_resources";
pub const RESOURCE_ID_KEY: &str = "__wasm_rquickjs_resource_id";
pub const DISPOSE_SYMBOL: &str = "__wasm_rquickjs_symbol_dispose";

pub struct JsState {
    pub rt: AsyncRuntime,
    pub ctx: AsyncContext,
    pub last_resource_id: AtomicUsize,
    pub resource_drop_queue_tx: futures::channel::mpsc::UnboundedSender<usize>,
    pub resource_drop_queue_rx: RefCell<Option<futures::channel::mpsc::UnboundedReceiver<usize>>>,
    pub abort_handles: RefCell<HashMap<usize, AbortHandle>>,
    pub last_abort_id: AtomicUsize,
    pub unrefed_timers: RefCell<HashSet<usize>>,
    pub gc_pending: std::sync::atomic::AtomicBool,
}

/// Tracks which initialization phase the runtime is in.
/// Used to support Wizer pre-initialization and guard against re-entrant
/// `get_js_state()` calls during module evaluation (e.g. from `setTimeout`
/// callbacks that fire during init).
#[repr(u8)]
#[derive(Clone, Copy)]
enum InitPhase {
    /// No initialization has been performed yet.
    Uninitialized = 0,
    /// `STATE` is published but JS evaluation is still in progress.
    /// Re-entrant `get_js_state()` calls return the existing state without
    /// re-running initialization.
    Initializing = 1,
    /// Fully initialized including user module evaluation.
    FullyInitialized = 2,
    /// Wizer pre-initialized: JS state is snapshotted but runtime env (argv, env vars)
    /// needs to be refreshed from the actual host environment on first access.
    WizerPreInitialized = 3,
}

impl JsState {
    /// Phase 1: Create the runtime, context, resolvers, loaders, and all Rust-side
    /// state. Does NOT evaluate any JavaScript — safe to publish to `STATE` before
    /// JS module initialization runs.
    async fn new_base() -> Self {
        let rt = AsyncRuntime::new().expect("Failed to create AsyncRuntime");
        // Raise the GC threshold to reduce the chance of triggering a QuickJS-ng
        // shape refcount bug during heavy async/promise workloads. The default
        // threshold (0xFF) causes GC to run too frequently, which can trigger
        // a use-after-free in the shape reference counting code path.
        rt.set_gc_threshold(256 * 1024 * 1024).await;
        let ctx = AsyncContext::full(&rt)
            .await
            .expect("Failed to create AsyncContext");

        let mut builtin_resolver =
            BuiltinResolver::default().with_module(crate::JS_EXPORT_MODULE_NAME);
        for (name, _) in crate::JS_ADDITIONAL_MODULES.iter() {
            builtin_resolver = builtin_resolver.with_module(name.to_string());
        }
        let builtin_resolver = crate::modules::add_native_module_resolvers(builtin_resolver);
        let builtin_resolver = crate::builtin::add_module_resolvers(builtin_resolver);

        let file_resolver = FileResolver::default()
            .with_path("/")
            .with_pattern("{}.js")
            .with_pattern("{}.mjs")
            .with_pattern("{}.json");

        let resolver = (
            (
                RealmGuardResolver,
                MockModuleResolver,
                DataUrlResolver,
                FileUrlResolver,
                builtin_resolver,
                NodeModulesResolver,
                NodeFileResolver,
            ),
            (CjsEvalResolver, file_resolver, NodeModuleErrorResolver),
        );

        let mut builtin_loader = BuiltinLoader::default().with_module(
            crate::JS_EXPORT_MODULE_NAME,
            inject_import_meta_prologue(
                &ImportMetaInit {
                    url: format!(
                        "file:///__wasm_rquickjs_virtual__/{}.mjs",
                        crate::JS_EXPORT_MODULE_NAME
                    ),
                    filename: None,
                    dirname: None,
                    include_resolve: true,
                },
                crate::js_export_module(),
            ),
        );
        for (name, get_module) in crate::JS_ADDITIONAL_MODULES.iter() {
            let source = (get_module)();
            let injected = inject_import_meta_prologue(
                &ImportMetaInit {
                    url: format!("file:///__wasm_rquickjs_virtual__/{}.mjs", name),
                    filename: None,
                    dirname: None,
                    include_resolve: true,
                },
                &source,
            );
            builtin_loader = builtin_loader.with_module(name.to_string(), injected);
        }

        let loader = (
            MockModuleLoader,
            builtin_loader,
            crate::modules::module_loader(),
            crate::builtin::module_loader(),
            DataUrlLoader,
            JsonFileLoader,
            CjsCompatLoader,
            ImportMetaLoader,
        );

        rt.set_loader(resolver, loader).await;

        async_with!(ctx => |ctx| {
            let global = ctx.globals();

            global.set(RESOURCE_TABLE_NAME, Object::new(ctx.clone()))
                .expect("Failed to initialize resource table");

            global.set("__wasm_rquickjs_mock_seq", 0i64)
                .expect("Failed to initialize mock sequence counter");
        })
        .await;

        rt.set_host_promise_rejection_tracker(Some(Box::new(
            |ctx, promise, reason, is_handled| {
                if let Ok(handler) = ctx
                    .globals()
                    .get::<_, Function>("__wasm_rquickjs_rejection_tracker")
                {
                    let _ = handler.call::<_, Value>((promise, reason, is_handled));
                }
            },
        )))
        .await;

        let (resource_drop_queue_tx, resource_drop_queue_rx) = futures::channel::mpsc::unbounded();

        let last_resource_id = AtomicUsize::new(1);
        Self {
            rt,
            ctx,
            last_resource_id,
            resource_drop_queue_tx,
            resource_drop_queue_rx: RefCell::new(Some(resource_drop_queue_rx)),
            abort_handles: RefCell::new(HashMap::new()),
            last_abort_id: AtomicUsize::new(0),
            unrefed_timers: RefCell::new(HashSet::new()),
            gc_pending: std::sync::atomic::AtomicBool::new(false),
        }
    }

    /// Phase 2a: Initialize engine builtins — dispose symbols and builtin wiring.
    /// This can be pre-initialized by Wizer without user module code.
    async fn init_engine(&self) {
        // Dispose symbols must be initialized before builtins, since builtin
        // modules use [Symbol.dispose] in their class definitions.
        async_with!(self.ctx => |ctx| {
            Module::evaluate(
                ctx.clone(),
                "dispose",
                format!(r#"
                const dispose = Symbol.for("dispose");
                globalThis.{DISPOSE_SYMBOL} = dispose;
                Symbol.dispose = dispose;
                const asyncDispose = Symbol.for("asyncDispose");
                Symbol.asyncDispose = asyncDispose;
                "#)
            ).catch(&ctx)
            .unwrap_or_else(|e| panic!("Failed to evaluate dispose module initialization:\n{}", format_caught_error(e)))
            .finish::<()>()
            .catch(&ctx)
            .unwrap_or_else(|e| panic!("Failed to finish dispose module initialization:\n{}", format_caught_error(e)));
        })
            .await;
        self.rt.idle().await;

        async_with!(self.ctx => |ctx| {
            // Wire built-in globals (globalThis.require, Buffer, process, etc.)
            // This must complete before user code runs, because bundled CJS-in-ESM code
            // (e.g. esbuild's __require shim) checks `typeof require` at the top level
            // during module evaluation. ES module semantics hoist all imports and evaluate
            // them before the module body, so wiring and user import cannot share a single
            // Module::evaluate call.
            let wiring = crate::builtin::wire_builtins();
            Module::evaluate(
                ctx.clone(),
                "__wasm_rquickjs_init_wiring",
                wiring,
            )
            .catch(&ctx)
            .unwrap_or_else(|e| panic!("Failed to evaluate built-in wiring:\n{}", format_caught_error(e)))
            .finish::<()>()
            .catch(&ctx)
            .unwrap_or_else(|e| panic!("Failed to finish built-in wiring:\n{}", format_caught_error(e)));
        })
            .await;
        drain_and_idle(self).await;
    }

    /// Phase 2b: Import and evaluate the user module.
    /// Must be called after init_engine().
    async fn init_user_module(&self) {
        async_with!(self.ctx => |ctx| {
            // Import the user module (now globalThis.require is available)
            Module::evaluate(
                ctx.clone(),
                "__wasm_rquickjs_init_entry",
                format!(r#"
                import * as userModule from '{}';
                globalThis.userModule = userModule;
                "#, crate::JS_EXPORT_MODULE_NAME),
            )
            .catch(&ctx)
            .unwrap_or_else(|e| panic!("Failed to evaluate module initialization:\n{}", format_caught_error(e)))
            .finish::<()>()
            .catch(&ctx)
            .unwrap_or_else(|e| panic!("Failed to finish module initialization:\n{}", format_caught_error(e)));

            for (name, _) in crate::JS_ADDITIONAL_MODULES.iter() {
              Module::import(&ctx, name.to_string())
                 .catch(&ctx)
                 .unwrap_or_else(|e| panic!("Failed to import user module {name}:\n{}", format_caught_error(e)))
                 .finish::<()>()
                 .catch(&ctx)
                 .unwrap_or_else(|e| panic!("Failed to finish importing user module {name}:\n{}", format_caught_error(e)));
            }
        })
            .await;
        drain_and_idle(self).await;
    }

    /// Phase 2: Evaluate all JavaScript — dispose symbols, builtin wiring, user
    /// module import. Must be called after `STATE` is published so that any
    /// re-entrant `get_js_state()` calls (e.g. from `setTimeout` during module
    /// init) find the already-published state instead of recursing.
    async fn finish_init(&self) {
        self.init_engine().await;
        self.init_user_module().await;
    }

    /// Refresh `process.argv` and `process.env` from the actual WASI host
    /// environment. Called after a Wizer snapshot is restored so that
    /// snapshotted (empty) values are replaced with the real runtime values.
    /// Mutates objects in-place so ESM bindings remain valid.
    async fn refresh_process_env(state: &JsState) {
        let argv = wasip2::cli::environment::get_arguments();
        let env_vars: std::collections::HashMap<String, String> =
            wasip2::cli::environment::get_environment()
                .into_iter()
                .collect();

        async_with!(state.ctx => |ctx| {
            let globals = ctx.globals();
            if let Ok(process) = globals.get::<_, rquickjs::Object>("process") {
                // Refresh argv in-place so existing references stay valid
                if let Ok(existing_argv) = process.get::<_, rquickjs::Array>("argv") {
                    let _ = existing_argv.as_object().set("length", 0u32);
                    for (i, arg) in argv.iter().enumerate() {
                        let _ = existing_argv.set(i, arg.as_str());
                    }
                }
                let _ = process.set(
                    "argv0",
                    argv.first().map(|s| s.as_str()).unwrap_or(""),
                );

                // Refresh env via JS eval to trigger Proxy traps
                if let Ok(new_env) = rquickjs::Object::new(ctx.clone()) {
                    for (key, value) in &env_vars {
                        let _ = new_env.set(key.as_str(), value.as_str());
                    }
                    let _ = globals.set("__wasm_rquickjs_new_env", new_env);
                    let _ = ctx.eval::<(), &str>(
                        "(() => { \
                            const e = globalThis.__wasm_rquickjs_new_env; \
                            for (const k of Object.keys(process.env)) delete process.env[k]; \
                            for (const [k,v] of Object.entries(e)) process.env[k] = v; \
                            delete globalThis.__wasm_rquickjs_new_env; \
                        })()",
                    );
                }
            }
        })
        .await;
    }
}

fn abort_unrefed_timers(js_state: &JsState) {
    let unrefed = js_state.unrefed_timers.borrow().clone();
    let mut abort_handles = js_state.abort_handles.borrow_mut();
    let mut unrefed_mut = js_state.unrefed_timers.borrow_mut();
    for id in unrefed.iter() {
        if let Some(handle) = abort_handles.remove(id) {
            handle.abort();
        }
        unrefed_mut.remove(id);
    }
}

/// Runs GC if it was requested from JS (deferred to avoid re-entrancy issues).
async fn run_pending_gc(js_state: &JsState) {
    if js_state
        .gc_pending
        .swap(false, std::sync::atomic::Ordering::Relaxed)
    {
        async_with!(js_state.ctx => |ctx| {
            ctx.run_gc();
        })
        .await;
    }
}

/// Spawns a sentinel task that waits for all ref'd timers to complete,
/// then aborts remaining unref'd timers so that `idle()` can return.
async fn drain_and_idle(js_state: &JsState) {
    run_pending_gc(js_state).await;
    if js_state.unrefed_timers.borrow().is_empty() {
        js_state.rt.idle().await;
        return;
    }
    // Spawn a sentinel that polls until only unref'd timers remain, then aborts them.
    async_with!(js_state.ctx => |ctx| {
        ctx.spawn(async {
            loop {
                wstd::task::sleep(wstd::time::Duration::from_millis(1)).await;
                let state = get_js_state();
                let abort_count = state.abort_handles.borrow().len();
                let unref_count = state.unrefed_timers.borrow().len();
                // When the only remaining abort handles are for unref'd timers,
                // abort them all (the sentinel itself is not tracked in abort_handles).
                if abort_count > 0 && abort_count == unref_count {
                    abort_unrefed_timers(state);
                    break;
                }
                if unref_count == 0 {
                    break;
                }
            }
        });
    })
    .await;
    js_state.rt.idle().await;
}

static mut STATE: Option<JsState> = None;
static mut INIT_PHASE: InitPhase = InitPhase::Uninitialized;

/// True while `wizer_initialize` is running. Used by built-in modules to avoid
/// std::fs / std::env operations during Wizer pre-init: those would trigger
/// wasi-libc's lazy preopen-cache population with the empty wizer environment,
/// and the broken cache would then be snapshotted into the pre-initialized
/// component, breaking filesystem access at runtime. See issue #91.
static WIZER_ACTIVE: std::sync::atomic::AtomicBool = std::sync::atomic::AtomicBool::new(false);

#[inline]
pub fn is_wizer_active() -> bool {
    WIZER_ACTIVE.load(std::sync::atomic::Ordering::Relaxed)
}

#[allow(static_mut_refs)]
pub fn get_js_state() -> &'static JsState {
    unsafe {
        match INIT_PHASE {
            InitPhase::Uninitialized => {
                // Phase 1: Create the runtime and all Rust-side state (no JS evaluation).
                STATE = Some(block_on(JsState::new_base()));
                // Mark as Initializing so re-entrant get_js_state() calls (e.g.
                // from setTimeout callbacks during module init) return the existing
                // state instead of re-running initialization.
                INIT_PHASE = InitPhase::Initializing;
                // Phase 2: Evaluate JS modules.
                block_on(STATE.as_ref().unwrap().finish_init());
                INIT_PHASE = InitPhase::FullyInitialized;
            }
            InitPhase::WizerPreInitialized => {
                // Wizer snapshot restored — refresh argv/env from the real host.
                let state = STATE.as_ref().unwrap();
                block_on(JsState::refresh_process_env(state));
                INIT_PHASE = InitPhase::FullyInitialized;
            }
            InitPhase::Initializing | InitPhase::FullyInitialized => {
                // Already initialized or in progress — return existing state.
            }
        }
        STATE.as_ref().unwrap()
    }
}

pub fn async_exported_function<F: Future>(future: F) -> F::Output {
    let js_state = get_js_state();

    block_on(async move {
        use futures::StreamExt;

        if let Some(mut resource_drop_queue_rx) = js_state.resource_drop_queue_rx.take() {
            let resource_dropper = async move {
                while let Some(resource_id) = resource_drop_queue_rx.next().await {
                    if resource_id > 0 {
                        drop_js_resource(resource_id).await;
                    } else {
                        break;
                    }
                }
                resource_drop_queue_rx
            };

            // Finish resource dropper
            js_state
                .resource_drop_queue_tx
                .unbounded_send(0)
                .expect("Failed to enqueue resource dropper stop signal");
            let (result, resource_drop_queue_rx) = (future, resource_dropper).join().await;
            js_state
                .resource_drop_queue_rx
                .replace(Some(resource_drop_queue_rx));

            result
        } else {
            // This case will never happen because block_on does not allow reentry
            unreachable!()
        }
    })
}

pub async fn call_js_export<A, R>(wit_package: &str, function_path: &[&str], args: A) -> R
where
    A: for<'js> IntoArgs<'js>,
    R: for<'js> FromJs<'js> + 'static,
{
    call_js_export_internal(wit_package, function_path, args, |a| a, |_, _| None).await
}

pub async fn call_js_export_returning_result<A, R, E>(
    wit_package: &str,
    function_path: &[&str],
    args: A,
) -> crate::wrappers::JsResult<R, E>
where
    A: for<'js> IntoArgs<'js>,
    R: for<'js> FromJs<'js> + 'static,
    E: for<'js> FromJs<'js> + 'static,
{
    call_js_export_internal(
        wit_package,
        function_path,
        args,
        |a| crate::wrappers::JsResult(Ok(a)),
        |ctx, value| {
            FromJs::from_js(ctx, value.clone())
                .ok()
                .map(|e| crate::wrappers::JsResult(Err(e)))
        },
    )
    .await
}

async fn call_js_export_internal<A, R, FR, TME>(
    wit_package: &str,
    function_path: &[&str],
    args: A,
    map_result: impl Fn(R) -> FR,
    try_map_exception: TME,
) -> FR
where
    A: for<'js> IntoArgs<'js>,
    R: for<'js> FromJs<'js> + 'static,
    FR: 'static,
    TME: for<'js> Fn(&Ctx<'js>, &Value<'js>) -> Option<FR>,
{
    let js_state = get_js_state();

    let result: FR = async_with!(js_state.ctx => |ctx| {
        let module: Object = ctx.globals().get("userModule").expect("Failed to get userModule");
        let (user_function_obj, parent): (Object, Object) = get_path(&module, function_path).unwrap_or_else(|| panic!("{}", dump_cannot_find_export("exported JS function", function_path, &module, wit_package)));
        let user_function = user_function_obj.as_function().unwrap_or_else(|| panic!("Expected export {} to be a function", function_path.join("."))).clone();

        let parameter_count = user_function_obj.get::<&str, usize>("length").unwrap_or_else(|_| panic!("Failed to get parameter count of exported function {}", function_path.join(".")));
        if parameter_count != args.num_args() {
            panic!(
                "The WIT specification defines {} parameters,\nbut the exported JavaScript function got {} parameters (exported function {} in WIT package {})",
                args.num_args(),
                parameter_count,
                function_path.join("."),
                wit_package
            );
        }

        let result: Result<Value, Error> = call_with_this(ctx.clone(), user_function, parent, args);

        match result {
            Err(Error::Exception) => {
                let exception = ctx.catch();
                if let Some(result) = try_map_exception(&ctx, &exception) {
                    result
                } else {
                    panic! ("Exception during call of {fun}:\n{exception}", fun = function_path.join("."), exception = format_js_exception(&exception));
                }
            }
            Err(e) => {
                panic! ("Error during call of {fun}:\n{e:?}", fun = function_path.join("."));
            }
            Ok(value) => {
                if value.is_promise() {
                    let promise: Promise = value.into_promise().unwrap();
                    let promise_future = promise.into_future::<R> ();

                    match promise_future.await {
                        Ok(result) => {
                            map_result(result)
                        }
                        Err(e) => {
                            match e {
                                Error::Exception => {
                                    let exception = ctx.catch();
                                    if let Some(result) = try_map_exception(&ctx, &exception) {
                                        result
                                    } else {
                                        panic! ("Exception during awaiting call result for {function_path}:\n{exception}", function_path=function_path.join("."), exception = format_js_exception(&exception))
                                    }
                                }
                                _ => {
                                    panic ! ("Error during awaiting call result for {function_path}:\n{e:?}", function_path=function_path.join("."))
                                }
                            }
                        }
                    }
                }
                else {
                    (map_result)(
                        R::from_js(&ctx, value).unwrap_or_else(|err| panic!("Unexpected result value for exported function {path}: {err}", path=function_path.join(".")))
                    )
                }
            }
        }
    }).await;
    drain_and_idle(js_state).await;
    result
}

pub async fn call_js_resource_constructor<A>(
    wit_package: &str,
    resource_path: &[&str],
    args: A,
) -> usize
where
    A: for<'js> IntoArgs<'js>,
{
    let js_state = get_js_state();

    let result = async_with!(js_state.ctx => |ctx| {
        let module: Object = ctx.globals().get("userModule").expect("Failed to get userModule");
        let (constructor_obj, _parent): (Constructor, Object) = get_path(&module, resource_path).unwrap_or_else(|| panic!("{}", dump_cannot_find_export("exported JS resource class", resource_path, &module, wit_package)));
        let constructor = constructor_obj.as_constructor().unwrap_or_else(|| panic!("Expected export {path} to be a class with a constructor", path = resource_path.join("."))).clone();

        let parameter_count = constructor_obj.get::<&str, usize>("length").unwrap_or_else(|_| panic!("Failed to get parameter count of exported constructor {}", resource_path.join(".")));
        if parameter_count != args.num_args() {
            panic!(
                "The WIT specification defines {} parameters,\nbut the exported JavaScript constructor got {} parameters (exported constructor {} in WIT package {})",
                args.num_args(),
                parameter_count,
                resource_path.join("."),
                wit_package
            );
        }

        let result: Result<Object, Error> = constructor.construct(args);

        match result {
            Err(Error::Exception) => {
                let exception = ctx.catch();
                panic! ("Exception during call of constructor {path}:\n{exception}", path= resource_path.join("."), exception = format_js_exception(&exception));
            }
            Err(e) => {
                panic! ("Error during call of constructor {path}: {e:?}", path= resource_path.join("."));
            }
            Ok(resource) => {
                let resource_id = get_free_resource_id();
                resource.set(RESOURCE_ID_KEY, resource_id)
                    .expect("Failed to set resource ID");
                let resource_table: Object = ctx.globals().get(RESOURCE_TABLE_NAME)
                    .expect("Failed to get the resource table");
                resource_table
                    .set(resource_id.to_string(), resource)
                    .expect("Failed to store resource instance");

                resource_id
            }
        }
    }).await;
    drain_and_idle(js_state).await;
    result
}

pub fn get_free_resource_id() -> usize {
    get_js_state()
        .last_resource_id
        .fetch_add(1, std::sync::atomic::Ordering::Relaxed)
}

pub async fn call_js_resource_method<A, R>(
    wit_package: &str,
    resource_path: &[&str],
    resource_id: usize,
    name: &str,
    args: A,
) -> R
where
    A: for<'js> IntoArgs<'js>,
    R: for<'js> FromJs<'js> + 'static,
{
    call_js_resource_method_internal(
        wit_package,
        resource_path,
        resource_id,
        name,
        args,
        |a| a,
        |_, _| None,
    )
    .await
}

pub async fn call_js_resource_method_returning_result<A, R, E>(
    wit_package: &str,
    resource_path: &[&str],
    resource_id: usize,
    name: &str,
    args: A,
) -> crate::wrappers::JsResult<R, E>
where
    A: for<'js> IntoArgs<'js>,
    R: for<'js> FromJs<'js> + 'static,
    E: for<'js> FromJs<'js> + 'static,
{
    call_js_resource_method_internal(
        wit_package,
        resource_path,
        resource_id,
        name,
        args,
        |a| crate::wrappers::JsResult(Ok(a)),
        |ctx, value| {
            FromJs::from_js(ctx, value.clone())
                .ok()
                .map(|e| crate::wrappers::JsResult(Err(e)))
        },
    )
    .await
}

async fn call_js_resource_method_internal<A, R, FR, TME>(
    wit_package: &str,
    resource_path: &[&str],
    resource_id: usize,
    name: &str,
    args: A,
    map_result: impl Fn(R) -> FR,
    try_map_exception: TME,
) -> FR
where
    A: for<'js> IntoArgs<'js>,
    R: for<'js> FromJs<'js> + 'static,
    FR: 'static,
    TME: for<'js> Fn(&Ctx<'js>, &Value<'js>) -> Option<FR>,
{
    let js_state = get_js_state();

    let result: FR = async_with!(js_state.ctx => |ctx| {
        let resource_table: Object = ctx.globals().get(RESOURCE_TABLE_NAME)
            .expect("Failed to get the resource table");
        let resource_instance: Object = resource_table.get(resource_id.to_string())
            .unwrap_or_else(|_| panic!("Failed to get resource instance with id #{resource_id} of class {}", resource_path.join(".")));

        let method_obj: Object = resource_instance.get(name)
            .unwrap_or_else(|_| panic!("{}", dump_cannot_find_method(
                name,
                resource_path,
                &resource_instance,
                wit_package,
            )));

        let method = method_obj.as_function().unwrap_or_else(|| panic!("Expected method {name} to be a function in class {}", resource_path.join("."))).clone();

        let parameter_count = method.get::<&str, usize>("length").unwrap_or_else(|_| panic!("Failed to get parameter count of exported method {name} in class {}", resource_path.join(".")));
        if parameter_count != args.num_args() {
            panic!(
                "The WIT specification defines {} parameters,\nbut the exported JavaScript method got {} parameters (exported method {} of class {} representing a resource defined in WIT package {})",
                args.num_args(),
                parameter_count,
                name,
                resource_path.join("."),
                wit_package
            );
        }

        let result: Result<Value, Error> = call_with_this(ctx.clone(), method, resource_instance, args);

        match result {
            Err(Error::Exception) => {
                let exception = ctx.catch();
                if let Some(result) = try_map_exception(&ctx, &exception) {
                    result
                } else {
                    panic!("Exception during call of method {name} in {path}:\n{exception}", path=resource_path.join("."), exception = format_js_exception(&exception));
                }
            }
            Err(e) => {
                panic!("Error during call of method {name} in {path}:\n{e:?}", path=resource_path.join("."));
            }
            Ok(value) => {
                if value.is_promise() {
                    let promise: Promise = value.into_promise().unwrap();
                    let promise_future = promise.into_future::<R> ();
                    match promise_future.await {
                        Ok(result) => {
                            map_result(result)
                        }
                        Err(e) => {
                            match e {
                                Error::Exception => {
                                    let exception = ctx.catch();
                                    if let Some(result) = try_map_exception(&ctx, &exception) {
                                        result
                                    } else {
                                        panic!("Exception during awaiting call result of method {name} in {path}:\n{exception:?}", path=resource_path.join("."), exception = format_js_exception(&exception));
                                    }
                                }
                                _ => {
                                    panic!("Error during awaiting call result of method {name} in {path}:\n{e:?}", path=resource_path.join("."));
                                }
                            }
                        }
                    }
                }
                else {
                    map_result(R::from_js(&ctx, value).unwrap_or_else(|err| panic!("Unexpected result value for method {name} in exported class {path}: {err}",
                                path=resource_path.join("."))))
                }
            }
        }
    }).await;
    drain_and_idle(js_state).await;
    result
}

pub fn enqueue_drop_js_resource(resource_id: usize) {
    let js_state = get_js_state();
    js_state
        .resource_drop_queue_tx
        .unbounded_send(resource_id)
        .expect("Failed to enqueue resource drop");
}

async fn drop_js_resource(resource_id: usize) {
    let js_state = get_js_state();

    async_with!(js_state.ctx => |ctx| {
        let resource_table: Object = ctx.globals().get(RESOURCE_TABLE_NAME)
            .expect("Failed to get the resource table");
        if let Err(e) = resource_table.remove(resource_id.to_string()) {
            panic!("Failed to delete resource {resource_id}: {e:?}");
        }
    })
    .await;
    js_state.rt.idle().await;
}

fn call_with_this<'js, A, R>(
    ctx: Ctx<'js>,
    function: Function<'js>,
    this: Object<'js>,
    args: A,
) -> rquickjs::Result<R>
where
    A: IntoArgs<'js>,
    R: FromJs<'js>,
{
    let num = args.num_args();
    let mut accum_args = Args::new(ctx.clone(), num + 1);
    accum_args.this(this)?;
    args.into_args(&mut accum_args)?;
    function.call_arg(accum_args)
}

fn get_path<'js, V: FromJs<'js>>(root: &Object<'js>, path: &[&str]) -> Option<(V, Object<'js>)> {
    let (head, tail) = path.split_first()?;
    if tail.is_empty() {
        root.get(*head).ok().map(|v| (v, root.clone()))
    } else {
        let next: Object<'js> = root.get(*head).ok()?;
        get_path(&next, tail)
    }
}

fn dump_cannot_find_export(
    what: &str,
    path: &[&str],
    module: &Object,
    wit_package: &str,
) -> String {
    let mut panic_message = String::new();
    panic_message.push_str(&format!(
        "Cannot find {what} {} of WIT package {wit_package}",
        path.join(".")
    ));
    panic_message.push_str("\nProvided exports:\n");
    let mut keys: Vec<String> = vec![];
    for key in module.keys().flatten() {
        keys.push(key);
    }
    keys.sort();
    panic_message.push_str(&format!("  {}\n", keys.join(", ")));

    if path.len() == 1 {
        panic_message.push_str(&format!(
            "\nTry adding an export `export const {} = ...`\n",
            path[0]
        ));
    } else if path.len() > 1 {
        let mut current_object = module.clone();
        for i in 0..path.len() {
            match current_object.get::<&str, Object>(path[i]) {
                Ok(child) => {
                    current_object = child;
                }
                Err(_) => {
                    if i == 0 {
                        panic_message.push_str(&format!(
                            "\nTry adding an export `export const {} = {{ ... }}`\n",
                            path[i]
                        ));
                    } else {
                        panic_message.push_str(&format!("\nKeys in {}:\n", path[..i].join(".")));
                        let mut keys: Vec<String> = vec![];
                        for key in current_object.keys().flatten() {
                            keys.push(key);
                        }
                        keys.sort();
                        panic_message.push_str(&format!("  {}\n", keys.join(", ")));

                        panic_message.push_str(&format!(
                            "\nTry adding a field `{}` to {}\n",
                            path[i],
                            path[..i].join(".")
                        ));
                    }
                    break;
                }
            }
        }
    }
    panic_message
}

fn dump_cannot_find_method(
    name: &str,
    resource_path: &[&str],
    class_instance: &Object,
    wit_package: &str,
) -> String {
    let mut panic_message = String::new();
    panic_message.push_str(&format!(
        "Cannot find method {name} in an instance of class {path} of WIT package {wit_package}",
        path = resource_path.join(".")
    ));
    if let Some(prototype) = class_instance.get_prototype() {
        panic_message.push_str("\nKeys in the instance's prototype:\n");
        let mut keys: Vec<String> = vec![];
        for key in prototype
            .own_keys(Filter::new().symbol().string().private())
            .flatten()
        {
            keys.push(key);
        }
        keys.sort();
        panic_message.push_str(&format!("  {}\n", keys.join(", ")));
    }

    panic_message.push_str(&format!(
        "\nTry adding a method `{}() {{ ... }}` to class {path}\n",
        name,
        path = resource_path.join(".")
    ));

    panic_message
}

pub fn format_js_exception(exc: &Value) -> String {
    try_format_js_error(exc)
        .or_else(|| try_format_tagged_error(exc))
        .unwrap_or_else(|| {
            let formatted_exc = pretty_stringify_or_debug_print(exc);
            if formatted_exc.contains("\n") {
                format!("JavaScript exception:\n{formatted_exc}",)
            } else {
                format!("JavaScript exception: {formatted_exc}",)
            }
        })
}

pub fn try_format_js_error(err: &Value) -> Option<String> {
    let error_ctor: Object = err.ctx().globals().get("Error").ok()?;
    let obj = err.as_object()?;

    if !obj.is_instance_of(error_ctor) {
        return None;
    }

    let message: Option<String> = obj.get("message").ok();
    let stack: Option<String> = obj.get("stack").ok();

    match (message, stack) {
        (Some(msg), Some(st)) => Some(format!("JavaScript error: {msg}\nStack:\n{st}")),
        (Some(msg), None) => Some(format!("JavaScript error: {msg}")),
        (None, Some(st)) => Some(format!("JavaScript error: <no message>\nStack:\n{st}")),
        _ => None,
    }
}

pub fn try_format_tagged_error(err: &Value) -> Option<String> {
    let obj = err.as_object()?;
    let tag: Option<String> = obj.get("tag").ok();
    let val: Option<Value> = obj.get("val").ok();
    let val = val.and_then(|v| (!v.is_undefined()).then_some(v));

    match (tag, val) {
        (Some(tag), Some(val)) => {
            let formatted_val = pretty_stringify_or_debug_print(&val);
            if formatted_val.contains("\n") {
                Some(format!("Error: {tag}:\n{formatted_val}"))
            } else {
                Some(format!("Error: {tag}: {formatted_val}"))
            }
        }
        (Some(tag), None) => Some(format!("Error: {tag}")),
        _ => None,
    }
}

fn pretty_stringify_or_debug_print(val: &Value) -> String {
    if let Some(formatted) = try_pretty_stringify(val) {
        formatted
    } else {
        format!("{val:#?}")
    }
}

fn try_pretty_stringify(val: &Value) -> Option<String> {
    if val.is_undefined() {
        return Some("undefined".to_string());
    }

    // Return strings as they are
    if let Some(str) = val.as_string() {
        return str.to_string().ok();
    }

    // For other values try to use JSON.stringify()
    let json: Object = val.ctx().globals().get("JSON").ok()?;
    let stringify: Function = json.get("stringify").ok()?;
    let res: Result<String, Error> = stringify.call((val, rquickjs::Undefined, 2));
    res.ok()
}

pub fn format_caught_error(caught: CaughtError) -> String {
    match caught {
        CaughtError::Error(e) => {
            format!("Host error: {e:?}")
        }
        CaughtError::Exception(exc) => format_js_exception(&exc.into_value()),
        CaughtError::Value(val) => format_js_exception(&val),
    }
}

#[cfg(test)]
mod cjs_export_analyzer_tests {
    use super::*;

    fn assert_analysis(
        source: &str,
        is_cjs: bool,
        exports: &[&str],
        reexports: &[&str],
    ) {
        let analysis = analyze_cjs_exports(source);
        assert_eq!(analysis.is_cjs, is_cjs, "is_cjs mismatch for {source}");
        assert_eq!(analysis.exports, exports, "exports mismatch for {source}");
        assert_eq!(
            analysis.reexports, reexports,
            "reexports mismatch for {source}"
        );
    }

    fn assert_cjs_global(source: &str, expected: Option<&str>) {
        assert_eq!(
            find_bare_cjs_global_in_esm(source),
            expected,
            "CJS global detection mismatch for {source}"
        );
    }

    #[test]
    fn detects_supported_cjs_export_patterns() {
        assert_analysis(
            r#"
                exports.foo = 1;
                module.exports.bar = 2;
                exports["baz"] = 3;
                Object.defineProperty(exports, "valueExport", { value: 4 });
                Object.defineProperty(module.exports, "getterExport", { get() { return dep.value; } });
                Object.defineProperty(exports, "functionGetter", { get: function () { return dep["other"]; } });
            "#,
            true,
            &["foo", "bar", "baz", "valueExport", "getterExport", "functionGetter"],
            &[],
        );
    }

    #[test]
    fn malformed_non_ascii_escapes_do_not_panic() {
        assert_analysis(r#"exports["\xaé"] = 1;"#, false, &[], &[]);
        assert_analysis(r#"exports["\uabcé"] = 1;"#, false, &[], &[]);
    }

    #[test]
    fn detects_module_exports_assignments_with_comments() {
        assert_analysis(r#"module /*x*/ . /*y*/ exports = {};"#, true, &[], &[]);
        assert_analysis(
            r#"module /*x*/ . /*y*/ exports = require("./dep.cjs");"#,
            true,
            &[],
            &["./dep.cjs"],
        );
        assert_analysis(
            r#"module.exports = require("./dep.cjs").nested;"#,
            true,
            &[],
            &[],
        );
        assert_analysis(
            r#"module.exports = require("./dep.cjs")();"#,
            true,
            &[],
            &[],
        );
        assert_analysis(
            r#"
                var dep = require("./dep.cjs").nested;
                Object.keys(dep).forEach(function (key) {
                    Object.defineProperty(exports, key, { get: function () { return dep[key]; } });
                });
                exports.own = "own";
            "#,
            true,
            &["own"],
            &[],
        );
    }

    #[test]
    fn detects_module_exports_object_literal_names_and_spread_reexports() {
        assert_analysis(
            r#"
                const a = 1;
                const c = 2;
                const e = 4;
                module.exports = { a, b: c, "d": e, ...require("./dep.cjs") };
            "#,
            true,
            &["a", "b", "d"],
            &["./dep.cjs"],
        );

        assert_analysis(
            r#"
                const a = 1;
                module.exports = { a, dynamic: factory() };
            "#,
            true,
            &["a", "dynamic"],
            &[],
        );

        assert_analysis(
            r#"
                const a = 1;
                module.exports = { a, b: require("./dep.cjs"), c: "not-detected" };
            "#,
            true,
            &["a", "b"],
            &["./dep.cjs"],
        );

        assert_analysis(
            r#"
                const a = 1;
                const c = 3;
                module.exports = { a, ...require("./dep.cjs"), c };
            "#,
            true,
            &["a", "c"],
            &["./dep.cjs"],
        );

        assert_analysis(
            r#"
                const a = 1;
                module.exports = { a, [dynamic]: value, c: "not-detected" };
            "#,
            true,
            &["a"],
            &[],
        );
    }

    #[test]
    fn detects_only_documented_export_star_helper_reexports() {
        assert_analysis(
            r#"
                __export(require("./dep-a.cjs"));
                __exportStar(require("./dep-b.cjs"), exports);
                tslib.__export(require("./dep-c.cjs"), exports);
                tslib.__exportStar(require("./dep-d.cjs"), exports);
                exports.own = "own";
            "#,
            true,
            &["own"],
            &["./dep-a.cjs", "./dep-b.cjs", "./dep-c.cjs", "./dep-d.cjs"],
        );

        assert_analysis(
            r#"
                function nested() {
                    __export(require("./dep-a.cjs"));
                }
                nested();
                helper.__export(require("./dep-b.cjs"), exports);
                __export(require(depName));
                exports.own = "own";
            "#,
            true,
            &["own"],
            &[],
        );
    }

    #[test]
    fn require_binding_alone_does_not_classify_esm_as_cjs() {
        assert_analysis(
            r#"
                import { createRequire } from "node:module";
                const require = createRequire(import.meta.url);
                const dep = require("./dep.cjs");
                export const value = dep.value;
            "#,
            false,
            &[],
            &[],
        );
    }

    #[test]
    fn detects_free_cjs_globals_for_esm_diagnostics() {
        assert_cjs_global("require;", Some("require"));
        assert_cjs_global("require('x');", Some("require"));
        assert_cjs_global("exports = {};", Some("exports"));
        assert_cjs_global("module;", Some("module"));
        assert_cjs_global("__filename;", Some("__filename"));
        assert_cjs_global("__dirname;", Some("__dirname"));
    }

    #[test]
    fn ignores_bound_or_non_free_cjs_global_names() {
        assert_cjs_global("export default { require: 1 };", None);
        assert_cjs_global("export default import.meta.require;", None);
        assert_cjs_global("const require = 1; export default require;", None);
        assert_cjs_global("let exports = 1; export default exports;", None);
        assert_cjs_global("var module = 1; export default module;", None);
        assert_cjs_global("class __dirname {} export default __dirname;", None);
        assert_cjs_global(
            "import require from 'data:text/javascript,export default 1'; export default require;",
            None,
        );
        assert_cjs_global(
            "import * as module from 'data:text/javascript,export default {}'; export default module;",
            None,
        );
        assert_cjs_global(
            "import { value as exports } from 'data:text/javascript,export const value = 1'; export default exports;",
            None,
        );
        assert_cjs_global(
            "function f(require) { return require; } export default f(1);",
            None,
        );
        assert_cjs_global("const f = (require) => require; export default f(1);", None);
        assert_cjs_global("export default ((require) => require)(1);", None);
        assert_cjs_global(
            "const {\n  module\n} = { module: 1 };\nexport default module;",
            None,
        );
        assert_cjs_global("const x = 0,\n  require = 1;\nexport default require;", None);
        assert_cjs_global(
            "export default { require() { return 1; }, f(module) { return module; } }.f(2);",
            None,
        );
        assert_cjs_global("export default { async require() { return 1; } };", None);
        assert_cjs_global("export default { *module() { yield 1; } }.module().next().value;", None);
        assert_cjs_global("export default { get exports() { return 1; } }.exports;", None);
        assert_cjs_global("export default { \"x\"(require) { return require; } }.x(1);", None);
        assert_cjs_global("export default { /* comment */ require() { return 1; } }.require();", None);
        assert_cjs_global("function* module() { yield 1; } export default module;", None);
    }

    #[test]
    fn package_type_diagnostics_use_first_cjs_global() {
        let require_diag = esm_preflight_error_module_source("require('x');", true).unwrap();
        assert!(require_diag.contains("require is not defined"));
        assert!(require_diag.contains(".cjs"));

        let filename_diag = esm_preflight_error_module_source("console.log(__filename);", true).unwrap();
        assert!(filename_diag.contains("__filename is not defined"));
        assert!(filename_diag.contains(".cjs"));

        assert!(esm_preflight_error_module_source("const require = 1; export default require;", true).is_none());
    }

    #[test]
    fn require_redeclaration_scanner_skips_non_code() {
        assert!(has_cjs_wrapper_require_redeclaration("const require = 1;"));
        assert!(has_cjs_wrapper_require_redeclaration("let /*x*/ require = 1;"));
        assert!(!has_cjs_wrapper_require_redeclaration(
            "const text = `const require = 1`; export default text;"
        ));
        assert!(!has_cjs_wrapper_require_redeclaration(
            "// const require = 1\nexport default 1;"
        ));
        assert!(!has_cjs_wrapper_require_redeclaration(
            "const re = /const require = 1/; export default re;"
        ));
        assert!(!has_cjs_wrapper_require_redeclaration(
            "function f() { const require = 1; return require; }"
        ));
    }

    #[test]
    fn ignores_false_positive_assignments_and_define_property_descriptors() {
        assert_analysis(
            r#"
                if (module.exports === undefined) {}
                if (exports.fake == "no") {}
                const template = `exports.templateOnly = "no";`;
                Object.defineProperty(exports, "setterOnly", { set(v) { return dep.value; } });
                Object.defineProperty(exports, "unrelated", { other: function () { return dep.value; } });
                Object.defineProperty(exports, "regexDescriptor", { enumerable: /value:/ });
                Object.defineProperty(exports, "multipleReturn", { get() { return dep.value; return dynamic(); } });
                Object.defineProperty(exports, "conditionalReturn", { get() { if (dep) return dep.value; return dynamic(); } });
            "#,
            false,
            &[],
            &[],
        );
    }

    #[test]
    fn detects_only_real_transpiler_reexport_callbacks() {
        assert_analysis(
            r#"
                var _dep = require("./dep.cjs");
                Object.keys(_dep).forEach(function (key) {
                    const π = 1;
                    Object.defineProperty(exports, key, {
                        enumerable: true,
                        get: function () { return _dep[key]; }
                    });
                });
                exports.own = "own";
            "#,
            true,
            &["own"],
            &["./dep.cjs"],
        );

        assert_analysis(
            r#"
                var _dep = require("./dep.cjs");
                Object.keys(_dep).forEach(function (key) {
                    const msg = "Object.defineProperty(exports, key, { get: function () { return _dep[key]; } })";
                });
                exports.own = "own";
            "#,
            true,
            &["own"],
            &[],
        );

        assert_analysis(
            r#"
                var _dep = require("./dep.cjs");
                Object.keys(_dep).forEach(function (key) {
                    Object.defineProperty(other, key, { value: 1 });
                    exports;
                    function unrelated() { return _dep[key]; }
                });
                exports.own = "own";
            "#,
            true,
            &["own"],
            &[],
        );

        assert_analysis(
            r#"
                var dep = require("./dep.cjs");
                Object.keys(dep).forEach(function (key) {
                    if (key === "default" || key === "__esModule") return;
                    exports[key] = dep[key];
                });
                exports.own = "own";
            "#,
            true,
            &["own"],
            &["./dep.cjs"],
        );

        assert_analysis(
            r#"
                var dep = require("./dep.cjs");
                Object.keys(dep).forEach(function (key) {
                    exports[key] = other[key];
                });
                exports.own = "own";
            "#,
            true,
            &["own"],
            &[],
        );

        assert_analysis(
            r#"
                var _dep = _interopRequireWildcard(require("./dep.cjs"));
                Object.keys(_dep).forEach(function (key) {
                    if (key === "default" || key === "__esModule") return;
                    if (Object.prototype.hasOwnProperty.call(exports, key)) return;
                    exports[key] = _dep[key];
                });
                exports.own = "own";
            "#,
            true,
            &["own"],
            &["./dep.cjs"],
        );

        assert_analysis(
            r#"
                var _dep = _interopWildcard(require("./dep.cjs"));
                Object.keys(_dep).forEach(function (key) {
                    exports[key] = _dep[key];
                });
                exports.own = "own";
            "#,
            true,
            &["own"],
            &[],
        );

        assert_analysis(
            r#"
                var name = "./dep.cjs";
                var _dep = _interopRequireWildcard(require(name));
                Object.keys(_dep).forEach(function (key) {
                    exports[key] = _dep[key];
                });
                exports.own = "own";
            "#,
            true,
            &["own"],
            &[],
        );
    }
}

/// Wizer pre-initialization entry point: full initialization including user module.
/// After Wizer snapshots this state, the runtime is ready to handle exports immediately.
#[allow(static_mut_refs)]
pub fn wizer_initialize() {
    // Mark Wizer pre-init as active so built-in modules avoid touching
    // std::fs / std::env: those would trigger wasi-libc's lazy preopen-cache
    // population with the empty wizer environment, and the broken cache would
    // then be snapshotted into the pre-initialized component (issue #91).
    WIZER_ACTIVE.store(true, std::sync::atomic::Ordering::Relaxed);

    unsafe {
        // Phase 1: Create runtime
        STATE = Some(block_on(JsState::new_base()));

        // Mark as Initializing so re-entrant get_js_state() calls (e.g.
        // from setTimeout callbacks during module init) return the existing
        // state instead of re-running initialization.
        INIT_PHASE = InitPhase::Initializing;

        // Phase 2: Full initialization
        block_on(STATE.as_ref().unwrap().finish_init());

        // Run GC to compact the heap before snapshot
        block_on(async {
            let state = STATE.as_ref().unwrap();
            drain_and_idle(state).await;
            async_with!(state.ctx => |ctx| {
                ctx.run_gc();
                ctx.run_gc();
            })
            .await;
            drain_and_idle(state).await;

            // Verify clean state
            assert!(
                state.abort_handles.borrow().is_empty(),
                "pending timers/tasks at snapshot time"
            );
            assert!(
                state.unrefed_timers.borrow().is_empty(),
                "unrefed timers still tracked at snapshot time"
            );
        });

        INIT_PHASE = InitPhase::WizerPreInitialized;
    }

    WIZER_ACTIVE.store(false, std::sync::atomic::Ordering::Relaxed);
}
