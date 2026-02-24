import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT } from "../paths.js";
import { enableTestInConfig, enableSubtestInConfig, loadConfig } from "../config.js";
import * as jsonc from "jsonc-parser";

const REPORT_PATH = path.join(REPO_ROOT, "tests", "node_compat", "report.md");
const CONFIG_PATH = path.join(REPO_ROOT, "tests", "node_compat", "config.jsonc");

const formattingOptions: jsonc.FormattingOptions = {
  insertSpaces: true,
  tabSize: 2,
  eol: "\n",
};

interface ParsedTestEntry {
  path: string;
  subtestName?: string;
}

/** Parse a report section that lists test paths as `- \`path\`` or `- \`path#subtest\`` bullet items. */
function parseTestList(report: string, sectionHeading: string): ParsedTestEntry[] {
  const headingIdx = report.indexOf(`## ${sectionHeading}`);
  if (headingIdx === -1) return [];

  // Find the content between this heading and the next ## heading
  const afterHeading = report.slice(headingIdx);
  const nextHeadingIdx = afterHeading.indexOf("\n## ", 1);
  const sectionContent =
    nextHeadingIdx === -1
      ? afterHeading
      : afterHeading.slice(0, nextHeadingIdx);

  const entries: ParsedTestEntry[] = [];
  for (const line of sectionContent.split("\n")) {
    const match = line.match(/^- `([^`]+)`/);
    if (match) {
      const fullPath = match[1];
      const hashIdx = fullPath.indexOf('#');
      if (hashIdx >= 0) {
        entries.push({
          path: fullPath.substring(0, hashIdx),
          subtestName: fullPath.substring(hashIdx + 1),
        });
      } else {
        entries.push({ path: fullPath });
      }
    }
  }
  return entries;
}

export async function syncConfigCommand(
  options: { dryRun: boolean } = { dryRun: false },
): Promise<void> {
  if (!fs.existsSync(REPORT_PATH)) {
    console.error(
      `Error: Report not found at ${REPORT_PATH}\n` +
        `Run the report generator first:\n` +
        `  cargo test --test node_compat_report -- --nocapture`,
    );
    process.exit(1);
  }

  const report = fs.readFileSync(REPORT_PATH, "utf-8");

  // 1. Tests that should be unskipped (marked skip but actually pass)
  const shouldUnskip = parseTestList(report, "Tests That Should Not Be Skipped");

  // 2. Passing tests not yet in config.jsonc
  const missingFromConfig = parseTestList(report, "Passing Tests Not in Config");

  if (shouldUnskip.length === 0 && missingFromConfig.length === 0) {
    console.log("✅ config.jsonc is already in sync with the report. Nothing to do.");
    return;
  }

  if (shouldUnskip.length > 0) {
    console.log(
      `\n🔄 ${shouldUnskip.length} test(s) to unskip (marked skip but actually pass):`,
    );
    for (const entry of shouldUnskip) {
      const label = entry.subtestName ? `${entry.path}#${entry.subtestName}` : entry.path;
      console.log(`  • ${label}`);
    }
  }

  if (missingFromConfig.length > 0) {
    console.log(
      `\n➕ ${missingFromConfig.length} passing test(s) to add to config:`,
    );
    for (const entry of missingFromConfig) {
      const label = entry.subtestName ? `${entry.path}#${entry.subtestName}` : entry.path;
      console.log(`  • ${label}`);
    }
  }

  if (options.dryRun) {
    console.log("\n(dry run — no changes made)");
    return;
  }

  console.log();

  // Apply unskips
  for (const entry of shouldUnskip) {
    if (entry.subtestName) {
      enableSubtestInConfig(entry.path, entry.subtestName);
    } else {
      enableTestInConfig(entry.path);
    }
  }

  // Apply additions: add as enabled entries
  if (missingFromConfig.length > 0) {
    let content = fs.readFileSync(CONFIG_PATH, "utf-8");
    for (const entry of missingFromConfig) {
      if (entry.subtestName) {
        // Add subtest to existing split entry
        const edits = jsonc.modify(content, ["tests", entry.path, "subtests", entry.subtestName], {}, { formattingOptions });
        content = jsonc.applyEdits(content, edits);
      } else {
        // Add new file entry
        const edits = jsonc.modify(content, ["tests", entry.path], {}, {
          formattingOptions,
          getInsertionIndex: (properties) => {
            // Insert in sorted position
            for (let i = 0; i < properties.length; i++) {
              if (properties[i] > entry.path) return i;
            }
            return properties.length;
          },
        });
        content = jsonc.applyEdits(content, edits);
      }
    }
    fs.writeFileSync(CONFIG_PATH, content);
    for (const entry of missingFromConfig) {
      const label = entry.subtestName ? `${entry.path}#${entry.subtestName}` : entry.path;
      console.log(`  Added "${label}" to config.jsonc`);
    }
  }

  console.log(
    `\n✅ Done. Unskipped ${shouldUnskip.length}, added ${missingFromConfig.length} tests.`,
  );
}
