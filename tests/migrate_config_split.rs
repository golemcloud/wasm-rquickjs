test_r::enable!();

#[allow(dead_code)]
#[path = "common/mod.rs"]
mod common;

use crate::common::js_subtest_parser::{SubtestDiscovery, discover_subtests};
use crate::common::strip_jsonc_comments;
use serde_json::Value;
use std::collections::BTreeSet;
use std::fs;
use test_r::test;

/// Find the byte span (start, end) of a JSON object value for a given key in JSONC text.
/// Returns the byte range of the value object `{...}` (inclusive of braces).
/// Handles JSONC line/block comments and nested objects.
fn find_value_span(content: &str, key: &str) -> Option<(usize, usize)> {
    let search = format!("\"{}\"", key);
    let key_pos = content.find(&search)?;
    let bytes = content.as_bytes();
    let mut pos = key_pos + search.len();

    // Skip whitespace
    while pos < bytes.len() && bytes[pos].is_ascii_whitespace() {
        pos += 1;
    }
    // Expect ':'
    if pos >= bytes.len() || bytes[pos] != b':' {
        return None;
    }
    pos += 1;
    // Skip whitespace
    while pos < bytes.len() && bytes[pos].is_ascii_whitespace() {
        pos += 1;
    }
    if pos >= bytes.len() || bytes[pos] != b'{' {
        return None;
    }

    let value_start = pos;
    let mut depth = 0;
    let mut in_string = false;

    while pos < bytes.len() {
        if in_string {
            if bytes[pos] == b'\\' && pos + 1 < bytes.len() {
                pos += 2;
                continue;
            }
            if bytes[pos] == b'"' {
                in_string = false;
            }
        } else {
            match bytes[pos] {
                b'"' => in_string = true,
                b'{' => depth += 1,
                b'}' => {
                    depth -= 1;
                    if depth == 0 {
                        return Some((value_start, pos + 1));
                    }
                }
                b'/' if pos + 1 < bytes.len() && bytes[pos + 1] == b'/' => {
                    pos += 2;
                    while pos < bytes.len() && bytes[pos] != b'\n' {
                        pos += 1;
                    }
                    continue;
                }
                b'/' if pos + 1 < bytes.len() && bytes[pos + 1] == b'*' => {
                    pos += 2;
                    while pos + 1 < bytes.len()
                        && !(bytes[pos] == b'*' && bytes[pos + 1] == b'/')
                    {
                        pos += 1;
                    }
                    if pos + 1 < bytes.len() {
                        pos += 2;
                    }
                    continue;
                }
                _ => {}
            }
        }
        pos += 1;
    }

    None
}

/// Find the byte position of the closing '}' of the "tests" object in JSONC content.
fn find_tests_object_close(content: &str) -> Option<usize> {
    let tests_key = "\"tests\"";
    let key_pos = content.find(tests_key)?;
    let bytes = content.as_bytes();
    let mut pos = key_pos + tests_key.len();

    // Skip to ':'
    while pos < bytes.len() && bytes[pos].is_ascii_whitespace() {
        pos += 1;
    }
    if pos >= bytes.len() || bytes[pos] != b':' {
        return None;
    }
    pos += 1;
    // Skip to '{'
    while pos < bytes.len() && bytes[pos].is_ascii_whitespace() {
        pos += 1;
    }
    if pos >= bytes.len() || bytes[pos] != b'{' {
        return None;
    }

    let mut depth = 0;
    let mut in_string = false;

    while pos < bytes.len() {
        if in_string {
            if bytes[pos] == b'\\' && pos + 1 < bytes.len() {
                pos += 2;
                continue;
            }
            if bytes[pos] == b'"' {
                in_string = false;
            }
        } else {
            match bytes[pos] {
                b'"' => in_string = true,
                b'{' => depth += 1,
                b'}' => {
                    depth -= 1;
                    if depth == 0 {
                        return Some(pos);
                    }
                }
                b'/' if pos + 1 < bytes.len() && bytes[pos + 1] == b'/' => {
                    pos += 2;
                    while pos < bytes.len() && bytes[pos] != b'\n' {
                        pos += 1;
                    }
                    continue;
                }
                b'/' if pos + 1 < bytes.len() && bytes[pos + 1] == b'*' => {
                    pos += 2;
                    while pos + 1 < bytes.len()
                        && !(bytes[pos] == b'*' && bytes[pos + 1] == b'/')
                    {
                        pos += 1;
                    }
                    if pos + 1 < bytes.len() {
                        pos += 2;
                    }
                    continue;
                }
                _ => {}
            }
        }
        pos += 1;
    }

    None
}

/// Escape a string for embedding in a JSON string literal.
fn escape_json(s: &str) -> String {
    s.replace('\\', "\\\\")
        .replace('"', "\\\"")
        .replace('\n', "\\n")
        .replace('\r', "\\r")
        .replace('\t', "\\t")
}

/// Format a split entry value (the part after `"key": `).
fn format_split_value(
    skip: bool,
    reason: &str,
    subtests: &[(String, bool, String)], // (name, skip, reason)
) -> String {
    let mut lines = Vec::new();
    lines.push("{".to_string());

    if skip {
        lines.push("      \"skip\": true,".to_string());
        if !reason.is_empty() {
            lines.push(format!("      \"reason\": \"{}\",", escape_json(reason)));
        }
    }

    lines.push("      \"split\": true,".to_string());
    lines.push("      \"subtests\": {".to_string());

    for (i, (name, sub_skip, sub_reason)) in subtests.iter().enumerate() {
        let comma = if i + 1 < subtests.len() { "," } else { "" };
        if *sub_skip {
            lines.push(format!(
                "        \"{}\": {{ \"skip\": true, \"reason\": \"{}\" }}{}",
                escape_json(name),
                escape_json(sub_reason),
                comma
            ));
        } else {
            lines.push(format!(
                "        \"{}\": {{}}{}",
                escape_json(name),
                comma
            ));
        }
    }

    lines.push("      }".to_string());
    lines.push("    }".to_string());
    lines.join("\n")
}

/// Build subtests list from discovery, inheriting skip/reason from file level.
fn build_subtests(
    discovery: &SubtestDiscovery,
    file_skip: bool,
    file_reason: &str,
) -> Vec<(String, bool, String)> {
    let names: Vec<String> = match discovery {
        SubtestDiscovery::None => return Vec::new(),
        SubtestDiscovery::Block(blocks) => blocks.iter().map(|b| b.name.clone()).collect(),
        SubtestDiscovery::NodeTest(tests) => tests.iter().map(|t| t.name.clone()).collect(),
    };

    names
        .into_iter()
        .map(|name| {
            if file_skip {
                let reason = if file_reason.is_empty() {
                    "inherited".to_string()
                } else {
                    format!("inherited: {}", file_reason)
                };
                (name, true, reason)
            } else {
                (name, false, String::new())
            }
        })
        .collect()
}

/// Discover all `.js` test files from vendored suite directories.
/// Matches the approach used by the report generator in node_compat_report.rs.
fn discover_suite_files() -> BTreeSet<String> {
    let suites = ["parallel", "sequential", "es-module"];
    let mut files = BTreeSet::new();

    for suite in &suites {
        let suite_dir = format!("tests/node_compat/suite/{suite}");
        let suite_path = std::path::Path::new(&suite_dir);
        if !suite_path.exists() {
            eprintln!("Suite directory {suite_dir} not found, skipping");
            continue;
        }
        if let Ok(entries) = fs::read_dir(&suite_dir) {
            for entry in entries.flatten() {
                let name = entry.file_name().to_string_lossy().to_string();
                if name.ends_with(".js") {
                    files.insert(format!("{suite}/{name}"));
                }
            }
        }
    }

    files
}

#[test]
fn migrate_config_split() {
    let config_path = "tests/node_compat/config.jsonc";
    let content = fs::read_to_string(config_path).expect("Failed to read config.jsonc");
    let json_str = strip_jsonc_comments(&content);
    let config: Value = serde_json::from_str(&json_str).expect("Failed to parse config");

    let tests_obj = config
        .get("tests")
        .and_then(|v| v.as_object())
        .expect("config.jsonc missing 'tests' object");

    let existing_keys: BTreeSet<String> = tests_obj.keys().cloned().collect();

    // Discover all .js files from suite directories
    let all_suite_files = discover_suite_files();
    let new_files: Vec<String> = all_suite_files.difference(&existing_keys).cloned().collect();

    let mut modified_content = content.clone();
    let mut split_count = 0;
    let mut total_subtests = 0;
    let mut new_count = 0;
    let mut new_split_count = 0;

    // Phase 1: Split existing entries (text-level replacement to preserve comments)
    let mut split_updates: Vec<(String, String)> = Vec::new();

    for (test_path, opts) in tests_obj.iter() {
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
        let file_skip = opts.get("skip").and_then(|v| v.as_bool()).unwrap_or(false);
        let file_reason = opts.get("reason").and_then(|v| v.as_str()).unwrap_or("");

        let subtests = build_subtests(&discovery, file_skip, file_reason);
        if subtests.len() < 2 {
            continue;
        }

        let new_value = format_split_value(file_skip, file_reason, &subtests);
        split_updates.push((test_path.clone(), new_value));
        split_count += 1;
        total_subtests += subtests.len();
    }

    // Apply split updates in reverse order of position to preserve byte offsets
    let mut positioned_updates: Vec<(usize, usize, String)> = Vec::new();
    for (key, new_value) in &split_updates {
        if let Some((start, end)) = find_value_span(&modified_content, key) {
            positioned_updates.push((start, end, new_value.clone()));
        } else {
            eprintln!("WARNING: Could not find value span for key: {}", key);
        }
    }
    positioned_updates.sort_by(|a, b| b.0.cmp(&a.0)); // reverse order preserves offsets

    for (start, end, new_value) in positioned_updates {
        modified_content.replace_range(start..end, &new_value);
    }

    // Phase 2: Insert new entries before the closing '}' of the tests object
    if !new_files.is_empty() {
        let close_pos = find_tests_object_close(&modified_content)
            .expect("Could not find closing brace of tests object");

        // Split content at the tests object closing brace
        let prefix = &modified_content[..close_pos];
        let suffix = &modified_content[close_pos..]; // starts with '}'

        // Check if the last existing entry needs a trailing comma
        let trimmed_prefix = prefix.trim_end();
        let needs_comma = !trimmed_prefix.ends_with(',') && !trimmed_prefix.ends_with('{');

        let mut new_section = String::new();

        if needs_comma {
            // Insert comma right after the last entry value
            // We append it to trimmed_prefix and then re-add the whitespace
            new_section.push(',');
        }

        new_section.push_str("\n\n    // === newly discovered tests (not yet evaluated) ===");

        for test_path in &new_files {
            let suite_file = format!("tests/node_compat/suite/{}", test_path);
            let source = match fs::read_to_string(&suite_file) {
                Ok(s) => s,
                Err(_) => {
                    eprintln!("Skipping new file {}: could not read", test_path);
                    continue;
                }
            };

            let discovery = discover_subtests(test_path, &source);
            let subtests =
                build_subtests(&discovery, true, "newly discovered, not yet evaluated");

            if subtests.len() >= 2 {
                let value =
                    format_split_value(true, "newly discovered, not yet evaluated", &subtests);
                new_section.push_str(&format!("\n    \"{}\": {},", test_path, value));
                total_subtests += subtests.len();
                new_split_count += 1;
            } else {
                new_section.push_str(&format!(
                    "\n    \"{}\": {{ \"skip\": true, \"reason\": \"newly discovered, not yet evaluated\" }},",
                    test_path
                ));
            }
            new_count += 1;
        }

        // Remove trailing comma from the very last new entry
        if new_section.ends_with(',') {
            new_section.pop();
        }

        new_section.push_str("\n  "); // indentation before closing '}'

        // Reconstruct: trimmed prefix + new section + suffix
        modified_content = format!("{}{}{}", trimmed_prefix, new_section, suffix);
    }

    // Write back
    fs::write(config_path, &modified_content).expect("Failed to write config.jsonc");

    println!("Migration complete:");
    println!("  Existing files split: {}", split_count);
    println!(
        "  New files added: {} ({} with splits)",
        new_count, new_split_count
    );
    println!("  Total subtests discovered: {}", total_subtests);
    println!("  Config written to: {}", config_path);
}
