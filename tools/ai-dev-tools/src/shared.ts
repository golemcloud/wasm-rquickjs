import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT, LOG_DIR } from "./paths.js";
import { loadConfig } from "./config.js";
import { testPathToFilter, runSpecificTests } from "./tests.js";

export const CARGO_FAIL_RE = /(?:Finished test:\s+)?(?:node_compat::)?gen_node_compat_tests::(\S+)\s+(?:\[FAILED\]|\.\.\.\s+FAILED)/g;

/** Revert all working tree changes including untracked files created by Amp. */
export function revertWorkspace(): void {
  execSync("git checkout HEAD -- .", { cwd: REPO_ROOT, stdio: "pipe" });
  execSync("git clean -fd", { cwd: REPO_ROOT, stdio: "pipe" });
}

export let stopRequested = false;

export function setStopRequested(value: boolean): void {
  stopRequested = value;
}

export function setupGracefulStop(): () => void {
  stopRequested = false;

  if (!process.stdin.isTTY) {
    return () => {};
  }

  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf8");
  process.stdin.unref();

  const handler = (key: string) => {
    if (key === "q" || key === "s") {
      stopRequested = true;
      console.log("\n  🛑 Stop requested — will finish current test and exit gracefully.");
      console.log("     (Press 'q' again or Ctrl+C to force-exit immediately)\n");
      // Replace handler with force-exit on next press
      process.stdin.removeListener("data", handler);
      process.stdin.on("data", () => {
        console.log("\n  ⚡ Force-exiting.");
        process.exit(1);
      });
    }
  };

  process.stdin.on("data", handler);
  return () => {
    try {
      process.stdin.removeListener("data", handler);
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
      }
      process.stdin.pause();
    } catch (e) {
      console.error("  ⚠ cleanupStop error (non-fatal):", e);
    }
  };
}

export interface FailingTest {
  path: string;
  subtestName?: string;
}

/**
 * Parse cargo test output to find failing test names and map them back
 * to config.jsonc test paths.
 */
export function extractFailingTests(output: string): FailingTest[] {
  const pattern = new RegExp(CARGO_FAIL_RE.source, CARGO_FAIL_RE.flags);
  const failingFilters = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(output)) !== null) {
    failingFilters.add(match[1]);
  }

  if (failingFilters.size === 0) return [];

  const config = loadConfig();
  const results: FailingTest[] = [];

  for (const [testPath, opts] of Object.entries(config.tests)) {
    if (opts.skip) continue;

    if (opts.split && opts.subtests) {
      for (const [subtestName, subOpts] of Object.entries(opts.subtests)) {
        if (subOpts.skip) continue;
        const filter = testPathToFilter(testPath, subtestName);
        if (failingFilters.has(filter)) {
          results.push({ path: testPath, subtestName });
        }
      }
    } else {
      const filter = testPathToFilter(testPath);
      if (failingFilters.has(filter)) {
        results.push({ path: testPath });
      }
    }
  }

  return results;
}

/**
 * Extract failing filter names from cargo test output.
 * Returns a Set of filter strings (not mapped back to config paths).
 */
export function extractFailingFilters(output: string): Set<string> {
  const pattern = new RegExp(CARGO_FAIL_RE.source, CARGO_FAIL_RE.flags);
  const filters = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(output)) !== null) {
    filters.add(match[1]);
  }
  return filters;
}

const FLAKY_MD = path.join(LOG_DIR, "flaky.md");
const FLAKY_RETRIES = 2;

/** Append flaky test entries to flaky.md */
export function recordFlakyTests(tests: FailingTest[], targetLabel: string): void {
  const header = !fs.existsSync(FLAKY_MD)
    ? "# Flaky Tests\n\nTests that failed during regression checks but passed on retry.\n\n"
    : "";
  const timestamp = new Date().toISOString();
  const entries = tests
    .map((t) => {
      const label = t.subtestName ? `${t.path}#${t.subtestName}` : t.path;
      return `- ${label}`;
    })
    .join("\n");
  const block = `${header}## ${timestamp} (while fixing ${targetLabel})\n\n${entries}\n\n`;
  try {
    fs.appendFileSync(FLAKY_MD, block);
  } catch (e) {
    console.log(`  ⚠ Failed to write flaky.md: ${e}`);
  }
}

/**
 * Retry only the failing tests to check if they're flaky.
 * Returns true if all failures were flaky (passed on at least one retry).
 */
export async function checkIfFlaky(failingTests: FailingTest[]): Promise<boolean> {
  for (let retry = 1; retry <= FLAKY_RETRIES; retry++) {
    console.log(`  🔄 Flaky retry ${retry}/${FLAKY_RETRIES}: re-running ${failingTests.length} failing test(s)...`);
    const { ok } = await runSpecificTests(failingTests);
    if (ok) {
      console.log(`  ✅ All previously-failing tests passed on retry ${retry}. They appear to be flaky.`);
      return true;
    }
  }
  console.log(`  ❌ Failures persisted after ${FLAKY_RETRIES} retries. Not flaky.`);
  return false;
}

const CREDIT_WAIT_MINUTES = 10;

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForCredits(): Promise<void> {
  console.log(`  ⏳ Credits appear exhausted. Waiting ${CREDIT_WAIT_MINUTES} minutes for recharge...`);
  for (let remaining = CREDIT_WAIT_MINUTES; remaining > 0; remaining--) {
    console.log(`     ${remaining} minute${remaining !== 1 ? "s" : ""} remaining...`);
    await sleep(60_000);
  }
  console.log("  ▶ Resuming...");
}

/** Check if amp actually changed any files (including new untracked files). */
export function hasWorkspaceChanges(): boolean {
  try {
    const status = execSync("git status --porcelain", { cwd: REPO_ROOT, encoding: "utf-8" });
    return status.trim().length > 0;
  } catch {
    return true;
  }
}
