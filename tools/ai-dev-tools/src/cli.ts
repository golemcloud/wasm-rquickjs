#!/usr/bin/env node

import { parseArgs } from "node:util";
import { fixCommand } from "./commands/fix.js";
import { syncConfigCommand } from "./commands/sync-config.js";
import { ensureAllVendoredCommand } from "./commands/ensure-all-vendored.js";

const USAGE = `\
ai-dev-tools — AI-powered development tools for wasm-rquickjs

Usage:
  ai-dev-tools fix <category>             Fix skipped node-compat tests for a category
  ai-dev-tools sync-config [--dry-run]    Update config.jsonc from the compat report
  ai-dev-tools ensure-all-vendored [--dry-run]  Ensure ALL vendored tests are in config.jsonc
  ai-dev-tools --help                     Show this help message

Examples:
  npx ai-dev-tools fix net
  npx ai-dev-tools fix crypto
  npx ai-dev-tools fix fs
  npx ai-dev-tools sync-config
  npx ai-dev-tools sync-config --dry-run
  npx ai-dev-tools ensure-all-vendored
  npx ai-dev-tools ensure-all-vendored --dry-run

  # Or during development:
  npx tsx src/cli.ts fix net
  npx tsx src/cli.ts sync-config
  npx tsx src/cli.ts ensure-all-vendored
`;

const CATEGORY_PATTERN = /^[a-z][a-z0-9_]*$/;

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      help: { type: "boolean", short: "h" },
      "dry-run": { type: "boolean" },
    },
  });

  if (values.help || positionals.length === 0) {
    console.log(USAGE);
    process.exit(positionals.length === 0 ? 1 : 0);
  }

  const command = positionals[0];

  switch (command) {
    case "fix": {
      const category = positionals[1];
      if (!category) {
        console.error("Error: fix command requires a <category> argument");
        console.log();
        console.log(USAGE);
        process.exit(1);
      }
      if (!CATEGORY_PATTERN.test(category)) {
        console.error(
          `Error: invalid category '${category}'. Must be lowercase alphanumeric (e.g., net, crypto, fs).`,
        );
        process.exit(1);
      }
      await fixCommand(category);
      break;
    }
    case "sync-config": {
      await syncConfigCommand({ dryRun: !!values["dry-run"] });
      break;
    }
    case "ensure-all-vendored": {
      await ensureAllVendoredCommand({ dryRun: !!values["dry-run"] });
      break;
    }
    default:
      console.error(`Unknown command: ${command}`);
      console.log();
      console.log(USAGE);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
