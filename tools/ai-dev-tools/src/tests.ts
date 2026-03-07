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

/**
 * Map from report-style module names (snake_case, as shown in the Rust
 * node_compat_report) to the list of filename prefixes used in the vendored
 * test suite.  For example the report module "test_runner" corresponds to
 * filenames like `test-runner-*.js`.
 *
 * Categories whose module name already matches the filename prefix (e.g.
 * "crypto" → `test-crypto-*.js`) don't need an entry here.
 */
const CATEGORY_ALIASES: Record<string, string[]> = {
  test_runner:          ["runner"],
  string_decoder:       ["string-decoder", "stringdecoder"],
  child_process:        ["child-process", "child_process"],
  worker_threads:       ["worker", "worker-threads"],
  async_hooks:          ["async-hooks", "async-context", "async-local-storage", "async-wrap"],
  perf_hooks:           ["perf", "performance"],
  diagnostics_channel:  ["diagnostics"],
  trace_events:         ["trace"],
  abort:                ["abortcontroller", "abortsignal", "aborted"],
  module:               ["module", "require", "esm", "cjs", "loaders"],
  events:               ["events", "event-emitter"],
  fs:                   ["fs", "file"],
  http:                 ["http", "http2", "https"],
  tls:                  ["tls", "ssl"],
  timers:               ["timers", "settimeout", "setinterval", "setimmediate"],
  stream:               ["stream", "readable", "writable", "transform", "duplex"],
  encoding:             ["encoding", "textdecoder", "textencoder"],
  fetch:                ["fetch", "response", "request", "headers"],
  inspector:            ["inspector", "debugger"],
};

/**
 * Return the list of filename prefixes that should be matched for a given
 * category.  Accepts both the filename prefix itself ("runner") and the
 * report-style module name ("test_runner").
 */
function categoryPrefixes(category: string): string[] {
  // Direct alias lookup (e.g. "test_runner" → ["runner"])
  if (CATEGORY_ALIASES[category]) return CATEGORY_ALIASES[category];

  // Check if the category is itself one of the alias values and return it as-is
  for (const prefixes of Object.values(CATEGORY_ALIASES)) {
    if (prefixes.includes(category)) return [category];
  }

  // No alias — the category name is the filename prefix (e.g. "crypto")
  return [category];
}

/** All suite subdirectories to scan for vendored test files. */
const SUITE_DIRS = ["parallel", "sequential", "es-module"];

/** Return sorted list of vendored test paths (relative to suite/) for a category. */
export function getVendoredTests(category: string): string[] {
  const suiteRoot = path.join(REPO_ROOT, "tests", "node_compat", "suite");
  const prefixes = categoryPrefixes(category);

  const files = new Set<string>();
  for (const suiteDir of SUITE_DIRS) {
    const dir = path.join(suiteRoot, suiteDir);
    for (const prefix of prefixes) {
      for (const f of globSync(path.join(dir, `test-${prefix}-*.js`))) files.add(f);
      for (const f of globSync(path.join(dir, `test-${prefix}.js`))) files.add(f);
    }
  }

  return [...files]
    .map((f) => path.relative(suiteRoot, f))
    .sort();
}

/** Return ALL vendored test paths (relative to suite/) across all suites. */
export function getAllVendoredTests(): string[] {
  const suiteRoot = path.join(REPO_ROOT, "tests", "node_compat", "suite");
  const files: string[] = [];
  for (const suiteDir of SUITE_DIRS) {
    const dir = path.join(suiteRoot, suiteDir);
    for (const f of globSync(path.join(dir, "*.js"))) {
      files.push(path.relative(suiteRoot, f));
    }
  }
  return files.sort();
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

/** Build cargo test filter patterns for a category. */
function categoryTestFilters(category: string): string[] {
  const filters: string[] = [];
  for (const prefix of categoryPrefixes(category)) {
    const p = prefix.replace(/-/g, "_");
    for (const suite of SUITE_DIRS) {
      const s = suite.replace(/-/g, "_");
      filters.push(`${s}__test_${p}_`);
    }
  }
  return filters;
}

/** Run all enabled (non-ignored) tests for a category. */
export async function runCategoryTests(category: string, options?: RunOptions): Promise<{ ok: boolean; output: string }> {
  const logfile = path.join(LOG_DIR, `run-${Date.now()}.txt`);
  console.log(`  Running ${category} tests...`);
  const filters = categoryTestFilters(category);
  const { ok, output } = await run(
    ["cargo", "test", "--test", "node_compat", ...filters, "--", "--nocapture"],
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


/** Run a specific set of tests (by path/subtest) in a single cargo test invocation.
 *  Uses test-r's support for multiple filter arguments. */
export async function runSpecificTests(
  tests: { path: string; subtestName?: string }[],
  options?: RunOptions & { includeIgnored?: boolean },
): Promise<{ ok: boolean; output: string }> {
  if (tests.length === 0) return { ok: true, output: "" };

  const filters = tests.map((t) => testPathToFilter(t.path, t.subtestName));
  const logfile = path.join(LOG_DIR, `specific-${Date.now()}.txt`);
  console.log(`  Running ${tests.length} specific test(s)...`);

  const args = ["cargo", "test", "--test", "node_compat", "--", "--nocapture"];
  if (options?.includeIgnored) args.push("--include-ignored");
  args.push(...filters);

  return run(args, logfile, options);
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
  return categoryPrefixes(category).some((prefix) =>
    SUITE_DIRS.some(
      (suite) =>
        testPath.startsWith(`${suite}/test-${prefix}-`) ||
        testPath === `${suite}/test-${prefix}.js`,
    ),
  );
}
