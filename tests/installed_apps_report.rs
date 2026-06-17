//! Installed app compatibility report generator.
//!
//! This report is generated from tests/installed_apps/config.jsonc. Runtime tests in
//! tests/runtime/installed_apps.rs use the same config as their source of truth.
//!
//! Usage:
//!   cargo test --test installed_apps_report -- --nocapture
//!
//! The report is written to tests/installed_apps/report.md.

test_r::enable!();

#[allow(dead_code)]
mod common;

use common::{InstalledAppCategory, InstalledAppEntry, InstalledAppTestEntry};
use std::collections::BTreeMap;
use std::fs;
use test_r::test;

const CONFIG_PATH: &str = "tests/installed_apps/config.jsonc";
const REPORT_PATH: &str = "tests/installed_apps/report.md";

#[derive(Debug, Clone, Copy, Default)]
struct CategoryCounts {
    runnable: usize,
    known_gap: usize,
    deferred: usize,
}

impl CategoryCounts {
    fn add(&mut self, category: InstalledAppCategory) {
        match category {
            InstalledAppCategory::Runnable => self.runnable += 1,
            InstalledAppCategory::KnownGap => self.known_gap += 1,
            InstalledAppCategory::Deferred => self.deferred += 1,
        }
    }

    fn total(self) -> usize {
        self.runnable + self.known_gap + self.deferred
    }

    fn status(self) -> &'static str {
        if self.known_gap == 0 && self.deferred == 0 {
            "Passing"
        } else if self.runnable > 0 {
            "Partial"
        } else if self.known_gap > 0 {
            "Known gap"
        } else {
            "Deferred"
        }
    }
}

#[test]
fn generate_installed_apps_report() -> anyhow::Result<()> {
    let apps = common::load_installed_apps_config(CONFIG_PATH)?;
    let mut totals = CategoryCounts::default();
    for app in &apps {
        for test in &app.tests {
            totals.add(test.category);
        }
    }

    let mut report = String::new();
    report.push_str("# Installed App Compatibility Report\n\n");
    report.push_str(&format!(
        "Generated: {} | Source: `{CONFIG_PATH}` | Engine: wasm-rquickjs (QuickJS)\n\n",
        now_date()
    ));
    report.push_str(
        "This report tracks compatibility for unbundled npm-installed apps attached to the \
         component as a filesystem. It is intentionally separate from `tests/libraries/libraries.md`, \
         which tests Rollup-bundled library usage. Runtime tests in `tests/runtime/installed_apps.rs` \
         are generated from the same config file as this report.\n\n",
    );

    push_scope(&mut report);
    push_how_it_runs(&mut report);
    push_summary(&mut report, totals, &apps);
    push_app_sections(&mut report, &apps);
    push_non_runnable(&mut report, &apps);

    fs::write(REPORT_PATH, &report)?;

    println!("Report written to {REPORT_PATH}");
    println!(
        "Installed app tests: {}/{} runnable, {} known gap, {} deferred",
        totals.runnable,
        totals.total(),
        totals.known_gap,
        totals.deferred
    );

    Ok(())
}

fn push_scope(report: &mut String) {
    report.push_str("## Scope\n\n");
    report.push_str("| Included | Deferred |\n");
    report.push_str("|---|---|\n");
    report.push_str("| Pure JavaScript packages installed with npm | Native `.node` bindings |\n");
    report.push_str("| `node_modules` package resolution | Packages that load WASM artifacts |\n");
    report.push_str("| package `exports` / `imports` | Child process execution |\n");
    report.push_str(
        "| CJS/ESM interop and same-process cycles | CLI preload/eval/warning behavior |\n\n",
    );
}

fn push_how_it_runs(report: &mut String) {
    report.push_str("## How It Runs\n\n");
    report.push_str("For every runnable test, the runtime harness:\n\n");
    report.push_str("1. Copies `tests/installed_apps/apps/<app>` to a temporary directory.\n");
    report
        .push_str("2. Runs `npm install --install-links --ignore-scripts --no-audit --no-fund`.\n");
    report.push_str(
        "3. Verifies the raw app test on host Node.js via `node run-node.mjs <test-file>`.\n",
    );
    report.push_str("4. Copies the installed app into the WASI preopen as `/app`.\n");
    report.push_str("5. Executes the test through `examples/runtime/installed-app-runner` against real `/app/node_modules`.\n\n");
}

fn push_summary(report: &mut String, totals: CategoryCounts, apps: &[InstalledAppEntry]) {
    report.push_str("## Summary\n\n");
    report.push_str(&format!(
        "Runnable installed-app compatibility: **{}/{}** tests.\n\n",
        totals.runnable,
        totals.total()
    ));
    report.push_str("| Classification | Count |\n");
    report.push_str("|---|---:|\n");
    report.push_str(&format!("| Passing (runnable) | {} |\n", totals.runnable));
    report.push_str(&format!("| Known gap | {} |\n", totals.known_gap));
    report.push_str(&format!("| Deferred | {} |\n\n", totals.deferred));

    report.push_str("## Apps\n\n");
    report.push_str("| App | Status | Tests | Notes |\n");
    report.push_str("|---|---:|---:|---|\n");
    for app in apps {
        let counts = counts_for_app(app);
        let reason = app.reason.as_deref().unwrap_or("");
        report.push_str(&format!(
            "| `{}` | {} | {}/{} | {} |\n",
            app.name,
            counts.status(),
            counts.runnable,
            counts.total(),
            escape_table_cell(reason)
        ));
    }
    report.push('\n');
}

fn push_app_sections(report: &mut String, apps: &[InstalledAppEntry]) {
    for app in apps {
        report.push_str(&format!("## `{}`\n\n", app.name));
        report.push_str("| Test | Status | Coverage |\n");
        report.push_str("|---|---:|---|\n");
        for test in &app.tests {
            report.push_str(&format!(
                "| `{}` | {} | {} |\n",
                test.file,
                test.category.status_label(),
                escape_table_cell(&test.coverage)
            ));
        }
        report.push('\n');
    }
}

fn push_non_runnable(report: &mut String, apps: &[InstalledAppEntry]) {
    let mut by_reason: BTreeMap<String, Vec<(&InstalledAppEntry, &InstalledAppTestEntry)>> =
        BTreeMap::new();
    for app in apps {
        for test in &app.tests {
            if test.category == InstalledAppCategory::Runnable {
                continue;
            }
            by_reason
                .entry(
                    test.reason
                        .as_deref()
                        .filter(|reason| !reason.trim().is_empty())
                        .unwrap_or("missing reason")
                        .to_string(),
                )
                .or_default()
                .push((app, test));
        }
    }

    report.push_str("## Non-Runnable Tests\n\n");
    if by_reason.is_empty() {
        report.push_str("_No non-runnable installed-app tests._\n");
        return;
    }

    report.push_str("| Reason | Count | Entries |\n");
    report.push_str("|---|---:|---|\n");
    for (reason, entries) in by_reason {
        let examples = entries
            .iter()
            .map(|(app, test)| format!("`{}/{}`", app.name, test.file))
            .collect::<Vec<_>>()
            .join(", ");
        report.push_str(&format!(
            "| {} | {} | {} |\n",
            escape_table_cell(&reason),
            entries.len(),
            examples
        ));
    }
}

fn counts_for_app(app: &InstalledAppEntry) -> CategoryCounts {
    let mut counts = CategoryCounts::default();
    for test in &app.tests {
        counts.add(test.category);
    }
    counts
}

fn escape_table_cell(value: &str) -> String {
    value.replace('\n', " ").replace('|', "\\|")
}

fn now_date() -> String {
    chrono::Local::now().format("%Y-%m-%d").to_string()
}
