use futures::future::AbortHandle;
use futures_concurrency::future::Join;
use indexmap::IndexMap;
use rquickjs::convert::Coerced;
use rquickjs::function::{Args, Constructor, This};
use rquickjs::loader::{BuiltinLoader, BuiltinResolver, FileResolver, Loader, Resolver};
use rquickjs::object::Property;
use rquickjs::{
    AsyncContext, AsyncRuntime, CatchResultExt, Ctx, Error, Filter, FromJs, Function, Module,
    Object, Promise, Value, async_with, Exception,
};
use rquickjs::{CaughtError, prelude::*};
use serde::de::Error as SerdeError;
use serde::{Deserialize, Deserializer};
use std::borrow::Cow;
use std::cell::RefCell;
use std::collections::{HashMap, HashSet};
use std::future::Future;
use std::ops::ControlFlow;
use std::rc::Rc;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};
use wstd::runtime::block_on;

fn throw_native_coded_error<'js, T>(
    ctx: &Ctx<'js>,
    message: &str,
    code: &str,
    type_error: bool,
) -> rquickjs::Result<T> {
    let error_value = if type_error {
        let _ = Exception::throw_type(ctx, message);
        ctx.catch()
    } else {
        Exception::from_message(ctx.clone(), message)?.into_value()
    };
    let Some(error_obj) = error_value.clone().into_object() else {
        return Err(ctx.throw(error_value));
    };
    error_obj.prop(
        "code",
        Property::from(code).writable().enumerable().configurable(),
    )?;
    Err(ctx.throw(error_obj.into_value()))
}

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

struct PrivateBuiltinResolverGuard;

impl PrivateBuiltinResolverGuard {
    fn is_private_builtin(name: &str) -> bool {
        name.starts_with("__wasm_rquickjs_builtin/")
    }

    fn is_user_referrer(base: &str) -> bool {
        base == crate::JS_EXPORT_MODULE_NAME
            || base == "<input>"
            || crate::JS_ADDITIONAL_MODULES
                .iter()
                .any(|(name, _)| base == *name)
            || base.starts_with("data:")
            || base.starts_with("file:")
            || base.starts_with('/')
            || base.starts_with("virtual:")
    }
}

impl Resolver for PrivateBuiltinResolverGuard {
    fn resolve<'js>(&mut self, ctx: &Ctx<'js>, base: &str, name: &str) -> rquickjs::Result<String> {
        if !Self::is_private_builtin(name) || !Self::is_user_referrer(base) {
            return Err(Error::new_resolving(base, name));
        }

        let message = format!("Cannot find module '{}'", name);
        throw_native_coded_error(ctx, &message, "ERR_MODULE_NOT_FOUND", false)
    }
}

/// Loader for `data:` URL modules (e.g. `data:text/javascript,export default 42`).
struct DataUrlLoader;

impl DataUrlLoader {
    fn content_separator_pos(rest: &str) -> Option<usize> {
        rest.find(',')
    }

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
        format!("export default undefined;\nawait Promise.reject(new SyntaxError('{escaped_msg}'));\n")
    }
}

impl Loader for DataUrlLoader {
    fn load<'js>(
        &mut self,
        ctx: &Ctx<'js>,
        path: &str,
    ) -> rquickjs::Result<Module<'js, rquickjs::module::Declared>> {
        let path_without_suffix = module_filesystem_path(path);
        let rest = path_without_suffix
            .strip_prefix("data:")
            .ok_or_else(|| Error::new_loading(path))?;

        // Find the comma separating metadata from content
        let comma_pos = Self::content_separator_pos(rest).ok_or_else(|| Error::new_loading(path))?;
        let metadata = &rest[..comma_pos];
        let raw_content = rest[comma_pos + 1..]
            .split_once('#')
            .map(|(content, _)| content)
            .unwrap_or(&rest[comma_pos + 1..]);

        // Parse metadata: e.g. "text/javascript" or "text/javascript;base64".
        let is_base64 = metadata
            .split(';')
            .skip(1)
            .any(|part| part.eq_ignore_ascii_case("base64"));

        // Extract base MIME type (before any parameters)
        let base_mime = metadata.split(';').next().unwrap_or(metadata).trim();

        let json_import_attr = if base_mime == "application/json" {
            import_attr_type_from_path(path)
        } else {
            None
        };

        let source = if is_base64 {
            // Simple base64 decoder for ASCII content
            let decoded = base64_decode(raw_content).ok_or_else(|| Error::new_loading(path))?;
            String::from_utf8(decoded).map_err(|_| Error::new_loading(path))?
        } else {
            Self::percent_decode(raw_content).ok_or_else(|| Error::new_loading(path))?
        };

        if base_mime == "application/json" {
            if json_import_attr.as_deref() != Some("json") {
                let escaped = DataUrlLoader::js_string_escape(path);
                let module_source = format!(
                    "await Promise.reject(Object.assign(new TypeError('Module \"{escaped}\" needs an import attribute of type: json'), {{code: 'ERR_IMPORT_ATTRIBUTE_MISSING'}}));\n"
                );
                return Module::declare(ctx.clone(), path, module_source.as_bytes().to_vec());
            }
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
            if let Some(error_source) = esm_preflight_error_module_source(&source, false, false) {
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

const IMPORT_TYPE_QUERY_PREFIX: &str = "__wasm_rquickjs_import_type=";

thread_local! {
    static IMPORT_ATTR_REWRITE_TOKENS: RefCell<HashMap<String, String>> = RefCell::new(HashMap::new());
}

static IMPORT_ATTR_REWRITE_SEQ: AtomicUsize = AtomicUsize::new(1);

fn next_import_attr_rewrite_token(import_type: &str) -> String {
    let seq = IMPORT_ATTR_REWRITE_SEQ.fetch_add(1, Ordering::Relaxed);
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_nanos())
        .unwrap_or(seq as u128);
    format!("{import_type}-{seq:x}-{nonce:x}")
}

fn register_import_attr_rewrite(token: &str, rewritten_specifier: &str) {
    IMPORT_ATTR_REWRITE_TOKENS.with(|tokens| {
        tokens
            .borrow_mut()
            .insert(token.to_string(), rewritten_specifier.to_string());
    });
}

fn existing_import_attr_rewrite(specifier: &str, import_type: &str) -> Option<String> {
    IMPORT_ATTR_REWRITE_TOKENS.with(|tokens| {
        tokens.borrow().iter().find_map(|(token, rewritten)| {
            let (token_import_type, _) = token.split_once('-')?;
            if token_import_type == import_type && strip_import_type_rewrite_token(rewritten) == specifier {
                Some(rewritten.clone())
            } else {
                None
            }
        })
    })
}

fn consume_import_type_rewrite_token(token: &str, path: &str) -> Option<String> {
    IMPORT_ATTR_REWRITE_TOKENS.with(|tokens| {
        let mut tokens = tokens.borrow_mut();
        if tokens.get(token).is_some_and(|specifier| specifier == path) {
            tokens.remove(token);
            token.split_once('-').map(|(import_type, _)| import_type.to_string())
        } else {
            None
        }
    })
}

fn transfer_import_type_rewrite_token(unresolved: &str, resolved: &str) {
    let token = import_type_rewrite_token(unresolved);
    if let Some(token) = token {
        IMPORT_ATTR_REWRITE_TOKENS.with(|tokens| {
            let mut tokens = tokens.borrow_mut();
            if tokens
                .get(token)
                .is_some_and(|specifier| specifier == unresolved)
            {
                tokens.insert(token.to_string(), resolved.to_string());
            }
        });
    }
}

fn discard_import_type_rewrite_token(path: &str) {
    let token = import_type_rewrite_token(path);
    if let Some(token) = token {
        IMPORT_ATTR_REWRITE_TOKENS.with(|tokens| {
            let mut tokens = tokens.borrow_mut();
            if tokens.get(token).is_some_and(|specifier| specifier == path) {
                tokens.remove(token);
            }
        });
    }
}

fn discard_generated_import_type_rewrite_token(path: &str) {
    let token = import_type_rewrite_token(path);
    if let Some(token) = token {
        IMPORT_ATTR_REWRITE_TOKENS.with(|tokens| {
            tokens.borrow_mut().remove(token);
        });
    }
}

fn import_type_rewrite_token(path: &str) -> Option<&str> {
    if let Some(rest) = path.strip_prefix("data:")
        && let Some(comma_pos) = DataUrlLoader::content_separator_pos(rest)
    {
        let metadata = &rest[..comma_pos];
        return metadata
            .split(';')
            .find_map(|part| part.strip_prefix(IMPORT_TYPE_QUERY_PREFIX));
    }

    let suffix = split_module_path_suffix(path).1;
    if suffix.is_empty() {
        return None;
    }
    let query = suffix
        .strip_prefix('?')
        .or_else(|| suffix.strip_prefix('#'))
        .unwrap_or(suffix);
    query
        .split(['&', '#'])
        .find_map(|part| part.strip_prefix(IMPORT_TYPE_QUERY_PREFIX))
}

fn has_import_type_rewrite_token(path: &str) -> bool {
    import_type_rewrite_token(path).is_some_and(|token| {
        IMPORT_ATTR_REWRITE_TOKENS.with(|tokens| {
            tokens
                .borrow()
                .get(token)
                .is_some_and(|specifier| specifier == path)
        })
    })
}

fn read_import_specifier_literal(
    source: &str,
    pos: usize,
) -> Option<(usize, usize, usize, usize)> {
    let bytes = source.as_bytes();
    if !matches!(bytes.get(pos), Some(b'"' | b'\'')) {
        return None;
    }

    let literal_start = pos;
    let quote = bytes[pos];
    let mut i = pos + 1;
    let specifier_start = i;
    while i < bytes.len() && bytes[i] != quote {
        if bytes[i] == b'\\' {
            i += 1;
        }
        i += 1;
    }
    let specifier_end = i;
    if i < bytes.len() {
        i += 1;
    }
    Some((literal_start, i, specifier_start, specifier_end))
}

fn read_closed_import_specifier_literal(
    source: &str,
    pos: usize,
) -> Option<(usize, usize, usize, usize)> {
    let literal = read_import_specifier_literal(source, pos)?;
    let bytes = source.as_bytes();
    if literal.1 <= pos + 1 || literal.1 > bytes.len() || bytes.get(literal.1 - 1) != bytes.get(pos) {
        return None;
    }
    Some(literal)
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
        if let Some(next) = skip_non_code(source, i, true) {
            result.push_str(&source[i..next]);
            i = next;
            continue;
        }

        // Look for 'import' keyword
        if bytes[i] == b'i'
            && i + 6 <= len
            && &source[i..i + 6] == "import"
            && (i == 0 || !is_id_char(bytes[i - 1]))
            && (i == 0 || (bytes[i - 1] != b'.' && bytes[i - 1] != b'#'))
            && (i + 6 >= len
                || !is_id_char(bytes[i + 6])
                || bytes[i + 6] == b'"'
                || bytes[i + 6] == b'\'')
        {
            let import_start = i;
            i += 6;

            let mut specifier_literal = None;

            while i < len && bytes[i].is_ascii_whitespace() {
                i += 1;
            }

            if i < len && bytes[i] == b'(' {
                if is_object_method_shorthand_import(source, import_start, i) {
                    result.push_str(&source[import_start..i]);
                    continue;
                }
                if let Some((rewritten, next)) = rewrite_dynamic_import_call(source, import_start, i) {
                    result.push_str(&rewritten);
                    i = next;
                    continue;
                }
                result.push_str(&source[import_start..i]);
                continue;
            }

            if let Some(literal) = read_import_specifier_literal(source, i) {
                specifier_literal = Some(literal);
                i = literal.1;
            } else {
                while i < len {
                    if bytes[i] == b'f'
                        && i + 4 <= len
                        && &source[i..i + 4] == "from"
                        && (i == 0 || !is_id_char(bytes[i - 1]))
                        && (i + 4 >= len || !is_id_char(bytes[i + 4]))
                    {
                        let mut j = i + 4;
                        while j < len && bytes[j].is_ascii_whitespace() {
                            j += 1;
                        }
                        if let Some(literal) = read_import_specifier_literal(source, j) {
                            specifier_literal = Some(literal);
                            i = literal.1;
                            break;
                        }
                    }
                    if matches!(bytes[i], b';' | b'\n' | b'\r') {
                        break;
                    }
                    i += 1;
                }
            }

            if let Some((spec_lit_start, spec_lit_end, spec_start, spec_end)) = specifier_literal {
                let specifier = &source[spec_start..spec_end];

                // Skip whitespace
                let after_spec = i;
                while i < len && bytes[i].is_ascii_whitespace() {
                    i += 1;
                }

                if i + 6 <= len
                    && &source[i..i + 6] == "assert"
                    && (i + 6 >= len || !is_id_char(bytes[i + 6]))
                {
                    return "await Promise.reject(new SyntaxError('Unexpected identifier'));\n"
                        .to_string();
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
                                    let next = skip_string_or_template(source, i);
                                    i = if next == len && bytes.get(len - 1) != Some(&bytes[i]) {
                                        len + 1
                                    } else {
                                        next
                                    };
                                    continue;
                                }
                                _ => {}
                            }
                            i += 1;
                        }
                        let attrs_content = &source[attrs_start..if i > 0 { i - 1 } else { i }];

                        let attr_info = extract_import_attr_info(attrs_content);
                        if attr_info.type_non_string {
                            return syntax_error_module_source("Import attribute value must be a string");
                        }
                        let format = determine_data_url_format(specifier);

                        // Validate
                        if let Some(error_module) = validate_static_import_attrs(
                            attr_info.type_value.as_deref(),
                            attr_info.unsupported_key.as_deref(),
                            format,
                            specifier,
                            module_path,
                        ) {
                            return error_module;
                        }

                        // Valid: strip the with clause, keep everything else
                        result.push_str(&source[import_start..spec_lit_start]);
                        result.push_str(&rewrite_import_specifier_literal(
                            &source[spec_lit_start..spec_lit_end],
                            specifier,
                            attr_info.type_value.as_deref(),
                        ));
                        result.push_str(&source[spec_lit_end..after_spec]);
                        while i < len && bytes[i].is_ascii_whitespace() {
                            i += 1;
                        }
                        continue;
                    } else {
                        // 'with' not followed by '{', not import attrs
                        i = with_start;
                        result.push_str(&source[import_start..i]);
                        continue;
                    }
                }

                let format = determine_data_url_format(specifier);
                if let Some(error_module) =
                    validate_static_import_attrs(None, None, format, specifier, module_path)
                {
                    return error_module;
                }

                result.push_str(&source[import_start..i]);
                continue;
            }

            // Not a bare import string - check for named/namespace imports with 'from'
            // For now, scan for 'from' followed by a string and then 'with'
            // Skip complex patterns and output as-is
            result.push_str(&source[import_start..i]);
            continue;
        }

        if let Some(ch) = source[i..].chars().next() {
            result.push(ch);
            i += ch.len_utf8();
        } else {
            break;
        }
    }

    result
}

fn rewrite_import_specifier_literal(literal: &str, specifier: &str, type_value: Option<&str>) -> String {
    if type_value != Some("json") {
        return literal.to_string();
    }
    let rewritten = append_import_type_query(specifier, "json");
    format!("\"{}\"", escape_js_string(&rewritten))
}

fn rewrite_dynamic_import_call(
    source: &str,
    import_start: usize,
    open_paren: usize,
) -> Option<(String, usize)> {
    let bytes = source.as_bytes();
    let len = bytes.len();
    let mut i = open_paren + 1;
    while i < len && bytes[i].is_ascii_whitespace() {
        i += 1;
    }
    if i >= len || (bytes[i] != b'"' && bytes[i] != b'\'') {
        return rewrite_dynamic_import_expression_call(source, open_paren);
    }

    let (spec_literal_start, spec_literal_end, _, _) =
        read_closed_import_specifier_literal(source, i)?;
    i = spec_literal_end;

    while i < len && bytes[i].is_ascii_whitespace() {
        i += 1;
    }

    if i < len && bytes[i] == b')' {
        return Some((
            format!(
                "globalThis.__wasm_rquickjs_import_attr_dynamic_import(import.meta.url,{},undefined,true,(__wasm_rquickjs_prepared)=>import(__wasm_rquickjs_prepared))",
                &source[spec_literal_start..spec_literal_end]
            ),
            i + 1,
        ));
    }
    if i >= len || bytes[i] != b',' {
        return None;
    }
    i += 1;
    let options_start = i;
    let mut paren_depth = 1usize;
    let mut brace_depth = 0usize;
    while i < len {
        match bytes[i] {
            b'\'' | b'"' | b'`' => {
                i = skip_string_or_template(source, i);
                continue;
            }
            b'(' => paren_depth += 1,
            b')' => {
                paren_depth = paren_depth.saturating_sub(1);
                if paren_depth == 0 {
                    let options = &source[options_start..i];
                    return Some((
                        format!(
                            "globalThis.__wasm_rquickjs_import_attr_dynamic_import(import.meta.url,{},{},true,(__wasm_rquickjs_prepared)=>import(__wasm_rquickjs_prepared))",
                            &source[spec_literal_start..spec_literal_end],
                            options
                        ),
                        i + 1,
                    ));
                }
            }
            b'{' => brace_depth += 1,
            b'}' => brace_depth = brace_depth.saturating_sub(1),
            _ => {}
        }
        i += 1;
    }

    let _ = import_start;
    let _ = brace_depth;
    None
}

fn previous_non_whitespace_byte(source: &str, pos: usize) -> Option<u8> {
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

fn previous_non_whitespace_pos(source: &str, pos: usize) -> Option<usize> {
    let bytes = source.as_bytes();
    let mut i = pos;
    while i > 0 {
        i -= 1;
        if !bytes[i].is_ascii_whitespace() {
            return Some(i);
        }
    }
    None
}

fn previous_word(source: &str, pos: usize) -> Option<(&str, usize)> {
    let bytes = source.as_bytes();
    let mut end = pos;
    while end > 0 && bytes[end - 1].is_ascii_whitespace() {
        end -= 1;
    }
    let mut start = end;
    while start > 0 && is_id_char(bytes[start - 1]) {
        start -= 1;
    }
    (start < end).then_some((&source[start..end], start))
}

fn next_non_whitespace_byte(source: &str, pos: usize) -> Option<u8> {
    let bytes = source.as_bytes();
    let mut i = pos;
    while i < bytes.len() {
        if !bytes[i].is_ascii_whitespace() {
            return Some(bytes[i]);
        }
        i += 1;
    }
    None
}

fn matching_paren_end(source: &str, open_paren: usize) -> Option<usize> {
    let bytes = source.as_bytes();
    let mut i = open_paren + 1;
    let mut depth = 1usize;
    while i < bytes.len() {
        match bytes[i] {
            b'\'' | b'"' | b'`' => {
                i = skip_string_or_template(source, i);
                continue;
            }
            b'(' => depth += 1,
            b')' => {
                depth = depth.saturating_sub(1);
                if depth == 0 {
                    return Some(i + 1);
                }
            }
            _ => {}
        }
        i += 1;
    }
    None
}

fn method_prefix_boundary(source: &str, pos: usize) -> bool {
    matches!(
        previous_non_whitespace_byte(source, pos),
        None | Some(b'{') | Some(b',') | Some(b';')
    )
}

fn is_object_method_shorthand_import(source: &str, import_start: usize, open_paren: usize) -> bool {
    if matching_paren_end(source, open_paren)
        .and_then(|close| next_non_whitespace_byte(source, close))
        != Some(b'{')
    {
        return false;
    }
    if previous_word(source, import_start).is_some_and(|(word, _)| word == "static")
    {
        return true;
    }

    let bytes = source.as_bytes();
    let mut pos = import_start;
    loop {
        let Some(prev) = previous_non_whitespace_pos(source, pos) else {
            return false;
        };
        match bytes[prev] {
            b'{' | b',' | b';' => return true,
            b'*' => {
                pos = prev;
                continue;
            }
            _ => {}
        }

        let Some((word, start)) = previous_word(source, pos) else {
            return false;
        };
        if matches!(word, "async" | "get" | "set" | "static") {
            pos = start;
            continue;
        }
        return false;
    }
}

fn rewrite_dynamic_import_expression_call(source: &str, open_paren: usize) -> Option<(String, usize)> {
    let bytes = source.as_bytes();
    let len = bytes.len();
    let mut i = open_paren + 1;
    let expr_start = i;
    let mut paren_depth = 0usize;
    let mut bracket_depth = 0usize;
    let mut brace_depth = 0usize;
    while i < len {
        match bytes[i] {
            b'\'' | b'"' | b'`' => {
                i = skip_string_or_template(source, i);
                continue;
            }
            b'(' => paren_depth += 1,
            b')' if paren_depth == 0 && bracket_depth == 0 && brace_depth == 0 => {
                let expr = source[expr_start..i].trim();
                return Some((
                    format!(
                        "globalThis.__wasm_rquickjs_import_attr_dynamic_import(import.meta.url,{},undefined,true,(__wasm_rquickjs_prepared)=>import(__wasm_rquickjs_prepared))",
                        expr
                    ),
                    i + 1,
                ));
            }
            b')' => paren_depth = paren_depth.saturating_sub(1),
            b'[' => bracket_depth += 1,
            b']' => bracket_depth = bracket_depth.saturating_sub(1),
            b'{' => brace_depth += 1,
            b'}' => brace_depth = brace_depth.saturating_sub(1),
            b',' if paren_depth == 0 && bracket_depth == 0 && brace_depth == 0 => break,
            _ => {}
        }
        i += 1;
    }
    if i >= len || bytes[i] != b',' {
        return None;
    }
    let expr = source[expr_start..i].trim();
    i += 1;
    let options_start = i;
    let mut call_paren_depth = 1usize;
    while i < len {
        match bytes[i] {
            b'\'' | b'"' | b'`' => {
                i = skip_string_or_template(source, i);
                continue;
            }
            b'(' => call_paren_depth += 1,
            b')' => {
                call_paren_depth = call_paren_depth.saturating_sub(1);
                if call_paren_depth == 0 {
                    let options = &source[options_start..i];
                    return Some((
                        format!(
                            "globalThis.__wasm_rquickjs_import_attr_dynamic_import(import.meta.url,{},{},true,(__wasm_rquickjs_prepared)=>import(__wasm_rquickjs_prepared))",
                            expr, options
                        ),
                        i + 1,
                    ));
                }
            }
            _ => {}
        }
        i += 1;
    }
    None
}

#[derive(Default)]
struct ImportAttrInfo {
    type_value: Option<String>,
    unsupported_key: Option<String>,
    type_non_string: bool,
}

fn append_import_type_query(specifier: &str, import_type: &str) -> String {
    if let Some(rewritten) = existing_import_attr_rewrite(specifier, import_type) {
        return rewritten;
    }

    let token = next_import_attr_rewrite_token(import_type);
    if specifier.starts_with("data:") {
        if let Some(comma_pos) = specifier.strip_prefix("data:").and_then(DataUrlLoader::content_separator_pos) {
            let insert_pos = "data:".len() + comma_pos;
            let rewritten = format!(
                "{};{IMPORT_TYPE_QUERY_PREFIX}{token}{}",
                &specifier[..insert_pos],
                &specifier[insert_pos..]
            );
            register_import_attr_rewrite(&token, &rewritten);
            return rewritten;
        }
        return specifier.to_string();
    }
    let (base, suffix) = split_module_path_suffix(specifier);
    let separator = if suffix.is_empty() { "?" } else { "&" };
    let rewritten = format!("{base}{suffix}{separator}{IMPORT_TYPE_QUERY_PREFIX}{token}");
    register_import_attr_rewrite(&token, &rewritten);
    rewritten
}

fn import_attr_type_from_path(path: &str) -> Option<String> {
    import_type_rewrite_token(path)
        .and_then(|token| consume_import_type_rewrite_token(token, path))
}

fn strip_import_type_rewrite_token(path: &str) -> String {
    let Some(token) = import_type_rewrite_token(path) else {
        return path.to_string();
    };
    let marker = format!("{IMPORT_TYPE_QUERY_PREFIX}{token}");

    if let Some(rest) = path.strip_prefix("data:")
        && let Some(comma_pos) = DataUrlLoader::content_separator_pos(rest)
    {
        let metadata_end = "data:".len() + comma_pos;
        let metadata = &path[..metadata_end];
        if let Some(marker_start) = metadata.find(&marker) {
            let remove_start = marker_start
                .checked_sub(1)
                .filter(|idx| path.as_bytes().get(*idx) == Some(&b';'))
                .unwrap_or(marker_start);
            return format!("{}{}", &path[..remove_start], &path[marker_start + marker.len()..]);
        }
    }

    let (base, suffix) = split_module_path_suffix(path);
    if suffix.is_empty() {
        return path.to_string();
    }
    let Some(marker_start) = suffix.find(&marker) else {
        return path.to_string();
    };
    let remove_start = marker_start
        .checked_sub(1)
        .filter(|idx| matches!(suffix.as_bytes().get(*idx), Some(b'?') | Some(b'&')))
        .unwrap_or(marker_start);
    let mut stripped_suffix = String::with_capacity(suffix.len().saturating_sub(marker.len()));
    stripped_suffix.push_str(&suffix[..remove_start]);
    stripped_suffix.push_str(&suffix[marker_start + marker.len()..]);
    if stripped_suffix == "?" || stripped_suffix == "#" {
        base.to_string()
    } else {
        format!("{base}{stripped_suffix}")
    }
}

fn is_id_char(b: u8) -> bool {
    b.is_ascii_alphanumeric() || b == b'_' || b == b'$'
}

fn extract_import_attr_info(attrs: &str) -> ImportAttrInfo {
    let bytes = attrs.as_bytes();
    let len = bytes.len();
    let mut i = 0;
    let mut info = ImportAttrInfo::default();

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
        if key != "type" && info.unsupported_key.is_none() {
            info.unsupported_key = Some(key.to_string());
        }

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
                info.type_value = Some(val.to_string());
            }
        } else {
            if key == "type" {
                info.type_non_string = true;
            }
            // Skip non-string values
            while i < len && bytes[i] != b',' && bytes[i] != b'}' {
                i += 1;
            }
        }
    }
    info
}

/// Determine module format from a data URL specifier.
fn determine_data_url_format(specifier: &str) -> Option<&'static str> {
    if let Some(rest) = specifier.strip_prefix("data:") {
        if let Some(comma_pos) = DataUrlLoader::content_separator_pos(rest) {
            let metadata = &rest[..comma_pos];
            let base_mime = metadata.split(';').next().unwrap_or(metadata).trim();
            return match base_mime {
                "application/json" => Some("json"),
                "text/javascript" | "application/javascript" => Some("module"),
                "text/css" => Some("css"),
                _ => None,
            };
        }
    } else if specifier.starts_with("node:") {
        return Some("module");
    } else if module_filesystem_path(specifier).ends_with(".json") {
        return Some("json");
    } else if module_filesystem_path(specifier).ends_with(".js")
        || module_filesystem_path(specifier).ends_with(".mjs")
        || module_filesystem_path(specifier).ends_with(".cjs")
    {
        return Some("module");
    }
    None
}

/// Validate static import attributes. Returns Some(error_module_source) if invalid, None if valid.
fn validate_static_import_attrs(
    type_value: Option<&str>,
    unsupported_key: Option<&str>,
    format: Option<&str>,
    specifier: &str,
    _module_path: &str,
) -> Option<String> {
    let (code, message) = validate_import_attrs_error(type_value, unsupported_key, format, specifier)?;
    Some(import_attr_error_module_source(&code, &message))
}

fn validate_import_attrs_error(
    type_value: Option<&str>,
    unsupported_key: Option<&str>,
    format: Option<&str>,
    specifier: &str,
) -> Option<(String, String)> {
    if let Some(tv) = type_value {
        match tv {
            "json" => {
                if format == Some("module") {
                    return Some((
                        "ERR_IMPORT_ATTRIBUTE_TYPE_INCOMPATIBLE".to_string(),
                        "Cannot use import attributes to change the type of a JavaScript module"
                            .to_string(),
                    ));
                }
            }
            "css" => {
                if format != Some("css") {
                    return Some((
                        "ERR_IMPORT_ATTRIBUTE_UNSUPPORTED".to_string(),
                        "Import attribute type \"css\" is not supported".to_string(),
                    ));
                }
            }
            other => {
                return Some((
                    "ERR_IMPORT_ATTRIBUTE_UNSUPPORTED".to_string(),
                    format!("Import attribute type \"{other}\" is not supported"),
                ));
            }
        }
    }

    // Check for missing required attributes (JSON without type: "json")
    if format == Some("json") && type_value != Some("json") {
        return Some((
            "ERR_IMPORT_ATTRIBUTE_MISSING".to_string(),
            format!("Module \"{specifier}\" needs an import attribute of type: json"),
        ));
    }

    if let Some(key) = unsupported_key {
        return Some((
            "ERR_IMPORT_ATTRIBUTE_UNSUPPORTED".to_string(),
            format!("Import attribute \"{key}\" is not supported"),
        ));
    }

    None
}

fn import_attr_error_module_source(code: &str, message: &str) -> String {
    format!("await {};\n", import_attr_error_expression(code, message))
}

fn syntax_error_module_source(message: &str) -> String {
    let escaped = DataUrlLoader::js_string_escape(message);
    format!("await Promise.reject(new SyntaxError('{escaped}'));\n")
}

fn import_attr_error_expression(code: &str, message: &str) -> String {
    let escaped_message = DataUrlLoader::js_string_escape(message);
    let escaped_code = DataUrlLoader::js_string_escape(code);
    format!(
        "Promise.reject(Object.assign(new TypeError('{escaped_message}'), {{code: '{escaped_code}'}}))"
    )
}

fn throw_import_attr_type_incompatible<'js, T>(ctx: &Ctx<'js>) -> rquickjs::Result<T> {
    let globals = ctx.globals();
    let type_error_ctor: Function = globals.get("TypeError")?;
    let error_obj: Object =
        type_error_ctor.call(("Cannot use import attributes to change the type of a JavaScript module",))?;
    error_obj.set("code", "ERR_IMPORT_ATTRIBUTE_TYPE_INCOMPATIBLE")?;
    Err(ctx.throw(error_obj.into_value()))
}

fn esm_preflight_error_module_source(
    source: &str,
    package_type_module_js: bool,
    raw_cjs_global_messages: bool,
) -> Option<String> {
    if package_type_module_js {
        let cjs_global = find_bare_cjs_global_in_esm(source);
        if cjs_global.is_none() {
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
    let message = if raw_cjs_global_messages {
        match name {
            "require" => "require is not defined",
            "exports" => "exports is not defined",
            "module" => "module is not defined",
            "__filename" => "__filename is not defined",
            "__dirname" => "__dirname is not defined",
            _ => return None,
        }
    } else {
        match name {
            "require" => "require is not defined in ES module scope, you can use import instead",
            "exports" => "exports is not defined in ES module scope",
            "module" => "module is not defined in ES module scope",
            "__filename" => "__filename is not defined in ES module scope",
            "__dirname" => "__dirname is not defined in ES module scope",
            _ => return None,
        }
    };
    let escaped = DataUrlLoader::js_string_escape(message);
    Some(format!(
        "await Promise.reject(new ReferenceError('{escaped}'));\n"
    ))
}

fn esm_require_global_preflight_error_module_source(
    source: &str,
    raw_cjs_global_messages: bool,
) -> Option<String> {
    find_bare_cjs_global_in_esm_among(source, &["require"])?;
    let message = if raw_cjs_global_messages {
        "require is not defined"
    } else {
        "require is not defined in ES module scope, you can use import instead"
    };
    let escaped = DataUrlLoader::js_string_escape(message);
    Some(format!(
        "await Promise.reject(new ReferenceError('{escaped}'));\n"
    ))
}

#[derive(Debug, PartialEq, Eq)]
struct StaticNamedImport {
    imported: String,
    local: String,
}

fn cjs_named_import_error_module_source(ctx: &Ctx<'_>, filename: &str, source: &str) -> Option<String> {
    let conditions =
        NodeModulesResolver::conditions_from_global(ctx, NodePackageResolveMode::CjsAnalysis.default_conditions());
    find_cjs_named_import_error(filename, source, &conditions).map(|message| {
        let escaped = DataUrlLoader::js_string_escape(&message);
        format!("await Promise.reject(new SyntaxError('{escaped}'));\n")
    })
}

fn find_cjs_named_import_error(filename: &str, source: &str, conditions: &[String]) -> Option<String> {
    let mut result = None;
    scan_code_positions(source, true, |i, _| {
        if let Some((specifier, named_imports, next)) = parse_static_named_import(source, i) {
            if let Some(message) = cjs_named_import_error_message(filename, &specifier, &named_imports, conditions) {
                result = Some(message);
                return ControlFlow::Break(());
            }
            return ControlFlow::Continue(Some(next));
        }
        ControlFlow::Continue(None)
    });
    result
}

fn cjs_named_import_error_message(
    filename: &str,
    specifier: &str,
    named_imports: &[StaticNamedImport],
    conditions: &[String],
) -> Option<String> {
    if named_imports.is_empty() || !could_resolve_to_cjs_for_named_import_error(specifier) {
        return None;
    }
    let resolved = resolve_cjs_reexport_path(filename, specifier, conditions)?;
    if !resolved.ends_with(".cjs") && !is_cjs_js_file_for_named_import_error(&resolved) {
        return None;
    }
    let source = std::fs::read_to_string(&resolved).ok()?;
    let analysis = analyze_cjs_exports_for_file(&resolved, &source, &mut HashSet::new(), conditions);
    if !analysis.is_cjs && analysis.exports.is_empty() && analysis.reexports.is_empty() {
        return None;
    }

    for named_import in named_imports {
        if named_import.imported == "default" {
            continue;
        }
        if !analysis.exports.iter().any(|name| name == &named_import.imported) {
            let mut message = format!(
                "Named export '{}' not found. The requested module '{}' is a CommonJS module, which may not support all module.exports as named exports.\nCommonJS modules can always be imported via the default export, for example using:\n\nimport pkg from '{}';\n",
                named_import.imported, specifier, specifier
            );
            if named_imports.len() == 1 {
                message.push_str(&format!(
                    "const {{ {} }} = pkg;\n",
                    format_cjs_named_import_binding(named_import)
                ));
            }
            return Some(message);
        }
    }
    None
}

fn could_resolve_to_cjs_for_named_import_error(specifier: &str) -> bool {
    if specifier.starts_with("node:") || specifier.starts_with("data:") || specifier.contains("://") {
        return false;
    }
    if specifier.starts_with("./") || specifier.starts_with("../") || specifier.starts_with('/') {
        let (path, _) = split_module_path_suffix(specifier);
        return match std::path::Path::new(path).extension().and_then(|ext| ext.to_str()) {
            Some("cjs" | "js") | None => true,
            Some(_) => false,
        };
    }
    true
}

fn format_cjs_named_import_binding(named_import: &StaticNamedImport) -> String {
    let imported = if is_valid_js_identifier_name(&named_import.imported) {
        named_import.imported.clone()
    } else {
        format!("\"{}\"", escape_js_string(&named_import.imported))
    };
    if named_import.imported == named_import.local {
        imported
    } else {
        format!("{}: {}", imported, named_import.local)
    }
}

fn is_valid_js_identifier_name(value: &str) -> bool {
    let bytes = value.as_bytes();
    let Some((&first, rest)) = bytes.split_first() else {
        return false;
    };
    is_ident_start(first) && rest.iter().copied().all(is_ident_continue)
}

fn is_cjs_js_file_for_named_import_error(filename: &str) -> bool {
    filename.ends_with(".js") && package_scope_type(filename).as_deref() != Some("module")
}

const CJS_GLOBAL_NAMES: [&str; 5] = ["require", "exports", "module", "__filename", "__dirname"];

fn skip_esm_cjs_global_scanner_span(source: &str, pos: usize) -> Option<usize> {
    let bytes = source.as_bytes();
    if let Some(next) = parse_object_method_span(source, pos) {
        return Some(next);
    }
    match bytes[pos] {
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
        b'/' if is_regex_literal_start(source, pos) => Some(skip_regex_literal(source, pos)),
        _ => None,
    }
}

fn add_declared_cjs_global_bindings(bindings: Vec<String>, names: &[&str], declared: &mut Vec<String>) {
    for name in bindings {
        if names.contains(&name.as_str()) && !declared.iter().any(|existing| existing == &name) {
            declared.push(name);
        }
    }
}

fn collect_declared_cjs_globals_in_esm(source: &str) -> Vec<String> {
    let bytes = source.as_bytes();
    let mut i = 0usize;
    let mut declared = Vec::<String>::new();
    while i < bytes.len() {
        if let Some(next) = skip_esm_cjs_global_scanner_span(source, i) {
            i = next;
            continue;
        }

        if let Some((bindings, next)) = parse_import_declaration_bindings(source, i) {
            add_declared_cjs_global_bindings(bindings, &CJS_GLOBAL_NAMES, &mut declared);
            i = next;
            continue;
        }

        if let Some(next) = parse_arrow_function_span(source, i) {
            i = next;
            continue;
        }

        if let Some((bindings, next)) = parse_declaration_span(source, i) {
            add_declared_cjs_global_bindings(bindings, &CJS_GLOBAL_NAMES, &mut declared);
            i = next;
            continue;
        }

        i = next_char_boundary(source, i);
    }
    declared
}

fn find_bare_cjs_global_in_esm(source: &str) -> Option<&'static str> {
    find_bare_cjs_global_in_esm_among(source, &CJS_GLOBAL_NAMES)
}

fn find_bare_cjs_global_in_esm_among(source: &str, names: &'static [&'static str]) -> Option<&'static str> {
    let bytes = source.as_bytes();
    let mut i = 0usize;
    let mut declared = Vec::<String>::new();
    while i < bytes.len() {
        if let Some(next) = skip_esm_cjs_global_scanner_span(source, i) {
            i = next;
            continue;
        }

        if let Some((bindings, next)) = parse_import_declaration_bindings(source, i) {
            add_declared_cjs_global_bindings(bindings, names, &mut declared);
            i = next;
            continue;
        }

        if let Some(next) = parse_arrow_function_span(source, i) {
            i = next;
            continue;
        }

        if let Some((bindings, _)) = parse_variable_declaration_span(source, i) {
            add_declared_cjs_global_bindings(bindings, names, &mut declared);
            i = next_char_boundary(source, i);
            continue;
        }

        if let Some((bindings, next)) = parse_function_declaration_span(source, i)
            .or_else(|| parse_class_declaration_span(source, i))
        {
            add_declared_cjs_global_bindings(bindings, names, &mut declared);
            i = next;
            continue;
        }

        for name in names {
            if source[i..].starts_with(name)
                && is_ident_start_boundary(bytes, i)
                && is_ident_boundary(bytes, i + name.len())
                && previous_significant_byte(source, i) != Some(b'.')
                && !is_typeof_operand(source, i)
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

fn is_typeof_operand(source: &str, pos: usize) -> bool {
    let bytes = source.as_bytes();
    let mut end = pos;
    while end > 0 && bytes[end - 1].is_ascii_whitespace() {
        end -= 1;
    }
    if end > 0 && bytes[end - 1] == b'(' {
        end -= 1;
        while end > 0 && bytes[end - 1].is_ascii_whitespace() {
            end -= 1;
        }
    }
    let mut start = end;
    while start > 0 && is_ident_continue(bytes[start - 1]) {
        start -= 1;
    }
    start < end && &source[start..end] == "typeof" && is_ident_start_boundary(bytes, start)
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
    let mut i = skip_ws_comments(source, parse_ident_name(source, pos, "import")?);
    if i < bytes.len() && (bytes[i] == b'(' || bytes[i] == b'\'' || bytes[i] == b'"') {
        return Some((Vec::new(), find_statement_end(source, i)));
    }

    let mut bindings = Vec::new();
    if i < bytes.len() && bytes[i] == b'*' {
        i = skip_ws_comments(source, i + 1);
        if let Some(as_end) = parse_ident_name(source, i, "as") {
            i = skip_ws_comments(source, as_end);
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
                if let Some(as_end) = parse_ident_name(source, i, "as") {
                    i = skip_ws_comments(source, as_end);
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

fn parse_static_named_import(source: &str, pos: usize) -> Option<(String, Vec<StaticNamedImport>, usize)> {
    let bytes = source.as_bytes();
    let mut i = skip_ws_comments(source, parse_ident_name(source, pos, "import")?);
    if i < bytes.len() && matches!(bytes[i], b'(' | b'\'' | b'"') {
        return None;
    }

    let mut named_imports = Vec::new();
    if i < bytes.len() && bytes[i] == b'{' {
        collect_named_import_specifiers(source, i, &mut named_imports)?;
        i = skip_ws_comments(source, find_matching_brace(source, i)? + 1);
    } else {
        if i < bytes.len() && bytes[i] == b'*' {
            return None;
        }
        let (_, next) = read_ident(source, i)?;
        i = skip_ws_comments(source, next);
        if i >= bytes.len() || bytes[i] != b',' {
            return None;
        }
        i = skip_ws_comments(source, i + 1);
        if i >= bytes.len() || bytes[i] != b'{' {
            return None;
        }
        collect_named_import_specifiers(source, i, &mut named_imports)?;
        i = skip_ws_comments(source, find_matching_brace(source, i)? + 1);
    }

    i = skip_ws_comments(source, parse_ident_name(source, i, "from")?);
    let (specifier, next) = read_js_string(source, i)?;
    Some((specifier, named_imports, find_statement_end(source, next)))
}

fn collect_named_import_specifiers(
    source: &str,
    start: usize,
    imports: &mut Vec<StaticNamedImport>,
) -> Option<()> {
    let bytes = source.as_bytes();
    let end = find_matching_brace(source, start)?;
    let mut i = start + 1;
    while i < end {
        i = skip_ws_comments(source, i);
        if i >= end {
            break;
        }
        let (imported, next, needs_alias) = if matches!(bytes[i], b'\'' | b'"') {
            let (name, next) = read_js_string(source, i)?;
            (name, next, true)
        } else {
            let (name, next) = read_ident(source, i)?;
            (name, next, false)
        };
        let mut local = imported.clone();
        i = skip_ws_comments(source, next);
        if let Some(as_end) = parse_ident_name(source, i, "as") {
            i = skip_ws_comments(source, as_end);
            let (alias, next) = read_ident(source, i)?;
            local = alias;
            i = next;
        } else if needs_alias {
            return None;
        }
        imports.push(StaticNamedImport { imported, local });
        while i < end && bytes[i] != b',' {
            i = next_char_boundary(source, i);
        }
        if i < end && bytes[i] == b',' {
            i += 1;
        }
    }
    Some(())
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
        if let Some(as_end) = parse_ident_name(source, i, "as") {
            i = skip_ws_comments(source, as_end);
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
        if let Some(keyword_end) = parse_free_ident_name(source, pos, keyword) {
            let start = skip_ws_comments(source, keyword_end);
            let end = find_variable_declaration_end(source, start);
            return Some((collect_cjs_global_binding_names_in_variable_declaration(source, start, end), end));
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
    let mut i = skip_ws_comments(source, parse_ident_name(source, pos, "function")?);
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
    if let Some(async_end) = parse_ident_name(source, i, "async") {
        let next = skip_ws_comments(source, async_end);
        if next < bytes.len() && bytes[next] != b':' {
            i = next;
        }
    }
    if i < bytes.len() && bytes[i] == b'*' {
        i = skip_ws_comments(source, i + 1);
    }
    if let Some(accessor_end) = parse_ident_name(source, i, "get").or_else(|| parse_ident_name(source, i, "set")) {
        let next = skip_ws_comments(source, accessor_end);
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
    let mut i = skip_ws_comments(source, parse_ident_name(source, pos, "class")?);
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

fn collect_cjs_global_binding_names_in_variable_declaration(source: &str, start: usize, end: usize) -> Vec<String> {
    let bytes = source.as_bytes();
    let mut names = Vec::new();
    let mut i = start;
    let mut in_binding = true;
    let mut paren = 0usize;
    let mut brace = 0usize;
    let mut bracket = 0usize;
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
            b'(' => paren += 1,
            b')' => paren = paren.saturating_sub(1),
            b'{' => brace += 1,
            b'}' => brace = brace.saturating_sub(1),
            b'[' => bracket += 1,
            b']' => bracket = bracket.saturating_sub(1),
            b'=' if paren == 0 && brace == 0 && bracket == 0 => in_binding = false,
            b',' if paren == 0 && brace == 0 && bracket == 0 => in_binding = true,
            _ => {}
        }

        if in_binding {
            for name in CJS_GLOBAL_NAMES {
                if source[i..].starts_with(name)
                    && is_ident_start_boundary(bytes, i)
                    && is_ident_boundary(bytes, i + name.len())
                    && !object_pattern_property_key_without_binding(source, i + name.len())
                    && !names.iter().any(|existing| existing == name)
                {
                    names.push(name.to_string());
                    break;
                }
            }
        }
        i = next_char_boundary(source, i);
    }
    names
}

fn object_pattern_property_key_without_binding(source: &str, pos: usize) -> bool {
    let i = skip_ws_comments(source, pos);
    i < source.len() && source.as_bytes()[i] == b':'
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
                if let Some(keyword_end) = parse_ident_name(source, i, keyword) {
                    let next = skip_ws_comments(source, keyword_end);
                    if parse_ident_name(source, next, "require").is_some() {
                        if !is_create_require_import_meta_url_declaration(source, next) {
                            found = true;
                            return ControlFlow::Break(());
                        }
                    }
                }
            }
        }
        ControlFlow::Continue(None)
    });
    found
}

fn is_create_require_import_meta_url_declaration(source: &str, require_pos: usize) -> bool {
    let mut next = skip_ws_comments(source, require_pos + "require".len());
    if source.as_bytes().get(next) != Some(&b'=') {
        return false;
    }
    next = skip_ws_comments(source, next + 1);
    let Some(create_require_end) = parse_ident_name(source, next, "createRequire") else {
        return false;
    };
    next = skip_ws_comments(source, create_require_end);
    if source.as_bytes().get(next) != Some(&b'(') {
        return false;
    }
    next = skip_ws_comments(source, next + 1);
    parse_import_meta_url(source, next).is_some()
}

fn parse_import_meta_url(source: &str, pos: usize) -> Option<usize> {
    let i = parse_ident_name(source, pos, "import")?;
    let i = parse_dot_member_name(source, i, "meta")?;
    parse_dot_member_name(source, i, "url")
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
        let (mut path, suffix) = Self::file_url_to_path_parts(url)?;
        path.push_str(suffix);
        Some(path)
    }

    fn file_url_to_path_parts(url: &str) -> Option<(String, &str)> {
        let (encoded_path, suffix) = Self::file_url_path_and_suffix(url)?;
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
        Some((String::from_utf8(decoded).ok()?, suffix))
    }

    fn file_url_path_and_suffix(url: &str) -> Option<(&str, &str)> {
        let encoded = url.strip_prefix("file://")?;
        let end = encoded
            .find(|ch| ch == '?' || ch == '#')
            .unwrap_or(encoded.len());
        let encoded_path = &encoded[..end];
        let (host, path) = if encoded_path.starts_with('/') {
            ("", encoded_path)
        } else if let Some(slash) = encoded_path.find('/') {
            (&encoded_path[..slash], &encoded_path[slash..])
        } else {
            (encoded_path, "/")
        };

        if host.is_empty() || host.eq_ignore_ascii_case("localhost") {
            Some((path, &encoded[end..]))
        } else {
            None
        }
    }

    fn has_invalid_file_url_host(url: &str) -> bool {
        url.starts_with("file://") && Self::file_url_path_and_suffix(url).is_none()
    }

    fn with_loader_realm_suffix(base: &str, suffix: &str) -> String {
        append_loader_realm_param(suffix, loader_realm_param(base).as_deref())
    }

    fn is_same_directory_file_import(normalized: &str, base: &str) -> bool {
        let base_path = if let Some(path) = Self::file_url_to_path(base) {
            path
        } else if base.starts_with('/') {
            module_filesystem_path(base).to_string()
        } else {
            return false;
        };
        let Some(base_parent) = std::path::Path::new(&base_path).parent() else {
            return false;
        };
        let Some(target_parent) = std::path::Path::new(normalized).parent() else {
            return false;
        };
        CjsEvalResolver::normalize_path(base_parent) == CjsEvalResolver::normalize_path(target_parent)
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
        ctx: &Ctx<'js>,
        base: &str,
        name: &str,
    ) -> rquickjs::Result<String> {
        if let Some(encoded) = name.strip_prefix("file://") {
            let end = encoded
                .find(|ch| ch == '?' || ch == '#')
                .unwrap_or(encoded.len());
            if NodeFileResolver::has_encoded_path_separator(&encoded[..end]) {
                return NodeFileResolver::throw_invalid_encoded_separator(ctx, base, name);
            }
            if Self::has_invalid_file_url_host(name) {
                return NodeFileResolver::throw_invalid_file_url_host(
                    ctx,
                    format!("File URL host must be \"localhost\" or empty: {}", name),
                );
            }
        }

        if let Some((path, suffix)) = Self::file_url_to_path_parts(name) {
            let normalized = CjsEvalResolver::normalize_path(std::path::Path::new(&path));
            let url = NodeFileResolver::module_url_for_file_specifier(name);
            if std::path::Path::new(&normalized).is_dir() {
                discard_import_type_rewrite_token(name);
                return NodeFileResolver::throw_module_resolution_error(
                    ctx,
                    "ERR_UNSUPPORTED_DIR_IMPORT",
                    NodeFileResolver::directory_import_message(
                        &normalized,
                        base,
                        !Self::is_same_directory_file_import(&normalized, base),
                    ),
                    url,
                );
            }
            if !std::path::Path::new(&normalized).is_file() {
                discard_import_type_rewrite_token(name);
                return NodeFileResolver::throw_module_resolution_error(
                    ctx,
                    "ERR_MODULE_NOT_FOUND",
                    format!("Cannot find module '{}'", name),
                    url,
                );
            }
            let resolved = format!(
                "{}{}",
                normalized,
                Self::with_loader_realm_suffix(base, suffix)
            );
            transfer_import_type_rewrite_token(name, &resolved);
            Ok(resolved)
        } else {
            Err(Error::new_resolving(base, name))
        }
    }
}

struct RegisteredLoaderResolver;

impl Resolver for RegisteredLoaderResolver {
    fn resolve<'js>(
        &mut self,
        ctx: &Ctx<'js>,
        base: &str,
        name: &str,
    ) -> rquickjs::Result<String> {
        let globals = ctx.globals();
        let Ok(resolve_fn) =
            globals.get::<_, Function>("__wasm_rquickjs_resolve_static_registered_loader")
        else {
            return Err(Error::new_resolving(base, name));
        };
        let base_url =
            if base.starts_with("data:") || base.starts_with("file://") || base.starts_with("node:")
            {
                base.to_string()
            } else {
                path_to_file_url(base)
            };
        let resolved: Option<String> = resolve_fn.call((base_url, name.to_string()))?;
        match resolved {
            Some(resolved) if !resolved.is_empty() => Ok(resolved),
            _ => Err(Error::new_resolving(base, name)),
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
    fn decode_module_path<'js, 'path>(
        ctx: &Ctx<'js>,
        base: &str,
        name: &str,
        path: &'path str,
    ) -> rquickjs::Result<Cow<'path, str>> {
        if path.as_bytes().contains(&b'%') {
            if Self::has_encoded_path_separator(path) {
                return Self::throw_invalid_encoded_separator(ctx, base, name);
            }
            percent_decode(path)
                .map(Cow::Owned)
                .ok_or_else(|| Error::new_resolving(base, name))
        } else {
            Ok(Cow::Borrowed(path))
        }
    }

    fn has_encoded_path_separator(path: &str) -> bool {
        let bytes = path.as_bytes();
        let mut i = 0;
        while i + 2 < bytes.len() {
            if bytes[i] == b'%' && bytes[i + 1] == b'2' && matches!(bytes[i + 2], b'f' | b'F') {
                return true;
            }
            if bytes[i] == b'%' && bytes[i + 1] == b'5' && matches!(bytes[i + 2], b'c' | b'C') {
                return true;
            }
            i += 1;
        }
        false
    }

    fn throw_invalid_encoded_separator<'js, T>(
        ctx: &Ctx<'js>,
        base: &str,
        name: &str,
    ) -> rquickjs::Result<T> {
        let msg = format!(
            "Invalid module \"{}\" must not include encoded \"/\" or \"\\\" characters imported from {}",
            name, base
        );
        let type_error_ctor: Function = ctx.globals().get("TypeError")?;
        let error_obj: Object = type_error_ctor.call((&msg,))?;
        error_obj.set("code", "ERR_INVALID_MODULE_SPECIFIER")?;
        Err(ctx.throw(error_obj.into_value()))
    }

    fn throw_invalid_file_url_host<'js, T>(
        ctx: &Ctx<'js>,
        message: String,
    ) -> rquickjs::Result<T> {
        let _ = Exception::throw_type(ctx, &message);
        let error_value = ctx.catch();
        let Some(error_obj) = error_value.clone().into_object() else {
            return Err(ctx.throw(error_value));
        };
        Self::define_error_property(&error_obj, "code", "ERR_INVALID_FILE_URL_HOST")?;
        Err(ctx.throw(error_obj.into_value()))
    }

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

    fn module_url_for_path(path: &str, suffix: &str) -> String {
        format!(
            "{}{}",
            path_without_suffix_to_file_url(path),
            serialize_url_preserving_escapes(suffix)
        )
    }

    fn module_url_for_encoded_path(path: &str, suffix: &str) -> String {
        let path = normalize_encoded_module_path(path);
        format!(
            "{}{}",
            path_with_preserved_escapes_to_file_url(&path),
            serialize_url_preserving_escapes(suffix)
        )
    }

    fn module_url_for_file_specifier(specifier: &str) -> String {
        if !specifier.starts_with("file://") {
            return serialize_url_preserving_escapes(specifier);
        }
        let Some((encoded_path, suffix)) = FileUrlResolver::file_url_path_and_suffix(specifier)
        else {
            return serialize_url_preserving_escapes(specifier);
        };
        let encoded_path = normalize_encoded_module_path(encoded_path);
        format!(
            "{}{}",
            path_with_preserved_escapes_to_file_url(&encoded_path),
            serialize_url_preserving_escapes(suffix)
        )
    }

    fn throw_module_resolution_error<'js, T>(
        ctx: &Ctx<'js>,
        code: &str,
        message: String,
        url: String,
    ) -> rquickjs::Result<T> {
        let error_obj = Exception::from_message(ctx.clone(), &message)?.into_object();
        let error_proto = error_obj.get_prototype();
        let coded_proto = Object::new(ctx.clone())?;
        coded_proto.set_prototype(error_proto.as_ref())?;
        coded_proto.prop(
            "name",
            Property::from(format!("Error [{code}]"))
                .writable()
                .configurable(),
        )?;
        error_obj.set_prototype(Some(&coded_proto))?;
        Self::define_error_property(&error_obj, "code", code)?;
        Self::define_error_property(&error_obj, "url", &url)?;
        Err(ctx.throw(error_obj.into_value()))
    }

    fn directory_import_message(normalized_dir: &str, importer: &str, include_suggestion: bool) -> String {
        let mut message = format!(
            "Directory import '{}' is not supported resolving ES modules imported from {}",
            normalized_dir,
            Self::format_importer(importer)
        );
        if include_suggestion {
            let package_json_path = std::path::Path::new(normalized_dir).join("package.json");
            if let Ok(Some(package)) = NodeModulesResolver::read_package_json_optional(&package_json_path)
                && let Some(main) = package.main.as_deref()
                && let Some((suggestion, _)) =
                    NodeModulesResolver::resolve_package_legacy_main(std::path::Path::new(normalized_dir), main)
            {
                message.push_str(&format!("\nDid you mean to import \"{suggestion}\"?"));
            }
        }
        message
    }

    fn format_importer(importer: &str) -> String {
        FileUrlResolver::file_url_to_path(importer).unwrap_or_else(|| importer.to_string())
    }

    fn define_error_property<'js>(
        error_obj: &Object<'js>,
        name: &str,
        value: &str,
    ) -> rquickjs::Result<()> {
        error_obj.prop(
            name,
            Property::from(value)
                .writable()
                .enumerable()
                .configurable(),
        )
    }
}

impl Resolver for NodeFileResolver {
    fn resolve<'js>(
        &mut self,
        ctx: &Ctx<'js>,
        base: &str,
        name: &str,
    ) -> rquickjs::Result<String> {
        if name.contains("://") || name.starts_with("node:") {
            return Err(Error::new_resolving(base, name));
        }

        let (name_path, suffix) = split_module_path_suffix(name);
        let (candidate, url, include_directory_suggestion) = if name_path.starts_with('/') {
            let encoded_path = CjsEvalResolver::normalize_path(std::path::Path::new(name_path));
            let url = Self::module_url_for_encoded_path(&encoded_path, suffix);
            let name_path = match Self::decode_module_path(ctx, base, name, name_path) {
                Ok(path) => path,
                Err(err) => {
                    discard_import_type_rewrite_token(name);
                    return Err(err);
                }
            };
            (std::path::PathBuf::from(name_path.as_ref()), url, true)
        } else if name_path.starts_with("./") || name_path.starts_with("../") {
            let base_path = if let Some(path) = FileUrlResolver::file_url_to_path(base) {
                path
            } else {
                base.to_string()
            };
            let base_path = module_filesystem_path(&base_path);

            if base_path == "<input>" {
                discard_import_type_rewrite_token(name);
                return Err(Error::new_resolving(base, name));
            }

            let Some(base_dir) = std::path::Path::new(&base_path).parent() else {
                discard_import_type_rewrite_token(name);
                return Err(Error::new_resolving(base, name));
            };
            let encoded_candidate = base_dir.join(name_path);
            let encoded_path = CjsEvalResolver::normalize_path(&encoded_candidate);
            let url = Self::module_url_for_encoded_path(&encoded_path, suffix);
            let name_path = match Self::decode_module_path(ctx, base, name, name_path) {
                Ok(path) => path,
                Err(err) => {
                    discard_import_type_rewrite_token(name);
                    return Err(err);
                }
            };
            (base_dir.join(name_path.as_ref()), url, false)
        } else {
            discard_import_type_rewrite_token(name);
            return Err(Error::new_resolving(base, name));
        };

        let normalized = CjsEvalResolver::normalize_path(&candidate);
        if std::path::Path::new(&normalized).is_dir() {
            discard_import_type_rewrite_token(name);
            return Self::throw_module_resolution_error(
                ctx,
                "ERR_UNSUPPORTED_DIR_IMPORT",
                Self::directory_import_message(
                    &normalized,
                    base,
                    include_directory_suggestion
                        && !FileUrlResolver::is_same_directory_file_import(&normalized, base),
                ),
                url,
            );
        }

        let suffix = append_loader_realm_param(suffix, loader_realm_param(base).as_deref());
        if let Some(resolved) = Self::resolve_candidate(candidate, &suffix) {
            transfer_import_type_rewrite_token(name, &resolved);
            return Ok(resolved);
        }

        discard_import_type_rewrite_token(name);
        Self::throw_module_resolution_error(
            ctx,
            "ERR_MODULE_NOT_FOUND",
            format!("Cannot find module '{}'", name),
            url,
        )
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
        if name.starts_with("node:") {
            let msg = format!("No such built-in module: {}", name);
            return throw_native_coded_error(ctx, &msg, "ERR_UNKNOWN_BUILTIN_MODULE", true);
        }

        if let Some(scheme_end) = name.find("://") {
            let scheme = &name[..scheme_end];
            if scheme != "file" && scheme != "data" {
                let msg = format!(
                    "Only URLs with a scheme in: file, data, and node are supported by the default ESM loader. Received protocol '{}:'",
                    scheme
                );
                return throw_native_coded_error(ctx, &msg, "ERR_UNSUPPORTED_ESM_URL_SCHEME", false);
            }
        }

        let msg = format!("Cannot find module '{}'", name);
        throw_native_coded_error(ctx, &msg, "ERR_MODULE_NOT_FOUND", false)
    }
}

enum NodePackageResolveError {
    InvalidModuleSpecifier { specifier: String, base: String },
    InvalidPackagePatternMatch { specifier: String, message: String },
    PackagePathNotExported {
        package_name: String,
        subpath: String,
        no_exports_main: bool,
    },
    PackageImportNotDefined { specifier: String },
    InvalidPackageTarget { kind: &'static str, target: String },
    InvalidPackageConfig {
        path: String,
        reason: Option<String>,
    },
    UnsupportedDirectoryImport { request: String },
    ModuleNotFound { request: String },
}

enum PackageTargetResolution {
    Resolved(String),
    NoMatch,
    Blocked,
}

struct PackageTargetResolveContext<'a> {
    package_dir: &'a std::path::Path,
    allow_bare_target: bool,
    kind: &'static str,
    conditions: &'a [String],
    pattern_substitution: Option<&'a str>,
    warning_specifier: &'a str,
    warning_pattern_key: Option<&'a str>,
    warning_importer: Option<&'a str>,
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

fn deserialize_optional_package_string<'de, D>(deserializer: D) -> Result<Option<String>, D::Error>
where
    D: Deserializer<'de>,
{
    let value = Option::<serde_json::Value>::deserialize(deserializer)?;
    Ok(value.and_then(|value| value.as_str().map(|value| value.to_string())))
}

fn deserialize_strict_package_string<'de, D>(deserializer: D) -> Result<Option<String>, D::Error>
where
    D: Deserializer<'de>,
{
    match serde_json::Value::deserialize(deserializer)? {
        serde_json::Value::String(value) => Ok(Some(value)),
        value => Err(D::Error::custom(format!(
            "invalid package field type {}, expected string",
            value
        ))),
    }
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(default)]
struct PackageJson {
    #[serde(default, deserialize_with = "deserialize_strict_package_string")]
    name: Option<String>,
    #[serde(deserialize_with = "deserialize_optional_package_string")]
    main: Option<String>,
    exports: Option<PackageTarget>,
    imports: Option<PackageTarget>,
    #[serde(rename = "type")]
    #[serde(default, deserialize_with = "deserialize_strict_package_string")]
    package_type: Option<String>,
}

thread_local! {
    static PACKAGE_JSON_CACHE: RefCell<HashMap<String, Rc<PackageJson>>> = RefCell::new(HashMap::new());
}

struct NodePackageWarning {
    message: String,
    code: &'static str,
    dedupe_key: Option<String>,
}

pub(crate) fn node_package_deprecation_warning_seen(key: &str) -> bool {
    get_js_state()
        .node_package_deprecation_warnings
        .borrow()
        .contains(key)
}

pub(crate) fn mark_node_package_deprecation_warning_seen(key: String) {
    get_js_state()
        .node_package_deprecation_warnings
        .borrow_mut()
        .insert(key);
}

struct NodeModulesResolver;

enum NodePackageResolveMode {
    EsmImport,
    CjsAnalysis,
}

impl NodePackageResolveMode {
    const ESM_CONDITIONS: [&'static str; 5] = ["golem", "node", "module-sync", "import", "default"];
    const CJS_ANALYSIS_CONDITIONS: [&'static str; 5] =
        ["golem", "node", "require", "module-sync", "default"];

    fn default_conditions(&self) -> &'static [&'static str] {
        match self {
            NodePackageResolveMode::EsmImport => &Self::ESM_CONDITIONS,
            NodePackageResolveMode::CjsAnalysis => &Self::CJS_ANALYSIS_CONDITIONS,
        }
    }

    fn package_exports_importer<'a>(&self, base: &'a str) -> Option<&'a str> {
        match self {
            NodePackageResolveMode::EsmImport => Some(base),
            NodePackageResolveMode::CjsAnalysis => None,
        }
    }

    fn probes_missing_package_root_file(&self) -> bool {
        matches!(self, NodePackageResolveMode::CjsAnalysis)
    }
}

enum CjsAnalysisPackageFallbackStep {
    RootFile,
    PackageMain,
    Subpath,
    RootDirectory,
}

enum CjsAnalysisDirectoryFallbackStep {
    RootFile,
    PackageMain,
    RootDirectory,
}

impl NodeModulesResolver {
    fn try_resolve(
        &self,
        base: &str,
        name: &str,
        conditions: &[String],
        warnings: &mut Vec<NodePackageWarning>,
    ) -> Result<Option<String>, NodePackageResolveError> {
        self.try_resolve_package(base, name, conditions, warnings, NodePackageResolveMode::EsmImport)
    }

    fn try_resolve_for_cjs_analysis(
        &self,
        base: &str,
        name: &str,
        conditions: &[String],
    ) -> Result<Option<String>, NodePackageResolveError> {
        let mut ignored_warnings = Vec::new();
        self.try_resolve_package(
            base,
            name,
            conditions,
            &mut ignored_warnings,
            NodePackageResolveMode::CjsAnalysis,
        )
    }

    fn try_resolve_package(
        &self,
        base: &str,
        name: &str,
        conditions: &[String],
        warnings: &mut Vec<NodePackageWarning>,
        mode: NodePackageResolveMode,
    ) -> Result<Option<String>, NodePackageResolveError> {
        use std::path::Path;

        if name.starts_with('#') {
            return self.try_resolve_package_import_with_conditions(base, name, conditions, warnings);
        }

        if name.starts_with('.') || name.starts_with('/') || name.contains("://") {
            return Ok(None);
        }

        let Some((package_name, subpath)) = Self::split_package_name(name) else {
            return Ok(None);
        };
        Self::validate_package_name(base, name, package_name)?;

        let Some(base_dir) = Path::new(base).parent() else {
            return Ok(None);
        };
        if let Some(resolved) = Self::try_resolve_package_self(
            base_dir,
            base,
            package_name,
            subpath,
            conditions,
            warnings,
        )?
        {
            return Ok(Some(resolved));
        }

        let mut dir = base_dir.to_path_buf();
        loop {
            let package_path = dir.join("node_modules").join(package_name);
            if package_path.is_dir() {
                if let Some(resolved) = Self::try_resolve_package_directory(
                    base,
                    name,
                    package_name,
                    subpath,
                    &package_path,
                    conditions,
                    warnings,
                    &mode,
                )? {
                    return Ok(Some(resolved));
                }
            }

            if mode.probes_missing_package_root_file()
                && subpath.is_empty()
                && let Some(resolved) = Self::resolve_cjs_analysis_package_root_file(&package_path)
            {
                return Ok(Some(resolved));
            }

            if !dir.pop() {
                break;
            }
        }

        Ok(None)
    }

    fn try_resolve_package_directory(
        base: &str,
        specifier: &str,
        package_name: &str,
        subpath: &str,
        package_path: &std::path::Path,
        conditions: &[String],
        warnings: &mut Vec<NodePackageWarning>,
        mode: &NodePackageResolveMode,
    ) -> Result<Option<String>, NodePackageResolveError> {
        let pkg_path = package_path.join("package.json");
        let package = Self::read_package_json_optional(&pkg_path)?;

        if let Some(package) = package.as_ref() {
            if let Some(exports_field) = package.exports.as_ref() {
                Self::validate_package_exports_map(&pkg_path, exports_field)?;
                return Self::resolve_package_exports(
                    package_name,
                    package_path,
                    exports_field,
                    subpath,
                    conditions,
                    warnings,
                    mode.package_exports_importer(base),
                )
                .map(Some);
            }
        }

        match mode {
            NodePackageResolveMode::EsmImport => {
                Self::try_resolve_package_directory_esm(
                    base,
                    specifier,
                    subpath,
                    package_path,
                    package.as_deref(),
                    warnings,
                )
            }
            NodePackageResolveMode::CjsAnalysis => {
                Ok(Self::try_resolve_package_directory_for_cjs_analysis(
                    subpath,
                    package_path,
                    package.as_deref(),
                ))
            }
        }
    }

    fn read_package_json_optional(pkg_path: &std::path::Path) -> Result<Option<Rc<PackageJson>>, NodePackageResolveError> {
        let cache_key = CjsEvalResolver::normalize_path(pkg_path);
        if let Some(cached) = PACKAGE_JSON_CACHE.with_borrow(|cache| cache.get(&cache_key).cloned()) {
            return Ok(Some(cached));
        }
        match std::fs::read_to_string(pkg_path) {
            Ok(pkg_content) => {
                let package = Rc::new(serde_json::from_str::<PackageJson>(&pkg_content).map_err(|_| {
                    NodePackageResolveError::InvalidPackageConfig {
                        path: pkg_path.to_string_lossy().into_owned(),
                        reason: None,
                    }
                })?);
                PACKAGE_JSON_CACHE.with_borrow_mut(|cache| {
                    cache.insert(cache_key, package.clone());
                });
                Ok(Some(package))
            }
            Err(_) => Ok(None),
        }
    }

    fn try_resolve_package_directory_esm(
        base: &str,
        specifier: &str,
        subpath: &str,
        package_path: &std::path::Path,
        package: Option<&PackageJson>,
        warnings: &mut Vec<NodePackageWarning>,
    ) -> Result<Option<String>, NodePackageResolveError> {
        let package_type = package.and_then(|package| package.package_type.as_ref());
        if subpath.is_empty()
            && let Some(package) = package
            && let Some(main) = package.main.as_ref()
        {
            let is_module_package = package.package_type.as_deref() == Some("module");
            let resolved = Self::resolve_package_legacy_main(package_path, main);
            if let Some((resolved, used_extension_lookup)) = resolved {
                if is_module_package && used_extension_lookup {
                    warnings.push(NodePackageWarning {
                        message: format!(
                            "Package {}/ has a \"main\" field set to {:?}, excluding the full filename and extension to the resolved file at {:?}, imported from {}.\nAutomatic extension resolution of the \"main\" field is deprecated for ES modules.",
                            package_path.to_string_lossy().trim_end_matches('/'),
                            main,
                            std::path::Path::new(&resolved)
                                .strip_prefix(package_path)
                                .ok()
                                .map(|path| path.to_string_lossy().into_owned())
                                .unwrap_or_else(|| resolved.clone()),
                            base
                        ),
                        code: "DEP0151",
                        dedupe_key: None,
                    });
                }
                return Ok(Some(resolved));
            }
        }

        if !subpath.is_empty()
            && let Some(resolved) = Self::resolve_package_subpath(package_path, subpath, base, specifier)?
        {
            return Ok(Some(resolved));
        }

        if subpath.is_empty() {
            let is_module_package = package_type.is_some_and(|package_type| package_type == "module");
            let fallbacks = [
                package_path.join("index.js"),
                package_path.join("index.json"),
                package_path.join("index.node"),
            ];
            for fallback in &fallbacks {
                if fallback.is_file() {
                    if is_module_package
                        && fallback.extension().and_then(|ext| ext.to_str()) == Some("js")
                    {
                        warnings.push(NodePackageWarning {
                            message: format!(
                                "No \"main\" or \"exports\" field defined in the package.json for {}/ resolving the main entry point \"index.js\", imported from {}.\nDefault \"index\" lookups for the main are deprecated for ES modules.",
                                package_path.to_string_lossy().trim_end_matches('/'),
                                base
                            ),
                            code: "DEP0151",
                            dedupe_key: None,
                        });
                    }
                    return Ok(Some(fallback.to_string_lossy().into_owned()));
                }
            }
        }

        Ok(None)
    }

    fn try_resolve_package_directory_for_cjs_analysis(
        subpath: &str,
        package_path: &std::path::Path,
        package: Option<&PackageJson>,
    ) -> Option<String> {
        let steps = [
            CjsAnalysisPackageFallbackStep::RootFile,
            CjsAnalysisPackageFallbackStep::PackageMain,
            CjsAnalysisPackageFallbackStep::Subpath,
            CjsAnalysisPackageFallbackStep::RootDirectory,
        ];
        for step in steps {
            if let Some(resolved) = Self::resolve_cjs_analysis_package_fallback_step(
                step,
                subpath,
                package_path,
                package,
            ) {
                return Some(resolved);
            }
        }

        None
    }

    fn resolve_cjs_analysis_package_fallback_step(
        step: CjsAnalysisPackageFallbackStep,
        subpath: &str,
        package_path: &std::path::Path,
        package: Option<&PackageJson>,
    ) -> Option<String> {
        match step {
            CjsAnalysisPackageFallbackStep::RootFile => {
                subpath.is_empty().then(|| {
                    Self::resolve_cjs_analysis_directory_fallback_step(
                        CjsAnalysisDirectoryFallbackStep::RootFile,
                        package_path,
                        package,
                    )
                }).flatten()
            }
            CjsAnalysisPackageFallbackStep::PackageMain => {
                if !subpath.is_empty() {
                    return None;
                }
                Self::resolve_cjs_analysis_directory_fallback_step(
                    CjsAnalysisDirectoryFallbackStep::PackageMain,
                    package_path,
                    package,
                )
            }
            CjsAnalysisPackageFallbackStep::Subpath => {
                if subpath.is_empty() {
                    None
                } else {
                    Self::resolve_cjs_analysis_file_or_directory(package_path, subpath)
                }
            }
            CjsAnalysisPackageFallbackStep::RootDirectory => {
                subpath.is_empty().then(|| {
                    Self::resolve_cjs_analysis_directory_fallback_step(
                        CjsAnalysisDirectoryFallbackStep::RootDirectory,
                        package_path,
                        package,
                    )
                }).flatten()
            }
        }
    }

    fn try_resolve_package_import_with_conditions(
        &self,
        base: &str,
        name: &str,
        conditions: &[String],
        warnings: &mut Vec<NodePackageWarning>,
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
            if let Some(package) = Self::read_package_json_optional(&pkg_path)? {
                let Some(imports) = package.imports.as_ref() else {
                    return Err(NodePackageResolveError::PackageImportNotDefined {
                        specifier: name.to_string(),
                    });
                };
                Self::validate_package_import_specifier(name)?;
                return Self::resolve_package_import(&dir, imports, name, conditions, warnings, Some(base)).map(Some);
            }

            if !dir.pop() {
                break;
            }
        }

        Err(NodePackageResolveError::PackageImportNotDefined {
            specifier: name.to_string(),
        })
    }

    fn try_resolve_package_self(
        base_dir: &std::path::Path,
        importer: &str,
        package_name: &str,
        subpath: &str,
        conditions: &[String],
        warnings: &mut Vec<NodePackageWarning>,
    ) -> Result<Option<String>, NodePackageResolveError> {
        let mut dir = base_dir.to_path_buf();
        loop {
            if dir.file_name().is_some_and(|name| name == "node_modules") {
                return Ok(None);
            }

            let pkg_path = dir.join("package.json");
            if let Some(package) = Self::read_package_json_optional(&pkg_path)? {
                if package.name.as_deref() == Some(package_name)
                    && let Some(exports_field) = package.exports.as_ref()
                {
                    Self::validate_package_exports_map(&pkg_path, exports_field)?;
                    return Self::resolve_package_exports(
                        package_name,
                        &dir,
                        exports_field,
                        subpath,
                        conditions,
                        warnings,
                        Some(importer),
                    )
                    .map(Some);
                }
                return Ok(None);
            }

            if !dir.pop() {
                break;
            }
        }

        Ok(None)
    }

    fn split_package_name(name: &str) -> Option<(&str, &str)> {
        if name.starts_with('@') {
            let Some(first) = name.find('/') else {
                return Some((name, ""));
            };
            let rest = &name[first + 1..];
            if rest.is_empty() {
                return Some((name, ""));
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

    fn validate_package_name(
        base: &str,
        specifier: &str,
        package_name: &str,
    ) -> Result<(), NodePackageResolveError> {
        let invalid_scoped_name = package_name.starts_with('@') && !package_name.contains('/');
        if invalid_scoped_name || package_name.contains('%') || package_name.contains('\\') {
            return Err(NodePackageResolveError::InvalidModuleSpecifier {
                specifier: specifier.to_string(),
                base: base.to_string(),
            });
        }
        Ok(())
    }

    fn validate_package_import_specifier(specifier: &str) -> Result<(), NodePackageResolveError> {
        if specifier == "#" || specifier.starts_with("#/") {
            return Err(NodePackageResolveError::InvalidPackagePatternMatch {
                specifier: specifier.to_string(),
                message: "is not a valid internal imports specifier name".to_string(),
            });
        }
        Ok(())
    }

    fn resolve_package_subpath(
        package_dir: &std::path::Path,
        subpath: &str,
        base: &str,
        specifier: &str,
    ) -> Result<Option<String>, NodePackageResolveError> {
        if Self::has_encoded_slash_or_backslash(subpath) {
            return Err(NodePackageResolveError::InvalidModuleSpecifier {
                specifier: specifier.to_string(),
                base: base.to_string(),
            });
        }
        let decoded_subpath = percent_decode(subpath).unwrap_or_else(|| subpath.to_string());
        let target_path = package_dir.join(decoded_subpath);
        if target_path.is_file() {
            return Ok(Some(target_path.to_string_lossy().into_owned()));
        }
        if target_path.is_dir() {
            return Err(NodePackageResolveError::UnsupportedDirectoryImport {
                request: target_path.to_string_lossy().into_owned(),
            });
        }
        Ok(None)
    }

    fn resolve_package_legacy_main(
        package_dir: &std::path::Path,
        target: &str,
    ) -> Option<(String, bool)> {
        let target_path = package_dir.join(target.strip_prefix("./").unwrap_or(target));
        if target_path.is_file() {
            return Some((target_path.to_string_lossy().into_owned(), false));
        }
        if target_path.extension().is_none() {
            let js_target = Self::with_appended_extension(&target_path, ".js");
            if js_target.is_file() {
                return Some((js_target.to_string_lossy().into_owned(), true));
            }
            let json_target = Self::with_appended_extension(&target_path, ".json");
            if json_target.is_file() {
                return Some((json_target.to_string_lossy().into_owned(), false));
            }
            let node_target = Self::with_appended_extension(&target_path, ".node");
            if node_target.is_file() {
                return Some((node_target.to_string_lossy().into_owned(), false));
            }
        }
        let index_js = target_path.join("index.js");
        if index_js.is_file() {
            return Some((index_js.to_string_lossy().into_owned(), true));
        }
        let index_json = target_path.join("index.json");
        if index_json.is_file() {
            return Some((index_json.to_string_lossy().into_owned(), false));
        }
        let index_node = target_path.join("index.node");
        if index_node.is_file() {
            return Some((index_node.to_string_lossy().into_owned(), false));
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

    fn with_appended_extension(path: &std::path::Path, extension: &str) -> std::path::PathBuf {
        std::path::PathBuf::from(format!("{}{}", path.to_string_lossy(), extension))
    }

    fn cjs_analysis_file_or_directory_candidates(target_path: &std::path::Path) -> Vec<std::path::PathBuf> {
        vec![
            target_path.to_path_buf(),
            Self::with_appended_extension(target_path, ".js"),
            Self::with_appended_extension(target_path, ".json"),
            Self::with_appended_extension(target_path, ".node"),
            target_path.join("index.js"),
            target_path.join("index.json"),
            target_path.join("index.node"),
        ]
    }

    fn resolve_cjs_analysis_file_or_directory(package_dir: &std::path::Path, target: &str) -> Option<String> {
        let target_path = package_dir.join(target.strip_prefix("./").unwrap_or(target));
        Self::first_existing_normalized(Self::cjs_analysis_file_or_directory_candidates(&target_path))
    }

    fn resolve_cjs_analysis_package_root_file(package_dir: &std::path::Path) -> Option<String> {
        Self::first_existing_normalized(vec![
            package_dir.to_path_buf(),
            Self::with_appended_extension(package_dir, ".js"),
            Self::with_appended_extension(package_dir, ".json"),
            Self::with_appended_extension(package_dir, ".node"),
        ])
    }

    fn resolve_cjs_analysis_package_root_directory(package_dir: &std::path::Path) -> Option<String> {
        Self::first_existing_normalized(vec![
            package_dir.join("index.js"),
            package_dir.join("index.json"),
            package_dir.join("index.node"),
        ])
    }

    fn resolve_cjs_analysis_directory_fallback_step(
        step: CjsAnalysisDirectoryFallbackStep,
        directory_path: &std::path::Path,
        package: Option<&PackageJson>,
    ) -> Option<String> {
        match step {
            CjsAnalysisDirectoryFallbackStep::RootFile => {
                Self::resolve_cjs_analysis_package_root_file(directory_path)
            }
            CjsAnalysisDirectoryFallbackStep::PackageMain => {
                let main = package.and_then(|package| package.main.as_ref())?;
                Self::resolve_cjs_analysis_file_or_directory(directory_path, main)
            }
            CjsAnalysisDirectoryFallbackStep::RootDirectory => {
                Self::resolve_cjs_analysis_package_root_directory(directory_path)
            }
        }
    }

    fn resolve_cjs_analysis_relative(target_path: &std::path::Path) -> Option<String> {
        if let Some(resolved) = Self::resolve_cjs_analysis_directory_fallback_step(
            CjsAnalysisDirectoryFallbackStep::RootFile,
            target_path,
            None,
        ) {
            return Some(resolved);
        }

        if !target_path.is_dir() {
            return None;
        }

        let pkg_path = target_path.join("package.json");
        let package = match Self::read_package_json_optional(&pkg_path) {
            Ok(package) => package,
            Err(_) => return None,
        };
        let steps = [
            CjsAnalysisDirectoryFallbackStep::PackageMain,
            CjsAnalysisDirectoryFallbackStep::RootDirectory,
        ];
        for step in steps {
            if let Some(resolved) =
                Self::resolve_cjs_analysis_directory_fallback_step(step, target_path, package.as_deref())
            {
                return Some(resolved);
            }
        }

        None
    }

    fn resolve_package_exports(
        package_name: &str,
        package_dir: &std::path::Path,
        exports: &PackageTarget,
        subpath: &str,
        conditions: &[String],
        warnings: &mut Vec<NodePackageWarning>,
        importer: Option<&str>,
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
                    no_exports_main: false,
                });
            }
            return Self::resolve_package_target_with_context(
                package_dir,
                exports,
                false,
                "exports",
                conditions,
                None,
                &key,
                None,
                importer,
                warnings,
            )
            .and_then(|resolution| {
                Self::target_resolution_to_export_result(
                    resolution,
                    package_name,
                    subpath,
                    key == "." && Self::is_conditions_object(exports),
                )
            });
        }

        if let PackageTarget::Object(map) = exports {
            if let Some((target, pattern_substitution, pattern_key)) =
                Self::find_package_map_target(map, &key, "is not a valid match in pattern")?
            {
                return Self::resolve_package_target_with_context(
                    package_dir,
                    target,
                    false,
                    "exports",
                    conditions,
                    pattern_substitution.as_deref(),
                    &key,
                    pattern_key,
                    importer,
                    warnings,
                )
                .and_then(|resolution| {
                    Self::target_resolution_to_export_result(resolution, package_name, subpath, false)
                });
            }
        }

        Err(NodePackageResolveError::PackagePathNotExported {
            package_name: package_name.to_string(),
            subpath: subpath.to_string(),
            no_exports_main: false,
        })
    }

    fn resolve_package_import(
        package_dir: &std::path::Path,
        imports: &PackageTarget,
        specifier: &str,
        conditions: &[String],
        warnings: &mut Vec<NodePackageWarning>,
        importer: Option<&str>,
    ) -> Result<String, NodePackageResolveError> {
        if let PackageTarget::Object(map) = imports
        {
            if let Some((target, pattern_substitution, pattern_key)) =
                Self::find_package_map_target(
                    map,
                    specifier,
                    "request is not a valid match in pattern",
                )?
            {
                return Self::resolve_package_target_with_context(
                    package_dir,
                    target,
                    true,
                    "imports",
                    conditions,
                    pattern_substitution.as_deref(),
                    specifier,
                    pattern_key,
                    importer,
                    warnings,
                )
                .and_then(
                    |resolution| Self::target_resolution_to_import_result(resolution, specifier),
                );
            }
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

    fn validate_package_exports_map(
        pkg_path: &std::path::Path,
        exports: &PackageTarget,
    ) -> Result<(), NodePackageResolveError> {
        let PackageTarget::Object(map) = exports else {
            return Ok(());
        };
        if map.keys().any(|key| {
            !key.is_empty()
                && key
                    .chars()
                    .enumerate()
                    .all(|(idx, ch)| ch.is_ascii_digit() && (idx > 0 || ch != '0' || key.len() == 1))
        }) {
            return Err(NodePackageResolveError::InvalidPackageConfig {
                path: pkg_path.to_string_lossy().into_owned(),
                reason: Some("\"exports\" cannot contain numeric property keys".to_string()),
            });
        }
        let has_subpath_key = map.keys().any(|key| key.starts_with('.'));
        let has_condition_key = map.keys().any(|key| !key.starts_with('.'));
        if has_subpath_key && has_condition_key {
            return Err(NodePackageResolveError::InvalidPackageConfig {
                path: pkg_path.to_string_lossy().into_owned(),
                reason: Some(
                    "\"exports\" cannot contain some keys starting with '.' and some not. The exports object must either be an object of package subpath keys or an object of main entry condition name keys only."
                        .to_string(),
                ),
            });
        }
        Ok(())
    }

    fn decode_package_target_path(target: &str) -> String {
        percent_decode(target).unwrap_or_else(|| target.to_string())
    }

    fn resolve_package_target_with_context(
        package_dir: &std::path::Path,
        target: &PackageTarget,
        allow_bare_target: bool,
        kind: &'static str,
        conditions: &[String],
        pattern_substitution: Option<&str>,
        warning_specifier: &str,
        warning_pattern_key: Option<&str>,
        warning_importer: Option<&str>,
        warnings: &mut Vec<NodePackageWarning>,
    ) -> Result<PackageTargetResolution, NodePackageResolveError> {
        let ctx = PackageTargetResolveContext {
            package_dir,
            allow_bare_target,
            kind,
            conditions,
            pattern_substitution,
            warning_specifier,
            warning_pattern_key,
            warning_importer,
        };
        Self::add_invalid_package_target_context(
            Self::resolve_package_target_value(target, &ctx, warnings),
            warning_specifier,
        )
    }

    fn resolve_package_target_value(
        target: &PackageTarget,
        ctx: &PackageTargetResolveContext<'_>,
        warnings: &mut Vec<NodePackageWarning>,
    ) -> Result<PackageTargetResolution, NodePackageResolveError> {
        match target {
            PackageTarget::Null => {
                return Ok(PackageTargetResolution::Blocked);
            }
            PackageTarget::Bool(false) => {
                return Err(NodePackageResolveError::InvalidPackageTarget {
                    kind: ctx.kind,
                    target: "false".to_string(),
                });
            }
            PackageTarget::Bool(true) => {
                return Err(NodePackageResolveError::InvalidPackageTarget {
                    kind: ctx.kind,
                    target: "true".to_string(),
                });
            }
            PackageTarget::Invalid(value) => {
                return Err(NodePackageResolveError::InvalidPackageTarget {
                    kind: ctx.kind,
                    target: value.to_string(),
                });
            }
            PackageTarget::String(target_str) => {
                let target_str = if let Some(pattern_substitution) = ctx.pattern_substitution {
                    target_str.replace('*', pattern_substitution)
                } else {
                    target_str.clone()
                };
                Self::push_package_deprecation_warning(
                    warnings,
                    ctx.package_dir,
                    ctx.kind,
                    ctx.warning_specifier,
                    &target_str,
                    ctx.pattern_substitution,
                    ctx.warning_pattern_key,
                    ctx.warning_importer,
                );
                if ctx.allow_bare_target && Self::is_bare_package_specifier(&target_str) {
                    let base = ctx.package_dir.join("package.json");
                    let base_str = base.to_string_lossy();
                    let resolver = NodeModulesResolver;
                    if let Some(resolved) =
                        resolver.try_resolve(&base_str, &target_str, ctx.conditions, warnings)?
                    {
                        return Ok(PackageTargetResolution::Resolved(resolved));
                    }
                    return Err(NodePackageResolveError::ModuleNotFound {
                        request: target_str,
                    });
                }
                if ctx.allow_bare_target && target_str.starts_with("node:") {
                    return Ok(PackageTargetResolution::Resolved(target_str));
                }
                if Self::has_encoded_slash_or_backslash(&target_str) {
                    return Err(NodePackageResolveError::InvalidPackagePatternMatch {
                        specifier: target_str,
                        message: "must not include encoded \"/\" or \"\\\" characters".to_string(),
                    });
                }
                if !target_str.starts_with("./") {
                    return Err(NodePackageResolveError::InvalidPackageTarget {
                        kind: ctx.kind,
                        target: target_str,
                    });
                }
                let decoded_target = Self::decode_package_target_path(&target_str);
                let Some(candidate) =
                    Self::resolve_valid_package_target_path(ctx.package_dir, &decoded_target)
                else {
                    return Err(NodePackageResolveError::InvalidPackageTarget {
                        kind: ctx.kind,
                        target: target_str,
                    });
                };
                if candidate.is_file() {
                    return Ok(PackageTargetResolution::Resolved(
                        candidate.to_string_lossy().into_owned(),
                    ));
                }
                if candidate.is_dir() {
                    return Err(NodePackageResolveError::UnsupportedDirectoryImport {
                        request: candidate.to_string_lossy().into_owned(),
                    });
                }
                return Err(NodePackageResolveError::ModuleNotFound {
                    request: candidate.to_string_lossy().into_owned(),
                });
            }
            PackageTarget::Array(array) => {
                let mut last_fallback_error = None;
                for item in array {
                    match Self::resolve_package_target_value(item, ctx, warnings) {
                        Ok(PackageTargetResolution::Resolved(path)) => {
                            return Ok(PackageTargetResolution::Resolved(path));
                        }
                        Ok(PackageTargetResolution::Blocked) => continue,
                        Ok(PackageTargetResolution::NoMatch) => continue,
                        Err(err @ NodePackageResolveError::InvalidPackageTarget { .. }) => {
                            last_fallback_error = Some(err);
                            continue;
                        }
                        Err(err) => return Err(err),
                    }
                }
                if let Some(err) = last_fallback_error {
                    return Err(err);
                }
                return Ok(PackageTargetResolution::NoMatch);
            }
            PackageTarget::Object(map) => {
                for (condition, value) in map {
                    if ctx
                        .conditions
                        .iter()
                        .any(|candidate| candidate == condition)
                    {
                        match Self::resolve_package_target_value(value, ctx, warnings)? {
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
        if key.len() <= prefix.len() + suffix.len() {
            return None;
        }
        Some(key[prefix.len()..key.len() - suffix.len()].to_string())
    }

    fn has_encoded_slash_or_backslash(value: &str) -> bool {
        let lower = value.to_ascii_lowercase();
        lower.contains("%2f") || lower.contains("%5c")
    }

    fn is_invalid_package_pattern_substitution(substitution: &str) -> bool {
        if Self::has_encoded_slash_or_backslash(substitution) {
            return true;
        }
        substitution
            .split('/')
            .any(|segment| !segment.is_empty() && Self::is_invalid_package_target_segment(segment))
    }

    fn invalid_package_pattern_substitution_message(substitution: &str, fallback: &str) -> String {
        if Self::has_encoded_slash_or_backslash(substitution) {
            "must not include encoded \"/\" or \"\\\" characters".to_string()
        } else {
            fallback.to_string()
        }
    }

    fn add_invalid_package_target_context(
        result: Result<PackageTargetResolution, NodePackageResolveError>,
        specifier: &str,
    ) -> Result<PackageTargetResolution, NodePackageResolveError> {
        result.map_err(|err| match err {
            NodePackageResolveError::InvalidPackageTarget { kind, target } => {
                NodePackageResolveError::InvalidPackageTarget {
                    kind,
                    target: if target.contains(specifier) {
                        target
                    } else {
                        format!("{} for {}", target, specifier)
                    },
                }
            }
            other => other,
        })
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

    fn find_package_map_target<'a>(
        map: &'a IndexMap<String, PackageTarget>,
        specifier: &str,
        invalid_pattern_message: &str,
    ) -> Result<Option<(&'a PackageTarget, Option<String>, Option<&'a str>)>, NodePackageResolveError> {
        if let Some(target) = map.get(specifier) {
            return Ok(Some((target, None, None)));
        }

        let Some((pattern_key, pattern_substitution)) = Self::find_best_package_pattern(map, specifier) else {
            return Ok(None);
        };
        if Self::is_invalid_package_pattern_substitution(&pattern_substitution) {
            return Err(NodePackageResolveError::InvalidPackagePatternMatch {
                specifier: specifier.to_string(),
                message: Self::invalid_package_pattern_substitution_message(
                    &pattern_substitution,
                    invalid_pattern_message,
                ),
            });
        }
        Ok(map
            .get(pattern_key)
            .map(|target| (target, Some(pattern_substitution), Some(pattern_key))))
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
        no_exports_main: bool,
    ) -> Result<String, NodePackageResolveError> {
        match resolution {
            PackageTargetResolution::Resolved(path) => Ok(path),
            PackageTargetResolution::NoMatch | PackageTargetResolution::Blocked => {
        Err(NodePackageResolveError::PackagePathNotExported {
                    package_name: package_name.to_string(),
                    subpath: subpath.to_string(),
                    no_exports_main,
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

    fn has_deprecated_double_slash(value: &str) -> bool {
        value.contains("//")
    }

    fn has_deprecated_leading_or_trailing_slash(value: Option<&str>) -> bool {
        value.is_some_and(|value| value.starts_with('/') || value.ends_with('/'))
    }

    fn package_warning_location(
        package_dir: &std::path::Path,
        kind: &str,
        importer: Option<&str>,
    ) -> String {
        let package_json = package_dir.join("package.json");
        let mut location = format!(
            " in the \"{}\" field module resolution of the package at {}",
            kind,
            package_json.to_string_lossy()
        );
        if let Some(importer) = importer {
            location.push_str(" imported from ");
            location.push_str(importer);
        }
        location.push('.');
        location
    }

    fn push_package_deprecation_warning(
        warnings: &mut Vec<NodePackageWarning>,
        package_dir: &std::path::Path,
        kind: &str,
        specifier: &str,
        target: &str,
        pattern_substitution: Option<&str>,
        pattern_key: Option<&str>,
        importer: Option<&str>,
    ) {
        if kind == "exports"
            && pattern_substitution.is_some_and(|substitution| substitution.ends_with('/'))
        {
            let location = Self::package_warning_location(package_dir, kind, importer);
            warnings.push(NodePackageWarning {
                message: format!(
                    "Use of deprecated trailing slash pattern mapping {:?}{} Mapping specifiers ending in \"/\" is no longer supported.",
                    specifier, location
                ),
                code: "DEP0155",
                dedupe_key: Some(format!(
                    "{}:{}",
                    package_dir.to_string_lossy(),
                    specifier
                )),
            });
            return;
        }
        if Self::has_deprecated_double_slash(target) {
            let location = Self::package_warning_location(package_dir, kind, importer);
            let matched_pattern = pattern_key
                .map(|pattern_key| format!(" matched to {:?}", pattern_key))
                .unwrap_or_default();
            warnings.push(NodePackageWarning {
                message: format!(
                    "Use of deprecated double slash resolving {:?} for module request {:?}{}{}",
                    target, specifier, matched_pattern, location
                ),
                code: "DEP0166",
                dedupe_key: None,
            });
        } else if Self::has_deprecated_leading_or_trailing_slash(pattern_substitution) {
            let location = Self::package_warning_location(package_dir, kind, importer);
            let matched_pattern = pattern_key
                .map(|pattern_key| format!(" matched to {:?}", pattern_key))
                .unwrap_or_default();
            warnings.push(NodePackageWarning {
                message: format!(
                    "Use of deprecated leading or trailing slash matching resolving {:?} for module request {:?}{}{}",
                    target, specifier, matched_pattern, location
                ),
                code: "DEP0166",
                dedupe_key: None,
            });
        } else if Self::has_deprecated_double_slash(specifier) {
            let location = Self::package_warning_location(package_dir, kind, importer);
            let matched_pattern = pattern_key
                .map(|pattern_key| format!(" matched to {:?}", pattern_key))
                .unwrap_or_default();
            warnings.push(NodePackageWarning {
                message: format!(
                    "Use of deprecated double slash resolving {:?} for module request {:?}{}{}",
                    target, specifier, matched_pattern, location
                ),
                code: "DEP0166",
                dedupe_key: None,
            });
        }
    }

    fn default_conditions(defaults: &[&str]) -> Vec<String> {
        defaults.iter().map(|condition| (*condition).to_string()).collect()
    }

    fn conditions_from_global(ctx: &Ctx<'_>, defaults: &[&str]) -> Vec<String> {
        let mut conditions = Self::default_conditions(defaults);
        let Ok(user_conditions) = ctx.globals().get::<_, rquickjs::Array>("__wasm_rquickjs_package_conditions") else {
            return conditions;
        };

        for i in 0..user_conditions.len() {
            if let Ok(condition) = user_conditions.get::<String>(i) {
                Self::add_condition(&mut conditions, &condition);
            }
        }

        conditions
    }

    fn add_condition(conditions: &mut Vec<String>, condition: &str) {
        if condition.is_empty() || conditions.iter().any(|existing| existing == condition) {
            return;
        }
        conditions.push(condition.to_string());
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

fn emit_node_package_deprecation_warnings<'js>(
    ctx: &Ctx<'js>,
    warnings: &[NodePackageWarning],
) -> rquickjs::Result<()> {
    if warnings.is_empty() {
        return Ok(());
    }
    let process_object = match ctx.globals().get::<_, Object>("process") {
        Ok(process_object) => process_object,
        Err(_) => {
            let error_ctor: Function = ctx.globals().get("Error")?;
            let error_obj: Object = error_ctor.call(("Internal process object is not initialized",))?;
            return Err(ctx.throw(error_obj.into_value()));
        }
    };
    for warning in warnings {
        let key = warning.dedupe_key.as_deref().unwrap_or(warning.message.as_str());
        let warning_key = if warning.code == "DEP0155" {
            Some(format!("{}:{}", warning.code, key))
        } else {
            None
        };
        let no_deprecation = process_object.get::<_, Coerced<bool>>("noDeprecation")?.0;
        if no_deprecation {
            continue;
        }
        if let Some(warning_key) = warning_key.as_deref()
            && node_package_deprecation_warning_seen(warning_key)
        {
            continue;
        }
        if let Some(warning_key) = warning_key.as_ref() {
            mark_node_package_deprecation_warning_seen(warning_key.clone());
        }
        let emit_warning: Function = process_object.get("emitWarning")?;
        let _: Value = emit_warning.call((
            This(process_object.clone()),
            warning.message.as_str(),
            "DeprecationWarning",
            warning.code,
        ))?;
    }
    Ok(())
}

fn throw_node_package_resolve_error<'js>(
    ctx: &Ctx<'js>,
    err: NodePackageResolveError,
) -> rquickjs::Result<String> {
    let (code, message, type_error) = match err {
        NodePackageResolveError::InvalidModuleSpecifier { specifier, base } => (
            "ERR_INVALID_MODULE_SPECIFIER",
            format!(
                "Invalid module \"{}\" is not a valid package name imported from {}",
                specifier, base
            ),
            true,
        ),
        NodePackageResolveError::InvalidPackagePatternMatch { specifier, message } => (
            "ERR_INVALID_MODULE_SPECIFIER",
            format!("Invalid module \"{}\" {}", specifier, message),
            true,
        ),
        NodePackageResolveError::PackagePathNotExported {
            package_name,
            subpath,
            no_exports_main,
        } => {
            if no_exports_main {
                (
                    "ERR_PACKAGE_PATH_NOT_EXPORTED",
                    format!("No \"exports\" main defined in package {}", package_name),
                    false,
                )
            } else {
                let subpath = if subpath.is_empty() {
                    ".".to_string()
                } else {
                    format!("./{}", subpath)
                };
                (
                    "ERR_PACKAGE_PATH_NOT_EXPORTED",
                    format!("Package subpath '{}' is not defined by \"exports\" in package {}", subpath, package_name),
                    false,
                )
            }
        }
        NodePackageResolveError::PackageImportNotDefined { specifier } => (
            "ERR_PACKAGE_IMPORT_NOT_DEFINED",
            format!("Package import specifier '{}' is not defined", specifier),
            false,
        ),
        NodePackageResolveError::InvalidPackageTarget { kind, target } => {
            let mut message = format!("Invalid \"{}\" target '{}'", kind, target);
            if kind == "exports" && !target.starts_with("./") {
                message.push_str("; targets must start with \"./\"");
            }
            ("ERR_INVALID_PACKAGE_TARGET", message, false)
        }
        NodePackageResolveError::InvalidPackageConfig { path, reason } => (
            "ERR_INVALID_PACKAGE_CONFIG",
            match reason {
                Some(reason) => format!("Invalid package config {}. {}", path, reason),
                None => format!("Invalid package config {}", path),
            },
            false,
        ),
        NodePackageResolveError::UnsupportedDirectoryImport { request } => (
            "ERR_UNSUPPORTED_DIR_IMPORT",
            format!(
                "Directory import '{}' is not supported resolving ES modules",
                request
            ),
            false,
        ),
        NodePackageResolveError::ModuleNotFound { request } => (
            "ERR_MODULE_NOT_FOUND",
            format!("Cannot find module '{}'", request),
            false,
        ),
    };

    throw_native_coded_error(ctx, &message, code, type_error)
}

impl Resolver for NodeModulesResolver {
    fn resolve<'js>(
        &mut self,
        ctx: &Ctx<'js>,
        base: &str,
        name: &str,
    ) -> rquickjs::Result<String> {
        let conditions =
            Self::conditions_from_global(ctx, NodePackageResolveMode::EsmImport.default_conditions());
        let mut warnings = Vec::new();
        let (resolution_name, suffix) = if has_import_type_rewrite_token(name) {
            split_module_path_suffix(name)
        } else {
            (name, "")
        };
        let package_like = resolution_name.starts_with('#')
            || !(resolution_name.starts_with('.')
                || resolution_name.starts_with('/')
                || resolution_name.contains("://"));
        let result = self.try_resolve(base, resolution_name, &conditions, &mut warnings);
        emit_node_package_deprecation_warnings(ctx, &warnings)?;
        match result {
            Ok(Some(resolved)) => {
                let suffix = append_loader_realm_param(suffix, loader_realm_param(base).as_deref());
                let resolved = if suffix.is_empty() {
                    resolved
                } else {
                    format!("{resolved}{suffix}")
                };
                transfer_import_type_rewrite_token(name, &resolved);
                Ok(resolved)
            }
            Ok(None) => {
                if package_like {
                    discard_import_type_rewrite_token(name);
                }
                Err(Error::new_resolving(base, name))
            }
            Err(err) => {
                discard_import_type_rewrite_token(name);
                throw_node_package_resolve_error(ctx, err)
            }
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
    is_ident_start_boundary(source, pos) && (pos == 0 || !matches!(source[pos - 1], b'.' | b'#'))
}

fn skip_ws_comments(source: &str, pos: usize) -> usize {
    skip_ws_comments_impl::<false>(source, pos).0
}

fn skip_ws_comments_with_line_terminator(source: &str, pos: usize) -> (usize, bool) {
    skip_ws_comments_impl::<true>(source, pos)
}

fn skip_ws_comments_impl<const TRACK_LINE_TERMINATOR: bool>(
    source: &str,
    mut pos: usize,
) -> (usize, bool) {
    let bytes = source.as_bytes();
    let mut has_line_terminator = false;
    loop {
        while pos < bytes.len() && bytes[pos].is_ascii_whitespace() {
            if TRACK_LINE_TERMINATOR && matches!(bytes[pos], b'\n' | b'\r') {
                has_line_terminator = true;
            }
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
                if TRACK_LINE_TERMINATOR && matches!(bytes[pos], b'\n' | b'\r') {
                    has_line_terminator = true;
                }
                pos += 1;
            }
            pos = (pos + 2).min(bytes.len());
            continue;
        }
        return (pos, has_line_terminator);
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

fn parse_ident_name(source: &str, pos: usize, name: &str) -> Option<usize> {
    let bytes = source.as_bytes();
    if !is_ident_start_boundary(bytes, pos)
        || !source[pos..].starts_with(name)
        || !is_ident_boundary(bytes, pos + name.len())
    {
        return None;
    }
    Some(pos + name.len())
}

fn parse_free_ident_name(source: &str, pos: usize, name: &str) -> Option<usize> {
    let bytes = source.as_bytes();
    if !is_free_ident_start(bytes, pos) {
        return None;
    }
    parse_ident_name(source, pos, name)
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
    if let Some(exports_end) = parse_free_ident_name(source, pos, "exports") {
        return Some((CjsExportTarget::Exports, exports_end));
    }
    if let Some(module_end) = parse_free_ident_name(source, pos, "module") {
        let mut i = skip_ws_comments(source, module_end);
        if i < bytes.len() && bytes[i] == b'.' {
            i = skip_ws_comments(source, i + 1);
            if let Some(exports_end) = parse_ident_name(source, i, "exports") {
                return Some((CjsExportTarget::ModuleExports, exports_end));
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
    parse_require_call_string(source, pos, true)
}

fn parse_require_string_loose(source: &str, pos: usize) -> Option<(String, usize)> {
    parse_require_call_string(source, pos, false)
}

fn parse_require_call_string(source: &str, pos: usize, require_free_start: bool) -> Option<(String, usize)> {
    let bytes = source.as_bytes();
    let require_end = if require_free_start {
        parse_free_ident_name(source, pos, "require")?
    } else {
        parse_ident_name(source, pos, "require")?
    };
    let mut i = skip_ws_comments(source, require_end);
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

fn parse_object_define_property_call(source: &str, pos: usize) -> Option<usize> {
    let bytes = source.as_bytes();
    let mut i = skip_ws_comments(source, parse_free_ident_name(source, pos, "Object")?);
    if i >= bytes.len() || bytes[i] != b'.' {
        return None;
    }
    i = skip_ws_comments(source, i + 1);
    i = skip_ws_comments(source, parse_ident_name(source, i, "defineProperty")?);
    if i >= bytes.len() || bytes[i] != b'(' {
        return None;
    }
    Some(skip_ws_comments(source, i + 1))
}

fn parse_define_property_export(source: &str, pos: usize) -> Option<(String, usize)> {
    let bytes = source.as_bytes();
    let mut i = parse_object_define_property_call(source, pos)?;
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
    if descriptor_has_named_property(descriptor) {
        Some((name, end + 1))
    } else {
        None
    }
}

enum DescriptorNamedProperty {
    Value,
    Getter,
}

fn descriptor_function_getter_body(
    source: &str,
    pos: usize,
    descriptor_end: usize,
) -> Option<(usize, usize, usize)> {
    let bytes = source.as_bytes();
    let mut next = skip_ws_comments(source, parse_ident_name(source, pos, "function")?);
    if let Some((_, ident_end)) = read_ident(source, next) {
        next = skip_ws_comments(source, ident_end);
    }
    if next >= descriptor_end || bytes[next] != b'(' {
        return None;
    }
    let body = getter_body_after_empty_params(source, next, descriptor_end)?;
    Some((body.0, body.1, body.1 + 1))
}

fn descriptor_function_getter_end(source: &str, pos: usize, descriptor_end: usize) -> Option<usize> {
    let body = descriptor_function_getter_body(source, pos, descriptor_end)?;
    if !is_simple_getter_body(&source[body.0..body.1]) {
        return None;
    }
    Some(body.2)
}

fn getter_body_after_empty_params(source: &str, params_open: usize, limit: usize) -> Option<(usize, usize)> {
    let params_end = find_matching_paren(source, params_open)?;
    if params_end > limit || skip_ws_comments(source, params_open + 1) != params_end {
        return None;
    }
    let body_open = skip_ws_comments(source, params_end + 1);
    if body_open >= limit || source.as_bytes()[body_open] != b'{' {
        return None;
    }
    let body_end = find_matching_brace(source, body_open)?;
    if body_end > limit {
        return None;
    }
    Some((body_open + 1, body_end))
}

fn descriptor_object_span(descriptor: &str) -> Option<(usize, usize)> {
    let bytes = descriptor.as_bytes();
    let descriptor_start = skip_ws_comments(descriptor, 0);
    if descriptor_start >= bytes.len() || bytes[descriptor_start] != b'{' {
        return None;
    }
    let descriptor_end = find_matching_brace(descriptor, descriptor_start)?;
    Some((skip_ws_comments(descriptor, descriptor_start + 1), descriptor_end))
}

fn next_descriptor_entry(descriptor: &str, cursor: usize, descriptor_end: usize) -> Option<usize> {
    if cursor >= descriptor_end {
        return Some(descriptor_end);
    }
    if descriptor.as_bytes()[cursor] != b',' {
        return None;
    }
    Some(skip_ws_comments(descriptor, cursor + 1))
}

fn descriptor_has_named_property(descriptor: &str) -> bool {
    let bytes = descriptor.as_bytes();
    let Some((mut cursor, descriptor_end)) = descriptor_object_span(descriptor) else {
        return false;
    };
    let mut found: Option<DescriptorNamedProperty> = None;
    while cursor < descriptor_end {
        if bytes[cursor] == b',' {
            cursor = skip_ws_comments(descriptor, cursor + 1);
            continue;
        }
        if descriptor[cursor..].starts_with("...") {
            return false;
        }
        if bytes[cursor] == b'[' {
            if matches!(found, Some(DescriptorNamedProperty::Value)) {
                cursor = skip_ws_comments(descriptor, skip_object_literal_value(descriptor, cursor, descriptor_end));
                let Some(next_cursor) = next_descriptor_entry(descriptor, cursor, descriptor_end) else {
                    return false;
                };
                cursor = next_cursor;
                continue;
            }
            return false;
        }

        let Some((name, key_is_ident, key_end)) = parse_exports_literal_key(descriptor, cursor) else {
            return false;
        };
        let next = skip_ws_comments(descriptor, key_end);
        if !key_is_ident {
            if !matches!(found, Some(DescriptorNamedProperty::Value)) {
                return false;
            }
            cursor = skip_ws_comments(descriptor, skip_object_literal_value(descriptor, next, descriptor_end));
        } else if name == "value" {
            if matches!(found, Some(DescriptorNamedProperty::Getter)) {
                return false;
            }
            if matches!(found, Some(DescriptorNamedProperty::Value)) {
                let value_start = if next < descriptor_end && bytes[next] == b':' {
                    next + 1
                } else {
                    next
                };
                cursor = skip_ws_comments(descriptor, skip_object_literal_value(descriptor, value_start, descriptor_end));
            } else {
                if next >= descriptor_end || bytes[next] != b':' {
                    return false;
                }
                found = Some(DescriptorNamedProperty::Value);
                cursor = skip_ws_comments(descriptor, skip_object_literal_value(descriptor, next + 1, descriptor_end));
            }
        } else if name == "get" {
            if found.is_some() {
                return false;
            }
            if next < descriptor_end && bytes[next] == b'(' {
                let Some((body_start, body_end)) = getter_body_after_empty_params(descriptor, next, descriptor_end) else {
                    return false;
                };
                if !is_simple_getter_body(&descriptor[body_start..body_end]) {
                    return false;
                }
                found = Some(DescriptorNamedProperty::Getter);
                cursor = skip_ws_comments(descriptor, body_end + 1);
            } else if next < descriptor_end && bytes[next] == b':' {
                let function_end = descriptor_function_getter_end(descriptor, skip_ws_comments(descriptor, next + 1), descriptor_end);
                let Some(function_end) = function_end else {
                    return false;
                };
                found = Some(DescriptorNamedProperty::Getter);
                cursor = skip_ws_comments(descriptor, function_end);
            } else {
                return false;
            }
        } else if name == "enumerable" {
            if next >= descriptor_end || bytes[next] != b':' {
                return false;
            }
            if matches!(found, Some(DescriptorNamedProperty::Value)) {
                cursor = skip_ws_comments(descriptor, skip_object_literal_value(descriptor, next + 1, descriptor_end));
                let Some(next_cursor) = next_descriptor_entry(descriptor, cursor, descriptor_end) else {
                    return false;
                };
                cursor = next_cursor;
                continue;
            }
            if matches!(found, Some(DescriptorNamedProperty::Getter)) {
                return false;
            }
            let value_start = skip_ws_comments(descriptor, next + 1);
            let Some(true_end) = parse_ident_name(descriptor, value_start, "true") else {
                return false;
            };
            cursor = skip_ws_comments(descriptor, true_end);
        } else {
            if matches!(found, Some(DescriptorNamedProperty::Value)) {
                cursor = skip_ws_comments(descriptor, skip_object_literal_value(descriptor, next, descriptor_end));
            } else {
                return false;
            }
        }

        let Some(next_cursor) = next_descriptor_entry(descriptor, cursor, descriptor_end) else {
            return false;
        };
        cursor = next_cursor;
    }

    found.is_some()
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


fn is_simple_getter_body(body: &str) -> bool {
    let return_pos = skip_ws_comments(body, 0);
    let Some(return_end) = parse_free_ident_name(body, return_pos, "return") else {
        return false;
    };
    let mut i = skip_ws_comments(body, return_end);
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

    let mut i = skip_ws_comments(source, parse_free_ident_name(source, pos, "_interopRequireWildcard")?);
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
        if let Some(keyword_end) = parse_free_ident_name(source, pos, keyword) {
            let mut i = skip_ws_comments(source, keyword_end);
            let (name, next) = read_ident(source, i)?;
            i = skip_ws_comments(source, next);
            if i >= source.len() || source.as_bytes()[i] != b'=' {
                return None;
            }
            i = skip_ws_comments(source, i + 1);
            let (specifier, next) = parse_exports_assign_require_value(source, i)?;
            if !is_statement_boundary(source, next) {
                return None;
            }
            return Some((name, specifier, next));
        }
    }
    None
}

fn is_statement_boundary(source: &str, pos: usize) -> bool {
    let (next, has_line_terminator) = skip_ws_comments_with_line_terminator(source, pos);
    if next >= source.len() {
        return true;
    }
    if matches!(source.as_bytes()[next], b';' | b'}') {
        return true;
    }
    has_line_terminator && !is_asi_continuation_next(source, next)
}

fn is_asi_continuation_previous(byte: u8) -> bool {
    matches!(
        byte,
        b'(' | b'[' | b'.' | b',' | b'=' | b':' | b'?' | b'!' | b'~' | b'+' | b'-' | b'*' | b'/' | b'%' | b'&'
            | b'|' | b'^' | b'<' | b'>'
    )
}

fn is_asi_continuation_next(source: &str, pos: usize) -> bool {
    let bytes = source.as_bytes();
    if pos + 1 < bytes.len() && matches!(&source[pos..pos + 2], "++" | "--") {
        return false;
    }
    matches!(
        bytes[pos],
        b'(' | b'[' | b'.' | b',' | b':' | b'?' | b'+' | b'-' | b'*' | b'/' | b'%' | b'&' | b'|' | b'^' | b'<' | b'>'
            | b'='
    )
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
        if !member_access {
            if let Some(export_star_end) = parse_free_ident_name(source, pos, "__exportStar") {
                return Some(export_star_end);
            }
            if let Some(export_end) = parse_free_ident_name(source, pos, "__export") {
                return Some(export_end);
            }
        }
        if let Some(tslib_end) = parse_free_ident_name(source, pos, "tslib") {
            let mut i = skip_ws_comments(source, tslib_end);
            if i >= bytes.len() || bytes[i] != b'.' {
                return None;
            }
            i = skip_ws_comments(source, i + 1);
            if let Some(export_star_end) = parse_ident_name(source, i, "__exportStar") {
                return Some(export_star_end);
            }
            if let Some(export_end) = parse_ident_name(source, i, "__export") {
                return Some(export_end);
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

enum ObjectLiteralValueExport {
    NamedContinue,
    NamedStop,
}

fn named_export_object_literal_value(source: &str, pos: usize, object_end: usize) -> Option<ObjectLiteralValueExport> {
    let Some((ident, mut next)) = read_ident(source, pos) else {
        return None;
    };
    next = skip_ws_comments(source, next);
    if next >= object_end || source.as_bytes()[next] == b',' {
        Some(ObjectLiteralValueExport::NamedContinue)
    } else if matches!(ident.as_str(), "true" | "false" | "null" | "undefined") {
        Some(ObjectLiteralValueExport::NamedContinue)
    } else {
        Some(ObjectLiteralValueExport::NamedStop)
    }
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
            let spread_start = skip_ws_comments(source, cursor + 3);
            let next = if let Some((specifier, next)) = parse_require_string_loose(source, spread_start) {
                add_unique(&mut reexports, specifier);
                next
            } else if let Some((_, next)) = read_ident(source, spread_start) {
                let after_ident = skip_ws_comments(source, next);
                if after_ident < object_end && bytes[after_ident] != b',' {
                    break;
                }
                after_ident
            } else {
                break;
            };
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
            if parse_require_string_loose(source, next).is_some() {
                add_unique(&mut exports, name);
                break;
            }
            match named_export_object_literal_value(source, next, object_end) {
                Some(ObjectLiteralValueExport::NamedContinue) => {
                    add_unique(&mut exports, name);
                    cursor = skip_ws_comments(source, skip_object_literal_value(source, next, object_end));
                }
                Some(ObjectLiteralValueExport::NamedStop) => {
                    add_unique(&mut exports, name);
                    break;
                }
                None => break,
            }
        } else if key_is_ident {
            add_unique(&mut exports, name);
            cursor = next;
            if cursor < object_end && bytes[cursor] != b',' {
                break;
            }
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
    let mut i = skip_ws_comments(source, parse_free_ident_name(source, pos, "Object")?);
    if i >= bytes.len() || bytes[i] != b'.' {
        return None;
    }
    i = skip_ws_comments(source, i + 1);
    i = skip_ws_comments(source, parse_ident_name(source, i, "keys")?);
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
    let for_each_end = parse_ident_name(source, for_each_pos, "forEach")?;
    let end = find_matching_paren(source, for_each_end).unwrap_or(for_each_end);
    let (callback_key, callback_body) = extract_for_each_callback_body(source, for_each_pos, end)?;
    if callback_has_transpiler_reexport(callback_body, &binding, &callback_key) {
        Some((specifier, end + 1))
    } else {
        None
    }
}

fn extract_for_each_callback_body(source: &str, start: usize, end: usize) -> Option<(String, &str)> {
    let bytes = source.as_bytes();
    let call_open = source[start..end].find('(')? + start;
    let mut i = skip_ws_comments(source, call_open + 1);
    i = skip_ws_comments(source, parse_free_ident_name(source, i, "function")?);
    if i < end && is_ident_start(bytes[i]) {
        let (_, next) = read_ident(source, i)?;
        i = skip_ws_comments(source, next);
    }
    if i >= end || bytes[i] != b'(' {
        return None;
    }
    let params_end = find_matching_paren(source, i)?;
    if params_end > end {
        return None;
    }
    let mut param_pos = skip_ws_comments(source, i + 1);
    let (key, next) = read_ident(source, param_pos)?;
    param_pos = skip_ws_comments(source, next);
    if param_pos != params_end || bytes[param_pos] != b')' {
        return None;
    }
    i = skip_ws_comments(source, params_end + 1);
    if i >= end || bytes[i] != b'{' {
        return None;
    }
    let body_end = find_matching_brace(source, i)?;
    if body_end > end || skip_ws_comments(source, body_end + 1) != end {
        return None;
    }
    Some((key, &source[i + 1..body_end]))
}

fn callback_has_transpiler_reexport(callback: &str, binding: &str, key: &str) -> bool {
    let mut found = false;
    let statement_starts = statement_starts(callback);
    scan_code_positions_with_brace_depth(callback, true, |i, _, brace_depth| {
        if brace_depth != 0 {
            return ControlFlow::Continue(None);
        }
        if !statement_starts.get(i).copied().unwrap_or(false) {
            return ControlFlow::Continue(None);
        }
        if parse_export_star_conditional_reexport(callback, i, binding, key).is_some() {
            found = true;
            return ControlFlow::Break(());
        }
        if let Some(next) = parse_export_star_return_guard(callback, i, key) {
            let mut write_pos = skip_statement_separator(callback, next);
            while let Some(next_guard) = parse_duplicate_export_return_guard(callback, write_pos, binding, key) {
                write_pos = skip_statement_separator(callback, next_guard);
            }
            if statement_starts.get(write_pos).copied().unwrap_or(false)
                && (parse_define_property_reexport(callback, write_pos, binding, key).is_some()
                    || parse_direct_exports_reexport_assignment(callback, write_pos, binding, key).is_some())
            {
                found = true;
                return ControlFlow::Break(());
            }
            return ControlFlow::Continue(Some(next));
        }
        ControlFlow::Continue(None)
    });
    found
}

fn skip_statement_separator(source: &str, pos: usize) -> usize {
    let mut i = skip_ws_comments(source, pos);
    if i < source.len() && source.as_bytes()[i] == b';' {
        i = skip_ws_comments(source, i + 1);
    }
    i
}

fn parse_if_condition(source: &str, pos: usize) -> Option<(&str, usize)> {
    let bytes = source.as_bytes();
    let i = skip_ws_comments(source, parse_free_ident_name(source, pos, "if")?);
    if i >= bytes.len() || bytes[i] != b'(' {
        return None;
    }
    let condition_end = find_matching_paren(source, i)?;
    Some((
        &source[i + 1..condition_end],
        skip_ws_comments(source, condition_end + 1),
    ))
}

fn parse_export_star_conditional_reexport(source: &str, pos: usize, binding: &str, key: &str) -> Option<usize> {
    let (condition, i) = parse_if_condition(source, pos)?;
    if !is_export_star_has_own_guard_condition(condition, key) {
        return None;
    }
    parse_direct_exports_reexport_assignment(source, i, binding, key)
}

fn parse_export_star_return_guard(source: &str, pos: usize, key: &str) -> Option<usize> {
    let (condition, i) = parse_if_condition(source, pos)?;
    if !is_export_star_guard_condition(condition, key) {
        return None;
    }
    parse_free_ident_name(source, i, "return")
}

fn parse_duplicate_export_return_guard(source: &str, pos: usize, binding: &str, key: &str) -> Option<usize> {
    let (condition, i) = parse_if_condition(source, pos)?;
    if !is_duplicate_export_guard_condition(condition, binding, key) {
        return None;
    }
    parse_free_ident_name(source, i, "return")
}

fn is_duplicate_export_guard_condition(condition: &str, binding: &str, key: &str) -> bool {
    let i = skip_ws_comments(condition, 0);
    if let Some(next) = parse_exports_has_own_key(condition, i, key)
        && skip_ws_comments(condition, next) >= condition.len()
    {
        return true;
    }

    let Some(next) = parse_key_in_export_target_condition(condition, i, key) else {
        return false;
    };
    let mut i = skip_ws_comments(condition, next);
    if i + 2 > condition.len() || &condition[i..i + 2] != "&&" {
        return false;
    }
    i = skip_ws_comments(condition, i + 2);
    let Some(next) = parse_export_target_bracket_key(condition, i, key) else {
        return false;
    };
    i = skip_ws_comments(condition, next);
    if i + 3 > condition.len() || &condition[i..i + 3] != "===" {
        return false;
    }
    i = skip_ws_comments(condition, i + 3);
    let Some(next) = parse_binding_bracket_key(condition, i, binding, key) else {
        return false;
    };
    skip_ws_comments(condition, next) >= condition.len()
}

fn is_export_star_guard_condition(condition: &str, key: &str) -> bool {
    let mut i = skip_ws_comments(condition, 0);
    let (first, next) = match parse_key_equals_string(condition, i, key) {
        Some(result) => result,
        None => return false,
    };
    if first != "default" {
        return false;
    }
    i = skip_ws_comments(condition, next);
    if i + 2 > condition.len() || &condition[i..i + 2] != "||" {
        return false;
    }
    i = skip_ws_comments(condition, i + 2);
    let (second, next) = match parse_key_equals_string(condition, i, key) {
        Some(result) => result,
        None => return false,
    };
    if second != "__esModule" {
        return false;
    }
    skip_ws_comments(condition, next) >= condition.len()
}

fn is_export_star_has_own_guard_condition(condition: &str, key: &str) -> bool {
    let mut i = skip_ws_comments(condition, 0);
    let (first, next) = match parse_key_not_equals_string(condition, i, key) {
        Some(result) => result,
        None => return false,
    };
    if first != "default" {
        return false;
    }
    i = skip_ws_comments(condition, next);
    if i + 2 > condition.len() || &condition[i..i + 2] != "&&" {
        return false;
    }
    i = skip_ws_comments(condition, i + 2);
    let Some(next) = parse_negated_exports_has_own_key(condition, i, key) else {
        return false;
    };
    skip_ws_comments(condition, next) >= condition.len()
}

fn parse_key_equals_string(source: &str, pos: usize, key: &str) -> Option<(String, usize)> {
    parse_key_string_comparison(source, pos, key, "===")
}

fn parse_key_not_equals_string(source: &str, pos: usize, key: &str) -> Option<(String, usize)> {
    parse_key_string_comparison(source, pos, key, "!==")
}

fn parse_key_string_comparison(source: &str, pos: usize, key: &str, operator: &str) -> Option<(String, usize)> {
    let bytes = source.as_bytes();
    let mut i = skip_ws_comments(source, parse_free_ident_name(source, pos, key)?);
    if i + operator.len() > bytes.len() || &source[i..i + operator.len()] != operator {
        return None;
    }
    i = skip_ws_comments(source, i + operator.len());
    let (value, next) = read_js_string(source, i)?;
    Some((value, next))
}

fn parse_exports_has_own_key(source: &str, pos: usize, key: &str) -> Option<usize> {
    let (target, next) = parse_object_has_own_property_call(source, pos, key, true)?;
    if target != "exports" {
        return None;
    }
    Some(next)
}

fn parse_negated_exports_has_own_key(source: &str, pos: usize, key: &str) -> Option<usize> {
    let bytes = source.as_bytes();
    if pos >= bytes.len() || bytes[pos] != b'!' {
        return None;
    }
    let mut i = skip_ws_comments(source, pos + 1);

    let (receiver, next) = read_ident(source, i)?;
    if receiver == "Object" {
        if let Some((_, next)) = parse_object_has_own_property_call(source, i, key, false) {
            return Some(next);
        }
    }

    {
        i = parse_dot_member_name(source, next, "hasOwnProperty")?;
        if i >= bytes.len() || bytes[i] != b'(' {
            return None;
        }
        i = skip_ws_comments(source, i + 1);
        i = skip_ws_comments(source, parse_free_ident_name(source, i, key)?);
        if i >= bytes.len() || bytes[i] != b')' {
            return None;
        }
        return Some(i + 1);
    }
}

fn parse_object_has_own_property_call(
    source: &str,
    pos: usize,
    key: &str,
    require_prototype: bool,
) -> Option<(String, usize)> {
    let bytes = source.as_bytes();
    let (receiver, next) = read_ident(source, pos)?;
    if receiver != "Object" {
        return None;
    }
    let mut i = next;
    if let Some(next) = parse_dot_member_name(source, i, "prototype") {
        i = next;
    } else if require_prototype {
        return None;
    }
    i = parse_dot_member_name(source, i, "hasOwnProperty")?;
    i = parse_dot_member_name(source, i, "call")?;
    if i >= bytes.len() || bytes[i] != b'(' {
        return None;
    }
    i = skip_ws_comments(source, i + 1);
    let (target, next) = read_ident(source, i)?;
    i = skip_ws_comments(source, next);
    if i >= bytes.len() || bytes[i] != b',' {
        return None;
    }
    i = skip_ws_comments(source, i + 1);
    i = skip_ws_comments(source, parse_free_ident_name(source, i, key)?);
    if i >= bytes.len() || bytes[i] != b')' {
        return None;
    }
    Some((target, i + 1))
}

fn parse_key_in_export_target_condition(source: &str, pos: usize, key: &str) -> Option<usize> {
    let mut i = skip_ws_comments(source, parse_free_ident_name(source, pos, key)?);
    i = skip_ws_comments(source, parse_free_ident_name(source, i, "in")?);
    let (_, next) = parse_exports_target(source, i)?;
    Some(next)
}

fn parse_export_target_bracket_key(source: &str, pos: usize, key: &str) -> Option<usize> {
    let (_, next) = parse_exports_target(source, pos)?;
    parse_bracket_key(source, next, key)
}

fn parse_binding_bracket_key(source: &str, pos: usize, binding: &str, key: &str) -> Option<usize> {
    parse_bracket_key(source, parse_free_ident_name(source, pos, binding)?, key)
}

fn parse_bracket_key(source: &str, pos: usize, key: &str) -> Option<usize> {
    let bytes = source.as_bytes();
    let mut i = skip_ws_comments(source, pos);
    if i >= bytes.len() || bytes[i] != b'[' {
        return None;
    }
    i = skip_ws_comments(source, i + 1);
    i = skip_ws_comments(source, parse_free_ident_name(source, i, key)?);
    if i >= bytes.len() || bytes[i] != b']' {
        return None;
    }
    Some(i + 1)
}

fn parse_dot_member_name(source: &str, pos: usize, name: &str) -> Option<usize> {
    let bytes = source.as_bytes();
    let mut i = skip_ws_comments(source, pos);
    if i >= bytes.len() || bytes[i] != b'.' {
        return None;
    }
    i = skip_ws_comments(source, i + 1);
    Some(skip_ws_comments(source, parse_ident_name(source, i, name)?))
}

fn parse_direct_exports_reexport_assignment(source: &str, pos: usize, binding: &str, key: &str) -> Option<usize> {
    let bytes = source.as_bytes();
    let mut i = skip_ws_comments(source, parse_export_target_bracket_key(source, pos, key)?);
    if i >= bytes.len() || bytes[i] != b'=' || (i + 1 < bytes.len() && matches!(bytes[i + 1], b'=' | b'>')) {
        return None;
    }

    i = skip_ws_comments(source, i + 1);
    let after_rhs = skip_ws_comments(source, parse_binding_bracket_key(source, i, binding, key)?);
    if is_statement_boundary(source, after_rhs) {
        Some(after_rhs.min(source.len()))
    } else {
        None
    }
}

fn parse_define_property_reexport(source: &str, pos: usize, binding: &str, key: &str) -> Option<usize> {
    let bytes = source.as_bytes();
    let mut i = parse_object_define_property_call(source, pos)?;
    let (target, next) = parse_exports_target(source, i)?;
    if target != CjsExportTarget::Exports {
        return None;
    }
    i = skip_ws_comments(source, next);
    if i >= bytes.len() || bytes[i] != b',' {
        return None;
    }
    i = skip_ws_comments(source, i + 1);
    let Some(key_end) = parse_free_ident_name(source, i, key) else {
        return None;
    };
    i = skip_ws_comments(source, key_end);
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
    let bytes = descriptor.as_bytes();
    let Some((mut cursor, descriptor_end)) = descriptor_object_span(descriptor) else {
        return false;
    };
    let mut seen_enumerable = false;
    let mut found = false;
    while cursor < descriptor_end {
        if bytes[cursor] == b',' {
            cursor = skip_ws_comments(descriptor, cursor + 1);
            continue;
        }
        if descriptor[cursor..].starts_with("...") || bytes[cursor] == b'[' {
            return false;
        }
        let Some((name, key_is_ident, key_end)) = parse_exports_literal_key(descriptor, cursor)
        else {
            return false;
        };
        if !key_is_ident {
            return false;
        }
        let mut next = skip_ws_comments(descriptor, key_end);
        if name == "enumerable" {
            if seen_enumerable || found || next >= descriptor_end || bytes[next] != b':' {
                return false;
            }
            let value_start = skip_ws_comments(descriptor, next + 1);
            let Some(true_end) = parse_ident_name(descriptor, value_start, "true") else {
                return false;
            };
            seen_enumerable = true;
            cursor = skip_ws_comments(descriptor, true_end);
        } else if name == "get" {
            if found {
                return false;
            }
            if next < descriptor_end && bytes[next] == b'(' {
                let Some((body_start, body_end)) =
                    getter_body_after_empty_params(descriptor, next, descriptor_end)
                else {
                    return false;
                };
                if !getter_body_returns_binding_key(&descriptor[body_start..body_end], binding, key)
                {
                    return false;
                }
                found = true;
                cursor = skip_ws_comments(descriptor, body_end + 1);
            } else if next < descriptor_end && bytes[next] == b':' {
                next = skip_ws_comments(descriptor, next + 1);
                let Some((body_start, body_end, function_end)) =
                    descriptor_function_getter_body(descriptor, next, descriptor_end)
                else {
                    return false;
                };
                if !getter_body_returns_binding_key(&descriptor[body_start..body_end], binding, key)
                {
                    return false;
                }
                found = true;
                cursor = skip_ws_comments(descriptor, function_end);
            } else {
                return false;
            }
        } else {
            return false;
        }

        let Some(next_cursor) = next_descriptor_entry(descriptor, cursor, descriptor_end) else {
            return false;
        };
        cursor = next_cursor;
    }

    found && seen_enumerable
}

fn getter_body_returns_binding_key(body: &str, binding: &str, key: &str) -> bool {
    let bytes = body.as_bytes();
    let mut i = skip_ws_comments(body, 0);
    let Some(return_end) = parse_free_ident_name(body, i, "return") else {
        return false;
    };
    i = skip_ws_comments(body, return_end);
    let Some(binding_end) = parse_free_ident_name(body, i, binding) else {
        return false;
    };
    i = skip_ws_comments(body, binding_end);
    if i >= bytes.len() || bytes[i] != b'[' {
        return false;
    }
    i = skip_ws_comments(body, i + 1);
    let Some(key_end) = parse_free_ident_name(body, i, key) else {
        return false;
    };
    i = skip_ws_comments(body, key_end);
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

fn previous_significant_byte_before_import_meta(source: &str, pos: usize) -> Option<u8> {
    let mut previous = None;
    let _ = scan_code_positions(&source[..pos], true, |_, byte| {
        if !byte.is_ascii_whitespace() {
            previous = Some(byte);
        }
        ControlFlow::Continue(None)
    });
    previous
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

fn statement_starts(source: &str) -> Vec<bool> {
    let bytes = source.as_bytes();
    let mut starts = vec![false; bytes.len() + 1];
    let mut i = 0usize;
    let mut brace_depth = 0usize;
    let mut previous_code = None;
    let mut line_terminator_since_code = false;
    while i < bytes.len() {
        if bytes[i].is_ascii_whitespace() {
            if matches!(bytes[i], b'\n' | b'\r') {
                line_terminator_since_code = true;
            }
            i += 1;
            continue;
        }
        if let Some(next) = skip_non_code(source, i, true) {
            if source[i..next].bytes().any(|byte| matches!(byte, b'\n' | b'\r')) {
                line_terminator_since_code = true;
            }
            i = next;
            continue;
        }

        let current = bytes[i];
        if brace_depth == 0
            && (matches!(previous_code, None | Some(b';' | b'}'))
                || (line_terminator_since_code
                    && !previous_code.is_some_and(is_asi_continuation_previous)
                    && !is_asi_continuation_next(source, i)))
        {
            starts[i] = true;
        }

        match current {
            b'{' => brace_depth += 1,
            b'}' => brace_depth = brace_depth.saturating_sub(1),
            _ => {}
        }
        previous_code = Some(current);
        line_terminator_since_code = false;
        i = next_char_boundary(source, i);
    }
    starts
}

fn analyze_cjs_exports(source: &str) -> CjsExportAnalysis {
    let mut analysis = CjsExportAnalysis::default();
    let mut require_bindings = HashMap::<String, String>::new();
    let statement_starts = statement_starts(source);
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
        if brace_depth == 0
            && statement_starts.get(i).copied().unwrap_or(false)
            && let Some((binding, specifier, next)) = parse_require_binding(source, i)
        {
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
        if brace_depth == 0
            && statement_starts.get(i).copied().unwrap_or(false)
            && let Some((specifier, next)) = parse_object_keys_reexport(source, i, &require_bindings)
        {
            analysis.is_cjs = true;
            add_unique(&mut analysis.reexports, specifier);
            return ControlFlow::Continue(Some(next));
        }
        ControlFlow::Continue(None)
    });
    analysis
}

fn resolve_cjs_reexport_path(filename: &str, specifier: &str, conditions: &[String]) -> Option<String> {
    if !specifier.starts_with("./") && !specifier.starts_with("../") && !specifier.starts_with('/') {
        let resolver = NodeModulesResolver;
        return resolver
            .try_resolve_for_cjs_analysis(filename, specifier, conditions)
            .ok()
            .flatten();
    }
    let base = if specifier.starts_with('/') {
        std::path::PathBuf::from(specifier)
    } else {
        std::path::Path::new(filename).parent()?.join(specifier)
    };
    NodeModulesResolver::resolve_cjs_analysis_relative(&base)
}

fn is_cjs_analysis_source_path(path: &str) -> bool {
    let extension = std::path::Path::new(path)
        .extension()
        .and_then(|extension| extension.to_str());
    !matches!(extension, Some("json" | "node"))
}

fn analyze_cjs_exports_for_file(
    filename: &str,
    source: &str,
    seen: &mut HashSet<String>,
    conditions: &[String],
) -> CjsExportAnalysis {
    let mut analysis = analyze_cjs_exports(source);
    if !seen.insert(filename.to_string()) {
        return analysis;
    }
    let reexports = analysis.reexports.clone();
    for reexport in reexports {
        if let Some(path) = resolve_cjs_reexport_path(filename, &reexport, conditions)
            && !seen.contains(&path)
            && is_cjs_analysis_source_path(&path)
            && let Ok(source) = std::fs::read_to_string(&path)
        {
            let child = analyze_cjs_exports_for_file(&path, &source, seen, conditions);
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
        if let Ok(Some(package)) = NodeModulesResolver::read_package_json_optional(&pkg_path)
        {
            return package.package_type.clone();
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
        if import_attr_type_from_path(path).as_deref() == Some("json") {
            return throw_import_attr_type_incompatible(ctx);
        }

        let mut source = match std::fs::read_to_string(fs_path) {
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
        source = process_static_import_attrs(&source, path);
        let filename = Some(fs_abs_path.clone());
        let url = path_to_file_url(path);
        let raw_cjs_global_messages = require_esm_in_progress(ctx, &fs_abs_path, &url);

        let init = ImportMetaInit {
            url,
            filename,
            dirname: std::path::Path::new(&fs_abs_path)
                .parent()
                .map(|p| p.to_string_lossy().into_owned()),
            include_resolve: true,
        };

        let cjs_conditions =
            NodeModulesResolver::conditions_from_global(ctx, NodePackageResolveMode::CjsAnalysis.default_conditions());
        let detected_analysis =
            analyze_cjs_exports_for_file(&fs_abs_path, &source, &mut HashSet::new(), &cjs_conditions);
        let has_esm_syntax = source_looks_like_esm(&source);
        // .cjs files are always CommonJS; for .js files, use the analyzer so
        // comments, strings, templates, and regex literals do not force CJS.
        let is_cjs = is_cjs_ext
            || (!is_js_in_module_package_scope(&fs_abs_path)
                && !has_esm_syntax
                && !has_cjs_wrapper_require_redeclaration(&source)
                && (detected_analysis.is_cjs
                    || !detected_analysis.exports.is_empty()
                    || !detected_analysis.reexports.is_empty()));

        if !is_cjs {
            let package_type_module_js = fs_path.ends_with(".js") && is_js_in_module_package_scope(&fs_abs_path);
            let preflight_error_source = if package_type_module_js {
                esm_preflight_error_module_source(&source, true, raw_cjs_global_messages)
            } else {
                esm_require_global_preflight_error_module_source(&source, raw_cjs_global_messages)
            };
            if let Some(error_source) = preflight_error_source {
                return Module::declare(ctx.clone(), path, error_source.as_bytes().to_vec());
            }
            if let Some(error_source) = cjs_named_import_error_module_source(ctx, &fs_abs_path, &source) {
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
    let stripped_path = strip_loader_realm_param(path);
    let abs_path = ensure_absolute_path(&stripped_path);
    let (abs_path, suffix) = split_module_path_suffix(&abs_path);
    let mut url = path_without_suffix_to_file_url(abs_path);
    url.push_str(suffix);
    url
}

fn path_without_suffix_to_file_url(path: &str) -> String {
    let abs_path = if path.starts_with('/') {
        Cow::Borrowed(path)
    } else {
        Cow::Owned(format!("/{path}"))
    };
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
    url
}

fn path_with_preserved_escapes_to_file_url(path: &str) -> String {
    let abs_path = if path.starts_with('/') {
        Cow::Borrowed(path)
    } else {
        Cow::Owned(format!("/{path}"))
    };
    let mut url = String::from("file://");
    let bytes = abs_path.as_bytes();
    let mut i = 0;
    while i < bytes.len() {
        match bytes[i] {
            b'%' if i + 2 < bytes.len()
                && FileUrlResolver::hex_val(bytes[i + 1]).is_some()
                && FileUrlResolver::hex_val(bytes[i + 2]).is_some() =>
            {
                url.push('%');
                url.push(bytes[i + 1] as char);
                url.push(bytes[i + 2] as char);
                i += 3;
                continue;
            }
            b'%' => url.push_str("%25"),
            b' ' => url.push_str("%20"),
            b'#' => url.push_str("%23"),
            b'?' => url.push_str("%3F"),
            b'A'..=b'Z'
            | b'a'..=b'z'
            | b'0'..=b'9'
            | b'-'
            | b'_'
            | b'.'
            | b'~'
            | b'/'
            | b':' => url.push(bytes[i] as char),
            _ => {
                url.push_str(&format!("%{:02X}", bytes[i]));
            }
        }
        i += 1;
    }
    url
}

fn normalize_encoded_module_path(path: &str) -> String {
    let is_absolute = path.starts_with('/');
    let mut parts = Vec::new();

    for segment in path.split('/') {
        if segment.is_empty() || is_encoded_dot_segment(segment, ".") {
            continue;
        }
        if is_encoded_dot_segment(segment, "..") {
            parts.pop();
        } else {
            parts.push(segment);
        }
    }

    if is_absolute {
        format!("/{}", parts.join("/"))
    } else {
        parts.join("/")
    }
}

fn is_encoded_dot_segment(segment: &str, expected: &str) -> bool {
    if segment == expected {
        return true;
    }
    percent_decode(segment).is_some_and(|decoded| decoded == expected)
}

fn serialize_url_preserving_escapes(input: &str) -> String {
    let bytes = input.as_bytes();
    let mut encoded = String::with_capacity(input.len());
    let mut i = 0;
    while i < bytes.len() {
        match bytes[i] {
            b'%' if i + 2 < bytes.len()
                && FileUrlResolver::hex_val(bytes[i + 1]).is_some()
                && FileUrlResolver::hex_val(bytes[i + 2]).is_some() =>
            {
                encoded.push('%');
                encoded.push(bytes[i + 1] as char);
                encoded.push(bytes[i + 2] as char);
                i += 3;
                continue;
            }
            b' ' => encoded.push_str("%20"),
            0x00..=0x20 | b'"' | b'<' | b'>' | b'`' => {
                encoded.push_str(&format!("%{:02X}", bytes[i]));
            }
            _ if bytes[i] > 0x7F => {
                encoded.push_str(&format!("%{:02X}", bytes[i]));
            }
            _ => encoded.push(bytes[i] as char),
        }
        i += 1;
    }
    encoded
}

fn split_module_path_suffix(path: &str) -> (&str, &str) {
    if path.starts_with("data:") {
        return (path, "");
    }
    let suffix_start = path.find(|ch| ch == '?' || ch == '#').unwrap_or(path.len());
    (&path[..suffix_start], &path[suffix_start..])
}

fn module_filesystem_path(path: &str) -> &str {
    split_module_path_suffix(path).0
}

fn require_esm_in_progress(ctx: &Ctx<'_>, filename: &str, file_url: &str) -> bool {
    let globals = ctx.globals();
    let Ok(registry) = globals.get::<_, Object>("__wasm_rquickjs_require_esm_in_progress") else {
        return false;
    };
    registry.get::<_, bool>(filename).unwrap_or(false) || registry.get::<_, bool>(file_url).unwrap_or(false)
}

const LOADER_REALM_QUERY_PARAM: &str = "__wasm_rquickjs_loader_realm";

fn loader_realm_param(path_or_suffix: &str) -> Option<String> {
    let suffix = if path_or_suffix.starts_with('?') || path_or_suffix.starts_with('#') {
        path_or_suffix
    } else {
        split_module_path_suffix(path_or_suffix).1
    };
    let query = suffix.strip_prefix('?')?;
    let query = query.split_once('#').map_or(query, |(query, _)| query);
    for part in query.split('&') {
        if part
            .split_once('=')
            .is_some_and(|(key, _)| key == LOADER_REALM_QUERY_PARAM)
        {
            return Some(part.to_string());
        }
    }
    None
}

fn append_loader_realm_param(suffix: &str, param: Option<&str>) -> String {
    let Some(param) = param else {
        return suffix.to_string();
    };
    if loader_realm_param(suffix).is_some() {
        return suffix.to_string();
    }
    let hash_start = suffix.find('#').unwrap_or(suffix.len());
    let (before_hash, hash) = suffix.split_at(hash_start);
    let separator = if before_hash.contains('?') { '&' } else { '?' };
    format!("{before_hash}{separator}{param}{hash}")
}

fn strip_loader_realm_param_from_suffix(suffix: &str) -> String {
    let Some(query) = suffix.strip_prefix('?') else {
        return suffix.to_string();
    };
    let (query, hash) = query
        .split_once('#')
        .map_or((query, ""), |(query, hash)| (query, hash));
    let kept: Vec<&str> = query
        .split('&')
        .filter(|part| {
            !part
                .split_once('=')
                .is_some_and(|(key, _)| key == LOADER_REALM_QUERY_PARAM)
        })
        .collect();
    let mut stripped = String::new();
    if !kept.is_empty() {
        stripped.push('?');
        stripped.push_str(&kept.join("&"));
    }
    if !hash.is_empty() {
        stripped.push('#');
        stripped.push_str(hash);
    } else if suffix.contains('#') && suffix.ends_with('#') {
        stripped.push('#');
    }
    stripped
}

fn strip_loader_realm_param(path: &str) -> String {
    let (path, suffix) = split_module_path_suffix(path);
    let mut stripped = path.to_string();
    stripped.push_str(&strip_loader_realm_param_from_suffix(suffix));
    stripped
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
            if is_regex_literal_start(source, i) {
                i = skip_regex_literal(source, i);
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

fn source_looks_like_esm(source: &str) -> bool {
    if source_has_top_level_await(source) {
        return true;
    }

    scan_code_positions(source, true, |i, _| {
        if parse_ident_name(source, i, "export").is_some() && is_static_export_syntax(source, i) {
            return ControlFlow::Break(());
        }
        if parse_ident_name(source, i, "import").is_some() && is_static_import_syntax(source, i) {
            return ControlFlow::Break(());
        }
        ControlFlow::Continue(None)
    })
    .is_break()
}

fn is_static_export_syntax(source: &str, pos: usize) -> bool {
    if previous_significant_byte(source, pos) == Some(b'.') {
        return false;
    }
    let next = skip_ws_comments(source, pos + "export".len());
    if source.as_bytes().get(next) == Some(&b':') {
        return false;
    }
    match source.as_bytes().get(next).copied() {
        Some(b'{' | b'*') => true,
        _ => ["default", "const", "let", "var", "function", "class"]
            .iter()
            .any(|keyword| parse_ident_name(source, next, keyword).is_some()),
    }
}

fn is_static_import_syntax(source: &str, pos: usize) -> bool {
    if previous_significant_byte(source, pos) == Some(b'.') {
        return false;
    }
    let next = skip_ws_comments(source, pos + "import".len());
    if matches!(source.as_bytes().get(next), Some(b'(' | b':')) {
        return false;
    }
    matches!(
        source.as_bytes().get(next).copied(),
        Some(b'\'' | b'"' | b'{' | b'*')
    ) || source
        .as_bytes()
        .get(next)
        .copied()
        .is_some_and(is_js_identifier_start)
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
            "resolve:{{value:(s,p)=>{{if(p!==undefined){{if(typeof p==='string'){{return globalThis.__wasm_rquickjs_import_meta_resolve(p,s);}}if(p instanceof URL){{return globalThis.__wasm_rquickjs_import_meta_resolve(p.href,s);}}const e=new TypeError('The \"parentURL\" argument must be of type string or an instance of URL.');e.code='ERR_INVALID_ARG_TYPE';throw e;}}return globalThis.__wasm_rquickjs_import_meta_resolve(\"{}\",s);}},writable:true,enumerable:true,configurable:true}}",
            escape_js_string(&init.url)
        ));
    }

    props.push(format!(
        "url:{{value:\"{}\",writable:true,enumerable:true,configurable:true}}",
        escape_js_string(&init.url)
    ));

    let mut prologue = format!(
        "Object.defineProperties(import.meta,{{{}}});",
        props.join(",")
    );
    prologue.push_str(
        r##"if(!globalThis.__wasm_rquickjs_import_attr_specifier){globalThis.__wasm_rquickjs_import_attr_specifier=(s,t)=>{let v=String(s);let f=null;if(v.startsWith("data:")){const r=v.slice(5);const c=r.indexOf(",");const m=(c<0?r:r.slice(0,c)).split(";")[0].trim();if(m==="application/json")f="json";else if(m==="text/javascript"||m==="application/javascript")f="module";else if(m==="text/css")f="css";}else if(v.startsWith("node:"))f="module";else{const b=v.split(/[?#]/,1)[0];if(b.endsWith(".json"))f="json";else if(b.endsWith(".js")||b.endsWith(".mjs")||b.endsWith(".cjs"))f="module";}function er(c,m){return"data:text/javascript,"+encodeURIComponent(`await Promise.reject(Object.assign(new TypeError(${JSON.stringify(m)}),{code:${JSON.stringify(c)}}));`)}if(t&&t!=="json"&&t!=="css")return er("ERR_IMPORT_ATTRIBUTE_UNSUPPORTED",`Import attribute type "${t}" is not supported`);if(t==="json"&&f==="module")return er("ERR_IMPORT_ATTRIBUTE_TYPE_INCOMPATIBLE","Cannot use import attributes to change the type of a JavaScript module");if(f==="json"&&t!=="json")return er("ERR_IMPORT_ATTRIBUTE_MISSING",`Module "${v}" needs an import attribute of type: json`);if(t==="json"){if(v.startsWith("data:"))v=v.replace(/\"/g,"%22");return"data:text/javascript,"+encodeURIComponent("import value from "+JSON.stringify(v)+" with { type: \"json\" }; export default value;");}return v;};}"##,
    );
    let declared_cjs_globals = collect_declared_cjs_globals_in_esm(source);
    let shadowed_cjs_globals: Vec<&str> = ["require"]
        .iter()
        .copied()
        .filter(|name| !declared_cjs_globals.iter().any(|declared| declared == name))
        .collect();
    if !shadowed_cjs_globals.is_empty() {
        prologue.push_str("var ");
        prologue.push_str(&shadowed_cjs_globals.join(","));
        prologue.push(';');
    }
    let main_expr = init
        .filename
        .as_ref()
        .map(|filename| {
            format!(
                "!!(globalThis.process&&Array.isArray(globalThis.process.argv)&&globalThis.process.argv[1]===\"{}\")",
                escape_js_string(filename)
            )
        })
        .unwrap_or_else(|| "false".to_string());
    let source = rewrite_import_meta_main(source, &main_expr);

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

fn rewrite_import_meta_main(source: &str, replacement: &str) -> String {
    let mut spans = Vec::new();
    scan_code_positions(source, true, |i, _| {
        if let Some(end) = parse_import_meta_main_span(source, i) {
            spans.push((i, end));
            ControlFlow::Continue(Some(end))
        } else {
            ControlFlow::Continue(None)
        }
    });

    if spans.is_empty() {
        return source.to_string();
    }

    let mut rewritten = source.to_string();
    for (start, end) in spans.into_iter().rev() {
        rewritten.replace_range(start..end, replacement);
    }
    rewritten
}

fn parse_import_meta_main_span(source: &str, pos: usize) -> Option<usize> {
    let mut i = parse_ident_name(source, pos, "import")?;
    if matches!(
        previous_significant_byte_before_import_meta(source, pos),
        Some(b'.' | b'#')
    ) {
        return None;
    }
    i = skip_ws_comments(source, i);
    if source.as_bytes().get(i) != Some(&b'.') {
        return None;
    }
    i = skip_ws_comments(source, i + 1);
    i = parse_ident_name(source, i, "meta")?;
    i = skip_ws_comments(source, i);
    if source.as_bytes().get(i) != Some(&b'.') {
        return None;
    }
    i = skip_ws_comments(source, i + 1);
    parse_ident_name(source, i, "main")
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
            let ext = std::path::Path::new(fs_path)
                .extension()
                .and_then(|ext| ext.to_str())
                .map(|ext| format!(".{}", ext))
                .unwrap_or_default();
            let globals = ctx.globals();
            let type_error_ctor: Function = globals.get("TypeError")?;
            let error_obj: Object = type_error_ctor.call((format!(
                "Unknown file extension {:?} for {}",
                ext, fs_path
            ),))?;
            error_obj.set("code", "ERR_UNKNOWN_FILE_EXTENSION")?;
            return Err(ctx.throw(error_obj.into_value()));
        }
        if import_attr_type_from_path(path).as_deref() == Some("json") {
            return throw_import_attr_type_incompatible(ctx);
        }

        let mut source = match std::fs::read_to_string(fs_path) {
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
        source = process_static_import_attrs(&source, path);
        let std_path = std::path::Path::new(&fs_abs_path);
        let filename = Some(fs_abs_path.clone());
        let dirname = std_path.parent().map(|p| p.to_string_lossy().into_owned());
        let url = path_to_file_url(path);
        let raw_cjs_global_messages = require_esm_in_progress(ctx, &fs_abs_path, &url);

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

        if let Some(error_source) =
            esm_require_global_preflight_error_module_source(&source, raw_cjs_global_messages)
        {
            return Module::declare(ctx.clone(), path, error_source.as_bytes().to_vec());
        }
        if let Some(error_source) = cjs_named_import_error_module_source(ctx, &fs_abs_path, &source) {
            return Module::declare(ctx.clone(), path, error_source.as_bytes().to_vec());
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

        let import_attr_type = import_attr_type_from_path(path);
        let source = std::fs::read_to_string(fs_path).map_err(|_| Error::new_loading(path))?;
        let module_source = if import_attr_type.as_deref() != Some("json") {
            let escaped = DataUrlLoader::js_string_escape(path);
            format!(
                "await Promise.reject(Object.assign(new TypeError('Module \"{escaped}\" needs an import attribute of type: json'), {{code: 'ERR_IMPORT_ATTRIBUTE_MISSING'}}));\n"
            )
        } else if DataUrlLoader::is_valid_json(&source) {
            let escaped = DataUrlLoader::js_string_escape(&source);
            let original_path = strip_import_type_rewrite_token(path);
            if split_module_path_suffix(&original_path).1.is_empty() {
                format!(
                    "const __wasm_rquickjs_require = globalThis.__wasm_rquickjs_create_require(\"{}\");\nconst __wasm_rquickjs_filename = \"{}\";\nconst __wasm_rquickjs_cached = __wasm_rquickjs_require.cache[__wasm_rquickjs_filename];\nconst __wasm_rquickjs_value = __wasm_rquickjs_cached ? __wasm_rquickjs_cached.exports : JSON.parse('{escaped}');\nif (!__wasm_rquickjs_cached) __wasm_rquickjs_require.cache[__wasm_rquickjs_filename] = {{ id: __wasm_rquickjs_filename, filename: __wasm_rquickjs_filename, path: \"{}\", exports: __wasm_rquickjs_value, loaded: true, parent: null, children: [], paths: [] }};\nexport default __wasm_rquickjs_value;\n",
                    escape_js_string(fs_path),
                    escape_js_string(fs_path),
                    escape_js_string(
                        std::path::Path::new(fs_path)
                            .parent()
                            .and_then(|path| path.to_str())
                            .unwrap_or("/")
                    )
                )
            } else {
                format!("export default JSON.parse('{escaped}');\n")
            }
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
    pub node_package_deprecation_warnings: RefCell<HashSet<String>>,
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
                PrivateBuiltinResolverGuard,
                RegisteredLoaderResolver,
            ),
            (
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

            global.set(
                "__wasm_rquickjs_register_import_attr_rewrite",
                Function::new(ctx.clone(), |specifier: String, import_type: String| {
                    if import_type == "json" {
                        append_import_type_query(&specifier, &import_type)
                    } else {
                        specifier
                    }
                })
                .expect("Failed to create import attribute rewrite registrar"),
            )
            .expect("Failed to initialize import attribute rewrite registrar");

            global.set(
                "__wasm_rquickjs_discard_import_attr_rewrite",
                Function::new(ctx.clone(), |specifier: String| {
                    discard_generated_import_type_rewrite_token(&specifier);
                })
                .expect("Failed to create import attribute rewrite discard"),
            )
            .expect("Failed to initialize import attribute rewrite discard");
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
            node_package_deprecation_warnings: RefCell::new(HashSet::new()),
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

    #[test]
    fn data_url_separator_uses_first_comma() {
        assert_eq!(
            DataUrlLoader::content_separator_pos(r#"application/json;foo="test,""this""#),
            Some(r#"application/json;foo="test"#.len())
        );
        assert_eq!(
            DataUrlLoader::content_separator_pos(r#"application/json;foo="test\,",0"#),
            Some(r#"application/json;foo="test\"#.len())
        );
        assert_eq!(
            DataUrlLoader::content_separator_pos("application/json;foo=test%2C,0"),
            Some("application/json;foo=test%2C".len())
        );
        let rewritten = append_import_type_query(r#"data:application/json;foo="test,""this""#, "json");
        assert!(rewritten.starts_with(r#"data:application/json;foo="test;__wasm_rquickjs_import_type=json-"#));
        assert!(rewritten.ends_with(r#",""this""#));
        assert_eq!(
            import_attr_type_from_path(r#"data:application/json;__wasm_rquickjs_import_type=json,0"#),
            None
        );
        assert_eq!(import_attr_type_from_path(&rewritten), Some("json".to_string()));
        assert_eq!(
            split_module_path_suffix(r#"data:application/json,"?__wasm_rquickjs_import_type=json""#),
            (
                r#"data:application/json,"?__wasm_rquickjs_import_type=json""#,
                ""
            )
        );
        assert_eq!(
            split_module_path_suffix(r#"data:text/javascript,var x = "hello world?""#),
            (r#"data:text/javascript,var x = "hello world?""#, "")
        );

        let relative_rewritten = append_import_type_query("./test.json", "json");
        let (_, suffix) = split_module_path_suffix(&relative_rewritten);
        let resolved_rewritten = format!("/app/test.json{suffix}");
        assert_eq!(import_attr_type_from_path(&resolved_rewritten), None);

        let relative_rewritten = append_import_type_query("./test.json", "json");
        let (_, suffix) = split_module_path_suffix(&relative_rewritten);
        let resolved_rewritten = format!("/app/test.json{suffix}");
        transfer_import_type_rewrite_token(&relative_rewritten, &resolved_rewritten);
        assert_eq!(
            import_attr_type_from_path(&resolved_rewritten),
            Some("json".to_string())
        );
    }

    #[test]
    fn dynamic_import_rewrite_handles_array_commas() {
        let source = r#"
            await Promise.all([
                import("./plain.json"),
                import("./typed.json", { with: { type: "json" } }),
            ]);
        "#;
        let rewritten = process_static_import_attrs(source, "/app/main.mjs");

        assert!(rewritten.contains("__wasm_rquickjs_import_attr_dynamic_import"));
        assert!(rewritten.contains(r#"./typed.json", { with: { type: "json" } }"#));
        assert!(!rewritten.contains(r#"import("./typed.json","#));
    }

    #[test]
    fn dynamic_import_rewrite_preserves_object_method_shorthand() {
        let source = r#"
            const obj = {
                import(value) { return ["method", value]; },
                async importAsync(value) { return value; },
                *importGenerator(value) { yield value; },
                get importGetter() { return "getter"; },
                set importSetter(value) { this.value = value; },
            };
            const asyncObj = { async import(value) { return value; } };
            const generatorObj = { *import(value) { yield value; } };
            const asyncGeneratorObj = { async * import(value) { yield value; } };
            const getterObj = { get import() { return "getter"; } };
            const setterObj = { set import(value) { this.value = value; } };
            class ImportMethods {
                import(value) { return value; }
                static import(value) { return value; }
                static get importGetterStatic() { return "getter"; }
                async importAsync(value) { return value; }
                *importGenerator(value) { yield value; }
                async * importAsyncGenerator(value) { yield value; }
                get importGetter() { return "getter"; }
                set importSetter(value) { this.value = value; }
            }
            class AsyncImportMethod { async import(value) { return value; } }
            class GeneratorImportMethod { *import(value) { yield value; } }
            class StaticImportMethod { static import(value) { return value; } }
            class StaticGetterImportMethod { static get import() { return "getter"; } }
            class AsyncGeneratorImportMethod { async * import(value) { yield value; } }
            class GetterImportMethod { get import() { return "getter"; } }
            class SetterImportMethod { set import(value) { this.value = value; } }
            obj.import("value");
        "#;

        assert_eq!(process_static_import_attrs(source, "/app/main.mjs"), source);
    }

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
                Object.defineProperty(exports, "valueThenValue", { value: "first", value: "second" });
                Object.defineProperty(exports, "valueThenString", { value: "good", "value": "string-wins" });
                Object.defineProperty(exports, "valueThenComputed", { value: "good", ["value"]: "computed-wins" });
                Object.defineProperty(exports, "valueThenShorthand", { value: "first", value });
                Object.defineProperty(exports, "valueThenMethod", { value: "first", value() { return "method-value"; } });
                Object.defineProperty(exports, "valueThenFalseEnumerable", { value: dep.value, enumerable: false });
                if (false) Object.defineProperty(exports, "objectMemberDescriptor", { value: "bad" }.descriptor);
                if (false) Object.defineProperty(exports, "objectPlusDescriptor", { value: "bad" } + suffix);
            "#,
            true,
            &[
                "foo",
                "bar",
                "baz",
                "valueExport",
                "getterExport",
                "functionGetter",
                "valueThenValue",
                "valueThenString",
                "valueThenComputed",
                "valueThenShorthand",
                "valueThenMethod",
                "objectMemberDescriptor",
                "objectPlusDescriptor",
            ],
            &[],
        );
    }

    #[test]
    fn rejects_unsupported_cjs_define_property_descriptors() {
        assert_analysis(
            r#"
                const dep = { value: "getter-value" };
                const value = "shorthand-value";
                Object.defineProperty(exports, "arrowGetter", { get: () => dep.value });
                Object.defineProperty(exports, "stringKeyGetter", { "get": function () { return dep.value; } });
                Object.defineProperty(exports, "stringKeyValue", { "value": "string-key-value" });
                Object.defineProperty(exports, "shorthandValue", { value });
                Object.defineProperty(exports, "computedValue", { ["value"]: "computed-value" });
                Object.defineProperty(exports, "multiStatementGetter", { get() { const v = dep.value; return v; } });
                Object.defineProperty(exports, "helperValueDescriptor", makeDescriptor({ value: dep.value }));
                Object.defineProperty(exports, "parameterGetter", { get(a) { return dep.value; } });
                Object.defineProperty(exports, "parameterFunctionGetter", { get: function (a) { return dep.value; } });
                Object.defineProperty(exports, "helperDescriptor", makeDescriptor({ get() { return dep.value; } }));
                Object.defineProperty(exports, "nestedMemberGetter", { get() { return dep.value.nested; } });
                Object.defineProperty(exports, "nestedBracketGetter", { get() { return dep["value"]["nested"]; } });
                Object.defineProperty(exports, "duplicateGet", { get() { return dep.value; }, get: function (a) { return dep.value; } });
                Object.defineProperty(exports, "stringThenValue", { "value": "bad", value: dep.value });
                Object.defineProperty(exports, "computedThenValue", { ["value"]: "bad", value: dep.value });
                Object.defineProperty(exports, "writableThenValue", { writable: true, value: dep.value });
                Object.defineProperty(exports, "configurableThenValue", { configurable: true, value: dep.value });
                Object.defineProperty(exports, "quotedEnumerableThenValue", { "enumerable": true, value: dep.value });
            "#,
            true,
            &[],
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
            &[],
        );

        assert_analysis(
            r#"
                module.exports = { booleanLiteral: true, nullLiteral: null, undefinedLiteral: undefined };
            "#,
            true,
            &["booleanLiteral", "nullLiteral", "undefinedLiteral"],
            &[],
        );

        assert_analysis(
            r#"
                module.exports = { identifierValue: value, memberExpression: ns.x, callExpression: factory() };
            "#,
            true,
            &["identifierValue", "memberExpression"],
            &[],
        );

        assert_analysis(
            r#"
                module.exports = { nestedMemberExpression: ns.x.y, after: value };
            "#,
            true,
            &["nestedMemberExpression"],
            &[],
        );

        assert_analysis(
            r#"
                module.exports = { bracketMemberExpression: ns["x"], after: value };
            "#,
            true,
            &["bracketMemberExpression"],
            &[],
        );

        assert_analysis(
            r#"
                module.exports = { binaryExpression: value + 1, after: value };
            "#,
            true,
            &["binaryExpression"],
            &[],
        );

        assert_analysis(
            r#"
                module.exports = {
                    stringLiteral: "not-detected",
                    numberLiteral: 1,
                    objectLiteral: {},
                    callExpression: factory(),
                    identifierValue: value,
                };
            "#,
            true,
            &[],
            &[],
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
                const b = 2;
                const other = {};
                module.exports = { a, ...other, b };
            "#,
            true,
            &["a", "b"],
            &[],
        );

        assert_analysis(
            r#"
                module.exports = { a, ...other(), b };
                module.exports = { c, ...(other), d };
                module.exports = { e, ...ns.other, f };
            "#,
            true,
            &["a", "c", "e"],
            &[],
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
        assert_cjs_global("const x = require; export default x;", Some("require"));
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
        assert_cjs_global(
            "function f(require) { return require; } export default require;",
            Some("require"),
        );
        assert_cjs_global("const f = (require) => require; export default f(1);", None);
        assert_cjs_global("export default ((require) => require)(1);", None);
        assert_cjs_global(
            "const {\n  module\n} = { module: 1 };\nexport default module;",
            None,
        );
        assert_cjs_global(
            "const { require: localRequire } = { require: 1 };\nexport default localRequire;",
            None,
        );
        assert_cjs_global("const x = 0,\n  require = 1;\nexport default require;", None);
        assert_cjs_global("class C { #require = 1; get() { return this.#require; } } export default C;", None);
        assert_cjs_global("class C { #exports = 1; get() { return this.#exports; } } export default C;", None);
        assert_cjs_global("class C { #module = 1; get() { return this.#module; } } export default C;", None);
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
    fn package_type_diagnostics_ignore_local_exports_binding() {
        assert!(esm_preflight_error_module_source(
            r#"
                const exports = {};
                Object.defineProperty(exports, "__esModule", { value: true });
                exports.default = "value";
                export default exports;
                export { exports as "module.exports" };
            "#,
            true,
            false,
        )
        .is_none());
    }

    #[test]
    fn parses_static_named_import_specifiers_for_cjs_diagnostics() {
        assert_eq!(
            parse_static_named_import(r#"import { comeOn } from './fail.cjs';"#, 0),
            Some((
                "./fail.cjs".to_string(),
                vec![StaticNamedImport {
                    imported: "comeOn".to_string(),
                    local: "comeOn".to_string(),
                }],
                r#"import { comeOn } from './fail.cjs';"#.len()
            ))
        );
        assert_eq!(
            parse_static_named_import(r#"import { comeOn as renamed } from "deep-fail""#, 0)
                .map(|(specifier, imports, _)| (specifier, imports)),
            Some((
                "deep-fail".to_string(),
                vec![StaticNamedImport {
                    imported: "comeOn".to_string(),
                    local: "renamed".to_string(),
                }],
            ))
        );
        assert_eq!(
            parse_static_named_import(
                r#"import defaultValue, { comeOn, everybody } from './fail.cjs';"#,
                0,
            )
            .map(|(specifier, imports, _)| (specifier, imports)),
            Some((
                "./fail.cjs".to_string(),
                vec![
                    StaticNamedImport {
                        imported: "comeOn".to_string(),
                        local: "comeOn".to_string(),
                    },
                    StaticNamedImport {
                        imported: "everybody".to_string(),
                        local: "everybody".to_string(),
                    },
                ],
            ))
        );
        assert_eq!(
            parse_static_named_import(r#"import { default as cjsDefault } from './dep.cjs';"#, 0)
                .map(|(specifier, imports, _)| (specifier, imports)),
            Some((
                "./dep.cjs".to_string(),
                vec![StaticNamedImport {
                    imported: "default".to_string(),
                    local: "cjsDefault".to_string(),
                }],
            ))
        );
        assert_eq!(
            parse_static_named_import(
                r#"import { "missing-name" as missingName } from './dep.cjs';"#,
                0,
            )
            .map(|(specifier, imports, _)| (specifier, imports)),
            Some((
                "./dep.cjs".to_string(),
                vec![StaticNamedImport {
                    imported: "missing-name".to_string(),
                    local: "missingName".to_string(),
                }],
            ))
        );
        assert_eq!(
            format_cjs_named_import_binding(&StaticNamedImport {
                imported: "missing-name".to_string(),
                local: "missingName".to_string(),
            }),
            r#""missing-name": missingName"#
        );
    }

    #[test]
    fn package_type_diagnostics_use_first_cjs_global() {
        let require_diag = esm_preflight_error_module_source("require('x');", true, false).unwrap();
        assert!(require_diag.contains("require is not defined"));
        assert!(require_diag.contains(".cjs"));

        let filename_diag = esm_preflight_error_module_source("console.log(__filename);", true, false).unwrap();
        assert!(filename_diag.contains("__filename is not defined"));
        assert!(filename_diag.contains(".cjs"));

        assert!(esm_preflight_error_module_source("const require = 1; export default require;", true, false).is_none());
        assert!(esm_preflight_error_module_source("export default typeof require;", false, false).is_none());
        assert!(esm_preflight_error_module_source("export default typeof (exports);", false, false).is_none());
        let raw_exports_diag = esm_preflight_error_module_source("Object.keys(exports);", false, true).unwrap();
        assert!(raw_exports_diag.contains("exports is not defined"));
        assert!(!raw_exports_diag.contains("ES module scope"));
    }

    #[test]
    fn require_redeclaration_scanner_skips_non_code() {
        assert!(has_cjs_wrapper_require_redeclaration("const require = 1;"));
        assert!(has_cjs_wrapper_require_redeclaration("let /*x*/ require = 1;"));
        assert!(!has_cjs_wrapper_require_redeclaration(
            "const require = createRequire(import.meta.url);"
        ));
        assert!(!has_cjs_wrapper_require_redeclaration(
            "const require = createRequire(import . meta . url);"
        ));
        assert!(!has_cjs_wrapper_require_redeclaration(
            "const require = createRequire(import/*x*/.meta.url);"
        ));
        assert!(has_cjs_wrapper_require_redeclaration(
            "const require = createRequire(import.meta.urls);"
        ));
        assert!(has_cjs_wrapper_require_redeclaration(
            "const require = createRequire(import.meta.urlx);"
        ));
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
                Object.defineProperty(exports, "hiddenGetter", { enumerable: false, get() { return dep.value; } });
                Object.defineProperty(exports, "truthyEnumerableGetter", { enumerable: 1, get() { return dep.value; } });
                Object.defineProperty(exports, "multipleReturn", { get() { return dep.value; return dynamic(); } });
                Object.defineProperty(exports, "conditionalReturn", { get() { if (dep) return dep.value; return dynamic(); } });
                class PrivateNames {
                    #exports = {};
                    #module = { exports: {} };
                    write() {
                        this.#exports.privateExport = 1;
                        this.#module.exports.privateModuleExport = 1;
                    }
                }
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
            &[],
        );

        assert_analysis(
            r#"
                var _dep = require("./dep.cjs");
                Object.keys(_dep).forEach(function (key) {
                    if (key === "default" || key === "__esModule") return;
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
                var _dep = require("./dep.cjs");
                Object.keys(_dep).forEach(function (key) {
                    if (key === "default" || key === "__esModule") return;
                    Object.defineProperty(exports, key, {
                        enumerable: false,
                        get: function () { return _dep[key]; }
                    });
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
                    if (key === "default" || key === "__esModule") return;
                    Object.defineProperty(exports, key, {
                        enumerable: true,
                        get: function () { return _dep[key]; },
                        configurable: true
                    });
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
                    if (key === "default" || key === "__esModule") return;
                    Object.defineProperty(exports, key, {
                        enumerable: true,
                        enumerable: true,
                        get: function () { return _dep[key]; }
                    });
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
                    if (key === "default" || key === "__esModule") return;
                    Object.defineProperty(exports, key, {
                        get: function () { return _dep[key]; }
                    });
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
                    if (key === "default" || key === "__esModule") return;
                    Object.defineProperty(exports, key, {
                        get: function () { return _dep[key]; },
                        enumerable: true
                    });
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
                function copy() {
                    Object.keys(dep).forEach(function (key) {
                        if (key === "default" || key === "__esModule") return;
                        exports[key] = dep[key];
                    });
                }
                exports.own = "own";
            "#,
            true,
            &["own"],
            &[],
        );

        assert_analysis(
            r#"
                var dep = {};
                function init() {
                    var dep = require("./dep.cjs");
                }
                Object.keys(dep).forEach(function (key) {
                    if (key === "default" || key === "__esModule") return;
                    exports[key] = dep[key];
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
                    if (key !== "default" && !Object.prototype.hasOwnProperty.call(exports, key)) exports[key] = dep[key];
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
                    if (key !== "default" && !exports.hasOwnProperty(key)) exports[key] = dep[key];
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
                    if (key !== "default" && !Object.hasOwnProperty.call(exports, key)) exports[key] = dep[key];
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
                var ignored = {};
                Object.keys(dep).forEach(function (key) {
                    if (key !== "default" && !ignored.hasOwnProperty(key)) exports[key] = dep[key];
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
                var ignored = {};
                Object.keys(dep).forEach(function (key) {
                    if (key !== "default" && !Object.hasOwnProperty.call(ignored, key)) exports[key] = dep[key];
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
                var ignored = {};
                Object.keys(dep).forEach(function (key) {
                    if (key !== "default" && !Object.prototype.hasOwnProperty.call(ignored, key)) exports[key] = dep[key];
                });
                exports.own = "own";
            "#,
            true,
            &["own"],
            &["./dep.cjs"],
        );

        assert_analysis(
            r#"
                var dep = require("./dep.cjs")
                Object.keys(dep).forEach(function (key) {
                    if (key === "default" || key === "__esModule") return;
                    exports[key] = dep[key]
                })
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
                    if ("default" === key || "__esModule" === key) return;
                    exports[key] = dep[key];
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
                    exports[key] = dep[key];
                    if (key === "default" || key === "__esModule") return;
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
                    function guard() {
                        if (key === "default" || key === "__esModule") return;
                    }
                    exports[key] = dep[key];
                });
                exports.own = "own";
            "#,
            true,
            &["own"],
            &[],
        );

        assert_analysis(
            r#"
                for (var dep = require("./dep.cjs"); false;) {}
                Object.keys(dep).forEach(function (key) {
                    if (key === "default" || key === "__esModule") return;
                    exports[key] = dep[key];
                });
                exports.own = "own";
            "#,
            true,
            &["own"],
            &[],
        );

        assert_analysis(
            r#"
                /* header */ var dep = require("./dep.cjs");
                exports.own = "own";
                /* separator */ Object.keys(dep).forEach(function (key) {
                    if (key === "default" || key === "__esModule") return;
                    exports[key] = dep[key];
                });
            "#,
            true,
            &["own"],
            &["./dep.cjs"],
        );

        assert_analysis(
            r#"
                var dep = require("./dep.cjs");
                exports.own = "own"; // trailing comment
                // separator
                Object.keys(dep).forEach(function (key) {
                    if (key === "default" || key === "__esModule") return;
                    exports[key] = dep[key];
                });
            "#,
            true,
            &["own"],
            &["./dep.cjs"],
        );

        assert_analysis(
            r#"
                var dep = require("./dep.cjs");
                Object.keys(dep).forEach((key) => {
                    if (key === "default" || key === "__esModule") return;
                    exports[key] = dep[key];
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
                }, null);
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
                var _dep = _interopRequireWildcard(require("./dep.cjs"));
                Object.keys(_dep).forEach(function (key) {
                    if (key === "default" || key === "__esModule") return;
                    if (key in exports && exports[key] === _dep[key]) return;
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
                var _dep = _interopRequireWildcard(require("./dep.cjs"));
                Object.keys(_dep).forEach(function (key) {
                    if (key === "default" || key === "__esModule") return;
                    if (key in module.exports && module.exports[key] === _dep[key]) return;
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
                var _dep = _interopRequireWildcard(require("./dep.cjs"));
                Object.keys(_dep).forEach(function (key) {
                    if (key === "default" || key === "__esModule") return;
                    if (key in module.exports && module.exports[key] === _dep[key]) return;
                    module.exports[key] = _dep[key];
                });
                exports.own = "own";
            "#,
            true,
            &["own"],
            &["./dep.cjs"],
        );

        assert_analysis(
            r#"
                var _dep = _interopRequireWildcard(require("./dep.cjs"));
                var skip = {};
                Object.keys(_dep).forEach(function (key) {
                    if (key === "default" || key === "__esModule") return;
                    if (skip.hasOwnProperty(key)) return;
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
                var _dep = _interopRequireWildcard(require("./dep.cjs"));
                var skip = {};
                Object.keys(_dep).forEach(function (key) {
                    if (key === "default" || key === "__esModule") return;
                    if (key in skip && skip[key] === _dep[key]) return;
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
                var _dep = _interopRequireWildcard(require("./dep.cjs"));
                var other = {};
                Object.keys(_dep).forEach(function (key) {
                    if (key === "default" || key === "__esModule") return;
                    if (key in exports && exports[key] === other[key]) return;
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

        PACKAGE_JSON_CACHE.with_borrow_mut(|cache| cache.clear());
        INIT_PHASE = InitPhase::WizerPreInitialized;
    }

    WIZER_ACTIVE.store(false, std::sync::atomic::Ordering::Relaxed);
}
