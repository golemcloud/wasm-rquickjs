test_r::enable!();

#[allow(dead_code)]
#[path = "common/mod.rs"]
mod common;

use crate::common::js_subtest_parser::{
    BlockInfo, BlockKind, SubtestDiscovery, discover_subtests, discover_subtests_with_options,
    rewrite_for_block, rewrite_for_block_with_options, rewrite_for_node_test, sanitize_name,
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
    let source = "// preamble\n{ assert(1); }\n{ assert(2); }\n{ assert(3); }";
    let blocks = vec![
        BlockInfo {
            index: 0,
            span: (12, 26),
            name: "block_00".to_string(),
            kind: BlockKind::Block,
        },
        BlockInfo {
            index: 1,
            span: (27, 41),
            name: "block_01".to_string(),
            kind: BlockKind::Block,
        },
        BlockInfo {
            index: 2,
            span: (42, 56),
            name: "block_02".to_string(),
            kind: BlockKind::Block,
        },
    ];
    // Targeting block 1: only block 1 preserved, blocks 0 and 2 emptied
    let result = rewrite_for_block(source, &blocks, 1);
    assert!(!result.contains("assert(1)"));
    assert!(result.contains("assert(2)"));
    assert!(!result.contains("assert(3)"));

    // Targeting block 0: only block 0 preserved, blocks 1 and 2 emptied
    let result = rewrite_for_block(source, &blocks, 0);
    assert!(result.contains("assert(1)"));
    assert!(!result.contains("assert(2)"));
    assert!(!result.contains("assert(3)"));
}

#[test]
fn test_rewrite_for_block_isolates_top_level_expressions() {
    let source = "'use strict';\nconst common = require('../common');\n(async () => { assert(1); })();\n{ assert(2); }\n{ assert(3); }\n";
    let blocks = match discover_subtests_with_options("test.js", source, false, true) {
        SubtestDiscovery::Block(blocks) => blocks,
        other => panic!("Expected block discovery, got {:?}", other),
    };

    let result = rewrite_for_block_with_options(source, &blocks, 1, true);
    assert_eq!(blocks.len(), 3);
    assert_eq!(blocks[0].kind, BlockKind::Statement);
    assert_eq!(blocks[1].kind, BlockKind::Block);
    assert!(result.contains("'use strict'"));
    assert!(result.contains("const common"));
    assert!(!result.contains("assert(1)"));
    assert!(result.contains("assert(2)"));
    assert!(!result.contains("assert(3)"));
}

#[test]
fn test_isolated_mjs_discovers_top_level_executable_statements() {
    let source = "import assert from 'node:assert';\nawait assert.doesNotReject(Promise.resolve());\n{ assert.ok(true); }\n";
    let blocks = match discover_subtests_with_options("test.mjs", source, false, true) {
        SubtestDiscovery::Block(blocks) => blocks,
        other => panic!("Expected block discovery, got {other:?}"),
    };
    assert_eq!(blocks.len(), 2);
    assert_eq!(blocks[0].kind, BlockKind::Statement);
    assert_eq!(blocks[1].kind, BlockKind::Block);
    let result = rewrite_for_block_with_options(source, &blocks, 0, true);
    assert!(result.contains("import assert"));
    assert!(result.contains("await assert.doesNotReject"));
    assert!(!result.contains("assert.ok(true)"));
}

#[test]
fn test_rewrite_for_node_test() {
    let source =
        "const { test } = require('node:test');\ntest('a', () => {});\ntest('b', () => {});\n";
    let tests = match discover_subtests("test.js", source) {
        SubtestDiscovery::NodeTest(tests) => tests,
        other => panic!("Expected NodeTest discovery, got {:?}", other),
    };
    let result = rewrite_for_node_test(source, &tests, 1);
    assert!(!result.contains("test('a', () => {});"));
    assert!(result.contains("test('b', () => {});"));
}

#[test]
fn test_suite_discovery() {
    let source = r#"
'use strict';
const { suite, test } = require('node:test');

suite('First suite', () => {
    test('nested test', () => {});
});

suite('Second suite', () => {
    test('another nested test', () => {});
});
"#;
    match discover_subtests("test.js", source) {
        SubtestDiscovery::NodeTest(tests) => {
            assert_eq!(tests.len(), 2);
            assert_eq!(tests[0].name, "test_00_first_suite");
            assert_eq!(tests[1].name, "test_01_second_suite");
        }
        other => panic!("Expected NodeTest discovery, got {:?}", other),
    }
}

#[test]
fn test_mixed_test_and_suite_discovery() {
    let source = r#"
'use strict';
const { suite, test } = require('node:test');

test('standalone test', () => {});

suite('A suite', () => {
    test('nested', () => {});
});

test('another standalone', () => {});
"#;
    match discover_subtests("test.js", source) {
        SubtestDiscovery::NodeTest(tests) => {
            assert_eq!(tests.len(), 3);
            assert_eq!(tests[0].name, "test_00_standalone_test");
            assert_eq!(tests[1].name, "test_01_a_suite");
            assert_eq!(tests[2].name, "test_02_another_standalone");
        }
        other => panic!("Expected NodeTest discovery, got {:?}", other),
    }
}

#[test]
fn test_describe_it_nested_discovery() {
    let source = r#"
'use strict';
const { describe, it } = require('node:test');

describe('findPackageJSON', () => {
    it('first same-process case', () => {});
    it('second same-process case', () => {});
});
"#;
    match discover_subtests_with_options("test.js", source, true, false) {
        SubtestDiscovery::NodeTest(tests) => {
            assert_eq!(tests.len(), 2);
            assert_eq!(tests[0].name, "test_00_first_same_process_case");
            assert_eq!(tests[1].name, "test_01_second_same_process_case");
        }
        other => panic!("Expected NodeTest discovery, got {:?}", other),
    }
}

#[test]
fn test_describe_it_default_discovers_suite_only() {
    let source = r#"
'use strict';
const { describe, it } = require('node:test');

describe('findPackageJSON', () => {
    it('first same-process case', () => {});
    it('second same-process case', () => {});
});
"#;
    match discover_subtests("test.js", source) {
        SubtestDiscovery::None => {}
        other => panic!("Expected no split for one top-level suite, got {:?}", other),
    }
}

#[test]
fn test_no_split_for_single_block() {
    let source = "'use strict';\n{ assert(1); }";
    match discover_subtests("test.js", source) {
        SubtestDiscovery::None => {}
        other => panic!("Expected None, got {:?}", other),
    }
}
