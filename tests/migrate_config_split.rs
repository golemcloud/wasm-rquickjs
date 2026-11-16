//! Re-synchronises `tests/node_compat/config.jsonc` with the vendored Node.js suite.
//!
//! Run it after re-vendoring with `cargo test --test migrate_config_split -- --exact migrate_config_split`.
//! The migration rewrites only entries whose subtests changed, keeps every metadata key of every
//! entry and surviving subtest, and adds vendored `.js`/`.mjs` tests that are not listed yet as
//! `unevaluated`. It never deletes an entry and never guesses a classification. It writes a
//! review report to `NODE_COMPAT_MIGRATION_REPORT` (default
//! `target/node-compat-migration-report.json`) and fails when an entry needs a manual mapping:
//! a configured file whose source is gone, a subtest that disappeared, or a split file that can
//! no longer be split and whose subtests had different metadata.
//!
//! When a split file's subtests changed, the previous vendored suite is required as
//! `NODE_COMPAT_MIGRATION_PREVIOUS_SUITE`: a subtest keeps the metadata of the previous subtest
//! with identical source, so an unchanged block that moved to another index (and therefore another
//! generated name such as `block_05_block_05`) keeps its own classification.
//!
//! The contract tests run against temporary fixtures:
//! `cargo test --test migrate_config_split -- ':tag:migration_contract'`.

test_r::enable!();

#[allow(dead_code)]
#[path = "common/mod.rs"]
mod common;

use crate::common::js_subtest_parser::{SubtestDiscovery, discover_subtests_with_options};
use crate::common::strip_jsonc_comments;
use anyhow::{anyhow, bail};
use serde_json::{Map, Value, json};
use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::path::Path;
use test_r::test;

const SUITES: [&str; 3] = ["parallel", "sequential", "es-module"];
const NEW_FILE_REASON: &str = "newly discovered, not yet evaluated";
const NEW_SUBTEST_REASON: &str = "newly discovered subtest, not yet evaluated";
/// Keys written first, in this order; any other key follows alphabetically, then `split` and
/// `subtests`.
const KEY_ORDER: [&str; 6] = [
    "category",
    "reason",
    "flaky",
    "timeout",
    "nestedNodeTest",
    "isolateBlockSubtests",
];

#[derive(Debug, Default, serde::Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
struct MigrationReport {
    /// Unsplit entries that are now split; their subtests inherit the file's metadata.
    split: Vec<String>,
    /// Split entries whose subtests changed.
    resplit: Vec<String>,
    /// Split entries that are now one test; their subtests carried identical metadata.
    unsplit: Vec<String>,
    /// Vendored tests that were not listed, added as `unevaluated`.
    added: Vec<String>,
    /// Subtests matched across an index shift by identical source (`"by": "source"`) or by their
    /// unchanged description (`"by": "description"`).
    renamed: Vec<Value>,
    /// Subtests with a generated name whose source changed; they keep the metadata of the
    /// previous subtest at the same position. Review them when that file's subtests have
    /// different classifications.
    matched_by_position: Vec<Value>,
    /// Subtests without a previous entry.
    new_subtests: Vec<Value>,
    /// Subtests that are gone, with their previous metadata. Needs a mapping.
    removed_subtests: Vec<Value>,
    /// Configured files whose vendored source is gone, left unchanged. Needs a mapping.
    missing_sources: Vec<Value>,
    /// Split files that can no longer be split, left unchanged. Needs a decision.
    needs_decision: Vec<Value>,
}

impl MigrationReport {
    fn needs_review(&self) -> usize {
        self.removed_subtests.len() + self.missing_sources.len() + self.needs_decision.len()
    }
}

struct Migration {
    content: String,
    report: MigrationReport,
}

/// A member key and the end-exclusive byte span of its value.
type Member = (String, (usize, usize));

/// Byte spans of the members of the top-level `"tests"` object.
struct TestsLayout {
    /// Member key to the span of its value, end-exclusive.
    values: BTreeMap<String, (usize, usize)>,
    /// Position of the closing `}` of the `"tests"` object.
    close: usize,
}

/// Strict JSONC scanner: every member is located by structure, never by searching text, so a
/// key quoted in a comment or reason cannot be mistaken for the entry.
struct Scanner<'a> {
    text: &'a str,
    pos: usize,
}

impl<'a> Scanner<'a> {
    fn bytes(&self) -> &'a [u8] {
        self.text.as_bytes()
    }

    fn peek(&self) -> Option<u8> {
        self.bytes().get(self.pos).copied()
    }

    fn skip_trivia(&mut self) -> anyhow::Result<()> {
        loop {
            match self.peek() {
                Some(c) if c.is_ascii_whitespace() => self.pos += 1,
                Some(b'/') if self.bytes().get(self.pos + 1) == Some(&b'/') => {
                    while self.peek().is_some_and(|c| c != b'\n') {
                        self.pos += 1;
                    }
                }
                Some(b'/') if self.bytes().get(self.pos + 1) == Some(&b'*') => {
                    let end = self.text[self.pos + 2..]
                        .find("*/")
                        .ok_or_else(|| anyhow!("unterminated block comment at {}", self.pos))?;
                    self.pos += 2 + end + 2;
                }
                _ => return Ok(()),
            }
        }
    }

    fn expect(&mut self, c: u8) -> anyhow::Result<()> {
        self.skip_trivia()?;
        if self.peek() != Some(c) {
            bail!("expected '{}' at byte {}", c as char, self.pos);
        }
        self.pos += 1;
        Ok(())
    }

    fn string(&mut self) -> anyhow::Result<String> {
        self.skip_trivia()?;
        let start = self.pos;
        if self.peek() != Some(b'"') {
            bail!("expected a string at byte {start}");
        }
        self.pos += 1;
        loop {
            match self.peek() {
                None => bail!("unterminated string at byte {start}"),
                Some(b'\\') => self.pos += 2,
                Some(b'"') => {
                    self.pos += 1;
                    return Ok(serde_json::from_str(&self.text[start..self.pos])?);
                }
                Some(_) => self.pos += 1,
            }
        }
    }

    /// Skips one value and returns its span.
    fn value(&mut self) -> anyhow::Result<(usize, usize)> {
        self.skip_trivia()?;
        let start = self.pos;
        match self.peek() {
            Some(b'"') => {
                self.string()?;
            }
            Some(open @ (b'{' | b'[')) => {
                let close = if open == b'{' { b'}' } else { b']' };
                self.pos += 1;
                self.skip_trivia()?;
                if self.peek() == Some(close) {
                    self.pos += 1;
                } else {
                    loop {
                        if open == b'{' {
                            self.string()?;
                            self.expect(b':')?;
                        }
                        self.value()?;
                        self.skip_trivia()?;
                        match self.peek() {
                            Some(b',') => {
                                self.pos += 1;
                                self.skip_trivia()?;
                                if self.peek() == Some(close) {
                                    self.pos += 1;
                                    break;
                                }
                            }
                            Some(c) if c == close => {
                                self.pos += 1;
                                break;
                            }
                            _ => bail!("malformed {} at byte {}", open as char, self.pos),
                        }
                    }
                }
            }
            Some(_) => {
                while self
                    .peek()
                    .is_some_and(|c| !matches!(c, b',' | b'}' | b']') && !c.is_ascii_whitespace())
                {
                    self.pos += 1;
                }
                if self.pos == start {
                    bail!("expected a value at byte {start}");
                }
            }
            None => bail!("unexpected end of input"),
        }
        Ok((start, self.pos))
    }

    /// Reads the members of the object starting here: key to value span, and the closing brace.
    fn members(&mut self) -> anyhow::Result<(Vec<Member>, usize)> {
        self.expect(b'{')?;
        let mut members = Vec::new();
        loop {
            self.skip_trivia()?;
            if self.peek() == Some(b'}') {
                let close = self.pos;
                self.pos += 1;
                return Ok((members, close));
            }
            let key = self.string()?;
            self.expect(b':')?;
            let span = self.value()?;
            members.push((key, span));
            self.skip_trivia()?;
            match self.peek() {
                Some(b',') => self.pos += 1,
                Some(b'}') => {}
                _ => bail!("expected ',' or '}}' at byte {}", self.pos),
            }
        }
    }
}

fn tests_layout(content: &str) -> anyhow::Result<TestsLayout> {
    let mut scanner = Scanner {
        text: content,
        pos: 0,
    };
    let (top, _) = scanner.members()?;
    let (_, (start, _)) = top
        .into_iter()
        .find(|(key, _)| key == "tests")
        .ok_or_else(|| anyhow!("config has no top-level \"tests\" object"))?;
    let mut scanner = Scanner {
        text: content,
        pos: start,
    };
    let (members, close) = scanner.members()?;
    let mut values = BTreeMap::new();
    for (key, span) in members {
        if values.insert(key.clone(), span).is_some() {
            bail!("duplicate node_compat config entry {key:?}");
        }
    }
    Ok(TestsLayout { values, close })
}

fn ordered_keys(map: &Map<String, Value>) -> Vec<&String> {
    let mut keys: Vec<&String> = KEY_ORDER
        .iter()
        .filter_map(|k| map.get_key_value(*k).map(|(k, _)| k))
        .collect();
    let mut rest: Vec<&String> = map
        .keys()
        .filter(|k| !KEY_ORDER.contains(&k.as_str()))
        .collect();
    rest.sort();
    keys.extend(rest);
    keys
}

fn format_inline(map: &Map<String, Value>) -> String {
    if map.is_empty() {
        return "{}".to_string();
    }
    let members: Vec<String> = ordered_keys(map)
        .into_iter()
        .map(|k| format!("{}: {}", json!(k), map[k]))
        .collect();
    format!("{{ {} }}", members.join(", "))
}

fn format_split(meta: &Map<String, Value>, subtests: &[(String, Value)]) -> String {
    let mut lines = vec!["{".to_string()];
    for k in ordered_keys(meta) {
        lines.push(format!("      {}: {},", json!(k), meta[k]));
    }
    lines.push("      \"split\": true,".to_string());
    lines.push("      \"subtests\": {".to_string());
    for (i, (name, value)) in subtests.iter().enumerate() {
        let comma = if i + 1 < subtests.len() { "," } else { "" };
        let value = value.as_object().cloned().unwrap_or_default();
        lines.push(format!(
            "        {}: {}{comma}",
            json!(name),
            format_inline(&value)
        ));
    }
    lines.push("      }".to_string());
    lines.push("    }".to_string());
    lines.join("\n")
}

/// Subtest names with their source text, whitespace-normalised.
fn discovered_subtests(discovery: &SubtestDiscovery, source: &str) -> Vec<(String, String)> {
    let text = |(start, end): (u32, u32)| {
        source[start as usize..end as usize]
            .split_whitespace()
            .collect::<Vec<_>>()
            .join(" ")
    };
    match discovery {
        SubtestDiscovery::None => Vec::new(),
        SubtestDiscovery::Block(blocks) => blocks
            .iter()
            .map(|b| (b.name.clone(), text(b.span)))
            .collect(),
        SubtestDiscovery::NodeTest(tests) => tests
            .iter()
            .map(|t| (t.name.clone(), text(t.span)))
            .collect(),
    }
}

/// The description part of a generated subtest name (`test_03_assert_throws` → `assert_throws`),
/// or `None` when the description is itself generated (`block_02_block_02`).
fn subtest_description(name: &str) -> Option<&str> {
    let (_, rest) = name.split_once('_')?;
    let (index, description) = rest.split_once('_')?;
    if !index.bytes().all(|b| b.is_ascii_digit()) {
        return None;
    }
    let generated = description.rsplit_once('_').is_some_and(|(word, digits)| {
        !digits.is_empty()
            && digits.bytes().all(|b| b.is_ascii_digit())
            && word.bytes().all(|b| b.is_ascii_lowercase())
    });
    (!generated).then_some(description)
}

/// The only name in `pool` with this description, if there is exactly one.
fn unique_by_description<'a>(pool: &[&'a String], description: &str) -> Option<&'a String> {
    let mut matches = pool
        .iter()
        .filter(|name| subtest_description(name) == Some(description));
    let first = matches.next().copied();
    if matches.next().is_some() {
        None
    } else {
        first
    }
}

fn is_listable_test(name: &str) -> bool {
    name.starts_with("test-") && (name.ends_with(".js") || name.ends_with(".mjs"))
}

fn discover_suite_files(suite_root: &Path) -> anyhow::Result<BTreeSet<String>> {
    let mut files = BTreeSet::new();
    for suite in SUITES {
        let dir = suite_root.join(suite);
        if !dir.is_dir() {
            continue;
        }
        for entry in fs::read_dir(&dir)? {
            let entry = entry?;
            let name = entry.file_name().to_string_lossy().to_string();
            if entry.file_type()?.is_file() && is_listable_test(&name) {
                files.insert(format!("{suite}/{name}"));
            }
        }
    }
    Ok(files)
}

fn bool_option(opts: &Map<String, Value>, key: &str) -> bool {
    opts.get(key).and_then(Value::as_bool).unwrap_or(false)
}

fn discover(path: &str, source: &str, opts: &Map<String, Value>) -> Vec<(String, String)> {
    discovered_subtests(
        &discover_subtests_with_options(
            path,
            source,
            bool_option(opts, "nestedNodeTest"),
            bool_option(opts, "isolateBlockSubtests"),
        ),
        source,
    )
}

/// Previous subtest name for each current subtest whose source is identical and unique on both
/// sides.
fn match_by_source<'a>(
    current: &'a [(String, String)],
    previous: &'a [(String, String)],
) -> BTreeMap<&'a str, &'a str> {
    let count = |subtests: &'a [(String, String)]| {
        let mut counts: BTreeMap<&str, usize> = BTreeMap::new();
        for (_, text) in subtests {
            *counts.entry(text.as_str()).or_default() += 1;
        }
        counts
    };
    let (current_counts, previous_counts) = (count(current), count(previous));
    current
        .iter()
        .filter(|(_, text)| {
            current_counts[text.as_str()] == 1 && previous_counts.get(text.as_str()) == Some(&1)
        })
        .map(|(name, text)| {
            let (old, _) = previous.iter().find(|(_, t)| t == text).unwrap();
            (name.as_str(), old.as_str())
        })
        .collect()
}

/// A new subtest inherits a file-level classification that keeps it out of the runner; in a
/// runnable file it starts as `unevaluated`, because it is not part of the historical baseline.
fn new_subtest_value(meta: &Map<String, Value>) -> Value {
    let inherits_excluded = meta
        .get("category")
        .and_then(Value::as_str)
        .is_some_and(|c| !matches!(c, "runnable" | "expected-pass"));
    if inherits_excluded {
        json!({})
    } else {
        json!({ "category": "unevaluated", "reason": NEW_SUBTEST_REASON })
    }
}

fn migrate(
    content: &str,
    suite_root: &Path,
    previous_suite: Option<&Path>,
) -> anyhow::Result<Migration> {
    let config: Value = serde_json::from_str(&strip_jsonc_comments(content))?;
    let tests = config
        .get("tests")
        .and_then(Value::as_object)
        .ok_or_else(|| anyhow!("config.jsonc missing 'tests' object"))?;
    let layout = tests_layout(content)?;
    let mut report = MigrationReport::default();
    let mut replacements: Vec<(usize, usize, String)> = Vec::new();

    for (path, opts) in tests {
        let opts = opts
            .as_object()
            .ok_or_else(|| anyhow!("entry {path:?} is not an object"))?;
        let source = match fs::read_to_string(suite_root.join(path)) {
            Ok(source) => source,
            Err(_) => {
                report
                    .missing_sources
                    .push(json!({ "file": path, "entry": opts }));
                continue;
            }
        };
        let discovered_subtests = discover(path, &source, opts);
        let names: Vec<String> = discovered_subtests.iter().map(|(n, _)| n.clone()).collect();
        let mut meta = opts.clone();
        meta.remove("split");
        let existing = meta
            .remove("subtests")
            .and_then(|v| v.as_object().cloned())
            .unwrap_or_default();

        let replacement = if !bool_option(opts, "split") {
            // An explicit `"split": false` keeps the file as one test.
            if names.len() < 2 || opts.contains_key("split") {
                continue;
            }
            report.split.push(path.clone());
            let subtests: Vec<(String, Value)> =
                names.into_iter().map(|name| (name, json!({}))).collect();
            format_split(&meta, &subtests)
        } else {
            let discovered: BTreeSet<&String> = names.iter().collect();
            let same_names = existing.keys().collect::<BTreeSet<_>>() == discovered;
            if same_names && names.len() >= 2 && previous_suite.is_none() {
                continue;
            }
            if names.len() < 2 {
                let mut values = existing.values();
                let first = values.next().cloned().unwrap_or_else(|| json!({}));
                if values.any(|v| *v != first) {
                    report.needs_decision.push(json!({
                        "file": path,
                        "problem": "no longer splits, but its subtests carried different metadata",
                        "entry": opts,
                    }));
                    continue;
                }
                for (k, v) in first.as_object().into_iter().flatten() {
                    meta.insert(k.clone(), v.clone());
                }
                report.unsplit.push(path.clone());
                format_inline(&meta)
            } else {
                let Some(previous_root) = previous_suite else {
                    bail!(
                        "the subtests of {path} changed; set NODE_COMPAT_MIGRATION_PREVIOUS_SUITE to the previously vendored suite so that moved subtests keep their own metadata"
                    );
                };
                let previous_source = fs::read_to_string(previous_root.join(path))
                    .map_err(|e| anyhow!("previous suite has no {path}: {e}"))?;
                let previous = discover(path, &previous_source, opts);
                let previous_text: BTreeMap<&str, &str> = previous
                    .iter()
                    .map(|(name, text)| (name.as_str(), text.as_str()))
                    .collect();
                // Where each subtest's metadata comes from: identical source first, then the same
                // name, then an unchanged description.
                let mut origin: BTreeMap<String, (String, &str)> = BTreeMap::new();
                for (name, old) in match_by_source(&discovered_subtests, &previous) {
                    if existing.contains_key(old) {
                        origin.insert(name.to_string(), (old.to_string(), "source"));
                    }
                }
                let mut consumed: BTreeSet<String> =
                    origin.values().map(|(old, _)| old.clone()).collect();
                for name in &names {
                    if !origin.contains_key(name)
                        && existing.contains_key(name)
                        && !consumed.contains(name)
                    {
                        origin.insert(name.clone(), (name.clone(), "name"));
                        consumed.insert(name.clone());
                    }
                }
                let unmatched_new: Vec<&String> =
                    names.iter().filter(|n| !origin.contains_key(*n)).collect();
                let unmatched_old: Vec<&String> =
                    existing.keys().filter(|n| !consumed.contains(*n)).collect();
                for name in &unmatched_new {
                    if let Some(description) = subtest_description(name)
                        && unique_by_description(&unmatched_new, description) == Some(*name)
                        && let Some(old) = unique_by_description(&unmatched_old, description)
                    {
                        origin.insert((*name).clone(), (old.clone(), "description"));
                        consumed.insert(old.clone());
                    }
                }
                if same_names && origin.iter().all(|(name, (old, _))| name == old) {
                    continue;
                }
                let current_text: BTreeMap<&str, &str> = discovered_subtests
                    .iter()
                    .map(|(name, text)| (name.as_str(), text.as_str()))
                    .collect();
                let mut subtests = Vec::new();
                for name in &names {
                    let value = match origin.get(name) {
                        Some((old, by)) if old != name => {
                            report
                                .renamed
                                .push(json!({ "file": path, "from": old, "to": name, "by": by }));
                            existing[old.as_str()].clone()
                        }
                        Some((old, _)) => {
                            if subtest_description(name).is_none()
                                && previous_text.get(name.as_str())
                                    != current_text.get(name.as_str())
                            {
                                report
                                    .matched_by_position
                                    .push(json!({ "file": path, "subtest": name }));
                            }
                            existing[old.as_str()].clone()
                        }
                        None => {
                            report
                                .new_subtests
                                .push(json!({ "file": path, "subtest": name }));
                            new_subtest_value(&meta)
                        }
                    };
                    subtests.push((name.clone(), value));
                }
                for old in existing.keys().filter(|old| !consumed.contains(*old)) {
                    report.removed_subtests.push(json!({
                        "file": path,
                        "subtest": old,
                        "fileEntry": meta,
                        "entry": existing[old.as_str()],
                    }));
                }
                report.resplit.push(path.clone());
                format_split(&meta, &subtests)
            }
        };
        let (start, end) = layout.values[path.as_str()];
        replacements.push((start, end, replacement));
    }

    let mut migrated = content.to_string();
    let added: Vec<String> = discover_suite_files(suite_root)?
        .into_iter()
        .filter(|path| !tests.contains_key(path))
        .collect();
    if !added.is_empty() {
        let mut section = String::new();
        let before = migrated[..layout.close].trim_end();
        if !before.ends_with(',') && !before.ends_with('{') {
            section.push(',');
        }
        section.push_str("\n\n    // === newly discovered tests (not yet evaluated) ===");
        let mut meta = Map::new();
        meta.insert("category".into(), json!("unevaluated"));
        meta.insert("reason".into(), json!(NEW_FILE_REASON));
        for (i, path) in added.iter().enumerate() {
            let source = fs::read_to_string(suite_root.join(path))?;
            let names = discover(path, &source, &Map::new());
            let value = if names.len() >= 2 {
                let subtests: Vec<(String, Value)> = names
                    .into_iter()
                    .map(|(name, _)| (name, json!({})))
                    .collect();
                format_split(&meta, &subtests)
            } else {
                format_inline(&meta)
            };
            let comma = if i + 1 < added.len() { "," } else { "" };
            section.push_str(&format!("\n    {}: {value}{comma}", json!(path)));
        }
        section.push_str("\n  ");
        let trimmed_end = before.len();
        replacements.push((trimmed_end, layout.close, section));
        report.added = added;
    }

    replacements.sort_by_key(|(start, _, _)| std::cmp::Reverse(*start));
    for (start, end, text) in replacements {
        migrated.replace_range(start..end, &text);
    }
    // The result must still be a valid config with the same top-level shape.
    tests_layout(&migrated)?;
    Ok(Migration {
        content: migrated,
        report,
    })
}

#[test]
fn migrate_config_split() -> anyhow::Result<()> {
    let config_path = "tests/node_compat/config.jsonc";
    let report_path = std::env::var("NODE_COMPAT_MIGRATION_REPORT")
        .unwrap_or_else(|_| "target/node-compat-migration-report.json".to_string());
    let previous_suite = std::env::var("NODE_COMPAT_MIGRATION_PREVIOUS_SUITE").ok();
    let content = fs::read_to_string(config_path)?;
    let Migration {
        content: migrated,
        report,
    } = migrate(
        &content,
        Path::new("tests/node_compat/suite"),
        previous_suite.as_deref().map(Path::new),
    )?;
    fs::write(config_path, migrated)?;
    if let Some(parent) = Path::new(&report_path).parent() {
        fs::create_dir_all(parent)?;
    }
    fs::write(&report_path, serde_json::to_string_pretty(&report)? + "\n")?;

    println!("Migration of {config_path}:");
    println!("  newly split: {}", report.split.len());
    println!("  re-split: {}", report.resplit.len());
    println!("  unsplit: {}", report.unsplit.len());
    println!("  added as unevaluated: {}", report.added.len());
    println!(
        "  subtests renamed by index shift: {}",
        report.renamed.len()
    );
    println!(
        "  changed generated-name subtests matched by position: {}",
        report.matched_by_position.len()
    );
    println!("  new subtests: {}", report.new_subtests.len());
    println!("  removed subtests: {}", report.removed_subtests.len());
    println!(
        "  configured files without source: {}",
        report.missing_sources.len()
    );
    println!(
        "  entries needing a decision: {}",
        report.needs_decision.len()
    );
    println!("  review report: {report_path}");
    if report.needs_review() > 0 {
        bail!(
            "{} config entries need a manual mapping; see {report_path}. Map each one to its replacement or record the target change; never by count alone",
            report.needs_review()
        );
    }
    Ok(())
}

#[cfg(test)]
mod contract {
    use super::*;
    use camino_tempfile::Utf8TempDir;
    use test_r::test;

    const TWO_TESTS: &str =
        "const test = require('node:test');\ntest('alpha', () => {});\ntest('beta', () => {});\n";

    struct Fixture {
        temp: Utf8TempDir,
        previous: Utf8TempDir,
    }

    impl Fixture {
        fn new() -> Self {
            Self {
                temp: Utf8TempDir::new().unwrap(),
                previous: Utf8TempDir::new().unwrap(),
            }
        }

        fn source(&self, path: &str, source: &str) -> &Self {
            let path = self.temp.path().join(path);
            fs::create_dir_all(path.parent().unwrap()).unwrap();
            fs::write(path, source).unwrap();
            self
        }

        /// The file as it was in the previously vendored suite.
        fn previous(&self, path: &str, source: &str) -> &Self {
            let path = self.previous.path().join(path);
            fs::create_dir_all(path.parent().unwrap()).unwrap();
            fs::write(path, source).unwrap();
            self
        }

        fn migrate(&self, tests: &str) -> Migration {
            let content = format!(
                "{{\n  \"nodeVersion\": \"22.14.0\",\n  // \"parallel/test-a.js\" is quoted here\n  \"tests\": {{\n{tests}\n  }}\n}}\n"
            );
            migrate(
                &content,
                self.temp.path().as_std_path(),
                Some(self.previous.path().as_std_path()),
            )
            .unwrap()
        }
    }

    fn entries(migration: &Migration) -> Map<String, Value> {
        let config: Value =
            serde_json::from_str(&strip_jsonc_comments(&migration.content)).unwrap();
        config["tests"].as_object().unwrap().clone()
    }

    fn node_tests(names: &[&str]) -> String {
        let mut source = "const test = require('node:test');\n".to_string();
        for name in names {
            source.push_str(&format!("test('{name}', () => {{}});\n"));
        }
        source
    }

    #[test]
    #[test_r::tag(migration_contract)]
    fn splitting_keeps_every_file_level_key() {
        let fixture = Fixture::new();
        fixture.source("parallel/test-a.js", TWO_TESTS);
        let migration = fixture.migrate(
            r#"    "parallel/test-a.js": { "category": "known-gap", "reason": "gap", "flaky": true, "timeout": 300, "custom": 1 }"#,
        );
        let entry = &entries(&migration)["parallel/test-a.js"];
        assert_eq!(
            *entry,
            json!({
                "category": "known-gap", "reason": "gap", "flaky": true, "timeout": 300,
                "custom": 1, "split": true,
                "subtests": { "test_00_alpha": {}, "test_01_beta": {} },
            })
        );
        assert_eq!(migration.report.split, ["parallel/test-a.js"]);
    }

    #[test]
    #[test_r::tag(migration_contract)]
    fn an_explicit_split_false_is_kept() {
        let fixture = Fixture::new();
        fixture.source("parallel/test-a.js", TWO_TESTS);
        let entry = r#"    "parallel/test-a.js": { "category": "runnable", "split": false }"#;
        let migration = fixture.migrate(entry);
        assert!(migration.content.contains(entry));
        assert_eq!(migration.report, MigrationReport::default());
    }

    #[test]
    #[test_r::tag(migration_contract)]
    fn resplitting_keeps_metadata_and_reports_changed_subtests() {
        let fixture = Fixture::new();
        // `alpha` stays, `beta` moves from index 1 to 2, `gone` disappears, `fresh` is new.
        fixture
            .source(
                "parallel/test-a.js",
                &node_tests(&["alpha", "fresh", "beta"]),
            )
            .previous(
                "parallel/test-a.js",
                &node_tests(&["alpha", "beta", "gone"]),
            );
        let migration = fixture.migrate(
            r#"    "parallel/test-a.js": {
      "timeout": 30,
      "isolateBlockSubtests": false,
      "split": true,
      "subtests": {
        "test_00_alpha": { "category": "known-gap", "reason": "a" },
        "test_01_beta": { "flaky": true },
        "test_02_gone": { "category": "runnable" }
      }
    }"#,
        );
        let entry = &entries(&migration)["parallel/test-a.js"];
        assert_eq!(
            *entry,
            json!({
                "timeout": 30, "isolateBlockSubtests": false, "split": true,
                "subtests": {
                    "test_00_alpha": { "category": "known-gap", "reason": "a" },
                    "test_01_fresh": { "category": "unevaluated", "reason": NEW_SUBTEST_REASON },
                    "test_02_beta": { "flaky": true },
                },
            })
        );
        let report = &migration.report;
        assert_eq!(
            report.renamed,
            [
                json!({ "file": "parallel/test-a.js", "from": "test_01_beta", "to": "test_02_beta", "by": "source" })
            ]
        );
        assert_eq!(report.removed_subtests.len(), 1);
        assert_eq!(report.removed_subtests[0]["subtest"], "test_02_gone");
        assert_eq!(report.removed_subtests[0]["entry"]["category"], "runnable");
        assert_eq!(report.needs_review(), 1);
    }

    #[test]
    #[test_r::tag(migration_contract)]
    fn moved_blocks_keep_their_own_metadata() {
        let fixture = Fixture::new();
        // A block inserted first shifts every generated name; a changed block keeps its position.
        fixture
            .previous(
                "parallel/test-a.js",
                "{ gap(); }\n{ passes(); }\n{ changed(1); }\n",
            )
            .source(
                "parallel/test-a.js",
                "{ inserted(); }\n{ gap(); }\n{ passes(); }\n{ changed(2); }\n",
            );
        let migration = fixture.migrate(
            r#"    "parallel/test-a.js": {
      "split": true,
      "subtests": {
        "block_00_block_00": { "category": "known-gap", "reason": "gap" },
        "block_01_block_01": { "category": "runnable" },
        "block_02_block_02": { "category": "node-internals" }
      }
    }"#,
        );
        assert_eq!(
            entries(&migration)["parallel/test-a.js"]["subtests"],
            json!({
                "block_00_block_00": { "category": "unevaluated", "reason": NEW_SUBTEST_REASON },
                "block_01_block_01": { "category": "known-gap", "reason": "gap" },
                "block_02_block_02": { "category": "runnable" },
                "block_03_block_03": { "category": "unevaluated", "reason": NEW_SUBTEST_REASON },
            })
        );
        let report = &migration.report;
        assert_eq!(report.renamed.len(), 2);
        assert!(report.renamed.iter().all(|r| r["by"] == "source"));
        // The changed block matches nothing, so its old entry needs a mapping.
        assert_eq!(report.removed_subtests.len(), 1);
        assert_eq!(report.removed_subtests[0]["subtest"], "block_02_block_02");
        assert_eq!(
            report.removed_subtests[0]["entry"]["category"],
            "node-internals"
        );
    }

    #[test]
    #[test_r::tag(migration_contract)]
    fn changed_subtests_require_the_previous_suite() {
        let fixture = Fixture::new();
        fixture.source(
            "parallel/test-a.js",
            &node_tests(&["alpha", "beta", "gamma"]),
        );
        let content = "{ \"nodeVersion\": \"22.14.0\", \"tests\": { \"parallel/test-a.js\": { \"split\": true, \"subtests\": { \"test_00_alpha\": {}, \"test_01_beta\": {} } } } }";
        let error = migrate(content, fixture.temp.path().as_std_path(), None)
            .err()
            .unwrap();
        assert!(
            error
                .to_string()
                .contains("NODE_COMPAT_MIGRATION_PREVIOUS_SUITE"),
            "{error:#}"
        );
    }

    #[test]
    #[test_r::tag(migration_contract)]
    fn new_subtests_inherit_an_excluded_file_category() {
        let fixture = Fixture::new();
        fixture
            .source(
                "parallel/test-a.js",
                &node_tests(&["alpha", "beta", "gamma"]),
            )
            .previous("parallel/test-a.js", &node_tests(&["alpha", "beta"]));
        let migration = fixture.migrate(
            r#"    "parallel/test-a.js": { "category": "wasi-impossible", "split": true, "subtests": { "test_00_alpha": {}, "test_01_beta": {} } }"#,
        );
        let entry = &entries(&migration)["parallel/test-a.js"];
        assert_eq!(entry["subtests"]["test_02_gamma"], json!({}));
        assert_eq!(entry["category"], "wasi-impossible");
    }

    #[test]
    #[test_r::tag(migration_contract)]
    fn unsplitting_requires_identical_subtest_metadata() {
        let fixture = Fixture::new();
        fixture
            .source("parallel/test-same.js", &node_tests(&["only"]))
            .source("parallel/test-mixed.js", &node_tests(&["only"]));
        let mixed = r#"    "parallel/test-mixed.js": { "split": true, "subtests": { "test_00_only": {}, "test_01_other": { "category": "known-gap" } } }"#;
        let migration = fixture.migrate(&format!(
            "{mixed},\n    \"parallel/test-same.js\": {{ \"reason\": \"r\", \"split\": true, \"subtests\": {{ \"test_00_a\": {{ \"category\": \"known-gap\" }}, \"test_01_b\": {{ \"category\": \"known-gap\" }} }} }}"
        ));
        let entries = entries(&migration);
        assert_eq!(
            entries["parallel/test-same.js"],
            json!({ "category": "known-gap", "reason": "r" })
        );
        assert!(
            migration.content.contains(mixed),
            "mixed entry must stay untouched"
        );
        assert_eq!(migration.report.needs_decision.len(), 1);
        assert_eq!(
            migration.report.needs_decision[0]["file"],
            "parallel/test-mixed.js"
        );
    }

    #[test]
    #[test_r::tag(migration_contract)]
    fn unlisted_js_and_mjs_tests_are_added_as_unevaluated() {
        let fixture = Fixture::new();
        fixture
            .source("parallel/test-a.js", "")
            .source("parallel/test-b.mjs", "import 'node:assert';\n")
            .source("es-module/test-c.mjs", &node_tests(&["one", "two"]))
            .source("parallel/helper.js", "")
            .source("parallel/test-notes.txt", "");
        let migration = fixture.migrate(r#"    "parallel/test-a.js": {}"#);
        let entries = entries(&migration);
        assert_eq!(
            migration.report.added,
            ["es-module/test-c.mjs", "parallel/test-b.mjs"]
        );
        assert_eq!(
            entries["parallel/test-b.mjs"],
            json!({ "category": "unevaluated", "reason": NEW_FILE_REASON })
        );
        assert_eq!(
            entries["es-module/test-c.mjs"],
            json!({
                "category": "unevaluated", "reason": NEW_FILE_REASON, "split": true,
                "subtests": { "test_00_one": {}, "test_01_two": {} },
            })
        );
        assert!(!entries.contains_key("parallel/helper.js"));
    }

    #[test]
    #[test_r::tag(migration_contract)]
    fn missing_sources_are_reported_and_kept() {
        let fixture = Fixture::new();
        let missing = r#"    "sequential/test-moved.js": { "category": "runnable" }"#;
        let migration = fixture.migrate(missing);
        assert!(migration.content.contains(missing));
        assert_eq!(migration.report.missing_sources.len(), 1);
        assert_eq!(
            migration.report.missing_sources[0]["file"],
            "sequential/test-moved.js"
        );
        assert_eq!(migration.report.needs_review(), 1);
    }

    #[test]
    #[test_r::tag(migration_contract)]
    fn a_second_run_changes_nothing() {
        let fixture = Fixture::new();
        fixture
            .source("parallel/test-a.js", TWO_TESTS)
            .source("parallel/test-b.mjs", "");
        let first = fixture.migrate(r#"    "parallel/test-a.js": { "category": "known-gap" }"#);
        let second = migrate(&first.content, fixture.temp.path().as_std_path(), None).unwrap();
        assert_eq!(second.content, first.content);
        assert_eq!(second.report, MigrationReport::default());
    }

    #[test]
    #[test_r::tag(migration_contract)]
    fn duplicate_entries_are_rejected() {
        let fixture = Fixture::new();
        let content = "{ \"nodeVersion\": \"22.14.0\", \"tests\": { \"parallel/test-a.js\": {}, \"parallel/test-a.js\": { \"category\": \"known-gap\" } } }";
        let error = migrate(content, fixture.temp.path().as_std_path(), None)
            .err()
            .unwrap();
        assert!(error.to_string().contains("duplicate"), "{error:#}");
    }
}
