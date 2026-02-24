test_r::enable!();

#[allow(dead_code)]
#[path = "common/mod.rs"]
mod common;

use crate::common::js_subtest_parser::{SubtestDiscovery, discover_subtests};
use crate::common::strip_jsonc_comments;
use serde_json::{Map, Value, json};
use std::fs;
use test_r::test;

#[test]
fn migrate_config_split() {
    let config_path = "tests/node_compat/config.jsonc";
    let content = fs::read_to_string(config_path).expect("Failed to read config.jsonc");
    let json_str = strip_jsonc_comments(&content);
    let mut config: Value = serde_json::from_str(&json_str).expect("Failed to parse config");

    let tests_obj = config
        .get_mut("tests")
        .and_then(|v| v.as_object_mut())
        .expect("config.jsonc missing 'tests' object");

    let mut updates: Vec<(String, Value)> = Vec::new();
    let mut split_count = 0;
    let mut total_subtests = 0;

    // Collect entries to process (can't mutate while iterating)
    let entries: Vec<(String, Value)> = tests_obj
        .iter()
        .map(|(k, v)| (k.clone(), v.clone()))
        .collect();

    for (test_path, opts) in &entries {
        // Skip already-split entries
        if opts.get("split").and_then(|v| v.as_bool()).unwrap_or(false) {
            continue;
        }

        let suite_file = format!("tests/node_compat/suite/{}", test_path);
        let source = match fs::read_to_string(&suite_file) {
            Ok(s) => s,
            Err(_) => {
                eprintln!("Skipping {}: file not found", test_path);
                continue;
            }
        };

        let discovery = discover_subtests(test_path, &source);

        let subtests_list = match &discovery {
            SubtestDiscovery::None => continue,
            SubtestDiscovery::Block(blocks) => {
                blocks.iter().map(|b| b.name.clone()).collect::<Vec<_>>()
            }
            SubtestDiscovery::NodeTest(tests) => {
                tests.iter().map(|t| t.name.clone()).collect::<Vec<_>>()
            }
        };

        if subtests_list.len() < 2 {
            continue;
        }

        let file_skip = opts.get("skip").and_then(|v| v.as_bool()).unwrap_or(false);
        let file_reason = opts.get("reason").and_then(|v| v.as_str()).unwrap_or("");

        let mut new_entry = Map::new();

        // Preserve existing skip/reason
        if file_skip {
            new_entry.insert("skip".to_string(), json!(true));
            if !file_reason.is_empty() {
                new_entry.insert("reason".to_string(), json!(file_reason));
            }
        }

        new_entry.insert("split".to_string(), json!(true));

        let mut subtests_obj = Map::new();
        for name in &subtests_list {
            if file_skip {
                let mut sub = Map::new();
                sub.insert("skip".to_string(), json!(true));
                let reason = if file_reason.is_empty() {
                    "inherited".to_string()
                } else {
                    format!("inherited: {}", file_reason)
                };
                sub.insert("reason".to_string(), json!(reason));
                subtests_obj.insert(name.clone(), Value::Object(sub));
            } else {
                subtests_obj.insert(name.clone(), json!({}));
            }
        }
        new_entry.insert("subtests".to_string(), Value::Object(subtests_obj));

        updates.push((test_path.clone(), Value::Object(new_entry)));
        split_count += 1;
        total_subtests += subtests_list.len();
    }

    // Apply updates
    for (path, new_value) in &updates {
        tests_obj.insert(path.clone(), new_value.clone());
    }

    // Write back
    let output = serde_json::to_string_pretty(&config).expect("Failed to serialize config");
    fs::write(config_path, &output).expect("Failed to write config.jsonc");

    println!("Migration complete:");
    println!("  Split files: {}", split_count);
    println!("  Total subtests: {}", total_subtests);
    println!("  Config written to: {}", config_path);
}
