import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT, LOG_DIR } from "../paths.js";
import {
  addTestsToConfigSkippedBatch,
  enableTestInConfig,
  enableSubtestInConfig,
  skipSubtestInConfig,
  loadConfig,
  updateSkipReason,
} from "../config.js";
import {
  getVendoredTests,
  getSkippedTests,
  getEnabledTestCount,
  runCategoryTests,
  runCategoryTestsIncludeIgnored,
  runSingleTest,
  testPathToFilter,
  MANUAL_SKIP_PREFIX,
  type SkippedTest,
} from "../tests.js";
import { buildAmpPrompt, runAmp, classifyAmpResult, extractCannotFixReason, isCreditsExhausted, buildPrioritizePrompt, runAmpPrioritize, parsePrioritizeResult } from "../amp.js";
import { commitProgress } from "../git.js";

interface FailingTest {
  path: string;
  subtestName?: string;
}

/**
 * Parse cargo test output to find failing test names and map them back
 * to config.jsonc test paths.
 *
 * Cargo test prints lines like:
 *   test gen_node_compat_tests::parallel__test_foo_bar_js ... FAILED
 *
 * We extract the filter names and match them against enabled config entries
 * using testPathToFilter (which is the canonical forward mapping).
 */
function extractFailingTests(output: string): FailingTest[] {
  // Match both formats:
  //   Finished test: node_compat::gen_node_compat_tests::parallel__test_foo_js  [FAILED]
  //   test gen_node_compat_tests::parallel__test_foo_js ... FAILED
  const pattern = /(?:Finished test:\s+)?(?:node_compat::)?gen_node_compat_tests::(\S+)\s+(?:\[FAILED\]|\.\.\.\s+FAILED)/g;
  const failingFilters = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(output)) !== null) {
    failingFilters.add(match[1]);
  }

  if (failingFilters.size === 0) return [];

  // Build reverse lookup from filter name -> config path using all enabled config entries
  const config = loadConfig();
  const results: FailingTest[] = [];

  for (const [testPath, opts] of Object.entries(config.tests)) {
    if (opts.skip) continue;

    if (opts.split && opts.subtests) {
      // Check each subtest
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

const CREDIT_WAIT_MINUTES = 10;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForCredits(): Promise<void> {
  console.log(`  ⏳ Credits appear exhausted. Waiting ${CREDIT_WAIT_MINUTES} minutes for recharge...`);
  for (let remaining = CREDIT_WAIT_MINUTES; remaining > 0; remaining--) {
    console.log(`     ${remaining} minute${remaining !== 1 ? "s" : ""} remaining...`);
    await sleep(60_000);
  }
  console.log("  ▶ Resuming...");
}

/**
 * Run all tests for a category (including ignored/skipped) and enable any
 * skipped tests that already pass without any code changes.
 * Returns the number of newly-enabled tests.
 */
async function batchCheckSkippedTests(category: string): Promise<number> {
  const skipped = getSkippedTests(category);
  if (skipped.length === 0) return 0;

  console.log("  🔍 Batch-checking all skipped tests for newly-passing ones...");
  const { output } = await runCategoryTestsIncludeIgnored(category);

  // Extract the set of failing filter names from the output
  const pattern = /(?:Finished test:\s+)?(?:node_compat::)?gen_node_compat_tests::(\S+)\s+(?:\[FAILED\]|\.\.\.\s+FAILED)/g;
  const failingFilters = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(output)) !== null) {
    failingFilters.add(match[1]);
  }

  // Find skipped tests whose filter is NOT in the failing set → they pass
  const nowPassing: typeof skipped = [];
  for (const st of skipped) {
    const filter = testPathToFilter(st.path, st.subtestName);
    if (!failingFilters.has(filter)) {
      nowPassing.push(st);
    }
  }

  if (nowPassing.length === 0) {
    console.log("  ℹ No skipped tests are passing yet.");
    return 0;
  }

  console.log(`  🎉 Found ${nowPassing.length} skipped test(s) that now pass!`);
  for (const st of nowPassing) {
    const label = st.subtestName ? `${st.path}#${st.subtestName}` : st.path;
    console.log(`    ✅ ${label}`);
    if (st.subtestName) {
      enableSubtestInConfig(st.path, st.subtestName);
    } else {
      enableTestInConfig(st.path);
    }
  }

  // Verify no regressions after enabling
  console.log("  Verifying after batch-enable...");
  const { ok } = await runCategoryTests(category, { failFast: true });
  if (!ok) {
    console.log("  ⚠ Some newly-enabled tests caused regressions. Re-skipping all.");
    for (const st of nowPassing) {
      if (st.subtestName) {
        skipSubtestInConfig(st.path, st.subtestName, st.reason);
      } else {
        updateSkipReason(st.path, st.reason);
      }
    }
    return 0;
  }

  await commitProgress(category, "batch-enable-passing");
  return nowPassing.length;
}

/**
 * Ask an amp agent to pick the 10 highest-impact tests from the skipped list.
 * Returns a reordered copy of `skipped` with prioritized tests first,
 * or the original order if the agent fails to respond.
 */
async function prioritizeSkippedTests(
  category: string,
  skipped: SkippedTest[],
): Promise<SkippedTest[]> {
  if (skipped.length <= 1) return skipped;

  console.log("  🧠 Asking amp agent to prioritize next tests...");
  const prompt = buildPrioritizePrompt(category, skipped);
  const result = await runAmpPrioritize(prompt, category);

  if (result.isError) {
    console.log("  ⚠ Prioritization agent failed. Using default order.");
    return skipped;
  }

  const prioritized = parsePrioritizeResult(result.output);
  if (!prioritized || prioritized.length === 0) {
    console.log("  ⚠ Could not parse prioritization result. Using default order.");
    return skipped;
  }

  console.log("  📋 Prioritized order:");
  for (const label of prioritized) {
    console.log(`    1. ${label}`);
  }

  // Build a lookup from label -> SkippedTest
  const byLabel = new Map<string, SkippedTest>();
  for (const st of skipped) {
    const label = st.subtestName ? `${st.path}#${st.subtestName}` : st.path;
    byLabel.set(label, st);
  }

  // Reorder: prioritized tests first, then the rest in original order
  const reordered: SkippedTest[] = [];
  const used = new Set<string>();
  for (const label of prioritized) {
    const st = byLabel.get(label);
    if (st && !used.has(label)) {
      reordered.push(st);
      used.add(label);
    }
  }
  for (const st of skipped) {
    const label = st.subtestName ? `${st.path}#${st.subtestName}` : st.path;
    if (!used.has(label)) {
      reordered.push(st);
    }
  }

  return reordered;
}

export async function fixCommand(category: string): Promise<void> {
  fs.mkdirSync(LOG_DIR, { recursive: true });

  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`  fix-node-compat: category='${category}'`);
  console.log("═══════════════════════════════════════════════════════════════");
  console.log();

  // ── Step 1: Ensure all vendored tests are in config.jsonc ──────────────

  console.log(`Step 1: Ensuring all vendored tests for '${category}' are in config.jsonc...`);

  const vendored = getVendoredTests(category);
  const config = loadConfig();
  const missing = vendored.filter((t) => !(t in config.tests));

  if (missing.length === 0) {
    console.log(`  ✅ All ${vendored.length} vendored tests already in config.jsonc`);
  } else {
    addTestsToConfigSkippedBatch(missing, category);
    console.log(`  Added ${missing.length} missing tests to config.jsonc (as skipped)`);
  }

  // ── Step 2: Verify enabled tests pass ──────────────────────────────────

  console.log();
  console.log("Step 2: Verifying currently enabled tests pass...");

  const { ok: baselineOk, output: baselineOutput } = await runCategoryTests(category);
  if (!baselineOk) {
    console.log();
    console.log("  ⚠ Some enabled tests are failing. Marking them as skipped to continue...");

    const failingTests = extractFailingTests(baselineOutput);
    if (failingTests.length === 0) {
      throw new Error("Enabled tests are failing but could not parse which ones. Fix regressions before proceeding.");
    }

    for (const ft of failingTests) {
      const label = ft.subtestName ? `${ft.path}#${ft.subtestName}` : ft.path;
      console.log(`  Skipping failing test: ${label}`);
      if (ft.subtestName) {
        skipSubtestInConfig(ft.path, ft.subtestName, "regression: was enabled but started failing");
      } else {
        updateSkipReason(ft.path, "regression: was enabled but started failing");
      }
    }

    // Verify the remaining enabled tests now pass
    console.log();
    console.log("  Re-verifying after skipping failing tests...");
    const { ok: retryOk } = await runCategoryTests(category, { failFast: true });
    if (!retryOk) {
      throw new Error("Tests still failing after skipping detected failures. Fix regressions before proceeding.");
    }

    await commitProgress(category, "skip-regressions");
  }

  // ── Step 3: Fix loop ───────────────────────────────────────────────────

  console.log();
  console.log("Step 3: Starting fix loop...");
  console.log();

  let iteration = 0;
  let priorityQueue: SkippedTest[] = [];
  while (true) {
    iteration++;

    // Before the first iteration and every 10th iteration, batch-check and re-prioritize
    if (iteration === 1 || iteration % 10 === 1) {
      console.log();
      console.log("── Batch check: looking for skipped tests that already pass ──");
      await batchCheckSkippedTests(category);
      console.log();

      // Re-prioritize the remaining skipped tests
      const freshSkipped = getSkippedTests(category);
      priorityQueue = await prioritizeSkippedTests(category, freshSkipped);
      console.log();
    }

    // Refresh the skipped list and intersect with priority queue to remove stale entries
    const skipped = getSkippedTests(category);
    const passing = getEnabledTestCount(category);

    if (skipped.length === 0) {
      console.log(`🎉 All ${passing} tests for '${category}' are passing! Nothing left to fix.`);
      break;
    }

    // Build a set of currently-skipped labels for quick lookup
    const skippedLabels = new Set(
      skipped.map((st) => (st.subtestName ? `${st.path}#${st.subtestName}` : st.path)),
    );
    // Remove stale entries from priority queue
    priorityQueue = priorityQueue.filter((st) => {
      const label = st.subtestName ? `${st.path}#${st.subtestName}` : st.path;
      return skippedLabels.has(label);
    });

    // If priority queue is empty (all prioritized tests were handled), fall back to skipped order
    if (priorityQueue.length === 0) {
      priorityQueue = skipped;
    }

    console.log("───────────────────────────────────────────────────────────────");
    console.log(`  Iteration ${iteration} — ${passing} passing, ${skipped.length} skipped`);
    console.log("───────────────────────────────────────────────────────────────");
    console.log();
    console.log("Skipped tests:");
    for (const st of skipped) {
      const label = st.subtestName ? `${st.path}#${st.subtestName}` : st.path;
      console.log(`  • ${label}`);
      console.log(`    Reason: ${st.reason}`);
    }
    console.log();

    const target = priorityQueue[0];
    const targetLabel = target.subtestName ? `${target.path}#${target.subtestName}` : target.path;
    console.log(`▶ Attempting to fix: ${targetLabel}`);
    console.log(`  Current skip reason: ${target.reason}`);
    console.log();

    const testFile = path.join(REPO_ROOT, "tests", "node_compat", "suite", target.path);
    if (!fs.existsSync(testFile)) {
      console.log(`  ⚠ Test file not found: ${testFile}`);
      console.log(`    Run tests/node_compat/vendor.sh to fetch the vendored test suite.`);
      updateSkipReason(target.path, "test file not vendored");
      continue;
    }

    // Run the test to check if it already passes
    console.log("  Running test to check current status...");
    const { ok: alreadyPasses, output: failureOutput } = await runSingleTest(target.path, target.subtestName);
    console.log();

    if (alreadyPasses) {
      console.log("  🎉 Test already passes! Enabling in config.jsonc...");
      if (target.subtestName) {
        enableSubtestInConfig(target.path, target.subtestName);
      } else {
        enableTestInConfig(target.path);
      }
      await commitProgress(category, target.path);
      console.log();
      continue;
    }

    // Build prompt and run amp
    const prompt = buildAmpPrompt(category, target.path, target.reason, failureOutput, target.subtestName);
    const ampResult = await runAmp(prompt, category, target.path, iteration);

    console.log();
    console.log("  Amp agent finished. Analyzing result...");
    console.log();

    // Detect credit exhaustion and wait for recharge
    if (ampResult.isError && isCreditsExhausted(ampResult.output)) {
      await waitForCredits();
      continue; // Retry the same test
    }

    const ampOutput = ampResult.output;
    const result = classifyAmpResult(ampOutput);

    // Check if amp actually changed any files
    let hasChanges: boolean;
    try {
      execSync("git diff --quiet HEAD", { cwd: REPO_ROOT, stdio: "pipe" });
      hasChanges = false;
    } catch {
      hasChanges = true;
    }

    if (!hasChanges && result !== "CANNOT_FIX") {
      console.log("  ℹ Amp made no code changes. Marking for manual review.");
      if (target.subtestName) {
        skipSubtestInConfig(target.path, target.subtestName, MANUAL_SKIP_PREFIX + "amp made no code changes");
      } else {
        updateSkipReason(target.path, MANUAL_SKIP_PREFIX + "amp made no code changes");
      }
      await commitProgress(category, target.path);
      console.log();
      continue;
    }

    if (result === "CANNOT_FIX") {
      const reasonNew = MANUAL_SKIP_PREFIX + extractCannotFixReason(ampOutput);
      console.log(`  ⏭ Test cannot be fixed: ${reasonNew}`);
      if (target.subtestName) {
        skipSubtestInConfig(target.path, target.subtestName, reasonNew);
      } else {
        updateSkipReason(target.path, reasonNew);
      }
      console.log();
      await commitProgress(category, target.path);
      console.log();
      continue;
    }

    if (result === "FIXED") {
      console.log("  ✅ Amp reports test is fixed!");
      console.log();

      // Enable first, then verify with a single category run (which includes the target)
      console.log("  Enabling in config.jsonc and verifying...");
      if (target.subtestName) {
        enableSubtestInConfig(target.path, target.subtestName);
      } else {
        enableTestInConfig(target.path);
      }

      console.log(`  Running ${category} tests (includes target)...`);
      const { ok: categoryOk } = await runCategoryTests(category, { failFast: true });
      if (categoryOk) {
        console.log("  ✅ Test passes and no regressions!");
      } else {
        // Revert: re-skip the test since it or something else is failing
        console.log("  ❌ Tests failed after enabling. Reverting to skipped.");
        if (target.subtestName) {
          skipSubtestInConfig(target.path, target.subtestName, MANUAL_SKIP_PREFIX + "amp fix attempt failed verification");
        } else {
          updateSkipReason(target.path, MANUAL_SKIP_PREFIX + "amp fix attempt failed verification");
        }
      }
    } else if (result === "PARTIAL") {
      console.log("  ⚠ Partial progress made. Running regression check...");
      const { ok: regrOk } = await runCategoryTests(category, { failFast: true });
      if (regrOk) {
        console.log("  ✅ No regressions from partial changes.");
      } else {
        console.log("  ❌ Regressions from partial changes. Reverting...");
        execSync("git checkout HEAD -- .", { cwd: REPO_ROOT, stdio: "pipe" });
        if (target.subtestName) {
          skipSubtestInConfig(target.path, target.subtestName, MANUAL_SKIP_PREFIX + "amp partial fix caused regressions");
        } else {
          updateSkipReason(target.path, MANUAL_SKIP_PREFIX + "amp partial fix caused regressions");
        }
      }
    } else {
      // UNCLEAR
      console.log("  ❓ Unclear result from amp. Running regression check...");
      const { ok: regrOk } = await runCategoryTests(category, { failFast: true });
      if (regrOk) {
        console.log("  ✅ No regressions.");
        const { ok: ok2 } = await runSingleTest(target.path, target.subtestName);
        if (ok2) {
          console.log(`  🎉 Test actually passes now! Enabling in config.`);
          if (target.subtestName) {
            enableSubtestInConfig(target.path, target.subtestName);
          } else {
            enableTestInConfig(target.path);
          }
        }
      } else {
        console.log("  ❌ Regressions detected. Reverting...");
        execSync("git checkout HEAD -- .", { cwd: REPO_ROOT, stdio: "pipe" });
        if (target.subtestName) {
          skipSubtestInConfig(target.path, target.subtestName, MANUAL_SKIP_PREFIX + "amp fix caused regressions");
        } else {
          updateSkipReason(target.path, MANUAL_SKIP_PREFIX + "amp fix caused regressions");
        }
      }
    }

    console.log();
    await commitProgress(category, target.path);
    console.log();
  }

  console.log();
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`  Done! Category '${category}' processing complete.`);
  console.log(`  Logs in: ${LOG_DIR}`);
  console.log("═══════════════════════════════════════════════════════════════");
}
