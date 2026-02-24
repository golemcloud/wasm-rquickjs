test_r::enable!();

#[allow(dead_code)]
#[path = "common/mod.rs"]
mod common;

use crate::common::js_subtest_parser::{
    BlockInfo, SubtestDiscovery, discover_subtests, rewrite_for_block, rewrite_for_node_test,
    sanitize_name,
};
use test_r::test;

#[test]
fn test_block_discovery() {
    let source = r#"
'use strict';
const assert = require('assert');

// Test basic functionality
{
    assert.strictEqual(1, 1);
}

// Test error case
{
    assert.throws(() => {});
}
"#;
    match discover_subtests("test.js", source) {
        SubtestDiscovery::Block(blocks) => {
            assert_eq!(blocks.len(), 2);
            assert_eq!(blocks[0].index, 0);
            assert!(blocks[0].name.starts_with("block_00_"));
            assert_eq!(blocks[1].index, 1);
            assert!(blocks[1].name.starts_with("block_01_"));
        }
        other => panic!("Expected Block discovery, got {:?}", other),
    }
}

#[test]
fn test_node_test_discovery() {
    let source = r#"
'use strict';
const { test } = require('node:test');

test('first test', () => {
    // ...
});

test('second test', () => {
    // ...
});
"#;
    match discover_subtests("test.js", source) {
        SubtestDiscovery::NodeTest(tests) => {
            assert_eq!(tests.len(), 2);
            assert_eq!(tests[0].name, "test_00_first_test");
            assert_eq!(tests[1].name, "test_01_second_test");
        }
        other => panic!("Expected NodeTest discovery, got {:?}", other),
    }
}

#[test]
fn test_sanitize_name() {
    assert_eq!(sanitize_name("Hello World!"), "hello_world");
    assert_eq!(sanitize_name("test-with-dashes"), "test_with_dashes");
    assert_eq!(sanitize_name("  spaces  "), "spaces");
}

#[test]
fn test_rewrite_for_block() {
    let source = "// preamble\n{ assert(1); }\n{ assert(2); }";
    let blocks = vec![
        BlockInfo {
            index: 0,
            span: (12, 26),
            name: "block_00".to_string(),
        },
        BlockInfo {
            index: 1,
            span: (27, 41),
            name: "block_01".to_string(),
        },
    ];
    let result = rewrite_for_block(source, &blocks, 0);
    assert!(result.contains("assert(1)"));
    assert!(!result.contains("assert(2)"));
}

#[test]
fn test_rewrite_for_node_test() {
    let source = "test('a', () => {});\ntest('b', () => {});";
    let result = rewrite_for_node_test(source, 0);
    assert!(result.starts_with("globalThis.__wasm_rquickjs_node_test_filter = 0;"));
    assert!(result.contains(source));
}

#[test]
fn test_no_split_for_single_block() {
    let source = "'use strict';\n{ assert(1); }";
    match discover_subtests("test.js", source) {
        SubtestDiscovery::None => {}
        other => panic!("Expected None, got {:?}", other),
    }
}
