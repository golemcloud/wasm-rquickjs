//! Node.js compatibility inventory report generator.
//!
//! This report is generated only from tests/node_compat/config.jsonc. It does not compile or run
//! the node compatibility runner itself. Entries classified as `runnable` are treated as passing
//! because the node compatibility PR test runs them and fails CI if any of them fail.
//!
//! Usage:
//!   cargo test --test node_compat_report -- --nocapture
//!
//! The report is written to tests/node_compat/report.md

test_r::enable!();

#[allow(dead_code)]
mod common;

use common::{
    NodeCompatCategory, NodeCompatTestEntry, classify_test, load_node_compat_config,
    strip_jsonc_comments,
};
use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::path::Path;
use test_r::test;

const CONFIG_PATH: &str = "tests/node_compat/config.jsonc";
const REPORT_PATH: &str = "tests/node_compat/report.md";
const SUITE_ROOT: &str = "tests/node_compat/suite";

#[derive(Debug, Clone)]
struct InventoryItem {
    key: String,
    file_path: String,
    category: NodeCompatCategory,
    reason: Option<String>,
}

#[derive(Debug, Clone, Copy, Default)]
struct CategoryCounts {
    runnable: usize,
    known_gap: usize,
    wasi_impossible: usize,
    engine_difference: usize,
    node_internals: usize,
    unevaluated: usize,
}

impl CategoryCounts {
    fn add(&mut self, category: NodeCompatCategory) {
        match category {
            NodeCompatCategory::Runnable => self.runnable += 1,
            NodeCompatCategory::KnownGap => self.known_gap += 1,
            NodeCompatCategory::WasmImpossible => self.wasi_impossible += 1,
            NodeCompatCategory::EngineDifference => self.engine_difference += 1,
            NodeCompatCategory::NodeInternals => self.node_internals += 1,
            NodeCompatCategory::Unevaluated => self.unevaluated += 1,
        }
    }

    fn total(self) -> usize {
        self.runnable
            + self.known_gap
            + self.wasi_impossible
            + self.engine_difference
            + self.node_internals
            + self.unevaluated
    }

    fn primary_total(self) -> usize {
        self.runnable + self.known_gap
    }

    fn public_total(self) -> usize {
        self.runnable
            + self.known_gap
            + self.wasi_impossible
            + self.engine_difference
            + self.unevaluated
    }
}

#[test]
fn generate_node_compat_config_report() -> anyhow::Result<()> {
    let entries = load_node_compat_config(CONFIG_PATH)?;
    let node_version = load_node_version(CONFIG_PATH)?;
    let items = expand_entries(&entries);

    let mut counts = CategoryCounts::default();
    let mut by_module: BTreeMap<String, CategoryCounts> = BTreeMap::new();
    let mut by_category: BTreeMap<NodeCompatCategory, Vec<&InventoryItem>> = BTreeMap::new();
    let mut missing_reasons: Vec<&InventoryItem> = Vec::new();

    for item in &items {
        counts.add(item.category);
        by_category.entry(item.category).or_default().push(item);
        by_module
            .entry(module_for_item(item).to_string())
            .or_default()
            .add(item.category);

        if item.category != NodeCompatCategory::Runnable
            && item.reason.as_deref().is_none_or(str::is_empty)
        {
            missing_reasons.push(item);
        }
    }

    let mut report = String::new();
    report.push_str(&format!(
        "# Node.js v{node_version} Compatibility Inventory\n\n"
    ));
    report.push_str(&format!(
        "Generated: {} | Source: `{CONFIG_PATH}` | Engine: wasm-rquickjs (QuickJS)\n\n",
        now_date()
    ));
    report.push_str(
        "This report is generated from `config.jsonc` only. It does **not** run the vendored \
         tests itself. Entries classified as `runnable` are reported as passing because the \
         `node_compat` PR test executes runnable entries and fails CI if any of them fail.\n\n",
    );

    push_summary(&mut report, counts);
    push_module_table(&mut report, &by_module);
    push_split_summary(&mut report, &entries);
    push_reason_sections(&mut report, &by_category);
    push_missing_reasons(&mut report, &missing_reasons);

    fs::write(REPORT_PATH, &report)?;

    println!("Report written to {REPORT_PATH}");
    println!("Expanded inventory entries: {}", counts.total());
    println!(
        "Primary compatibility (CI-enforced): {}/{} ({:.1}%)",
        counts.runnable,
        counts.primary_total(),
        pct(counts.runnable, counts.primary_total())
    );
    println!(
        "Excluded from primary: WASI-impossible={}, engine-difference={}, unevaluated={}, node-internals={}",
        counts.wasi_impossible, counts.engine_difference, counts.unevaluated, counts.node_internals
    );

    Ok(())
}

#[test]
fn module_related_node_compat_entries_are_configured() -> anyhow::Result<()> {
    let entries = load_node_compat_config(CONFIG_PATH)?;
    let configured: BTreeSet<_> = entries.into_iter().map(|entry| entry.path).collect();
    let expected = collect_module_related_entrypoints()?;

    let missing: Vec<_> = expected
        .into_iter()
        .filter(|entry| !configured.contains(entry))
        .collect();

    assert!(
        missing.is_empty(),
        "module-related node_compat tests are vendored but missing from {CONFIG_PATH}:\n{}",
        missing.join("\n")
    );

    Ok(())
}

fn collect_module_related_entrypoints() -> anyhow::Result<BTreeSet<String>> {
    let mut entries = BTreeSet::new();
    collect_matching_files("es-module", is_es_module_entrypoint, &mut entries)?;
    collect_matching_files("parallel", is_parallel_module_entrypoint, &mut entries)?;
    collect_matching_files("sequential", is_sequential_module_entrypoint, &mut entries)?;
    Ok(entries)
}

fn collect_matching_files(
    suite_dir: &str,
    predicate: fn(&str) -> bool,
    entries: &mut BTreeSet<String>,
) -> anyhow::Result<()> {
    let dir = Path::new(SUITE_ROOT).join(suite_dir);
    for entry in fs::read_dir(&dir)? {
        let entry = entry?;
        if !entry.file_type()?.is_file() {
            continue;
        }

        let file_name = entry.file_name();
        let file_name = file_name.to_string_lossy();
        if predicate(&file_name) {
            entries.insert(format!("{suite_dir}/{file_name}"));
        }
    }
    Ok(())
}

fn is_js_entrypoint(name: &str) -> bool {
    name.starts_with("test-") && (name.ends_with(".js") || name.ends_with(".mjs"))
}

fn is_es_module_entrypoint(name: &str) -> bool {
    is_js_entrypoint(name)
}

fn is_parallel_module_entrypoint(name: &str) -> bool {
    is_js_entrypoint(name)
        && [
            "test-module-",
            "test-module.",
            "test-require-",
            "test-require.",
            "test-cjs-",
            "test-cjs.",
            "test-esm-",
            "test-esm.",
            "test-commonjs-",
            "test-commonjs.",
        ]
        .iter()
        .any(|prefix| name.starts_with(prefix))
}

fn is_sequential_module_entrypoint(name: &str) -> bool {
    is_js_entrypoint(name) && name.starts_with("test-module")
}

fn expand_entries(entries: &[NodeCompatTestEntry]) -> Vec<InventoryItem> {
    let mut items = Vec::new();
    for entry in entries {
        if entry.split && !entry.subtests.is_empty() {
            for subtest in &entry.subtests {
                items.push(InventoryItem {
                    key: format!("{}#{}", entry.path, subtest.name),
                    file_path: entry.path.clone(),
                    category: subtest.category,
                    reason: subtest.reason.clone(),
                });
            }
        } else {
            items.push(InventoryItem {
                key: entry.path.clone(),
                file_path: entry.path.clone(),
                category: entry.category,
                reason: entry.reason.clone(),
            });
        }
    }
    items.sort_by(|a, b| a.key.cmp(&b.key));
    items
}

fn load_node_version(config_path: &str) -> anyhow::Result<String> {
    let content = fs::read_to_string(config_path)?;
    let json_str = strip_jsonc_comments(&content);
    let value: serde_json::Value = serde_json::from_str(&json_str)?;
    Ok(value
        .get("nodeVersion")
        .and_then(|v| v.as_str())
        .unwrap_or("unknown")
        .to_string())
}

fn push_summary(report: &mut String, counts: CategoryCounts) {
    let primary_total = counts.primary_total();
    let public_total = counts.public_total();
    let total = counts.total();

    report.push_str("## Summary\n\n");
    report.push_str(
        "Primary compatibility is measured over the public API surface we can provide: \
         CI-enforced passing (`runnable`) plus `known-gap`. WASI-impossible tests, engine \
         differences, unevaluated tests, and Node.js-internals tests are acknowledged separately \
         and excluded from the primary percentage.\n\n",
    );
    report.push_str(&format!(
        "**Primary compatibility (CI-enforced):** {}/{} ({:.1}%)\n\n",
        counts.runnable,
        primary_total,
        pct(counts.runnable, primary_total)
    ));

    report.push_str("| Classification | Count | Primary % | Public inventory % | All listed % |\n");
    report.push_str("|----------------|-------|-----------|--------------------|--------------|\n");
    push_summary_row(
        report,
        "✅ passing (runnable)",
        counts.runnable,
        primary_total,
        public_total,
        total,
    );
    push_summary_row(
        report,
        "🧩 known gap",
        counts.known_gap,
        primary_total,
        public_total,
        total,
    );
    push_summary_row(
        report,
        "🚫 WASI-impossible (excluded)",
        counts.wasi_impossible,
        primary_total,
        public_total,
        total,
    );
    push_summary_row(
        report,
        "⚙️ engine difference (excluded)",
        counts.engine_difference,
        primary_total,
        public_total,
        total,
    );
    push_summary_row(
        report,
        "❔ unevaluated (excluded)",
        counts.unevaluated,
        primary_total,
        public_total,
        total,
    );
    push_summary_row(
        report,
        "🔒 Node.js internals (excluded)",
        counts.node_internals,
        primary_total,
        public_total,
        total,
    );
    report.push_str(&format!(
        "| **Total** | **{total}** |  |  | **100.0%** |\n\n"
    ));

    report.push_str(&format!(
        "Secondary full-public compatibility, including public tests that are currently \
         excluded from primary: **{}/{} ({:.1}%)**.\n\n",
        counts.runnable,
        public_total,
        pct(counts.runnable, public_total)
    ));
}

fn push_summary_row(
    report: &mut String,
    label: &str,
    count: usize,
    primary_total: usize,
    public_total: usize,
    total: usize,
) {
    let primary_pct = if label.contains("excluded") || label.contains("internals") {
        "—".to_string()
    } else {
        format!("{:.1}%", pct(count, primary_total))
    };
    let public_pct = if label.contains("internals") {
        "—".to_string()
    } else {
        format!("{:.1}%", pct(count, public_total))
    };
    report.push_str(&format!(
        "| {label} | {count} | {primary_pct} | {public_pct} | {:.1}% |\n",
        pct(count, total)
    ));
}

fn push_module_table(report: &mut String, by_module: &BTreeMap<String, CategoryCounts>) {
    report.push_str("## Inventory by Module\n\n");
    report.push_str("| Module | Total | Passing | Gap | WASI-impossible | Engine diff | Unevaluated | Internals | Primary % | Public compatibility % |\n");
    report.push_str("|--------|-------|----------|-----|-----------------|-------------|-------------|-----------|-----------|--------------------|\n");

    for (module, counts) in by_module {
        report.push_str(&format!(
            "| {module} | {} | {} | {} | {} | {} | {} | {} | {:.1}% | {:.1}% |\n",
            counts.total(),
            counts.runnable,
            counts.known_gap,
            counts.wasi_impossible,
            counts.engine_difference,
            counts.unevaluated,
            counts.node_internals,
            pct(counts.runnable, counts.primary_total()),
            pct(counts.runnable, counts.public_total()),
        ));
    }
    report.push('\n');
}

fn push_split_summary(report: &mut String, entries: &[NodeCompatTestEntry]) {
    report.push_str("## Split Test Summary\n\n");
    let split_entries: Vec<_> = entries.iter().filter(|entry| entry.split).collect();
    if split_entries.is_empty() {
        report.push_str("_No split test entries in config.jsonc._\n\n");
        return;
    }

    report.push_str("| File | Subtests | Passing | Gap | WASI-impossible | Engine diff | Unevaluated | Internals |\n");
    report.push_str("|------|----------|----------|-----|-----------------|-------------|-------------|-----------|\n");

    for entry in split_entries {
        let mut counts = CategoryCounts::default();
        for subtest in &entry.subtests {
            counts.add(subtest.category);
        }
        let filename = entry.path.rsplit('/').next().unwrap_or(&entry.path);
        report.push_str(&format!(
            "| `{}` | {} | {} | {} | {} | {} | {} | {} |\n",
            filename,
            entry.subtests.len(),
            counts.runnable,
            counts.known_gap,
            counts.wasi_impossible,
            counts.engine_difference,
            counts.unevaluated,
            counts.node_internals,
        ));
    }
    report.push('\n');
}

fn push_reason_sections(
    report: &mut String,
    by_category: &BTreeMap<NodeCompatCategory, Vec<&InventoryItem>>,
) {
    report.push_str("## Classified Non-Runnable Tests\n\n");
    for category in [
        NodeCompatCategory::KnownGap,
        NodeCompatCategory::WasmImpossible,
        NodeCompatCategory::EngineDifference,
        NodeCompatCategory::Unevaluated,
        NodeCompatCategory::NodeInternals,
    ] {
        let items = by_category.get(&category).cloned().unwrap_or_default();
        report.push_str(&format!("### {} ({})\n\n", category.label(), items.len()));
        if items.is_empty() {
            report.push_str("_No entries._\n\n");
            continue;
        }

        let mut by_reason: BTreeMap<String, Vec<&InventoryItem>> = BTreeMap::new();
        for item in items {
            by_reason
                .entry(
                    item.reason
                        .as_deref()
                        .filter(|reason| !reason.trim().is_empty())
                        .unwrap_or("missing reason")
                        .to_string(),
                )
                .or_default()
                .push(item);
        }

        let mut groups: Vec<_> = by_reason.into_iter().collect();
        groups.sort_by_key(|(_, items)| std::cmp::Reverse(items.len()));

        report.push_str("| Reason | Count | Example entries |\n");
        report.push_str("|--------|-------|-----------------|\n");
        for (reason, items) in &groups {
            let examples: Vec<_> = items
                .iter()
                .take(3)
                .map(|item| format!("`{}`", item.key))
                .collect();
            let suffix = if items.len() > 3 {
                format!(", ... (+{})", items.len() - 3)
            } else {
                String::new()
            };
            report.push_str(&format!(
                "| {} | {} | {}{} |\n",
                escape_table_cell(reason),
                items.len(),
                examples.join(", "),
                suffix
            ));
        }
        report.push('\n');
    }
}

fn push_missing_reasons(report: &mut String, missing_reasons: &[&InventoryItem]) {
    report.push_str("## Config Hygiene\n\n");
    if missing_reasons.is_empty() {
        report.push_str("All non-runnable entries have reasons.\n");
    } else {
        report.push_str(&format!(
            "{} non-runnable entr{} missing a reason.\n\n",
            missing_reasons.len(),
            if missing_reasons.len() == 1 {
                "y is"
            } else {
                "ies are"
            }
        ));
        report.push_str("<details>\n<summary>Entries missing reasons</summary>\n\n");
        for item in missing_reasons {
            report.push_str(&format!("- `{}` ({})\n", item.key, item.category.label()));
        }
        report.push_str("\n</details>\n");
    }
}

fn module_for_item(item: &InventoryItem) -> &str {
    let filename = item.file_path.rsplit('/').next().unwrap_or(&item.file_path);
    classify_test(filename)
}

fn pct(numerator: usize, denominator: usize) -> f64 {
    if denominator == 0 {
        0.0
    } else {
        numerator as f64 / denominator as f64 * 100.0
    }
}

fn escape_table_cell(value: &str) -> String {
    value.replace('\n', " ").replace('|', "\\|")
}

fn now_date() -> String {
    chrono::Local::now().format("%Y-%m-%d").to_string()
}
