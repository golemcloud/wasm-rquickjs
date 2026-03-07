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
  runSpecificTests,
  testPathToFilter,
  MANUAL_SKIP_PREFIX,
  type SkippedTest,
} from "../tests.js";
import { buildBatchPrompt, runAmp, classifyAmpResult, isCreditsExhausted } from "../amp.js";
import { commitProgress } from "../git.js";
import {
  revertWorkspace,
  stopRequested,
  setupGracefulStop,
  extractFailingFilters,
  extractFailingTests,
  recordFlakyTests,
  checkIfFlaky,
  waitForCredits,
  hasWorkspaceChanges,
} from "../shared.js";

// ── Group definitions ────────────────────────────────────────────────────────

interface GroupDef {
  /** Regex patterns to match against the filename (without directory prefix). */
  patterns: RegExp[];
  /** If true, auto-skip all tests in this group as fundamentally impossible. */
  autoSkip?: string;
}

const HTTP_GROUPS: Record<string, GroupDef> = {
  "outgoing-message": {
    patterns: [/^test-http-outgoing-/],
  },
  "incoming-message": {
    patterns: [/^test-http-incoming-/],
  },
  "headers": {
    patterns: [/^test-http-header-/, /^test-http-invalidheader/, /^test-http-blank-header/, /^test-http-automatic-header/],
  },
  "abort": {
    patterns: [/^test-http-abort-/, /^test-http-client-abort/, /^test-http-aborted/],
  },
  "agent": {
    patterns: [/^test-http-agent-/],
  },
  "client-body": {
    patterns: [/^test-http-client-upload/, /^test-http-client-pipe/, /^test-http-client-encoding/],
  },
  "request-options": {
    patterns: [/^test-http-url-/, /^test-http-request-/, /^test-http-hostname-/, /^test-http-host-/, /^test-http-localaddress/],
  },
  "encoding-framing": {
    patterns: [/^test-http-chunked/, /^test-http-chunk-/, /^test-http-content/, /^test-http-transfer-/],
  },
  "response": {
    patterns: [/^test-http-response-/, /^test-http-head-/, /^test-http-status-/, /^test-http-allow-/, /^test-http-no-content/, /^test-http-date-/, /^test-http-early-/, /^test-http-information-/],
  },
  "keep-alive": {
    patterns: [/^test-http-keep-alive/, /^test-http-1\.0/, /^test-http-should-keep/, /^test-http-pipeline/],
  },
  "timeout": {
    patterns: [/^test-http-set-timeout/, /^test-http-timeout/],
  },
  "compat-parser": {
    patterns: [/^test-http-compat-/, /^test-http-generic-/, /^test-http-parser/],
  },
  "client-lifecycle": {
    patterns: [/^test-http-client-timeout/, /^test-http-client-close/],
  },
  // Auto-skip groups — fundamentally impossible in WASM
  "server": {
    patterns: [/^test-http-server-/, /^test-http-bind-/, /^test-http-listening/],
    autoSkip: "[manual] requires HTTP server (net.listen) which is unavailable in WASM",
  },
  "transport": {
    patterns: [/^test-http-unix-socket/, /^test-http-proxy/, /^test-http-pipe-/, /^test-http-wget/],
    autoSkip: "[manual] requires unix sockets / proxy / external tools unavailable in WASM",
  },
  "upgrade-connect": {
    patterns: [/^test-http-upgrade-/, /^test-http-connect/, /^test-http-after-connect/],
    autoSkip: "[manual] requires HTTP CONNECT/upgrade which is unavailable via wasi:http",
  },
  "http2-https": {
    patterns: [/^test-http2-/, /^test-https-/],
    autoSkip: "[manual] http2/https not implemented",
  },
  // Client-misc is a catch-all for test-http-client-* not caught above
  "client-misc": {
    patterns: [/^test-http-client-/],
  },
};

const MAX_GROUP_SIZE = 10;

interface TestGroup {
  name: string;
  tests: SkippedTest[];
}

/** Extract the filename from a test path like "parallel/test-http-agent-foo.js" */
function testFilename(testPath: string): string {
  return path.basename(testPath);
}

/** Assign a skipped test to a group. Returns group name or "other". */
function assignGroup(test: SkippedTest): string {
  const filename = testFilename(test.path);
  for (const [groupName, def] of Object.entries(HTTP_GROUPS)) {
    if (def.patterns.some((re) => re.test(filename))) {
      return groupName;
    }
  }
  return "other";
}

/** Group skipped tests into batches by pattern. Split large groups. */
function groupTests(skipped: SkippedTest[]): TestGroup[] {
  const byGroup = new Map<string, SkippedTest[]>();

  for (const test of skipped) {
    const group = assignGroup(test);
    if (!byGroup.has(group)) byGroup.set(group, []);
    byGroup.get(group)!.push(test);
  }

  const result: TestGroup[] = [];
  for (const [name, tests] of byGroup) {
    if (tests.length <= MAX_GROUP_SIZE) {
      result.push({ name, tests });
    } else {
      // Split into sub-batches
      for (let i = 0; i < tests.length; i += MAX_GROUP_SIZE) {
        const chunk = tests.slice(i, i + MAX_GROUP_SIZE);
        const suffix = Math.floor(i / MAX_GROUP_SIZE) + 1;
        result.push({ name: `${name}-${suffix}`, tests: chunk });
      }
    }
  }

  // Sort: non-auto-skip groups first, then by size descending (attack biggest groups first)
  result.sort((a, b) => {
    const aSkip = isAutoSkipGroup(a.name) ? 1 : 0;
    const bSkip = isAutoSkipGroup(b.name) ? 1 : 0;
    if (aSkip !== bSkip) return aSkip - bSkip;
    return b.tests.length - a.tests.length;
  });

  return result;
}

function isAutoSkipGroup(groupName: string): boolean {
  // Strip numeric suffix for split groups
  const baseName = groupName.replace(/-\d+$/, "");
  return HTTP_GROUPS[baseName]?.autoSkip !== undefined;
}

function getAutoSkipReason(groupName: string): string | undefined {
  const baseName = groupName.replace(/-\d+$/, "");
  return HTTP_GROUPS[baseName]?.autoSkip;
}

// ── Triage phase: auto-skip impossible groups ────────────────────────────────

async function triageAutoSkipGroups(category: string): Promise<number> {
  const skipped = getSkippedTests(category);
  let skippedCount = 0;

  for (const test of skipped) {
    const group = assignGroup(test);
    const reason = getAutoSkipReason(group);
    if (reason) {
      if (test.subtestName) {
        skipSubtestInConfig(test.path, test.subtestName, reason);
      } else {
        updateSkipReason(test.path, reason);
      }
      skippedCount++;
    }
  }

  if (skippedCount > 0) {
    console.log(`  Auto-skipped ${skippedCount} tests in fundamentally impossible groups.`);
    await commitProgress(category, "auto-skip-impossible-groups");
  }

  return skippedCount;
}

// ── Pre-filter: skip --expose-internals tests ────────────────────────────────

async function skipExposeInternalsTests(category: string): Promise<number> {
  const skipped = getSkippedTests(category);
  let count = 0;

  for (const test of skipped) {
    const testFile = path.join(REPO_ROOT, "tests", "node_compat", "suite", test.path);
    if (!fs.existsSync(testFile)) continue;

    try {
      const content = fs.readFileSync(testFile, "utf-8");
      // Check first few lines for --expose-internals flag
      const head = content.slice(0, 500);
      if (head.includes("--expose-internals") || head.includes("expose_internals")) {
        const reason = "[manual] requires --expose-internals (Node.js internal APIs)";
        if (test.subtestName) {
          skipSubtestInConfig(test.path, test.subtestName, reason);
        } else {
          updateSkipReason(test.path, reason);
        }
        count++;
      }
    } catch {
      // Ignore read errors
    }
  }

  if (count > 0) {
    console.log(`  Auto-skipped ${count} tests requiring --expose-internals.`);
    await commitProgress(category, "auto-skip-expose-internals");
  }

  return count;
}

// ── Main batch fix command ───────────────────────────────────────────────────

const MAX_ATTEMPTS = 2;

export async function fixBatchCommand(category: string, options?: { dryRun?: boolean }): Promise<void> {
  const dryRun = options?.dryRun ?? false;
  fs.mkdirSync(LOG_DIR, { recursive: true });

  process.on("unhandledRejection", (err) => {
    console.error("\n⚠ UNHANDLED REJECTION:", err);
  });
  process.on("uncaughtException", (err) => {
    console.error("\n⚠ UNCAUGHT EXCEPTION:", err);
    process.exit(1);
  });

  const cleanupStop = setupGracefulStop();

  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`  fix-batch: category='${category}'${dryRun ? " (DRY RUN)" : ""}`);
  if (!dryRun) console.log("  Press 'q' to stop after the current batch finishes.");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log();

  // ── Step 1: Ensure all vendored tests are in config.jsonc ──────────────

  console.log("Step 1: Ensuring all vendored tests are in config.jsonc...");

  const vendored = getVendoredTests(category);
  const config = loadConfig();
  const missing = vendored.filter((t) => !(t in config.tests));

  if (missing.length === 0) {
    const initCounts = getTestCounts(category);
    console.log(`  ✅ All ${vendored.length} vendored test files already in config.jsonc (${initCounts.total} test cases)`);
  } else {
    addTestsToConfigSkippedBatch(missing, category);
    console.log(`  Added ${missing.length} missing tests to config.jsonc (as skipped)`);
  }

  // ── Step 2: Triage — auto-skip impossible groups ──────────────────────

  console.log();
  console.log("Step 2: Triaging — auto-skipping impossible groups and --expose-internals tests...");

  await triageAutoSkipGroups(category);
  await skipExposeInternalsTests(category);

  // ── Dry-run: show group plan and exit ────────────────────────────────

  if (dryRun) {
    console.log();
    console.log("Step 3 (dry-run): Group plan");
    console.log();

    const allSkipped = getSkippedTests(category);
    const groups = groupTests(allSkipped);
    const fixableGroups = groups.filter((g) => !isAutoSkipGroup(g.name) && g.tests.length > 0);
    const counts = getTestCounts(category);
    const totalSkipped = counts.fixableSkipped + counts.manualSkipped;

    console.log(`  ${counts.total} total test cases: ${counts.enabled} passing, ${totalSkipped} skipped (${counts.fixableSkipped} fixable, ${counts.manualSkipped} manual)`);
    console.log(`  ${allSkipped.length} fixable tests in ${fixableGroups.length} groups:`);
    console.log();

    for (const g of fixableGroups) {
      console.log(`  📦 ${g.name} (${g.tests.length} tests)`);
      for (const t of g.tests) {
        const label = t.subtestName ? `${t.path}#${t.subtestName}` : t.path;
        console.log(`     • ${label} — ${t.reason}`);
      }
      console.log();
    }

    const autoSkipGroups = groups.filter((g) => isAutoSkipGroup(g.name));
    if (autoSkipGroups.length > 0) {
      console.log("  🚫 Auto-skipped groups:");
      for (const g of autoSkipGroups) {
        const reason = getAutoSkipReason(g.name) ?? "unknown";
        console.log(`     ${g.name} (${g.tests.length} tests) — ${reason}`);
      }
      console.log();
    }

    console.log("═══════════════════════════════════════════════════════════════");
    console.log("  Dry run complete. No amp agents were launched.");
    console.log("  Run without --dry-run to start fixing.");
    console.log("═══════════════════════════════════════════════════════════════");

    cleanupStop();
    return;
  }

  // ── Step 3: Verify enabled tests pass ──────────────────────────────────

  console.log();
  console.log("Step 3: Verifying currently enabled tests pass...");

  const { ok: baselineOk, output: baselineOutput } = await runCategoryTests(category);
  if (!baselineOk) {
    console.log();
    console.log("  ⚠ Some enabled tests are failing. Marking them as skipped...");

    const failingTests = extractFailingTests(baselineOutput);
    if (failingTests.length === 0) {
      throw new Error("Enabled tests are failing but could not parse which ones.");
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

    console.log("  Re-verifying...");
    const { ok: retryOk } = await runCategoryTests(category, { failFast: true });
    if (!retryOk) {
      throw new Error("Tests still failing after skipping detected failures.");
    }

    await commitProgress(category, "skip-regressions");
  }

  // ── Step 4: Collect enabled tests for regression checking ──────────────

  // We'll recompute this after each successful commit to stay current

  // ── Step 5: Batch fix loop ─────────────────────────────────────────────

  console.log();
  console.log("Step 4: Starting batch fix loop...");
  console.log();

  const attemptCounts = new Map<string, number>();
  let round = 0;

  while (true) {
    if (stopRequested) break;

    round++;

    const allSkipped = getSkippedTests(category);
    if (allSkipped.length === 0) {
      const counts = getTestCounts(category);
      console.log(`🎉 All ${counts.enabled} test cases for '${category}' are passing!`);
      console.log(`   (${counts.manualSkipped} tests marked for manual review)`);
      break;
    }

    const groups = groupTests(allSkipped);
    // Filter out auto-skip groups (already handled) and empty groups
    const fixableGroups = groups.filter((g) => !isAutoSkipGroup(g.name) && g.tests.length > 0);

    if (fixableGroups.length === 0) {
      console.log("  No fixable groups remaining.");
      break;
    }

    console.log(`  Round ${round}: ${allSkipped.length} fixable tests in ${fixableGroups.length} groups`);
    for (const g of fixableGroups) {
      console.log(`    ${g.name}: ${g.tests.length} test(s)`);
    }
    console.log();

    let madeProgress = false;

    for (const group of fixableGroups) {
      if (stopRequested) break;

      const groupLabel = `${category}/${group.name}`;

      // Track attempts per group
      const attempts = (attemptCounts.get(groupLabel) ?? 0) + 1;
      attemptCounts.set(groupLabel, attempts);
      const ampMode = attempts === 1 ? "smart" : "deep";

      if (attempts > MAX_ATTEMPTS) {
        console.log(`  ⏭ ${groupLabel}: exceeded ${MAX_ATTEMPTS} attempts. Marking for manual review.`);
        for (const test of group.tests) {
          if (test.subtestName) {
            skipSubtestInConfig(test.path, test.subtestName, MANUAL_SKIP_PREFIX + `amp batch failed after ${MAX_ATTEMPTS} attempts (${group.name})`);
          } else {
            updateSkipReason(test.path, MANUAL_SKIP_PREFIX + `amp batch failed after ${MAX_ATTEMPTS} attempts (${group.name})`);
          }
        }
        await commitProgress(category, `batch-skip-${group.name}`);
        continue;
      }

      console.log("───────────────────────────────────────────────────────────────");
      console.log(`▶ Batch: ${groupLabel} (${group.tests.length} tests, attempt ${attempts}/${MAX_ATTEMPTS}, mode: ${ampMode})`);
      console.log("───────────────────────────────────────────────────────────────");

      for (const t of group.tests) {
        const label = t.subtestName ? `${t.path}#${t.subtestName}` : t.path;
        console.log(`  • ${label} — ${t.reason}`);
      }
      console.log();

      // Check which tests in the group still actually fail
      console.log("  Running batch tests to get current failure state...");
      const { ok: batchAlreadyPasses, output: beforeOutput } = await runSpecificTests(
        group.tests,
        { includeIgnored: true },
      );

      if (batchAlreadyPasses) {
        console.log("  🎉 All tests in batch already pass! Enabling...");
        for (const test of group.tests) {
          if (test.subtestName) {
            enableSubtestInConfig(test.path, test.subtestName);
          } else {
            enableTestInConfig(test.path);
          }
        }
        // Verify no regressions
        const { ok: regOk } = await runCategoryTests(category, { failFast: true });
        if (!regOk) {
          console.log("  ⚠ Regressions after enabling. Re-skipping.");
          for (const test of group.tests) {
            if (test.subtestName) {
              skipSubtestInConfig(test.path, test.subtestName, test.reason);
            } else {
              updateSkipReason(test.path, test.reason);
            }
          }
        } else {
          madeProgress = true;
        }
        await commitProgress(category, `batch-enable-${group.name}`);
        console.log();
        continue;
      }

      // Record which tests failed before the fix attempt
      const beforeFailingFilters = extractFailingFilters(beforeOutput);

      // Build batch prompt with failure output
      const prompt = buildBatchPrompt(category, group.name, group.tests, beforeOutput);
      const ampResult = await runAmp(prompt, category, `batch-${group.name}`, round, ampMode);

      console.log();
      console.log("  Amp agent finished. Analyzing result...");
      console.log();

      // Detect credit exhaustion
      if (ampResult.isError && isCreditsExhausted(ampResult.output)) {
        attemptCounts.set(groupLabel, attempts - 1);
        await waitForCredits();
        continue;
      }

      // Check if amp changed anything
      if (!hasWorkspaceChanges()) {
        console.log("  ℹ Amp made no code changes. Marking group for manual review.");
        for (const test of group.tests) {
          if (test.subtestName) {
            skipSubtestInConfig(test.path, test.subtestName, MANUAL_SKIP_PREFIX + "amp batch made no code changes");
          } else {
            updateSkipReason(test.path, MANUAL_SKIP_PREFIX + "amp batch made no code changes");
          }
        }
        await commitProgress(category, `batch-skip-${group.name}`);
        console.log();
        continue;
      }

      // Classify amp result
      const result = classifyAmpResult(ampResult.output);

      if (result === "CANNOT_FIX") {
        console.log("  ⏭ Batch cannot be fixed. Reverting and marking for manual review.");
        revertWorkspace();
        for (const test of group.tests) {
          if (test.subtestName) {
            skipSubtestInConfig(test.path, test.subtestName, MANUAL_SKIP_PREFIX + `batch ${group.name}: cannot fix`);
          } else {
            updateSkipReason(test.path, MANUAL_SKIP_PREFIX + `batch ${group.name}: cannot fix`);
          }
        }
        await commitProgress(category, `batch-skip-${group.name}`);
        console.log();
        continue;
      }

      // ── Verification: run batch tests again + regression check ──

      console.log("  Running batch tests after changes...");
      const { ok: afterBatchOk, output: afterOutput } = await runSpecificTests(
        group.tests,
        { includeIgnored: true },
      );

      const afterFailingFilters = extractFailingFilters(afterOutput);

      // Determine which tests are now passing
      const nowPassing: SkippedTest[] = [];
      const stillFailing: SkippedTest[] = [];

      for (const test of group.tests) {
        const filter = testPathToFilter(test.path, test.subtestName);
        if (!afterFailingFilters.has(filter)) {
          nowPassing.push(test);
        } else {
          stillFailing.push(test);
        }
      }

      console.log(`  Results: ${nowPassing.length} now passing, ${stillFailing.length} still failing`);

      if (nowPassing.length === 0) {
        // No improvement
        console.log("  ❌ No tests improved. Reverting...");
        revertWorkspace();
        console.log();
        continue;
      }

      // Check for regressions on currently-enabled tests
      console.log("  Checking for regressions on enabled tests...");
      const { ok: regressionOk, output: regrOutput } = await runCategoryTests(category);

      if (!regressionOk) {
        // Check if failures are just flaky
        const regressions = extractFailingTests(regrOutput);
        if (regressions.length > 0) {
          console.log(`  ⚠ ${regressions.length} test(s) failed. Checking if flaky...`);
          const flaky = await checkIfFlaky(regressions);
          if (flaky) {
            console.log("  ✅ All failures were flaky. Accepting changes.");
            recordFlakyTests(regressions, groupLabel);
          } else {
            console.log("  ❌ Real regressions. Reverting...");
            revertWorkspace();
            console.log();
            continue;
          }
        } else {
          console.log("  ❌ Regressions detected but could not identify which tests. Reverting...");
          revertWorkspace();
          console.log();
          continue;
        }
      }

      // ── Accept the changes ──

      // Enable tests that now pass
      for (const test of nowPassing) {
        const label = test.subtestName ? `${test.path}#${test.subtestName}` : test.path;
        console.log(`  ✅ Enabling: ${label}`);
        if (test.subtestName) {
          enableSubtestInConfig(test.path, test.subtestName);
        } else {
          enableTestInConfig(test.path);
        }
      }

      madeProgress = true;

      const total = group.tests.length;
      const passing = nowPassing.length;
      const commitLabel = passing === total
        ? `batch-fix-${group.name}`
        : `batch-partial-${group.name}-${passing}of${total}`;

      console.log(`  ✅ ${passing}/${total} tests now passing!`);
      await commitProgress(category, commitLabel);
      console.log();
    }

    if (!madeProgress) {
      console.log("  No progress in this round. Stopping.");
      break;
    }
  }

  cleanupStop();
  console.log();
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`  Done! Batch processing for '${category}' complete.`);
  const finalCounts = getTestCounts(category);
  console.log(`  ${finalCounts.enabled} passing, ${finalCounts.fixableSkipped} fixable, ${finalCounts.manualSkipped} manual`);
  console.log(`  Logs in: ${LOG_DIR}`);
  console.log("═══════════════════════════════════════════════════════════════");
}
