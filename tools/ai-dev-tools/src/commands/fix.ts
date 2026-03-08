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
  getTestCounts,
  runCategoryTests,
  runSingleTest,
  runSpecificTests,
  testPathToFilter,
  MANUAL_SKIP_PREFIX,
  type SkippedTest,
} from "../tests.js";
import { buildAmpPrompt, runAmp, classifyAmpResult, extractCannotFixReason, isCreditsExhausted, buildPrioritizePrompt, runAmpPrioritize, parsePrioritizeResult } from "../amp.js";
import { commitProgress } from "../git.js";
import {
  CARGO_FAIL_RE,
  revertWorkspace,
  stopRequested,
  setupGracefulStop,
  type FailingTest,
  extractFailingTests,
  recordFlakyTests,
  checkIfFlaky,
  waitForCredits,
} from "../shared.js";

/**
 * Run a specific set of skipped tests (including ignored) and enable any
 * that already pass without any code changes.
 * Returns the number of newly-enabled tests.
 */
async function batchCheckSkippedTests(category: string, testsToCheck?: SkippedTest[]): Promise<number> {
  const skipped = testsToCheck ?? getSkippedTests(category);
  if (skipped.length === 0) return 0;

  console.log(`  🔍 Batch-checking ${skipped.length} skipped test(s) for newly-passing ones...`);
  const { ok: batchOk, output } = await runSpecificTests(skipped, { includeIgnored: true });

  // Extract the set of failing filter names from the output
  const pattern = new RegExp(CARGO_FAIL_RE.source, CARGO_FAIL_RE.flags);
  const failingFilters = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(output)) !== null) {
    failingFilters.add(match[1]);
  }

  // If the run failed, don't trust "absence from failing set" as evidence of passing.
  // Tests may not have run at all (compilation error, harness crash, partial abort).
  if (!batchOk) {
    console.log("  ⚠ Test run failed. Skipping batch-check to avoid false positives.");
    return 0;
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
  for (let i = 0; i < prioritized.length; i++) {
    console.log(`    ${i + 1}. ${prioritized[i]}`);
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
  // Global safety nets — convert silent exits into visible diagnostics
  process.on("unhandledRejection", (err) => {
    console.error("\n⚠ UNHANDLED REJECTION:", err);
  });
  process.on("uncaughtException", (err) => {
    console.error("\n⚠ UNCAUGHT EXCEPTION:", err);
    process.exit(1);
  });
  process.on("beforeExit", (code) => {
    console.error(`\n⚠ beforeExit (code=${code}) — event loop drained unexpectedly`);
  });
  process.on("exit", (code) => {
    console.error(`\n⚠ exit (code=${code})`);
  });
  for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"] as const) {
    process.on(sig, () => {
      console.error(`\n⚠ received signal: ${sig}`);
    });
  }

  const cleanupStop = setupGracefulStop();

  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`  fix-node-compat: category='${category}'`);
  console.log("  Press 'q' to stop after the current test finishes.");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log();

  // ── Step 1: Ensure all vendored tests are in config.jsonc ──────────────

  console.log(`Step 1: Ensuring all vendored tests for '${category}' are in config.jsonc...`);

  const vendored = getVendoredTests(category);
  const config = loadConfig();
  const missing = vendored.filter((t) => !(t in config.tests));

  if (missing.length === 0) {
    const initCounts = getTestCounts(category);
    console.log(`  ✅ All ${vendored.length} vendored test files already in config.jsonc (${initCounts.total} test cases with subtests)`);
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

  const BATCH_SIZE = 30;
  const MAX_ATTEMPTS = 2;
  const attemptCounts = new Map<string, number>();
  let round = 0;

  outer: while (true) {
    if (stopRequested) break;

    round++;

    // Get all fixable skipped tests and select a batch
    const allSkipped = getSkippedTests(category);
    if (allSkipped.length === 0) {
      const counts = getTestCounts(category);
      console.log(`🎉 All ${counts.enabled} test cases for '${category}' are passing! No fixable tests remaining.`);
      console.log(`   (${counts.manualSkipped} tests marked for manual review)`);
      break;
    }

    // Prioritize and select the batch — boost timeout tests to the front
    const prioritized = await prioritizeSkippedTests(category, allSkipped);
    prioritized.sort((a, b) => {
      const aTimeout = /timed?\s*out/i.test(a.reason) ? 0 : 1;
      const bTimeout = /timed?\s*out/i.test(b.reason) ? 0 : 1;
      return aTimeout - bTimeout;
    });
    const batch = prioritized.slice(0, BATCH_SIZE);

    // Batch-check only the selected batch for ones that already pass
    console.log();
    console.log("── Batch check: looking for skipped tests that already pass ──");
    await batchCheckSkippedTests(category, batch);
    console.log();
    const batchLabels = new Set(
      batch.map((st) => (st.subtestName ? `${st.path}#${st.subtestName}` : st.path)),
    );

    console.log();
    console.log(`  Round ${round}: ${allSkipped.length} fixable tests total, working on batch of ${batch.length}`);
    console.log();

    let iteration = 0;
    let priorityQueue = batch;

    while (true) {
      if (stopRequested) {
        console.log("  🛑 Graceful stop: finishing up after completing the previous test.");
        break outer;
      }

      iteration++;

      // Every 10 iterations, batch-check for newly-passing tests
      if (iteration > 1 && iteration % 10 === 1) {
        console.log();
        console.log("── Batch check: looking for skipped tests that already pass ──");
        await batchCheckSkippedTests(category, priorityQueue);
        console.log();
      }

      // Refresh the skipped list and intersect with batch to remove handled entries
      const skipped = getSkippedTests(category);
      const counts = getTestCounts(category);

      if (skipped.length === 0) {
        console.log(`🎉 All ${counts.enabled} test cases for '${category}' are passing! No fixable tests remaining.`);
        console.log(`   (${counts.manualSkipped} tests marked for manual review)`);
        break outer;
      }

      // Build a set of currently-skipped labels for quick lookup
      const skippedLabels = new Set(
        skipped.map((st) => (st.subtestName ? `${st.path}#${st.subtestName}` : st.path)),
      );
      // Remove stale entries from priority queue (must still be skipped AND in current batch)
      priorityQueue = priorityQueue.filter((st) => {
        const label = st.subtestName ? `${st.path}#${st.subtestName}` : st.path;
        return skippedLabels.has(label) && batchLabels.has(label);
      });

      // If all tests in the batch have been handled, break inner loop to restart with next batch
      if (priorityQueue.length === 0) {
        const remainingFixable = getSkippedTests(category).length;
        console.log(`  ✅ Current batch complete. ${remainingFixable} fixable test(s) remain.`);
        if (remainingFixable > 0) {
          console.log("  🔄 Restarting with next batch...");
        }
        break;
      }

      const totalSkipped = counts.fixableSkipped + counts.manualSkipped;
      console.log("───────────────────────────────────────────────────────────────");
      console.log(`  Round ${round}, iteration ${iteration} — ${counts.total} test cases: ${counts.enabled} passing, ${totalSkipped} skipped (${skipped.length} fixable, batch ${priorityQueue.length})`);
      console.log("───────────────────────────────────────────────────────────────");
      console.log();
      console.log(`Fixable skipped tests: ${skipped.length} remaining (batch: ${priorityQueue.length})`);
      console.log();

    const target = priorityQueue[0];
    const targetLabel = target.subtestName ? `${target.path}#${target.subtestName}` : target.path;

    // Track attempts per test — try smart first, then deep, then give up
    const attempts = (attemptCounts.get(targetLabel) ?? 0) + 1;
    attemptCounts.set(targetLabel, attempts);
    const ampMode = attempts === 1 ? "smart" : "deep";
    if (attempts > MAX_ATTEMPTS) {
      console.log(`  ⏭ ${targetLabel}: exceeded ${MAX_ATTEMPTS} attempts (smart + deep). Marking for manual review.`);
      if (target.subtestName) {
        skipSubtestInConfig(target.path, target.subtestName, MANUAL_SKIP_PREFIX + `amp failed after ${MAX_ATTEMPTS} attempts`);
      } else {
        updateSkipReason(target.path, MANUAL_SKIP_PREFIX + `amp failed after ${MAX_ATTEMPTS} attempts`);
      }
      await commitProgress(category, target.path);
      continue;
    }

    console.log(`▶ Attempting to fix: ${targetLabel} (attempt ${attempts}/${MAX_ATTEMPTS}, mode: ${ampMode})`);
    console.log(`  Current skip reason: ${target.reason}`);
    console.log();

    const testFile = path.join(REPO_ROOT, "tests", "node_compat", "suite", target.path);
    if (!fs.existsSync(testFile)) {
      console.log(`  ⚠ Test file not found: ${testFile}`);
      console.log(`    Run tests/node_compat/vendor.sh to fetch the vendored test suite.`);
      if (target.subtestName) {
        skipSubtestInConfig(target.path, target.subtestName, MANUAL_SKIP_PREFIX + "test file not vendored");
      } else {
        updateSkipReason(target.path, MANUAL_SKIP_PREFIX + "test file not vendored");
      }
      await commitProgress(category, target.path);
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
    const ampResult = await runAmp(prompt, category, target.path, iteration, ampMode);

    console.log();
    console.log("  Amp agent finished. Analyzing result...");
    console.log();

    // Detect credit exhaustion — don't count this as a real attempt
    if (ampResult.isError && isCreditsExhausted(ampResult.output)) {
      attemptCounts.set(targetLabel, attempts - 1);
      await waitForCredits();
      continue; // Retry the same test
    }

    const ampOutput = ampResult.output;
    const result = classifyAmpResult(ampOutput);

    // Check if amp actually changed any files (including new untracked files)
    let hasChanges: boolean;
    try {
      const status = execSync("git status --porcelain", { cwd: REPO_ROOT, encoding: "utf-8" });
      hasChanges = status.trim().length > 0;
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
      // Revert any code changes amp made before updating config
      if (hasChanges) {
        console.log("  ↩ Reverting code changes from CANNOT_FIX attempt...");
        revertWorkspace();
      }
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

      // Run without failFast so we see ALL failing tests, not just the first
      console.log(`  Running ${category} tests (includes target)...`);
      const { ok: categoryOk, output: verifyOutput } = await runCategoryTests(category);
      if (categoryOk) {
        console.log("  ✅ Test passes and no regressions!");
      } else {
        // Extract which tests failed and check if they're just flaky
        const regressions = extractFailingTests(verifyOutput);

        // If the target test itself is among the failures, the fix didn't work — don't treat as flaky
        const targetInRegressions = regressions.some(
          (r) => r.path === target.path && r.subtestName === target.subtestName,
        );

        if (targetInRegressions || regressions.length === 0) {
          if (targetInRegressions) {
            console.log("  ❌ Target test itself failed verification. Reverting...");
          } else {
            console.log("  ❌ Tests failed but could not identify which ones. Reverting...");
          }
          revertWorkspace();
          if (target.subtestName) {
            skipSubtestInConfig(target.path, target.subtestName, MANUAL_SKIP_PREFIX + "amp fix attempt failed verification");
          } else {
            updateSkipReason(target.path, MANUAL_SKIP_PREFIX + "amp fix attempt failed verification");
          }
        } else {
          console.log(`  ⚠ ${regressions.length} other test(s) failed. Checking if they're flaky...`);
          const flaky = await checkIfFlaky(regressions);
          if (flaky) {
            console.log("  ✅ All failures were flaky. Accepting the fix.");
            recordFlakyTests(regressions, targetLabel);
          } else {
            console.log("  ❌ Real regressions. Reverting code and re-skipping...");
            revertWorkspace();
            if (target.subtestName) {
              skipSubtestInConfig(target.path, target.subtestName, MANUAL_SKIP_PREFIX + "amp fix attempt failed verification");
            } else {
              updateSkipReason(target.path, MANUAL_SKIP_PREFIX + "amp fix attempt failed verification");
            }
          }
        }
      }
    } else if (result === "PARTIAL") {
      console.log("  ⚠ Partial progress made. Running regression check...");
      const { ok: regrOk } = await runCategoryTests(category, { failFast: true });
      if (regrOk) {
        console.log("  ✅ No regressions from partial changes. Rotating test to end of queue.");
        priorityQueue = [...priorityQueue.slice(1), priorityQueue[0]];
      } else {
        console.log("  ❌ Regressions from partial changes. Reverting...");
        revertWorkspace();
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
        } else {
          console.log("  ℹ Test still fails. Rotating to end of queue.");
          priorityQueue = [...priorityQueue.slice(1), priorityQueue[0]];
        }
      } else {
        console.log("  ❌ Regressions detected. Reverting...");
        revertWorkspace();
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
  }

  cleanupStop();
  console.log();
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`  Done! Category '${category}' processing complete.`);
  console.log(`  Logs in: ${LOG_DIR}`);
  console.log("═══════════════════════════════════════════════════════════════");
}
