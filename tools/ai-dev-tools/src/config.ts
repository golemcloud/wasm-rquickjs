import fs from "node:fs";
import { CONFIG_PATH } from "./paths.js";
import * as jsonc from "jsonc-parser";

export interface SubtestEntry {
  skip?: boolean;
  reason?: string;
}

export interface TestEntry {
  skip?: boolean;
  reason?: string;
  split?: boolean;
  subtests?: Record<string, SubtestEntry>;
}

export interface Config {
  tests: Record<string, TestEntry>;
}

const formattingOptions: jsonc.FormattingOptions = {
  insertSpaces: true,
  tabSize: 2,
  eol: "\n",
};

function clipReason(reason: string): string {
  const r = reason.trim();
  return r.length > 200 ? r.slice(0, 197) + "..." : r;
}

function editConfig(apply: (content: string) => string): void {
  const content = fs.readFileSync(CONFIG_PATH, "utf-8");
  fs.writeFileSync(CONFIG_PATH, apply(content));
}

function applyModify(content: string, jsonPath: jsonc.JSONPath, value: unknown, opts?: jsonc.ModificationOptions): string {
  const edits = jsonc.modify(content, jsonPath, value, { formattingOptions, ...opts });
  return jsonc.applyEdits(content, edits);
}

function insertionIndexForPrefix(categoryPrefix: string): (properties: string[]) => number {
  return (properties) => {
    let lastMatch = -1;
    for (let i = 0; i < properties.length; i++) {
      if (properties[i].startsWith(categoryPrefix)) lastMatch = i;
    }
    return lastMatch >= 0 ? lastMatch + 1 : properties.length;
  };
}

export function loadConfig(): Config {
  const content = fs.readFileSync(CONFIG_PATH, "utf-8");
  return jsonc.parse(content) as Config;
}

export function testInConfig(testPath: string): boolean {
  const config = loadConfig();
  return testPath in config.tests;
}

export function addTestToConfigSkipped(
  testPath: string,
  category: string,
  reason = "not yet triaged",
): void {
  const categoryPrefix = `parallel/test-${category}`;
  const newValue: TestEntry = { skip: true, reason: clipReason(reason) };

  editConfig((content) => {
    return applyModify(content, ["tests", testPath], newValue, {
      getInsertionIndex: insertionIndexForPrefix(categoryPrefix),
    });
  });

  console.log(`  Added "${testPath}" as skipped to config.jsonc`);
}

export function addTestsToConfigSkippedBatch(
  testPaths: string[],
  category: string,
  reason = "not yet triaged",
): void {
  if (testPaths.length === 0) return;

  const categoryPrefix = `parallel/test-${category}`;
  const newValue: TestEntry = { skip: true, reason: clipReason(reason) };

  editConfig((content) => {
    let result = content;
    for (const testPath of testPaths) {
      result = applyModify(result, ["tests", testPath], newValue, {
        getInsertionIndex: insertionIndexForPrefix(categoryPrefix),
      });
    }
    return result;
  });

  for (const testPath of testPaths) {
    console.log(`  Added "${testPath}" as skipped to config.jsonc`);
  }
}

export function enableTestInConfig(testPath: string): void {
  editConfig((content) => {
    const parsed = jsonc.parse(content) as Config;
    const entry = parsed.tests?.[testPath];

    if (entry?.split && entry?.subtests) {
      // Split entry: remove skip/reason but preserve split and subtests
      let result = content;
      result = applyModify(result, ["tests", testPath, "skip"], undefined);
      result = applyModify(result, ["tests", testPath, "reason"], undefined);
      // Also clear skip on all subtests
      for (const subtestName of Object.keys(entry.subtests)) {
        result = applyModify(result, ["tests", testPath, "subtests", subtestName], {});
      }
      return result;
    }

    // Non-split: replace with empty object (existing behavior)
    return applyModify(content, ["tests", testPath], {});
  });

  console.log(`  Enabled "${testPath}" in config.jsonc`);
}

export function enableSubtestInConfig(testPath: string, subtestName: string): void {
  editConfig((content) => {
    const parsed = jsonc.parse(content) as Config;
    const entry = parsed.tests?.[testPath];
    let result = content;

    // If parent is skipped, lift the parent skip and explicitly skip all other subtests
    if (entry?.skip && entry?.subtests) {
      const parentReason = entry.reason ?? "no reason given";
      result = applyModify(result, ["tests", testPath, "skip"], undefined);
      result = applyModify(result, ["tests", testPath, "reason"], undefined);

      for (const otherName of Object.keys(entry.subtests)) {
        if (otherName !== subtestName && !entry.subtests[otherName].skip) {
          const val: SubtestEntry = { skip: true, reason: parentReason };
          result = applyModify(result, ["tests", testPath, "subtests", otherName], val);
        }
      }
    }

    // Enable the target subtest
    return applyModify(result, ["tests", testPath, "subtests", subtestName], {});
  });
  console.log(`  Enabled subtest "${subtestName}" in "${testPath}"`);
}

export function skipSubtestInConfig(testPath: string, subtestName: string, reason: string): void {
  const newValue: SubtestEntry = { skip: true, reason: clipReason(reason) };
  editConfig((content) => {
    return applyModify(content, ["tests", testPath, "subtests", subtestName], newValue);
  });
  console.log(`  Skipped subtest "${subtestName}" in "${testPath}"`);
}

export function addSplitTestToConfig(testPath: string, subtests: Record<string, SubtestEntry>): void {
  editConfig((content) => {
    let result = content;
    // Set split flag
    result = applyModify(result, ["tests", testPath, "split"], true);
    // Add each subtest
    for (const [name, entry] of Object.entries(subtests)) {
      result = applyModify(result, ["tests", testPath, "subtests", name], entry);
    }
    return result;
  });
  console.log(`  Added split test "${testPath}" with ${Object.keys(subtests).length} subtests`);
}

export function updateSkipReason(testPath: string, newReason: string): void {
  editConfig((content) => {
    let result = content;
    result = applyModify(result, ["tests", testPath, "skip"], true);
    result = applyModify(result, ["tests", testPath, "reason"], clipReason(newReason));
    return result;
  });

  console.log("  Updated skip reason");
}
