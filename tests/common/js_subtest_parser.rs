use oxc_allocator::Allocator;
use oxc_ast::ast::*;
use oxc_parser::Parser;
use oxc_span::SourceType;

/// Info about a top-level `{ }` block.
#[derive(Debug, Clone)]
pub struct BlockInfo {
    pub index: usize,
    /// Byte span: (start, end) - inclusive of the braces
    pub span: (u32, u32),
    pub name: String,
}

/// Info about a top-level `test('name', fn)` call.
#[derive(Debug, Clone)]
pub struct TestInfo {
    pub index: usize,
    pub span: (u32, u32),
    pub name: String,
}

#[derive(Debug)]
pub enum SubtestDiscovery {
    None,
    Block(Vec<BlockInfo>),
    NodeTest(Vec<TestInfo>),
}

/// Sanitize a string to a valid Rust identifier fragment.
/// Non-alphanumeric → `_`, lowercase, collapse consecutive `_`, truncate at 60 chars.
pub fn sanitize_name(s: &str) -> String {
    let mut result = String::new();
    let mut last_was_underscore = false;
    for c in s.chars() {
        if c.is_alphanumeric() {
            result.push(c.to_ascii_lowercase());
            last_was_underscore = false;
        } else if !last_was_underscore {
            result.push('_');
            last_was_underscore = true;
        }
    }
    let result = result
        .trim_start_matches('_')
        .trim_end_matches('_')
        .to_string();
    if result.len() > 60 {
        let mut end = 60;
        while end > 0 && !result.is_char_boundary(end) {
            end -= 1;
        }
        result[..end].to_string()
    } else {
        result
    }
}

/// Extract a comment from the line immediately preceding a block statement.
/// Looks backward from span_start in the source bytes for a `//` comment on the preceding line.
fn extract_preceding_comment(source: &str, span_start: u32) -> Option<String> {
    let bytes = source.as_bytes();
    let start = span_start as usize;
    if start == 0 {
        return None;
    }

    // Skip backwards past any whitespace to find end of preceding line
    let mut pos = start;
    while pos > 0 && (bytes[pos - 1] == b' ' || bytes[pos - 1] == b'\t' || bytes[pos - 1] == b'\r')
    {
        pos -= 1;
    }
    // We should now be at a newline or at content
    if pos > 0 && bytes[pos - 1] == b'\n' {
        pos -= 1;
        if pos > 0 && bytes[pos - 1] == b'\r' {
            pos -= 1;
        }
    } else {
        return None;
    }

    // Now find the start of this preceding line
    let line_end = pos;
    while pos > 0 && bytes[pos - 1] != b'\n' {
        pos -= 1;
    }
    let line_start = pos;

    let line = &source[line_start..line_end];
    let trimmed = line.trim();

    if let Some(comment) = trimmed.strip_prefix("//") {
        let comment = comment.trim();
        if !comment.is_empty() {
            return Some(comment.to_string());
        }
    }

    None
}

/// Check if the AST imports or requires 'node:test'.
fn uses_node_test(program: &Program) -> bool {
    for stmt in &program.body {
        match stmt {
            Statement::ImportDeclaration(import) => {
                if import.source.value == "node:test" {
                    return true;
                }
            }
            Statement::VariableDeclaration(var_decl) => {
                for decl in &var_decl.declarations {
                    if decl
                        .init
                        .as_ref()
                        .is_some_and(|init| is_require_node_test(init))
                    {
                        return true;
                    }
                }
            }
            Statement::ExpressionStatement(expr_stmt) => {
                if is_require_node_test(&expr_stmt.expression) {
                    return true;
                }
                if let Expression::AssignmentExpression(assign) = &expr_stmt.expression
                    && is_require_node_test(&assign.right)
                {
                    return true;
                }
            }
            _ => {}
        }
    }
    false
}

fn is_require_node_test(expr: &Expression) -> bool {
    if let Expression::CallExpression(call) = expr
        && let Expression::Identifier(id) = &call.callee
        && id.name == "require"
        && let Some(Argument::StringLiteral(s)) = call.arguments.first()
    {
        return s.value == "node:test";
    }
    false
}

/// Check if an expression is a `test(...)` call.
fn is_test_call(expr: &Expression) -> bool {
    if let Expression::CallExpression(call) = expr
        && let Expression::Identifier(id) = &call.callee
    {
        return id.name == "test";
    }
    false
}

/// Extract test name from a test() call's first argument.
fn extract_test_name(call: &CallExpression) -> Option<String> {
    if let Some(arg) = call.arguments.first() {
        match arg {
            Argument::StringLiteral(s) => return Some(s.value.to_string()),
            Argument::TemplateLiteral(t) => {
                if t.expressions.is_empty() && !t.quasis.is_empty() {
                    let value = t
                        .quasis
                        .iter()
                        .map(|q| q.value.raw.as_str())
                        .collect::<String>();
                    if !value.is_empty() {
                        return Some(value);
                    }
                }
            }
            _ => {}
        }
    }
    None
}

/// Discover subtests in a JS source file.
///
/// - `path`: file path (used to determine SourceType: .js → CJS, .mjs → ESM)
/// - `source`: the JS source code
pub fn discover_subtests(path: &str, source: &str) -> SubtestDiscovery {
    let source_type = if path.ends_with(".mjs") {
        SourceType::mjs()
    } else {
        SourceType::cjs()
    };

    let allocator = Allocator::default();
    let ret = Parser::new(&allocator, source, source_type).parse();

    let program = &ret.program;

    if uses_node_test(program) {
        let mut tests = Vec::new();
        let mut index = 0;

        for stmt in &program.body {
            if let Statement::ExpressionStatement(expr_stmt) = stmt
                && let Expression::CallExpression(call) = &expr_stmt.expression
                && is_test_call(&expr_stmt.expression)
            {
                let name = extract_test_name(call)
                    .map(|n| sanitize_name(&n))
                    .unwrap_or_else(|| format!("test_{index:02}"));
                let full_name = format!("test_{index:02}_{name}");
                tests.push(TestInfo {
                    index,
                    span: (expr_stmt.span.start, expr_stmt.span.end),
                    name: full_name,
                });
                index += 1;
            }
        }

        if tests.len() < 2 {
            SubtestDiscovery::None
        } else {
            SubtestDiscovery::NodeTest(tests)
        }
    } else {
        let mut blocks = Vec::new();
        let mut index = 0;

        for stmt in &program.body {
            if let Statement::BlockStatement(block) = stmt {
                let comment = extract_preceding_comment(source, block.span.start);
                let name = comment
                    .map(|c| sanitize_name(&c))
                    .filter(|s| !s.is_empty())
                    .unwrap_or_else(|| format!("block_{index:02}"));
                let full_name = format!("block_{index:02}_{name}");
                blocks.push(BlockInfo {
                    index,
                    span: (block.span.start, block.span.end),
                    name: full_name,
                });
                index += 1;
            }
        }

        if blocks.len() < 2 {
            SubtestDiscovery::None
        } else {
            SubtestDiscovery::Block(blocks)
        }
    }
}

/// Rewrite source to keep all blocks up to and including `target_index`,
/// while emptying later blocks.
///
/// This preserves setup side-effects from earlier blocks when a test file is
/// authored as sequential scenarios that build on previous state.
/// Processes in reverse order to preserve byte offsets.
pub fn rewrite_for_block(source: &str, blocks: &[BlockInfo], target_index: usize) -> String {
    let bytes = source.as_bytes();
    let mut result = bytes.to_vec();
    for block in blocks.iter().rev() {
        if block.index > target_index {
            let start = block.span.0 as usize;
            let end = block.span.1 as usize;
            // Validate span points at actual braces
            if start >= bytes.len() || end > bytes.len() || bytes[start] != b'{' {
                eprintln!(
                    "WARNING: Block {} span ({},{}) does not point at braces, skipping rewrite",
                    block.index, start, end
                );
                continue;
            }
            let inner_start = start + 1; // after '{'
            let inner_end = end - 1; // before '}'
            if inner_start < inner_end {
                result.splice(inner_start..inner_end, std::iter::once(b' '));
            }
        }
    }
    String::from_utf8(result).expect("UTF-8 source remained valid after block rewrite")
}

/// Rewrite source to filter to a single node:test test by index.
///
/// Uses `globalThis.__wasm_rquickjs_node_test_filter` which the node:test
/// polyfill reads on initialization. This works for both CJS and ESM files
/// and doesn't break `'use strict'` directive prologue.
pub fn rewrite_for_node_test(source: &str, target_index: usize) -> String {
    format!("globalThis.__wasm_rquickjs_node_test_filter = {target_index};\n{source}")
}
