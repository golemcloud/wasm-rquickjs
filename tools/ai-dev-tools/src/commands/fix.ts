import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT, LOG_DIR } from "../paths.js";
import {
  addTestsToConfigSkippedBatch,
  enableTestInConfig,
  loadConfig,
  updateSkipReason,
} from "../config.js";
import {
  getVendoredTests,
  getSkippedTests,
  runCategoryTests,
  runSingleTest,
  testPathToFilter,
} from "../tests.js";
import { buildAmpPrompt, runAmp, classifyAmpResult, extractCannotFixReason, isCreditsExhausted } from "../amp.js";
import { commitProgress } from "../git.js";

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
function extractFailingTests(output: string): string[] {
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
  const results: string[] = [];

  for (const [testPath, opts] of Object.entries(config.tests)) {
    if (opts.skip) continue;
    const filter = testPathToFilter(testPath);
    if (failingFilters.has(filter)) {
      results.push(testPath);
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

    for (const testPath of failingTests) {
      console.log(`  Skipping failing test: ${testPath}`);
      updateSkipReason(testPath, "regression: was enabled but started failing");
    }

    // Verify the remaining enabled tests now pass
    console.log();
    console.log("  Re-verifying after skipping failing tests...");
    const { ok: retryOk } = await runCategoryTests(category);
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
  while (true) {
    iteration++;
    const skipped = getSkippedTests(category);

    if (skipped.length === 0) {
      console.log(`🎉 All tests for '${category}' are passing! Nothing left to fix.`);
      break;
    }

    console.log("───────────────────────────────────────────────────────────────");
    console.log(`  Iteration ${iteration} — ${skipped.length} skipped tests remaining`);
    console.log("───────────────────────────────────────────────────────────────");
    console.log();
    console.log("Skipped tests:");
    for (const st of skipped) {
      console.log(`  • ${st.path}`);
      console.log(`    Reason: ${st.reason}`);
    }
    console.log();

    const target = skipped[0];
    console.log(`▶ Attempting to fix: ${target.path}`);
    console.log(`  Current skip reason: ${target.reason}`);
    console.log();

    const testFile = path.join(REPO_ROOT, "tests", "node_compat", "suite", target.path);
    if (!fs.existsSync(testFile)) {
      console.log(`  ⚠ Test file not found: ${testFile} — skipping`);
      continue;
    }

    // Run the test to check if it already passes
    console.log("  Running test to check current status...");
    const { ok: alreadyPasses, output: failureOutput } = await runSingleTest(target.path);
    console.log();

    if (alreadyPasses) {
      console.log("  🎉 Test already passes! Enabling in config.jsonc...");
      enableTestInConfig(target.path);
      await commitProgress(category, target.path);
      console.log();
      continue;
    }

    // Build prompt and run amp
    const prompt = buildAmpPrompt(category, target.path, target.reason, failureOutput);
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
      console.log("  ℹ Amp made no code changes. Skipping verification and moving on.");
      console.log();
      continue;
    }

    if (result === "CANNOT_FIX") {
      const reasonNew = extractCannotFixReason(ampOutput);
      console.log(`  ⏭ Test cannot be fixed: ${reasonNew}`);
      updateSkipReason(target.path, reasonNew);
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
      enableTestInConfig(target.path);

      console.log(`  Running ${category} tests (includes target)...`);
      const { ok: categoryOk } = await runCategoryTests(category);
      if (categoryOk) {
        console.log("  ✅ Test passes and no regressions!");
      } else {
        // Revert: re-skip the test since it or something else is failing
        console.log("  ❌ Tests failed after enabling. Reverting to skipped.");
        updateSkipReason(target.path, "amp fix attempt failed verification");
      }
    } else if (result === "PARTIAL") {
      console.log("  ⚠ Partial progress made. Running regression check...");
      const { ok: regrOk } = await runCategoryTests(category);
      if (regrOk) {
        console.log("  ✅ No regressions from partial changes.");
      } else {
        throw new Error("Regressions from partial changes! Stopping.");
      }
    } else {
      // UNCLEAR
      console.log("  ❓ Unclear result from amp. Running regression check...");
      const { ok: regrOk } = await runCategoryTests(category);
      if (regrOk) {
        console.log("  ✅ No regressions.");
        const { ok: ok2 } = await runSingleTest(target.path);
        if (ok2) {
          console.log(`  🎉 Test actually passes now! Enabling in config.`);
          enableTestInConfig(target.path);
        }
      } else {
        throw new Error("Regressions detected. Stopping.");
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
