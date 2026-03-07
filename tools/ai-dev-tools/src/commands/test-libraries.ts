import fs from "node:fs";
import path from "node:path";
import { simpleGit } from "simple-git";
import { REPO_ROOT, LOG_DIR } from "../paths.js";
import { runAmpWithSkill } from "../amp.js";
import { setupGracefulStop, stopRequested, waitForCredits } from "../shared.js";
import { isCreditsExhausted } from "../amp.js";

const LIBRARIES_MD = path.join(REPO_ROOT, "tests", "libraries", "libraries.md");

const git = simpleGit(REPO_ROOT);

/** Parse libraries.md and return the npm name of the first untested library (status ⬜). */
function findNextUntestedLibrary(): string | null {
  const content = fs.readFileSync(LIBRARIES_MD, "utf-8");
  // Match table rows: | # | Name | `npm-name` | ⬜ | ...
  const rowRe = /\|\s*\d+\s*\|\s*([^|]+?)\s*\|\s*`([^`]+)`\s*\|\s*⬜\s*\|/g;
  let match: RegExpExecArray | null;
  while ((match = rowRe.exec(content)) !== null) {
    return match[2]; // npm package name
  }
  return null;
}

/** Check whether a library's row in libraries.md is still marked ⬜. */
function isLibraryStillUntested(npmName: string): boolean {
  const content = fs.readFileSync(LIBRARIES_MD, "utf-8");
  const escaped = npmName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`\\|\\s*\\d+\\s*\\|[^|]+\\|\\s*\`${escaped}\`\\s*\\|\\s*⬜\\s*\\|`);
  return re.test(content);
}

/** Commit changes in tests/libraries/ after a library test. */
async function commitLibraryTest(libraryName: string): Promise<void> {
  console.log(`  Committing library test results for ${libraryName}...`);
  await git.add(["tests/libraries/"]);
  try {
    await git.commit(`lib: ${libraryName} test`);
    console.log(`  ✅ Committed: lib: ${libraryName} test`);
  } catch {
    console.log("  (nothing to commit)");
  }
}

export async function testLibrariesCommand(): Promise<void> {
  fs.mkdirSync(LOG_DIR, { recursive: true });

  process.on("unhandledRejection", (err) => {
    console.error("\n⚠ UNHANDLED REJECTION:", err);
  });
  process.on("uncaughtException", (err) => {
    console.error("\n⚠ UNCAUGHT EXCEPTION:", err);
    process.exit(1);
  });

  const cleanupStop = setupGracefulStop();
  let completedAll = false;

  try {
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("  test-libraries: testing npm library compatibility");
    console.log("  Press 'q' to stop after the current library finishes.");
    console.log("═══════════════════════════════════════════════════════════════");
    console.log();

    let iteration = 0;

    while (true) {
      if (stopRequested) break;

      const nextLib = findNextUntestedLibrary();
      if (!nextLib) {
        completedAll = true;
        break;
      }

      iteration++;

      console.log("───────────────────────────────────────────────────────────────");
      console.log(`  Iteration ${iteration}: testing library '${nextLib}'`);
      console.log("───────────────────────────────────────────────────────────────");
      console.log();

      const prompt = `\
Load the testing-library skill and use it to test the npm package \`${nextLib}\`.

This package is the next untested entry in tests/libraries/libraries.md.
Follow the skill instructions exactly.
When done, ensure the row for \`${nextLib}\` in libraries.md is updated with the results.`;

      const result = await runAmpWithSkill(
        prompt,
        "test-libraries",
        nextLib,
        iteration,
      );

      console.log();

      if (result.isError) {
        if (isCreditsExhausted(result.output)) {
          await waitForCredits();
          continue;
        }
        console.log(`  ❌ Amp agent failed for '${nextLib}'. Stopping for inspection.`);
        break;
      }

      // Verify the agent actually updated libraries.md for this library
      if (isLibraryStillUntested(nextLib)) {
        console.log(`  ❌ '${nextLib}' is still marked ⬜ in libraries.md after Amp run. Stopping.`);
        break;
      }

      await commitLibraryTest(nextLib);
      console.log();
    }
  } finally {
    cleanupStop();
  }

  console.log();
  console.log("═══════════════════════════════════════════════════════════════");
  if (completedAll) {
    console.log("  Done! All libraries have been tested.");
  } else if (stopRequested) {
    console.log("  Stopped by user. Remaining libraries are still untested.");
  } else {
    console.log("  Stopped due to error. Check logs for details.");
  }
  console.log(`  Logs in: ${LOG_DIR}`);
  console.log("═══════════════════════════════════════════════════════════════");
}
