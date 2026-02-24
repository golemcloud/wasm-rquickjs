import fs from "node:fs";
import path from "node:path";
import { globSync } from "node:fs";
import { REPO_ROOT, SUITE_DIR, LOG_DIR } from "./paths.js";
import { loadConfig } from "./config.js";
import { run } from "./runner.js";

export interface SkippedTest {
  path: string;
  subtestName?: string;
  reason: string;
  isSplit: boolean;
}

/** Return sorted list of vendored test paths (relative to suite/) for a category. */
export function getVendoredTests(category: string): string[] {
  const suiteRoot = path.join(REPO_ROOT, "tests", "node_compat", "suite");
  const prefixPattern = path.join(SUITE_DIR, `test-${category}-*.js`);
  const exactPattern = path.join(SUITE_DIR, `test-${category}.js`);

  const files = new Set<string>();
  for (const f of globSync(prefixPattern)) files.add(f);
  for (const f of globSync(exactPattern)) files.add(f);

  return [...files]
    .map((f) => path.relative(suiteRoot, f))
    .sort();
}

/** Return skipped tests for a category from config.jsonc. */
export function getSkippedTests(category: string): SkippedTest[] {
  const data = loadConfig();
  const tests = data.tests ?? {};
  const result: SkippedTest[] = [];

  for (const [testPath, opts] of Object.entries(tests).sort()) {
    if (!matchesCategory(testPath, category)) continue;

    if (opts.split && opts.subtests) {
      // Split entry: iterate subtests
      for (const [subtestName, subOpts] of Object.entries(opts.subtests)) {
        if (opts.skip || subOpts.skip) {
          result.push({
            path: testPath,
            subtestName,
            reason: subOpts.reason ?? opts.reason ?? "no reason given",
            isSplit: true,
          });
        }
      }
    } else if (opts.skip) {
      // Non-split entry
      result.push({
        path: testPath,
        reason: opts.reason ?? "no reason given",
        isSplit: false,
      });
    }
  }

  return result;
}

/** Convert e.g. 'parallel/test-net-isip.js' to 'parallel__test_net_isip_js'. */
export function testPathToFilter(testPath: string, subtestName?: string): string {
  let filter = testPath
    .replace(/\//g, "__")
    .replace(/\./g, "_")
    .replace(/-/g, "_");
  if (subtestName) {
    filter += `__${subtestName}`;
  }
  return filter;
}

/** Run all enabled (non-ignored) tests for a category. */
export async function runCategoryTests(category: string): Promise<{ ok: boolean; output: string }> {
  const logfile = path.join(LOG_DIR, `run-${Date.now()}.txt`);
  console.log(`  Running ${category} tests...`);
  const { ok, output } = await run(
    ["cargo", "test", "--test", "node_compat", `parallel__test_${category}`, "--", "--nocapture"],
    logfile,
  );
  if (ok) {
    console.log("  ✅ All enabled tests passed");
  } else {
    console.log(`  ❌ Some tests failed (see ${logfile})`);
  }
  return { ok, output };
}

/** Run a single test (including ignored) by its config path. */
export async function runSingleTest(
  testPath: string,
  subtestName?: string,
): Promise<{ ok: boolean; output: string }> {
  const filt = testPathToFilter(testPath, subtestName);
  const logfile = path.join(LOG_DIR, `single-${filt}-${Date.now()}.txt`);
  const label = subtestName ? `${testPath}#${subtestName}` : testPath;
  console.log(`  Running single test: ${label}`);
  return run(
    ["cargo", "test", "--test", "node_compat", filt, "--", "--nocapture", "--include-ignored"],
    logfile,
  );
}

/** Run all category tests including ignored, to find newly-passing ones. */
export async function runCategoryTestsIncludeIgnored(
  category: string,
): Promise<{ ok: boolean; output: string }> {
  const logfile = path.join(LOG_DIR, `newly-passing-${Date.now()}.txt`);
  console.log("  Checking if any other skipped tests now pass...");
  return run(
    [
      "cargo", "test", "--test", "node_compat",
      `parallel__test_${category}`, "--", "--nocapture", "--include-ignored",
    ],
    logfile,
  );
}

function matchesCategory(testPath: string, category: string): boolean {
  return (
    testPath.startsWith(`parallel/test-${category}-`) ||
    testPath === `parallel/test-${category}.js`
  );
}
