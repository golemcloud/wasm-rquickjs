import fs from "node:fs";
import { CONFIG_PATH } from "./paths.js";
import * as jsonc from "jsonc-parser";

export interface TestEntry {
  skip?: boolean;
  reason?: string;
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
    const edits = jsonc.modify(content, ["tests", testPath], newValue, {
      formattingOptions,
      getInsertionIndex: (properties) => {
        let lastMatch = -1;
        for (let i = 0; i < properties.length; i++) {
          if (properties[i].startsWith(categoryPrefix)) lastMatch = i;
        }
        return lastMatch >= 0 ? lastMatch + 1 : properties.length;
      },
    });
    return jsonc.applyEdits(content, edits);
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
      const edits = jsonc.modify(result, ["tests", testPath], newValue, {
        formattingOptions,
        getInsertionIndex: (properties) => {
          let lastMatch = -1;
          for (let i = 0; i < properties.length; i++) {
            if (properties[i].startsWith(categoryPrefix)) lastMatch = i;
          }
          return lastMatch >= 0 ? lastMatch + 1 : properties.length;
        },
      });
      result = jsonc.applyEdits(result, edits);
    }
    return result;
  });

  for (const testPath of testPaths) {
    console.log(`  Added "${testPath}" as skipped to config.jsonc`);
  }
}

export function enableTestInConfig(testPath: string): void {
  editConfig((content) => {
    const edits = jsonc.modify(content, ["tests", testPath], {}, { formattingOptions });
    return jsonc.applyEdits(content, edits);
  });

  console.log(`  Enabled "${testPath}" in config.jsonc`);
}

export function updateSkipReason(testPath: string, newReason: string): void {
  const newValue: TestEntry = { skip: true, reason: clipReason(newReason) };

  editConfig((content) => {
    const edits = jsonc.modify(content, ["tests", testPath], newValue, { formattingOptions });
    return jsonc.applyEdits(content, edits);
  });

  console.log("  Updated skip reason");
}
