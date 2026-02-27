import fs from "node:fs";
import path from "node:path";
import { globSync } from "node:fs";
import { REPO_ROOT, SUITE_DIR, LOG_DIR } from "./paths.js";
import { loadConfig } from "./config.js";
import { run, type RunOptions } from "./runner.js";

export interface SkippedTest {
  path: string;
  subtestName?: string;
  reason: string;
  isSplit: boolean;
}

/** Prefix for skip reasons that require manual intervention — the fix loop won't pick these up. */
export const MANUAL_SKIP_PREFIX = "[manual] ";

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
          const reason = subOpts.reason ?? opts.reason ?? "no reason given";
          if (!reason.startsWith(MANUAL_SKIP_PREFIX)) {
            result.push({
              path: testPath,
              subtestName,
              reason,
              isSplit: true,
            });
          }
        }
      }
    } else if (opts.skip) {
      const reason = opts.reason ?? "no reason given";
      if (!reason.startsWith(MANUAL_SKIP_PREFIX)) {
        // Non-split entry
        result.push({
          path: testPath,
          reason,
          isSplit: false,
        });
      }
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
export async function runCategoryTests(category: string, options?: RunOptions): Promise<{ ok: boolean; output: string }> {
  const logfile = path.join(LOG_DIR, `run-${Date.now()}.txt`);
  console.log(`  Running ${category} tests...`);
  const { ok, output } = await run(
    ["cargo", "test", "--test", "node_compat", `parallel__test_${category}_`, "--", "--nocapture"],
    logfile,
    options,
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
      `parallel__test_${category}_`, "--", "--nocapture", "--include-ignored",
    ],
    logfile,
  );
}

export interface TestCounts {
  /** Enabled (non-skipped) test cases — matches cargo test "passed" count. */
  enabled: number;
  /** Skipped test cases eligible for automated fixing (excludes manual-skip). */
  fixableSkipped: number;
  /** Skipped test cases marked as manual (MANUAL_SKIP_PREFIX). */
  manualSkipped: number;
  /** Total test cases (enabled + fixableSkipped + manualSkipped). Should match cargo "passed + ignored". */
  total: number;
}

/** Return counts of enabled/skipped test cases for a category, accounting for split subtests. */
export function getTestCounts(category: string): TestCounts {
  const data = loadConfig();
  const tests = data.tests ?? {};
  let enabled = 0;
  let fixableSkipped = 0;
  let manualSkipped = 0;

  for (const [testPath, opts] of Object.entries(tests)) {
    if (!matchesCategory(testPath, category)) continue;

    if (opts.split && opts.subtests) {
      for (const [, subOpts] of Object.entries(opts.subtests)) {
        if (!opts.skip && !subOpts.skip) {
          enabled++;
        } else {
          const reason = subOpts.reason ?? opts.reason ?? "";
          if (reason.startsWith(MANUAL_SKIP_PREFIX)) {
            manualSkipped++;
          } else {
            fixableSkipped++;
          }
        }
      }
    } else if (!opts.skip) {
      enabled++;
    } else {
      const reason = opts.reason ?? "";
      if (reason.startsWith(MANUAL_SKIP_PREFIX)) {
        manualSkipped++;
      } else {
        fixableSkipped++;
      }
    }
  }

  return { enabled, fixableSkipped, manualSkipped, total: enabled + fixableSkipped + manualSkipped };
}

/** Return the count of enabled (non-skipped) tests/subtests for a category. */
export function getEnabledTestCount(category: string): number {
  return getTestCounts(category).enabled;
}

function matchesCategory(testPath: string, category: string): boolean {
  return (
    testPath.startsWith(`parallel/test-${category}-`) ||
    testPath === `parallel/test-${category}.js`
  );
}
