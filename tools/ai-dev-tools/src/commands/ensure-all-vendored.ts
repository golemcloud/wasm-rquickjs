import fs from "node:fs";
import { CONFIG_PATH } from "../paths.js";
import { loadConfig } from "../config.js";
import { getAllVendoredTests } from "../tests.js";
import * as jsonc from "jsonc-parser";

const formattingOptions: jsonc.FormattingOptions = {
  insertSpaces: true,
  tabSize: 2,
  eol: "\n",
};

export async function ensureAllVendoredCommand(
  options: { dryRun: boolean } = { dryRun: false },
): Promise<void> {
  const allVendored = getAllVendoredTests();
  const config = loadConfig();
  const configTests = new Set(Object.keys(config.tests ?? {}));

  const missing = allVendored.filter((t) => !configTests.has(t));

  if (missing.length === 0) {
    console.log(
      `✅ All ${allVendored.length} vendored test files are in config.jsonc. Nothing to do.`,
    );
    return;
  }

  console.log(
    `Found ${missing.length} vendored test file(s) not in config.jsonc (out of ${allVendored.length} total):`,
  );
  for (const t of missing) {
    console.log(`  • ${t}`);
  }

  if (options.dryRun) {
    console.log("\n(dry run — no changes made)");
    return;
  }

  // Add all missing tests as skipped with "not yet triaged", in sorted position
  let content = fs.readFileSync(CONFIG_PATH, "utf-8");
  const newValue = { skip: true, reason: "not yet triaged" };

  for (const testPath of missing) {
    const edits = jsonc.modify(content, ["tests", testPath], newValue, {
      formattingOptions,
      getInsertionIndex: (properties) => {
        for (let i = 0; i < properties.length; i++) {
          if (properties[i] > testPath) return i;
        }
        return properties.length;
      },
    });
    content = jsonc.applyEdits(content, edits);
  }

  fs.writeFileSync(CONFIG_PATH, content);

  for (const t of missing) {
    console.log(`  Added "${t}" as skipped to config.jsonc`);
  }

  console.log(
    `\n✅ Added ${missing.length} test(s) to config.jsonc as skipped ("not yet triaged").`,
  );
}
