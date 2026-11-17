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
//! A changed subtest with a generated name keeps the metadata of the previous subtest at its
//! position only as a proposal. The run fails until each one has an accepted decision in the file
//! named by `NODE_COMPAT_MIGRATION_DECISIONS`. A decision is bound to the previous and current
//! suite versions, to the parsed `tests` object of the input config, and to both versions of the
//! test file, and it records the previous metadata, which the migration recomputes and compares.
//! A decision that stops running a formerly runnable subtest, or that excludes a former known gap,
//! must state how that obligation is kept.
//!
//! The contract tests run against temporary fixtures:
//! `cargo test --test migrate_config_split -- ':tag:migration_contract'`.

test_r::enable!();

#[allow(dead_code)]
#[path = "common/mod.rs"]
mod common;

use crate::common::js_subtest_parser::{SubtestDiscovery, discover_subtests_with_options};
use crate::common::{NodeCompatCategory, node_compat_category_from_entry, strip_jsonc_comments};
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
    /// previous subtest at the same position unless a decision accepted another value.
    matched_by_position: Vec<Value>,
    /// The inputs a decision for these subtests is bound to (suite versions and the hash of the
    /// input `tests` object); set when `matched_by_position` is not empty.
    #[serde(skip_serializing_if = "Option::is_none")]
    position_inputs: Option<Value>,
    /// Subtests matched by position without an accepted decision, with the hashes and previous
    /// metadata a decision must record, and the problem of a rejected decision. Needs a decision.
    pending_position_decisions: Vec<Value>,
    /// Decisions that match no subtest matched by position. Needs a fix of the decisions file.
    unused_decisions: Vec<Value>,
    /// Accepted decisions that changed the classification of a formerly runnable or known-gap
    /// subtest, with the obligation that keeps it accounted for.
    obligations: Vec<Value>,
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
        self.removed_subtests.len()
            + self.missing_sources.len()
            + self.needs_decision.len()
            + self.pending_position_decisions.len()
            + self.unused_decisions.len()
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

/// Keys of a positional decision.
const DECISION_KEYS: [&str; 11] = [
    "file",
    "subtest",
    "previousBlake3",
    "currentBlake3",
    "previous",
    "entry",
    "assertions",
    "note",
    "obligation",
    "movedTo",
    "evidence",
];
/// What a decision says about the assertions of the previous subtest.
const ASSERTIONS: [&str; 4] = ["kept", "changed", "moved", "none"];
/// How a decision keeps a formerly runnable or known-gap subtest accounted for.
const OBLIGATIONS: [&str; 3] = ["baseline-gap", "moved", "target-change"];

/// Accepted mapping decisions for subtests matched by position, by file and subtest.
type Decisions = BTreeMap<(String, String), Map<String, Value>>;
/// Accepted decisions that moved their assertions, with the `movedTo` targets.
type Moves = Vec<((String, String), Vec<String>)>;

fn blake3_hex(bytes: &[u8]) -> String {
    blake3::hash(bytes).to_hex().to_string()
}

/// The hash a decisions file binds the input config to: the parsed `tests` object, so that
/// comments and `nodeVersion` do not matter but every entry does.
fn tests_digest(tests: &Map<String, Value>) -> String {
    blake3_hex(Value::Object(tests.clone()).to_string().as_bytes())
}

fn suite_version(root: &Path) -> anyhow::Result<String> {
    let version = fs::read_to_string(root.join("NODE_VERSION"))
        .map_err(|e| anyhow!("{} has no NODE_VERSION: {e}", root.display()))?;
    Ok(version.trim().to_string())
}

fn category_name(category: NodeCompatCategory) -> &'static str {
    match category {
        NodeCompatCategory::Runnable => "runnable",
        NodeCompatCategory::KnownGap => "known-gap",
        NodeCompatCategory::WasmImpossible => "wasi-impossible",
        NodeCompatCategory::EngineDifference => "engine-difference",
        NodeCompatCategory::NodeInternals => "node-internals",
        NodeCompatCategory::Unevaluated => "unevaluated",
    }
}

/// The category, reason and flaky flag the harness gives a subtest of `file` in `suite_root`.
fn effective(
    path: &str,
    file: &Map<String, Value>,
    subtest: &Value,
    suite_root: &Path,
) -> anyhow::Result<(NodeCompatCategory, Value)> {
    let file_category =
        node_compat_category_from_entry(path, &Value::Object(file.clone()), None, suite_root)?;
    let category = node_compat_category_from_entry(path, subtest, Some(file_category), suite_root)?;
    let reason = subtest
        .get("reason")
        .and_then(Value::as_str)
        .or_else(|| file.get("reason").and_then(Value::as_str));
    let flaky = subtest
        .get("flaky")
        .and_then(Value::as_bool)
        .unwrap_or(file.get("flaky").and_then(Value::as_bool).unwrap_or(false));
    Ok((
        category,
        json!({ "category": category_name(category), "reason": reason, "flaky": flaky }),
    ))
}

/// Reads a decisions file and rejects it unless it is for these suite versions and this input
/// config, and every row is well formed and unique.
fn load_decisions(
    text: &str,
    previous_root: &Path,
    suite_root: &Path,
    tests_hash: &str,
) -> anyhow::Result<Decisions> {
    let record: Value = serde_json::from_str(text)?;
    let (from, to) = (suite_version(previous_root)?, suite_version(suite_root)?);
    if record["from"] != json!(from) || record["to"] != json!(to) {
        bail!(
            "the decisions are for {} -> {}, but the suites are {from} -> {to}",
            record["from"],
            record["to"]
        );
    }
    let bound = &record["previousConfig"]["testsBlake3"];
    if *bound != json!(tests_hash) {
        bail!(
            "the decisions are bound to an input config whose tests hash to {bound}, but this config's tests hash to {tests_hash:?}; restore the config named by previousConfig.revision instead of applying them to another config"
        );
    }
    let rows = record["positionDecisions"]
        .as_array()
        .ok_or_else(|| anyhow!("the decisions lack a positionDecisions array"))?;
    let mut decisions = Decisions::new();
    for row in rows {
        let row = row
            .as_object()
            .ok_or_else(|| anyhow!("decision {row} is not an object"))?;
        if let Some(key) = row.keys().find(|k| !DECISION_KEYS.contains(&k.as_str())) {
            bail!("decision {row:?} has an unknown key {key:?}");
        }
        let text = |key: &str| {
            row.get(key)
                .and_then(Value::as_str)
                .filter(|s| !s.trim().is_empty())
        };
        let (Some(file), Some(subtest)) = (text("file"), text("subtest")) else {
            bail!("decision {row:?} needs a file and a subtest");
        };
        let at = format!("{file}#{subtest}");
        for key in ["previousBlake3", "currentBlake3", "note"] {
            if text(key).is_none() {
                bail!("the decision for {at} needs a non-empty {key}");
            }
        }
        if !row.get("previous").is_some_and(Value::is_object)
            || !row.get("entry").is_some_and(Value::is_object)
        {
            bail!("the decision for {at} needs previous and entry objects");
        }
        let assertions = text("assertions").filter(|a| ASSERTIONS.contains(a));
        if assertions.is_none() {
            bail!("the decision for {at} needs assertions, one of {ASSERTIONS:?}");
        }
        let obligation =
            match row.get("obligation") {
                None => None,
                Some(o) => Some(o.as_str().filter(|o| OBLIGATIONS.contains(o)).ok_or_else(
                    || {
                        anyhow!(
                            "the decision for {at} has an obligation other than {OBLIGATIONS:?}"
                        )
                    },
                )?),
            };
        let moved = assertions == Some("moved") || obligation == Some("moved");
        match row.get("movedTo") {
            None if moved => bail!("the decision for {at} moves its assertions but has no movedTo"),
            Some(_) if !moved => bail!("the decision for {at} has movedTo without moving"),
            Some(targets)
                if !targets.as_array().is_some_and(|t| {
                    !t.is_empty() && t.iter().all(|t| t.as_str().is_some_and(|t| !t.is_empty()))
                }) =>
            {
                bail!("the movedTo of the decision for {at} must list file or file#subtest targets")
            }
            _ => {}
        }
        let target_change = obligation == Some("target-change");
        if target_change && text("evidence").is_none() {
            bail!("the target-change decision for {at} needs non-empty evidence");
        }
        if !target_change && row.contains_key("evidence") {
            bail!("the decision for {at} has evidence without a target-change obligation");
        }
        if decisions
            .insert((file.to_string(), subtest.to_string()), row.clone())
            .is_some()
        {
            bail!("duplicate decision for {at}");
        }
    }
    Ok(decisions)
}

/// Checks a decision against the subtest it maps. `Ok(Err(problem))` rejects the decision; on
/// acceptance it returns the entry to write and, when the decision changes the classification of
/// a formerly runnable or known-gap subtest, the obligation to report.
fn check_decision(
    decision: &Map<String, Value>,
    pending: &Value,
    meta: &Map<String, Value>,
    suite_root: &Path,
) -> anyhow::Result<Result<(Value, Option<Value>), String>> {
    for key in ["previousBlake3", "currentBlake3"] {
        if decision[key] != pending[key] {
            return Ok(Err(format!(
                "stale: {key} {} differs from the vendored file's {}",
                decision[key], pending[key]
            )));
        }
    }
    if decision["previous"] != pending["previous"] {
        return Ok(Err(format!(
            "previousMismatch: the recorded previous metadata {} differs from the input config's {}",
            decision["previous"], pending["previous"]
        )));
    }
    let path = pending["file"].as_str().unwrap_or_default();
    let entry = decision["entry"].clone();
    let (now, now_effective) = match effective(path, meta, &entry, suite_root) {
        Ok(resolved) => resolved,
        Err(e) => return Ok(Err(format!("invalidEntry: {e}"))),
    };
    let before = NodeCompatCategory::from_config_value(
        pending["previous"]["effective"]["category"]
            .as_str()
            .unwrap_or_default(),
    )?;
    let obligation = decision.get("obligation").and_then(Value::as_str);
    let needed = (before == NodeCompatCategory::Runnable && now != NodeCompatCategory::Runnable)
        || (before == NodeCompatCategory::KnownGap && !now.is_primary_surface());
    if needed && obligation.is_none() {
        return Ok(Err(format!(
            "obligationViolation: the formerly {} subtest becomes {}; an obligation (baseline-gap, moved or target-change) must keep it accounted for",
            category_name(before),
            category_name(now)
        )));
    }
    if obligation == Some("baseline-gap")
        && (before != NodeCompatCategory::Runnable
            || now != NodeCompatCategory::KnownGap
            || now_effective["reason"]
                .as_str()
                .is_none_or(|r| r.trim().is_empty()))
    {
        return Ok(Err(
            "obligationViolation: a baseline-gap obligation needs a formerly runnable subtest that becomes a known gap with a reason"
                .to_string(),
        ));
    }
    let reported = (before.is_primary_surface() && now != before).then(|| {
        json!({
            "file": path,
            "subtest": pending["subtest"],
            "previous": category_name(before),
            "entry": category_name(now),
            "obligation": obligation,
            "movedTo": decision.get("movedTo"),
            "evidence": decision.get("evidence"),
        })
    });
    Ok(Ok((entry, reported)))
}

/// The category the migrated config gives a `file` or `file#subtest` target.
fn target_category(
    tests: &Map<String, Value>,
    target: &str,
    suite_root: &Path,
) -> Result<NodeCompatCategory, String> {
    let (file, subtest) = match target.split_once('#') {
        Some((file, subtest)) => (file, Some(subtest)),
        None => (target, None),
    };
    let entry = tests
        .get(file)
        .and_then(Value::as_object)
        .ok_or_else(|| format!("movedTo target {target} is not in the migrated config"))?;
    let resolved = match subtest {
        None => {
            node_compat_category_from_entry(file, &Value::Object(entry.clone()), None, suite_root)
        }
        Some(subtest) => {
            let value = entry
                .get("subtests")
                .and_then(|s| s.get(subtest))
                .ok_or_else(|| format!("movedTo target {target} is not in the migrated config"))?;
            effective(file, entry, value, suite_root).map(|(category, _)| category)
        }
    };
    resolved.map_err(|e| format!("movedTo target {target}: {e}"))
}

fn migrate(
    content: &str,
    suite_root: &Path,
    previous_suite: Option<&Path>,
    decisions: Option<&str>,
) -> anyhow::Result<Migration> {
    let config: Value = serde_json::from_str(&strip_jsonc_comments(content))?;
    let tests = config
        .get("tests")
        .and_then(Value::as_object)
        .ok_or_else(|| anyhow!("config.jsonc missing 'tests' object"))?;
    let decisions = match (decisions, previous_suite) {
        (None, _) => None,
        (Some(_), None) => bail!("mapping decisions need NODE_COMPAT_MIGRATION_PREVIOUS_SUITE"),
        (Some(text), Some(previous_root)) => Some(load_decisions(
            text,
            previous_root,
            suite_root,
            &tests_digest(tests),
        )?),
    };
    // A decision whose movedTo targets do not keep its assertions running is rejected, which can
    // in turn invalidate a decision that moved its assertions to that subtest.
    let mut rejected: BTreeMap<(String, String), String> = BTreeMap::new();
    loop {
        let (migration, moves) = migrate_once(
            content,
            tests,
            suite_root,
            previous_suite,
            decisions.as_ref(),
            &rejected,
        )?;
        let migrated: Value = serde_json::from_str(&strip_jsonc_comments(&migration.content))?;
        let migrated_tests = migrated["tests"].as_object().cloned().unwrap_or_default();
        let baseline_gaps: BTreeSet<String> = migration
            .report
            .obligations
            .iter()
            .filter(|o| o["obligation"] == "baseline-gap")
            .map(|o| {
                format!(
                    "{}#{}",
                    o["file"].as_str().unwrap_or_default(),
                    o["subtest"].as_str().unwrap_or_default()
                )
            })
            .collect();
        let mut newly = BTreeMap::new();
        for (key, targets) in moves {
            let problem = targets.iter().find_map(|target| {
                match target_category(&migrated_tests, target, suite_root) {
                    Ok(NodeCompatCategory::Runnable) => None,
                    Ok(_) if baseline_gaps.contains(target) => None,
                    Ok(category) => Some(format!(
                        "obligationViolation: movedTo target {target} is {}, neither runnable nor a baseline gap",
                        category_name(category)
                    )),
                    Err(problem) => Some(format!("obligationViolation: {problem}")),
                }
            });
            if let Some(problem) = problem {
                newly.insert(key, problem);
            }
        }
        if newly.is_empty() {
            return Ok(migration);
        }
        rejected.extend(newly);
    }
}

/// One migration pass; decisions in `rejected` are reported as pending with their problem.
/// Returns the accepted decisions whose assertions moved, with their targets.
fn migrate_once(
    content: &str,
    tests: &Map<String, Value>,
    suite_root: &Path,
    previous_suite: Option<&Path>,
    decisions: Option<&Decisions>,
    rejected: &BTreeMap<(String, String), String>,
) -> anyhow::Result<(Migration, Moves)> {
    let layout = tests_layout(content)?;
    let mut report = MigrationReport::default();
    let mut replacements: Vec<(usize, usize, String)> = Vec::new();
    let mut used: BTreeSet<(String, String)> = BTreeSet::new();
    let mut moves = Vec::new();

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
                let current_text: BTreeMap<&str, &str> = discovered_subtests
                    .iter()
                    .map(|(name, text)| (name.as_str(), text.as_str()))
                    .collect();
                // A generated name kept by position whose source changed is audited even when
                // the entry itself needs no rewrite, and keeps its previous metadata only until
                // a decision accepts it or another value.
                let mut decided: BTreeMap<&String, Value> = BTreeMap::new();
                for name in &names {
                    if origin.get(name).is_some_and(|(old, _)| old == name)
                        && subtest_description(name).is_none()
                        && previous_text.get(name.as_str()) != current_text.get(name.as_str())
                    {
                        report
                            .matched_by_position
                            .push(json!({ "file": path, "subtest": name }));
                        let raw = &existing[name.as_str()];
                        let (_, previous_effective) = effective(path, &meta, raw, previous_root)?;
                        let mut pending = json!({
                            "file": path,
                            "subtest": name,
                            "previousBlake3": blake3_hex(previous_source.as_bytes()),
                            "currentBlake3": blake3_hex(source.as_bytes()),
                            "previous": {
                                "raw": raw,
                                "fileEntry": meta,
                                "effective": previous_effective,
                            },
                        });
                        let key = (path.clone(), name.clone());
                        let Some(decision) = decisions.and_then(|d| d.get(&key)) else {
                            report.pending_position_decisions.push(pending);
                            continue;
                        };
                        used.insert(key.clone());
                        let checked = match rejected.get(&key) {
                            Some(problem) => Err(problem.clone()),
                            None => check_decision(decision, &pending, &meta, suite_root)?,
                        };
                        match checked {
                            Ok((entry, obligation)) => {
                                if let Some(targets) = decision.get("movedTo") {
                                    let targets = targets
                                        .as_array()
                                        .into_iter()
                                        .flatten()
                                        .filter_map(Value::as_str)
                                        .map(str::to_string)
                                        .collect();
                                    moves.push((key, targets));
                                }
                                report.obligations.extend(obligation);
                                decided.insert(name, entry);
                            }
                            Err(problem) => {
                                pending["problem"] = json!(problem);
                                report.pending_position_decisions.push(pending);
                            }
                        }
                    }
                }
                let unchanged = decided
                    .iter()
                    .all(|(name, entry)| existing[name.as_str()] == *entry);
                if same_names && unchanged && origin.iter().all(|(name, (old, _))| name == old) {
                    continue;
                }
                let mut subtests = Vec::new();
                for name in &names {
                    let value = match origin.get(name) {
                        Some((old, by)) if old != name => {
                            report
                                .renamed
                                .push(json!({ "file": path, "from": old, "to": name, "by": by }));
                            existing[old.as_str()].clone()
                        }
                        Some((old, _)) => decided
                            .get(name)
                            .cloned()
                            .unwrap_or_else(|| existing[old.as_str()].clone()),
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
    for (file, subtest) in decisions.into_iter().flat_map(BTreeMap::keys) {
        if !used.contains(&(file.clone(), subtest.clone())) {
            report.unused_decisions.push(json!({
                "file": file,
                "subtest": subtest,
                "problem": "no changed subtest with a generated name is matched by position here",
            }));
        }
    }
    if !report.matched_by_position.is_empty() {
        report.position_inputs = Some(json!({
            "from": previous_suite.and_then(|root| suite_version(root).ok()),
            "to": suite_version(suite_root).ok(),
            "testsBlake3": tests_digest(tests),
        }));
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
    Ok((
        Migration {
            content: migrated,
            report,
        },
        moves,
    ))
}

#[test]
fn migrate_config_split() -> anyhow::Result<()> {
    let config_path = "tests/node_compat/config.jsonc";
    let report_path = std::env::var("NODE_COMPAT_MIGRATION_REPORT")
        .unwrap_or_else(|_| "target/node-compat-migration-report.json".to_string());
    let previous_suite = std::env::var("NODE_COMPAT_MIGRATION_PREVIOUS_SUITE").ok();
    let decisions = std::env::var("NODE_COMPAT_MIGRATION_DECISIONS")
        .ok()
        .map(|path| fs::read_to_string(&path).map_err(|e| anyhow!("cannot read {path}: {e}")))
        .transpose()?;
    let content = fs::read_to_string(config_path)?;
    let Migration {
        content: migrated,
        report,
    } = migrate(
        &content,
        Path::new("tests/node_compat/suite"),
        previous_suite.as_deref().map(Path::new),
        decisions.as_deref(),
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
    println!(
        "  of which pending a decision: {}",
        report.pending_position_decisions.len()
    );
    println!("  unused decisions: {}", report.unused_decisions.len());
    println!(
        "  accepted classification changes: {}",
        report.obligations.len()
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
            let fixture = Self {
                temp: Utf8TempDir::new().unwrap(),
                previous: Utf8TempDir::new().unwrap(),
            };
            fs::write(fixture.temp.path().join("NODE_VERSION"), "26.13.1\n").unwrap();
            fs::write(fixture.previous.path().join("NODE_VERSION"), "22.14.0\n").unwrap();
            fixture
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
            self.migrate_with(&config(tests), None).unwrap()
        }

        fn migrate_with(
            &self,
            content: &str,
            decisions: Option<&Value>,
        ) -> anyhow::Result<Migration> {
            migrate(
                content,
                self.temp.path().as_std_path(),
                Some(self.previous.path().as_std_path()),
                decisions.map(Value::to_string).as_deref(),
            )
        }
    }

    fn config(tests: &str) -> String {
        format!(
            "{{\n  \"nodeVersion\": \"22.14.0\",\n  // \"parallel/test-a.js\" is quoted here\n  \"tests\": {{\n{tests}\n  }}\n}}\n"
        )
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
    fn changed_blocks_with_unchanged_names_are_reported() {
        let fixture = Fixture::new();
        fixture
            .previous("parallel/test-a.js", "{ passes(1); }\n{ gap(); }\n")
            .source("parallel/test-a.js", "{ passes(2); }\n{ gap(); }\n");
        let tests = r#"    "parallel/test-a.js": {
      "split": true,
      "subtests": {
        "block_00_block_00": { "category": "runnable" },
        "block_01_block_01": { "category": "known-gap", "reason": "gap" }
      }
    }"#;
        let migration = fixture.migrate(tests);
        assert!(migration.content.contains(tests));
        let parsed: Value = serde_json::from_str(&format!("{{{tests}}}")).unwrap();
        assert_eq!(
            migration.report,
            MigrationReport {
                matched_by_position: vec![
                    json!({ "file": "parallel/test-a.js", "subtest": "block_00_block_00" })
                ],
                position_inputs: Some(json!({
                    "from": "22.14.0",
                    "to": "26.13.1",
                    "testsBlake3": blake3::hash(parsed.to_string().as_bytes()).to_hex().to_string(),
                })),
                pending_position_decisions: vec![json!({
                    "file": "parallel/test-a.js",
                    "subtest": "block_00_block_00",
                    "previousBlake3": blake3::hash(b"{ passes(1); }\n{ gap(); }\n").to_hex().to_string(),
                    "currentBlake3": blake3::hash(b"{ passes(2); }\n{ gap(); }\n").to_hex().to_string(),
                    "previous": {
                        "raw": { "category": "runnable" },
                        "fileEntry": {},
                        "effective": { "category": "runnable", "reason": null, "flaky": false },
                    },
                })],
                ..MigrationReport::default()
            }
        );
        assert_eq!(migration.report.needs_review(), 1);
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
        let error = migrate(content, fixture.temp.path().as_std_path(), None, None)
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
        let second = migrate(
            &first.content,
            fixture.temp.path().as_std_path(),
            None,
            None,
        )
        .unwrap();
        assert_eq!(second.content, first.content);
        assert_eq!(second.report, MigrationReport::default());
    }

    #[test]
    #[test_r::tag(migration_contract)]
    fn duplicate_entries_are_rejected() {
        let fixture = Fixture::new();
        let content = "{ \"nodeVersion\": \"22.14.0\", \"tests\": { \"parallel/test-a.js\": {}, \"parallel/test-a.js\": { \"category\": \"known-gap\" } } }";
        let error = migrate(content, fixture.temp.path().as_std_path(), None, None)
            .err()
            .unwrap();
        assert!(error.to_string().contains("duplicate"), "{error:#}");
    }

    // The next four cases use only the interface of the migration before decisions existed, so
    // they also show what it got wrong: a changed block was silently accepted by position.

    #[test]
    #[test_r::tag(migration_contract)]
    fn a_changed_runnable_block_needs_a_decision() {
        let fixture = Fixture::new();
        fixture
            .previous("parallel/test-a.js", "{ passes(1); }\n{ gap(); }\n")
            .source("parallel/test-a.js", "{ passes(2); }\n{ gap(); }\n");
        let tests = r#"    "parallel/test-a.js": { "split": true, "subtests": { "block_00_block_00": {}, "block_01_block_01": { "category": "known-gap", "reason": "gap" } } }"#;
        let migration = fixture.migrate(tests);
        assert!(migration.content.contains(tests));
        assert_eq!(migration.report.needs_review(), 1);
    }

    #[test]
    #[test_r::tag(migration_contract)]
    fn a_changed_excluded_block_needs_a_decision() {
        let fixture = Fixture::new();
        fixture
            .previous("parallel/test-a.js", "{ internals(1); }\n{ passes(); }\n")
            .source("parallel/test-a.js", "{ internals(2); }\n{ passes(); }\n");
        let tests = r#"    "parallel/test-a.js": { "split": true, "subtests": { "block_00_block_00": { "category": "node-internals", "reason": "internal" }, "block_01_block_01": {} } }"#;
        let migration = fixture.migrate(tests);
        assert!(migration.content.contains(tests));
        assert_eq!(migration.report.needs_review(), 1);
    }

    #[test]
    #[test_r::tag(migration_contract)]
    fn a_changed_block_with_an_unchanged_entry_but_new_internals_needs_a_decision() {
        let fixture = Fixture::new();
        fixture
            .previous("parallel/test-a.js", "{ passes(1); }\n{ passes(); }\n")
            .source(
                "parallel/test-a.js",
                "{ passes(2); internalBinding('x'); }\n{ passes(); }\n",
            );
        let tests = r#"    "parallel/test-a.js": { "split": true, "subtests": { "block_00_block_00": {}, "block_01_block_01": {} } }"#;
        let migration = fixture.migrate(tests);
        assert!(migration.content.contains(tests));
        assert_eq!(migration.report.needs_review(), 1);
    }

    #[test]
    #[test_r::tag(migration_contract)]
    fn a_block_moved_with_identical_source_needs_no_decision() {
        let fixture = Fixture::new();
        fixture
            .previous("parallel/test-a.js", "{ gap(); }\n{ passes(); }\n")
            .source(
                "parallel/test-a.js",
                "{ added(); }\n{ gap(); }\n{ passes(); }\n",
            );
        let migration = fixture.migrate(
            r#"    "parallel/test-a.js": { "split": true, "subtests": { "block_00_block_00": { "category": "known-gap", "reason": "gap" }, "block_01_block_01": {} } }"#,
        );
        let subtests = &entries(&migration)["parallel/test-a.js"]["subtests"];
        assert_eq!(
            subtests["block_01_block_01"],
            json!({ "category": "known-gap", "reason": "gap" })
        );
        assert_eq!(subtests["block_02_block_02"], json!({}));
        assert_eq!(migration.report.needs_review(), 0);
    }

    /// Three blocks: the first two change, the third does not.
    const PREVIOUS_BLOCKS: &str = "{ one(1); }\n{ two(1); }\n{ three(); }\n";
    const CURRENT_BLOCKS: &str = "{ one(2); }\n{ two(2); }\n{ three(); }\n";

    fn blocks(first: &str, second: &str, third: &str) -> String {
        format!(
            "    \"parallel/test-a.js\": {{ \"split\": true, \"subtests\": {{ \"block_00_block_00\": {first}, \"block_01_block_01\": {second}, \"block_02_block_02\": {third} }} }}"
        )
    }

    fn pending<'a>(migration: &'a Migration, subtest: &str) -> &'a Value {
        migration
            .report
            .pending_position_decisions
            .iter()
            .find(|row| row["subtest"] == subtest)
            .unwrap_or_else(|| panic!("{subtest} is not pending: {:#?}", migration.report))
    }

    /// A decision built from the pending row of `subtest`, with `extra` keys.
    fn decision(proposal: &Migration, subtest: &str, entry: Value, extra: Value) -> Value {
        let row = pending(proposal, subtest);
        let mut decision = json!({
            "file": row["file"],
            "subtest": subtest,
            "previousBlake3": row["previousBlake3"],
            "currentBlake3": row["currentBlake3"],
            "previous": row["previous"],
            "entry": entry,
            "assertions": "kept",
            "note": "reviewed against both versions",
        });
        for (key, value) in extra.as_object().unwrap() {
            decision[key] = value.clone();
        }
        decision
    }

    fn record(proposal: &Migration, rows: Vec<Value>) -> Value {
        let inputs = proposal.report.position_inputs.as_ref().unwrap();
        json!({
            "from": inputs["from"],
            "to": inputs["to"],
            "previousConfig": {
                "revision": "fixture",
                "path": "tests/node_compat/config.jsonc",
                "testsBlake3": inputs["testsBlake3"],
            },
            "positionDecisions": rows,
        })
    }

    fn blocks_fixture() -> Fixture {
        let fixture = Fixture::new();
        fixture
            .previous("parallel/test-a.js", PREVIOUS_BLOCKS)
            .source("parallel/test-a.js", CURRENT_BLOCKS);
        fixture
    }

    #[test]
    #[test_r::tag(migration_contract)]
    fn accepted_decisions_replace_the_positional_proposal() {
        let fixture = blocks_fixture();
        let input = config(&blocks("{}", "{}", "{}"));
        let proposal = fixture.migrate_with(&input, None).unwrap();
        let gap = json!({ "category": "known-gap", "reason": "the new assertion needs X" });
        let decisions = record(
            &proposal,
            vec![
                decision(
                    &proposal,
                    "block_00_block_00",
                    json!({}),
                    json!({ "assertions": "none" }),
                ),
                decision(
                    &proposal,
                    "block_01_block_01",
                    gap.clone(),
                    json!({ "assertions": "changed", "obligation": "baseline-gap" }),
                ),
            ],
        );
        let migration = fixture.migrate_with(&input, Some(&decisions)).unwrap();
        let subtests = &entries(&migration)["parallel/test-a.js"]["subtests"];
        assert_eq!(subtests["block_00_block_00"], json!({}));
        assert_eq!(subtests["block_01_block_01"], gap);
        assert_eq!(subtests["block_02_block_02"], json!({}));
        // The audit list stays complete; only the decisions are settled.
        assert_eq!(migration.report.matched_by_position.len(), 2);
        assert_eq!(
            migration.report.obligations,
            [json!({
                "file": "parallel/test-a.js",
                "subtest": "block_01_block_01",
                "previous": "runnable",
                "entry": "known-gap",
                "obligation": "baseline-gap",
                "movedTo": null,
                "evidence": null,
            })]
        );
        assert_eq!(migration.report.needs_review(), 0);
        // The same decisions on the same input give the same result.
        let again = fixture.migrate_with(&input, Some(&decisions)).unwrap();
        assert_eq!(again.content, migration.content);
        assert_eq!(again.report, migration.report);
        // They are bound to the input config, so they do not apply to the migrated one.
        let error = fixture
            .migrate_with(&migration.content, Some(&decisions))
            .err()
            .unwrap();
        assert!(
            error.to_string().contains("testsBlake3") || error.to_string().contains("tests hash"),
            "{error:#}"
        );
    }

    #[test]
    #[test_r::tag(migration_contract)]
    fn a_kept_decision_leaves_the_config_untouched() {
        let fixture = blocks_fixture();
        let input = config(&blocks(
            "{}",
            r#"{ "category": "node-internals", "reason": "internal" }"#,
            "{}",
        ));
        let proposal = fixture.migrate_with(&input, None).unwrap();
        assert_eq!(proposal.content, input);
        let decisions = record(
            &proposal,
            vec![
                decision(&proposal, "block_00_block_00", json!({}), json!({})),
                decision(
                    &proposal,
                    "block_01_block_01",
                    json!({ "category": "node-internals", "reason": "internal" }),
                    json!({}),
                ),
            ],
        );
        let migration = fixture.migrate_with(&input, Some(&decisions)).unwrap();
        assert_eq!(migration.content, input);
        assert!(migration.report.obligations.is_empty());
        assert_eq!(migration.report.needs_review(), 0);
    }

    #[test]
    #[test_r::tag(migration_contract)]
    fn decisions_must_keep_old_obligations_accounted_for() {
        let fixture = blocks_fixture();
        let input = config(&blocks(
            "{}",
            r#"{ "category": "known-gap", "reason": "gap" }"#,
            "{}",
        ));
        let proposal = fixture.migrate_with(&input, None).unwrap();
        let impossible = json!({ "category": "wasi-impossible", "reason": "needs a socket" });
        let problem = |rows: Vec<Value>| {
            let migration = fixture
                .migrate_with(&input, Some(&record(&proposal, rows)))
                .unwrap();
            assert!(migration.content.contains(&blocks(
                "{}",
                r#"{ "category": "known-gap", "reason": "gap" }"#,
                "{}"
            )));
            migration
                .report
                .pending_position_decisions
                .iter()
                .map(|row| row["problem"].as_str().unwrap_or("none").to_string())
                .collect::<Vec<_>>()
        };
        let gap = json!({ "category": "known-gap", "reason": "gap" });
        // A runnable subtest that stops running, and a known gap that becomes excluded, each
        // need an obligation of the right kind.
        let rejected = problem(vec![
            decision(
                &proposal,
                "block_00_block_00",
                gap.clone(),
                json!({ "assertions": "changed" }),
            ),
            decision(
                &proposal,
                "block_01_block_01",
                impossible.clone(),
                json!({ "assertions": "changed", "obligation": "baseline-gap" }),
            ),
        ]);
        assert_eq!(rejected.len(), 2);
        assert!(
            rejected
                .iter()
                .all(|p| p.starts_with("obligationViolation")),
            "{rejected:?}"
        );
        // A baseline gap needs a reason.
        let rejected = problem(vec![decision(
            &proposal,
            "block_00_block_00",
            json!({ "category": "known-gap" }),
            json!({ "assertions": "changed", "obligation": "baseline-gap" }),
        )]);
        assert!(
            rejected[0].starts_with("obligationViolation"),
            "{rejected:?}"
        );

        let accepted = fixture
            .migrate_with(
                &input,
                Some(&record(
                    &proposal,
                    vec![
                        decision(
                            &proposal,
                            "block_00_block_00",
                            gap.clone(),
                            json!({ "assertions": "changed", "obligation": "baseline-gap" }),
                        ),
                        decision(
                            &proposal,
                            "block_01_block_01",
                            impossible.clone(),
                            json!({
                                "assertions": "changed",
                                "obligation": "target-change",
                                "evidence": "Node 26 rewrote the block to need a listening socket",
                            }),
                        ),
                    ],
                )),
            )
            .unwrap();
        assert_eq!(accepted.report.needs_review(), 0);
        assert_eq!(accepted.report.obligations.len(), 2);
        assert_eq!(
            entries(&accepted)["parallel/test-a.js"]["subtests"]["block_01_block_01"],
            impossible
        );
    }

    #[test]
    #[test_r::tag(migration_contract)]
    fn an_unchanged_entry_whose_effective_category_changed_needs_an_obligation() {
        let fixture = Fixture::new();
        fixture
            .previous("parallel/test-a.js", "{ passes(1); }\n{ passes(); }\n")
            .source(
                "parallel/test-a.js",
                "{ passes(2); internalBinding('x'); }\n{ passes(); }\n",
            );
        let input = config(
            r#"    "parallel/test-a.js": { "split": true, "subtests": { "block_00_block_00": {}, "block_01_block_01": {} } }"#,
        );
        let proposal = fixture.migrate_with(&input, None).unwrap();
        assert_eq!(
            pending(&proposal, "block_00_block_00")["previous"]["effective"]["category"],
            "runnable"
        );
        let kept = record(
            &proposal,
            vec![decision(
                &proposal,
                "block_00_block_00",
                json!({}),
                json!({}),
            )],
        );
        let migration = fixture.migrate_with(&input, Some(&kept)).unwrap();
        let row = pending(&migration, "block_00_block_00");
        assert!(
            row["problem"]
                .as_str()
                .unwrap()
                .contains("becomes node-internals"),
            "{row:#}"
        );
        let decided = record(
            &proposal,
            vec![decision(
                &proposal,
                "block_00_block_00",
                json!({}),
                json!({ "obligation": "target-change", "evidence": "Node 26 exposes internals here" }),
            )],
        );
        let migration = fixture.migrate_with(&input, Some(&decided)).unwrap();
        assert_eq!(migration.report.needs_review(), 0);
        assert_eq!(migration.report.obligations[0]["entry"], "node-internals");
    }

    #[test]
    #[test_r::tag(migration_contract)]
    fn moved_assertions_must_land_on_a_runnable_subtest() {
        let fixture = blocks_fixture();
        let input = config(&blocks(
            "{}",
            "{}",
            r#"{ "category": "known-gap", "reason": "gap" }"#,
        ));
        let proposal = fixture.migrate_with(&input, None).unwrap();
        let gap = json!({ "category": "known-gap", "reason": "split elsewhere" });
        let moved = |target: &str| {
            decision(
                &proposal,
                "block_00_block_00",
                gap.clone(),
                json!({ "assertions": "moved", "obligation": "moved", "movedTo": [target] }),
            )
        };
        let kept = decision(&proposal, "block_01_block_01", json!({}), json!({}));
        let run = |rows| {
            fixture
                .migrate_with(&input, Some(&record(&proposal, rows)))
                .unwrap()
        };
        let accepted = run(vec![
            moved("parallel/test-a.js#block_01_block_01"),
            kept.clone(),
        ]);
        assert_eq!(accepted.report.needs_review(), 0);
        for target in [
            "parallel/test-a.js#block_02_block_02",
            "parallel/test-missing.js",
        ] {
            let rejected = run(vec![moved(target), kept.clone()]);
            let row = pending(&rejected, "block_00_block_00");
            assert!(
                row["problem"]
                    .as_str()
                    .unwrap()
                    .starts_with("obligationViolation"),
                "{row:#}"
            );
            assert_eq!(rejected.report.needs_review(), 1);
        }
        // The target itself is a changed subtest; when its own decision stops it running
        // without a baseline gap, the decision that moved assertions to it is rejected too.
        let target_moved = decision(
            &proposal,
            "block_01_block_01",
            json!({ "category": "wasi-impossible", "reason": "socket" }),
            json!({ "assertions": "changed", "obligation": "target-change", "evidence": "socket" }),
        );
        let rejected = run(vec![
            moved("parallel/test-a.js#block_01_block_01"),
            target_moved,
        ]);
        assert_eq!(rejected.report.pending_position_decisions.len(), 1);
        assert_eq!(
            pending(&rejected, "block_00_block_00")["file"],
            "parallel/test-a.js"
        );
    }

    #[test]
    #[test_r::tag(migration_contract)]
    fn stale_mismatched_and_unused_decisions_fail() {
        let fixture = blocks_fixture();
        let input = config(&blocks("{}", "{}", "{}"));
        let proposal = fixture.migrate_with(&input, None).unwrap();
        let mut stale = decision(&proposal, "block_00_block_00", json!({}), json!({}));
        stale["currentBlake3"] = json!(blake3::hash(b"another source").to_hex().to_string());
        let mut mismatched = decision(&proposal, "block_01_block_01", json!({}), json!({}));
        mismatched["previous"]["effective"]["category"] = json!("known-gap");
        let mut unused = decision(&proposal, "block_01_block_01", json!({}), json!({}));
        unused["subtest"] = json!("block_02_block_02");
        let migration = fixture
            .migrate_with(
                &input,
                Some(&record(&proposal, vec![stale, mismatched, unused])),
            )
            .unwrap();
        assert_eq!(migration.content, input);
        let problems: Vec<&str> = migration
            .report
            .pending_position_decisions
            .iter()
            .map(|row| row["problem"].as_str().unwrap())
            .collect();
        assert!(problems[0].starts_with("stale"), "{problems:?}");
        assert!(problems[1].starts_with("previousMismatch"), "{problems:?}");
        assert_eq!(
            migration.report.unused_decisions,
            [json!({
                "file": "parallel/test-a.js",
                "subtest": "block_02_block_02",
                "problem": "no changed subtest with a generated name is matched by position here",
            })]
        );
        assert_eq!(migration.report.needs_review(), 3);
    }

    #[test]
    #[test_r::tag(migration_contract)]
    fn decisions_for_other_inputs_or_malformed_rows_are_rejected() {
        let fixture = blocks_fixture();
        let input = config(&blocks("{}", "{}", "{}"));
        let proposal = fixture.migrate_with(&input, None).unwrap();
        let row = decision(&proposal, "block_00_block_00", json!({}), json!({}));
        let error = |decisions: Value| {
            fixture
                .migrate_with(&input, Some(&decisions))
                .err()
                .unwrap_or_else(|| panic!("accepted {decisions:#}"))
                .to_string()
        };
        let mut versions = record(&proposal, vec![row.clone()]);
        versions["to"] = json!("24.15.0");
        assert!(error(versions).contains("24.15.0"));
        let mut config_hash = record(&proposal, vec![row.clone()]);
        config_hash["previousConfig"]["testsBlake3"] = json!("0".repeat(64));
        assert!(error(config_hash).contains("tests hash"));
        assert!(error(record(&proposal, vec![row.clone(), row.clone()])).contains("duplicate"));
        let mut unknown = row.clone();
        unknown["category"] = json!("runnable");
        assert!(error(record(&proposal, vec![unknown])).contains("unknown key"));
        let mut no_note = row.clone();
        no_note["note"] = json!(" ");
        assert!(error(record(&proposal, vec![no_note])).contains("note"));
        let mut no_evidence = row.clone();
        no_evidence["obligation"] = json!("target-change");
        assert!(error(record(&proposal, vec![no_evidence])).contains("evidence"));
        let without_previous = migrate(
            &input,
            fixture.temp.path().as_std_path(),
            None,
            Some(&record(&proposal, vec![row]).to_string()),
        )
        .err()
        .unwrap();
        assert!(
            without_previous
                .to_string()
                .contains("NODE_COMPAT_MIGRATION_PREVIOUS_SUITE")
        );
    }
}
