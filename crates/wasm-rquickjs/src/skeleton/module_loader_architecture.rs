use std::collections::{BTreeMap, BTreeSet};

use proc_macro2::{Delimiter, TokenStream, TokenTree};
use quote::ToTokens;

const MODULE_JS: &str = include_str!("../../skeleton/src/builtin/module.js");
const INTERNAL_RS: &str = include_str!("../../skeleton/src/internal.rs");

#[derive(Clone, Debug, Eq, PartialEq)]
enum JsTokenKind {
    Ident(String),
    Number,
    String,
    Punct(char),
    Operator(String),
}

#[derive(Clone, Debug, Eq, PartialEq)]
struct JsToken {
    kind: JsTokenKind,
    braces: usize,
    parens: usize,
    brackets: usize,
}

fn tokenize_js(source: &str) -> Vec<JsToken> {
    let bytes = source.as_bytes();
    let mut tokens = Vec::new();
    let mut i = 0;
    let (mut braces, mut parens, mut brackets) = (0, 0, 0);
    let mut expression_expected = true;
    while i < bytes.len() {
        match bytes[i] {
            b'/' if bytes.get(i + 1) == Some(&b'/') => {
                i += 2;
                while i < bytes.len() && bytes[i] != b'\n' {
                    i += 1;
                }
            }
            b'/' if bytes.get(i + 1) == Some(&b'*') => {
                i += 2;
                while i + 1 < bytes.len() && &bytes[i..i + 2] != b"*/" {
                    i += 1;
                }
                i = (i + 2).min(bytes.len());
            }
            quote @ (b'\'' | b'"' | b'`') => {
                i += 1;
                while i < bytes.len() {
                    if bytes[i] == b'\\' {
                        i = (i + 2).min(bytes.len());
                    } else if bytes[i] == quote {
                        i += 1;
                        break;
                    } else {
                        i += 1;
                    }
                }
                tokens.push(JsToken {
                    kind: JsTokenKind::String,
                    braces,
                    parens,
                    brackets,
                });
                expression_expected = false;
            }
            b'/' if expression_expected => {
                i += 1;
                let mut in_class = false;
                while i < bytes.len() {
                    match bytes[i] {
                        b'\\' => i = (i + 2).min(bytes.len()),
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
                            break;
                        }
                        _ => i += 1,
                    }
                }
                tokens.push(JsToken {
                    kind: JsTokenKind::String,
                    braces,
                    parens,
                    brackets,
                });
                expression_expected = false;
            }
            byte if byte == b'_' || byte == b'$' || byte.is_ascii_alphabetic() => {
                let start = i;
                i += 1;
                while i < bytes.len()
                    && (bytes[i] == b'_' || bytes[i] == b'$' || bytes[i].is_ascii_alphanumeric())
                {
                    i += 1;
                }
                let value = source[start..i].to_string();
                expression_expected = matches!(
                    value.as_str(),
                    "return"
                        | "throw"
                        | "case"
                        | "delete"
                        | "typeof"
                        | "void"
                        | "new"
                        | "in"
                        | "of"
                );
                tokens.push(JsToken {
                    kind: JsTokenKind::Ident(value),
                    braces,
                    parens,
                    brackets,
                });
            }
            byte if byte.is_ascii_digit() => {
                i += 1;
                while i < bytes.len()
                    && (bytes[i].is_ascii_alphanumeric() || matches!(bytes[i], b'.' | b'_'))
                {
                    i += 1;
                }
                tokens.push(JsToken {
                    kind: JsTokenKind::Number,
                    braces,
                    parens,
                    brackets,
                });
                expression_expected = false;
            }
            byte @ (b'{' | b'}' | b'(' | b')' | b'[' | b']') => {
                if byte == b'}' {
                    braces = braces.saturating_sub(1);
                } else if byte == b')' {
                    parens = parens.saturating_sub(1);
                } else if byte == b']' {
                    brackets = brackets.saturating_sub(1);
                }
                tokens.push(JsToken {
                    kind: JsTokenKind::Punct(byte as char),
                    braces,
                    parens,
                    brackets,
                });
                if byte == b'{' {
                    braces += 1;
                } else if byte == b'(' {
                    parens += 1;
                } else if byte == b'[' {
                    brackets += 1;
                }
                expression_expected = !matches!(byte, b')' | b']' | b'}');
                i += 1;
            }
            byte if b".,;:".contains(&byte) => {
                tokens.push(JsToken {
                    kind: JsTokenKind::Punct(byte as char),
                    braces,
                    parens,
                    brackets,
                });
                expression_expected = !matches!(byte, b'.');
                i += 1;
            }
            byte if b"=+-*%&|^!<>?/~".contains(&byte) => {
                let was_expression_expected = expression_expected;
                let start = i;
                i += 1;
                while i < bytes.len() && b"=+-*%&|^!<>?/~".contains(&bytes[i]) {
                    i += 1;
                }
                let operator = source[start..i].to_string();
                expression_expected = if matches!(operator.as_str(), "++" | "--") {
                    was_expression_expected
                } else {
                    true
                };
                tokens.push(JsToken {
                    kind: JsTokenKind::Operator(operator),
                    braces,
                    parens,
                    brackets,
                });
            }
            _ => i += 1,
        }
    }
    tokens
}

fn referenced_identifiers(tokens: &[JsToken]) -> BTreeSet<&str> {
    tokens
        .iter()
        .enumerate()
        .filter_map(|(index, token)| {
            let JsTokenKind::Ident(value) = &token.kind else {
                return None;
            };
            let next = tokens.get(index + 1);
            matches!(next.map(|t| &t.kind), Some(JsTokenKind::Punct('('))).then_some(value.as_str())
        })
        .collect()
}

fn top_level_declarations(source: &str) -> BTreeMap<String, usize> {
    fn add(declarations: &mut BTreeMap<String, usize>, name: &str) {
        *declarations.entry(name.to_string()).or_default() += 1;
    }

    fn collect_binding(tokens: &[JsToken], declarations: &mut BTreeMap<String, usize>) {
        let mut i = 0;
        let mut default_expression = None;
        while i < tokens.len() {
            if let Some((braces, parens, brackets)) = default_expression {
                let ends_default = matches!(tokens[i].kind, JsTokenKind::Punct(','))
                    && tokens[i].braces == braces
                    && tokens[i].parens == parens
                    && tokens[i].brackets == brackets;
                let leaves_pattern = tokens[i].braces < braces
                    || tokens[i].parens < parens
                    || tokens[i].brackets < brackets;
                if !ends_default && !leaves_pattern {
                    i += 1;
                    continue;
                }
                default_expression = None;
            }
            if matches!(&tokens[i].kind, JsTokenKind::Operator(op) if op == "=") {
                default_expression = Some((tokens[i].braces, tokens[i].parens, tokens[i].brackets));
                i += 1;
                continue;
            }
            if matches!(tokens[i].kind, JsTokenKind::Punct('[')) {
                let depth = tokens[i].brackets;
                let mut close = i + 1;
                while close < tokens.len()
                    && !(matches!(tokens[close].kind, JsTokenKind::Punct(']'))
                        && tokens[close].brackets == depth)
                {
                    close += 1;
                }
                if close < tokens.len()
                    && matches!(
                        tokens.get(close + 1).map(|t| &t.kind),
                        Some(JsTokenKind::Punct(':'))
                    )
                {
                    i = close + 2;
                    continue;
                }
            }
            if let JsTokenKind::Ident(name) = &tokens[i].kind {
                let next = tokens.get(i + 1);
                let property_key = matches!(next.map(|t| &t.kind), Some(JsTokenKind::Punct(':')));
                if !property_key {
                    add(declarations, name);
                }
            }
            i += 1;
        }
    }

    let tokens = tokenize_js(source);
    let mut declarations = BTreeMap::new();
    let mut i = 0;
    while i < tokens.len() {
        let token = &tokens[i];
        if token.braces != 0 || token.parens != 0 || token.brackets != 0 {
            i += 1;
            continue;
        }
        let JsTokenKind::Ident(kind) = &token.kind else {
            i += 1;
            continue;
        };
        if matches!(kind.as_str(), "function" | "class") {
            if let Some(JsToken {
                kind: JsTokenKind::Ident(name),
                ..
            }) = tokens.get(i + 1)
            {
                add(&mut declarations, name);
            }
            i += 1;
            continue;
        }
        if !matches!(kind.as_str(), "const" | "let" | "var") {
            i += 1;
            continue;
        }
        i += 1;
        let mut start = i;
        while i <= tokens.len() {
            let at_end = i == tokens.len();
            let separator = tokens.get(i).is_some_and(|candidate| {
                candidate.braces == 0
                    && candidate.parens == 0
                    && candidate.brackets == 0
                    && matches!(candidate.kind, JsTokenKind::Punct(',' | ';'))
            });
            if at_end || separator {
                let declarator = &tokens[start..i];
                let assignment = declarator.iter().position(|candidate| {
                    candidate.braces == 0
                        && candidate.parens == 0
                        && candidate.brackets == 0
                        && matches!(&candidate.kind, JsTokenKind::Operator(op) if op == "=")
                });
                collect_binding(
                    &declarator[..assignment.unwrap_or(declarator.len())],
                    &mut declarations,
                );
                if at_end || matches!(tokens[i].kind, JsTokenKind::Punct(';')) {
                    break;
                }
                start = i + 1;
            }
            i += 1;
        }
    }
    declarations
}

fn rust_declarations(source: &str) -> BTreeSet<String> {
    syn::parse_file(source)
        .expect("internal.rs must parse as Rust")
        .items
        .into_iter()
        .filter_map(|item| match item {
            syn::Item::Const(item) => Some(item.ident.to_string()),
            syn::Item::Enum(item) => Some(item.ident.to_string()),
            syn::Item::Fn(item) => Some(item.sig.ident.to_string()),
            syn::Item::Mod(item) => Some(item.ident.to_string()),
            syn::Item::Static(item) => Some(item.ident.to_string()),
            syn::Item::Struct(item) => Some(item.ident.to_string()),
            syn::Item::Trait(item) => Some(item.ident.to_string()),
            syn::Item::Type(item) => Some(item.ident.to_string()),
            _ => None,
        })
        .collect()
}

fn registered_rust_bridges(source: &str) -> BTreeSet<String> {
    fn visit(stream: TokenStream, bridges: &mut BTreeSet<String>) {
        let tokens = stream.into_iter().collect::<Vec<_>>();
        for (index, token) in tokens.iter().enumerate() {
            if matches!(token, TokenTree::Ident(ident) if ident == "set_non_replaceable_global")
                && let Some(TokenTree::Group(args)) = tokens.get(index + 1)
                && args.delimiter() == Delimiter::Parenthesis
            {
                let mut arguments = vec![Vec::new()];
                for token in args.stream() {
                    if matches!(&token, TokenTree::Punct(punct) if punct.as_char() == ',') {
                        arguments.push(Vec::new());
                    } else {
                        arguments.last_mut().unwrap().push(token);
                    }
                }
                if let Some([TokenTree::Literal(literal)]) = arguments.get(1).map(Vec::as_slice)
                    && let Ok(value) = syn::parse_str::<syn::LitStr>(&literal.to_string())
                    && value.value().starts_with("__wasm_rquickjs_")
                {
                    bridges.insert(value.value());
                }
            }
            if let TokenTree::Group(group) = token {
                visit(group.stream(), bridges);
            }
        }
    }
    let mut bridges = BTreeSet::new();
    visit(
        syn::parse_file(source)
            .expect("internal.rs must parse as Rust")
            .into_token_stream(),
        &mut bridges,
    );
    bridges
}

fn assert_no_import_meta_mutation(tokens: &[JsToken]) {
    fn ident(token: Option<&JsToken>, expected: &str) -> bool {
        matches!(token.map(|t| &t.kind), Some(JsTokenKind::Ident(value)) if value == expected)
    }
    fn punct(token: Option<&JsToken>, expected: char) -> bool {
        matches!(token.map(|t| &t.kind), Some(JsTokenKind::Punct(value)) if *value == expected)
    }
    fn operator(token: Option<&JsToken>, expected: &[&str]) -> bool {
        matches!(token.map(|t| &t.kind), Some(JsTokenKind::Operator(value)) if expected.contains(&value.as_str()))
    }

    fn import_meta_at(tokens: &[JsToken], index: usize) -> Option<(usize, usize)> {
        let mut core = index;
        let mut parentheses = 0;
        while punct(tokens.get(core), '(') {
            core += 1;
            parentheses += 1;
        }
        if !ident(tokens.get(core), "import")
            || !punct(tokens.get(core + 1), '.')
            || !ident(tokens.get(core + 2), "meta")
        {
            return None;
        }
        let mut end = core + 3;
        if parentheses > 0 {
            loop {
                if punct(tokens.get(end), '.')
                    && matches!(
                        tokens.get(end + 1).map(|t| &t.kind),
                        Some(JsTokenKind::Ident(_))
                    )
                {
                    end += 2;
                } else if punct(tokens.get(end), '[') {
                    let depth = tokens[end].brackets;
                    end += 1;
                    while end < tokens.len()
                        && !(punct(tokens.get(end), ']') && tokens[end].brackets == depth)
                    {
                        end += 1;
                    }
                    if end == tokens.len() {
                        return None;
                    }
                    end += 1;
                } else {
                    break;
                }
            }
        }
        for _ in 0..parentheses {
            if !punct(tokens.get(end), ')') {
                return None;
            }
            end += 1;
        }
        Some((index, end))
    }

    for i in 0..tokens.len() {
        let object_mutator = ident(tokens.get(i), "Object")
            && punct(tokens.get(i + 1), '.')
            && (ident(tokens.get(i + 2), "assign")
                || ident(tokens.get(i + 2), "defineProperty")
                || ident(tokens.get(i + 2), "defineProperties"));
        let reflect_mutator = ident(tokens.get(i), "Reflect")
            && punct(tokens.get(i + 1), '.')
            && ident(tokens.get(i + 2), "set");
        if (object_mutator || reflect_mutator)
            && punct(tokens.get(i + 3), '(')
            && import_meta_at(tokens, i + 4).is_some()
        {
            panic!("JavaScript must not mutate host-owned import.meta through Object APIs");
        }
        let Some((start, mut end)) = import_meta_at(tokens, i) else {
            continue;
        };
        loop {
            if punct(tokens.get(end), '.')
                && matches!(
                    tokens.get(end + 1).map(|t| &t.kind),
                    Some(JsTokenKind::Ident(_))
                )
            {
                end += 2;
            } else if punct(tokens.get(end), '[') {
                let depth = tokens[end].brackets;
                end += 1;
                while end < tokens.len()
                    && !(punct(tokens.get(end), ']') && tokens[end].brackets == depth)
                {
                    end += 1;
                }
                end = (end + 1).min(tokens.len());
            } else {
                break;
            }
        }
        let assignment = operator(
            tokens.get(end),
            &[
                "=", "+=", "-=", "*=", "/=", "%=", "**=", "&&=", "||=", "??=", "&=", "|=", "^=",
                "<<=", ">>=", ">>>=",
            ],
        );
        let update = operator(tokens.get(start.wrapping_sub(1)), &["++", "--"])
            || operator(tokens.get(end), &["++", "--"]);
        let deleted = ident(tokens.get(start.wrapping_sub(1)), "delete");
        let statement_end = tokens[end..]
            .iter()
            .position(|token| matches!(token.kind, JsTokenKind::Punct(';')))
            .map_or(tokens.len(), |offset| end + offset);
        let statement_start = tokens[..start]
            .iter()
            .rposition(|token| matches!(token.kind, JsTokenKind::Punct(';')))
            .map_or(0, |index| index + 1);
        let destructuring_assignment = tokens[end..statement_end]
            .iter()
            .position(|token| matches!(&token.kind, JsTokenKind::Operator(op) if op == "="))
            .is_some_and(|offset| {
                tokens[statement_start..start]
                    .iter()
                    .any(|token| matches!(token.kind, JsTokenKind::Punct('{' | '[' | '(')))
                    && tokens[end..end + offset]
                        .iter()
                        .any(|token| matches!(token.kind, JsTokenKind::Punct('}' | ']')))
            });
        if assignment || update || deleted || destructuring_assignment {
            panic!("JavaScript must not mutate host-owned import.meta metadata");
        }
    }
}

#[test]
fn module_loader_architecture() {
    let js_tokens = tokenize_js(MODULE_JS);
    let js_declarations = top_level_declarations(MODULE_JS);
    let js_identifiers = referenced_identifiers(&js_tokens);
    let rust_declarations = rust_declarations(INTERNAL_RS);
    let rust_bridges = registered_rust_bridges(INTERNAL_RS);

    for owner in [
        "NodeModulesResolver",
        "CjsExportAnalysis",
        "CjsCompatLoader",
    ] {
        assert!(
            rust_declarations.contains(owner),
            "Rust-owned capability {owner} must be declared in internal.rs"
        );
    }
    for forbidden in [
        "resolvePackageExports",
        "resolvePackageTargetValue",
        "findPackageMapTarget",
        "packagePatternCompare",
        "packagePatternKeyMatch",
        "analyzeCommonJsExportNames",
        "generateCommonJsFacadeSource",
    ] {
        assert!(
            !js_declarations.contains_key(forbidden),
            "Rust-owned capability {forbidden} must not have a top-level JS declaration"
        );
    }
    for owner in [
        "moduleCache",
        "requireExtensions",
        "loadCommonJsTransaction",
    ] {
        assert_eq!(
            js_declarations.get(owner),
            Some(&1),
            "JS-owned CJS capability {owner} must have one top-level declaration"
        );
        assert!(
            !rust_declarations.contains(owner),
            "Rust must not declare JS-owned CJS capability {owner}"
        );
    }
    assert!(js_tokens.windows(4).any(|window| matches!(window, [JsToken { kind: JsTokenKind::Ident(name), .. }, JsToken { kind: JsTokenKind::Punct(':'), .. }, JsToken { kind: JsTokenKind::Ident(object), .. }, JsToken { kind: JsTokenKind::Punct('.'), .. }] if name == "_pathCache" && object == "Object")), "Module._pathCache must remain JS-owned mutable state");
    for bridge in [
        "__wasm_rquickjs_cjs_resolve_package_exports",
        "__wasm_rquickjs_cjs_resolve_package_self_reference",
        "__wasm_rquickjs_cjs_resolve_package_fallback",
        "__wasm_rquickjs_package_global_conditions",
        "__wasm_rquickjs_analyze_loader_cjs_reexport_names",
    ] {
        assert!(
            js_identifiers.contains(bridge),
            "module.js must reference Rust bridge {bridge}"
        );
        assert!(
            rust_bridges.contains(bridge),
            "internal.rs must register Rust bridge {bridge}"
        );
    }
    assert_no_import_meta_mutation(&js_tokens);
}

#[test]
fn js_tokenizer_skips_non_code_text() {
    let source = "// function lineComment() {}\n/* const blockComment = 1; */\nconst realDeclaration = \"class stringText {}\";\nconst template = `function templateText() {}`;\nconst regex = /class regexText {}\\//;";
    let declarations = top_level_declarations(source);
    assert!(declarations.contains_key("realDeclaration"));
    assert!(declarations.contains_key("template"));
    assert!(declarations.contains_key("regex"));
    for skipped in [
        "lineComment",
        "blockComment",
        "stringText",
        "templateText",
        "regexText",
    ] {
        assert!(!declarations.contains_key(skipped));
    }
}

#[test]
fn js_declarations_are_structural() {
    let declarations = top_level_declarations(
        "const first = call(1, 2), { key: renamed, shorthand, defaulted = ignored } = value;\n\
         function topLevel() { const nested = 1; }\n\
         class TopLevelClass { method() { let alsoNested = 1; } }",
    );
    for declared in [
        "first",
        "renamed",
        "shorthand",
        "defaulted",
        "topLevel",
        "TopLevelClass",
    ] {
        assert_eq!(declarations.get(declared), Some(&1));
    }
    for skipped in ["key", "ignored", "nested", "alsoNested"] {
        assert!(!declarations.contains_key(skipped));
    }
    let computed = top_level_declarations("const { [moduleCache]: alias } = value;");
    assert!(!computed.contains_key("moduleCache"));
    assert_eq!(computed.get("alias"), Some(&1));
}

#[test]
fn bridge_references_require_calls() {
    let tokens = tokenize_js(
        "const __wasm_rquickjs_declaration = 1;\n\
         const object = { __wasm_rquickjs_key: 1 };\n\
         wasmRquickjsModuleGlobalThis.__wasm_rquickjs_called();",
    );
    let references = referenced_identifiers(&tokens);
    assert!(!references.contains("__wasm_rquickjs_declaration"));
    assert!(!references.contains("__wasm_rquickjs_key"));
    assert!(references.contains("__wasm_rquickjs_called"));
}

#[test]
fn rust_bridge_registration_uses_name_argument() {
    let bridges = registered_rust_bridges(
        r#"
        fn register() {
            set_non_replaceable_global(
                "__wasm_rquickjs_not_the_name",
                "ordinary_name",
                "__wasm_rquickjs_also_not_the_name",
            );
            set_non_replaceable_global(
                &global,
                "__wasm_rquickjs_actual_name",
                value,
            );
        }
        "#,
    );
    assert_eq!(
        bridges,
        BTreeSet::from(["__wasm_rquickjs_actual_name".to_string()])
    );
}

#[test]
fn import_meta_reads_are_allowed() {
    assert_no_import_meta_mutation(&tokenize_js(
        "const url = import.meta.url; const sum = import.meta.value + 1;",
    ));
}

#[test]
#[should_panic(expected = "must not mutate host-owned import.meta")]
fn import_meta_compound_assignment_is_rejected() {
    assert_no_import_meta_mutation(&tokenize_js("import.meta['value'] += 1;"));
}

#[test]
#[should_panic(expected = "must not mutate host-owned import.meta")]
fn import_meta_object_mutation_is_rejected() {
    assert_no_import_meta_mutation(&tokenize_js(
        "Object.defineProperty(import.meta, 'value', { value: 1 });",
    ));
}

#[test]
#[should_panic(expected = "must not mutate host-owned import.meta")]
fn parenthesized_import_meta_mutation_is_rejected() {
    assert_no_import_meta_mutation(&tokenize_js("(import.meta).value++;"));
}

#[test]
#[should_panic(expected = "must not mutate host-owned import.meta")]
fn parenthesized_full_member_update_is_rejected() {
    assert_no_import_meta_mutation(&tokenize_js("(import.meta.value)++;"));
}

#[test]
#[should_panic(expected = "must not mutate host-owned import.meta")]
fn parenthesized_full_member_assignment_is_rejected() {
    assert_no_import_meta_mutation(&tokenize_js("(import.meta.value) = source;"));
}

#[test]
#[should_panic(expected = "must not mutate host-owned import.meta")]
fn parenthesized_full_member_delete_is_rejected() {
    assert_no_import_meta_mutation(&tokenize_js("delete (import.meta.value);"));
}

#[test]
#[should_panic(expected = "must not mutate host-owned import.meta")]
fn destructuring_import_meta_mutation_is_rejected() {
    assert_no_import_meta_mutation(&tokenize_js("({ value: import.meta.value } = source);"));
}

#[test]
#[should_panic(expected = "must not mutate host-owned import.meta")]
fn reflect_import_meta_mutation_is_rejected() {
    assert_no_import_meta_mutation(&tokenize_js("Reflect.set((import.meta), 'value', 1);"));
}

#[test]
#[should_panic(expected = "must not mutate host-owned import.meta")]
fn define_properties_import_meta_mutation_is_rejected() {
    assert_no_import_meta_mutation(&tokenize_js(
        "Object.defineProperties(import.meta, { value: { value: 1 } });",
    ));
}
