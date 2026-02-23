import { execute } from "@sourcegraph/amp-sdk";
import path from "node:path";
import fs from "node:fs";
import logUpdate from "log-update";
import { REPO_ROOT, LOG_DIR } from "./paths.js";
import { testPathToFilter } from "./tests.js";

const MAX_PREVIEW_LINES = 20;

export function buildAmpPrompt(
  category: string,
  targetTest: string,
  targetReason: string,
  failureOutput: string,
): string {
  const filt = testPathToFilter(targetTest);
  const truncatedOutput = failureOutput.slice(-4000);

  return `\
You are working on the wasm-rquickjs project which wraps JavaScript in WebAssembly Components using QuickJS.

We are trying to make a Node.js compatibility test pass. The test is a vendored upstream Node.js test from v22.14.0.

## Test to fix
- **Test file**: tests/node_compat/suite/${targetTest}
- **Current skip reason**: ${targetReason}

## Test failure output
${truncatedOutput}

## Your task

1. Read the test file at tests/node_compat/suite/${targetTest} to understand what it tests.
2. Use the librarian tool to learn about the Node.js API being tested if needed (check the Node.js documentation).
3. Identify what needs to be implemented or fixed in the skeleton code (crates/wasm-rquickjs/skeleton/src/builtin/) or common-shim (tests/node_compat/common-shim/).
4. Implement the fix. Follow the project's hybrid native+JS pattern for built-in modules.
5. **IMPORTANT**: Do NOT modify the vendored test file itself (tests/node_compat/suite/*).
6. After making changes, clean and rebuild:
   - Run: ./cleanup-skeleton.sh
   - Then run the specific test: cargo test --test node_compat ${filt} -- --nocapture --include-ignored 2>&1 | tee /tmp/test-output.txt
7. If the test passes, also run all ${category} tests to check for regressions:
   cargo test --test node_compat parallel__test_${category} -- --nocapture 2>&1 | tee /tmp/test-output.txt
8. If after analysis you determine this test CANNOT pass (e.g., requires child_process, worker_threads, or other fundamentally unavailable WASM features), explain why and state 'CANNOT_FIX: <reason>'. Consult the oracle tool to confirm this assessment before giving up.

## Key files to check
- crates/wasm-rquickjs/skeleton/src/builtin/ — built-in module implementations
- crates/wasm-rquickjs/skeleton/src/builtin/mod.rs — module registration
- tests/node_compat/common-shim/index.js — test common shim
- tests/node_compat/config.jsonc — test configuration

## Rules from AGENTS.md
- The skeleton's Cargo.toml is stored as Cargo.toml_ — rename to Cargo.toml for building, rename back before finishing
- After skeleton changes, run ./cleanup-skeleton.sh before running tests
- Never modify vendored test files in tests/node_compat/suite/
- Always update README.md if adding new APIs

Respond with either:
- 'FIXED' if the test now passes (include what you changed)
- 'CANNOT_FIX: <reason>' if it's fundamentally impossible
- 'PARTIAL: <explanation>' if you made progress but couldn't fully fix it`;
}

export async function runAmp(
  prompt: string,
  category: string,
  targetTest: string,
  iteration: number,
): Promise<string> {
  const ampLog = path.join(LOG_DIR, `amp-${iteration}-${Date.now()}.txt`);
  console.log("  Launching amp agent to fix the test...");
  console.log(`  Log: ${ampLog}`);
  console.log();

  const logParts: string[] = [];
  const previewLines: string[] = [];
  let result = "";
  let isError = false;

  function pushPreview(text: string) {
    for (const line of text.split("\n")) {
      if (line.length > 0) {
        previewLines.push(line);
        if (previewLines.length > MAX_PREVIEW_LINES) {
          previewLines.shift();
        }
      }
    }
    logUpdate(previewLines.join("\n"));
  }

  for await (const message of execute({
    prompt,
    options: {
      cwd: REPO_ROOT,
      dangerouslyAllowAll: true,
      mode: "deep",
      archive: true,
      labels: ["fix-node-compat", category, targetTest],
    },
  })) {
    if (message.type === "system") {
      const text = `[system] session=${message.session_id}\n[system] tools=${message.tools.join(", ")}\n`;
      logParts.push(text);
      pushPreview(text);
    } else if (message.type === "assistant") {
      for (const content of message.message.content) {
        if (content.type === "text") {
          logParts.push(content.text);
          pushPreview(content.text);
        } else if (content.type === "tool_use") {
          const text = `[tool_use] ${content.name}(${JSON.stringify(content.input)})\n`;
          logParts.push(text);
          pushPreview(text);
        }
      }
    } else if (message.type === "result") {
      if (message.is_error) {
        logParts.push(`[error] ${message.error}\n`);
        pushPreview(`[error] ${message.error}`);
        result = message.error;
        isError = true;
      } else {
        logParts.push(`[result] ${message.result}\n`);
        pushPreview(`[result] ${message.result}`);
        result = message.result;
      }
    }
  }

  if (!isError) {
    logUpdate(`  ✓ Amp agent completed successfully`);
    logUpdate.done();
  } else {
    logUpdate.done();
  }

  const output = logParts.join("");
  fs.writeFileSync(ampLog, output);

  return result;
}

export function classifyAmpResult(output: string): "FIXED" | "CANNOT_FIX" | "PARTIAL" | "UNCLEAR" {
  const upper = output.toUpperCase();
  if (upper.includes("CANNOT_FIX")) return "CANNOT_FIX";
  if (upper.includes("FIXED")) return "FIXED";
  if (upper.includes("PARTIAL")) return "PARTIAL";
  return "UNCLEAR";
}

export function extractCannotFixReason(output: string): string {
  for (const line of output.split("\n")) {
    if (line.toUpperCase().includes("CANNOT_FIX")) {
      return line.replace(/.*CANNOT_FIX[:\s]*/i, "").trim();
    }
  }
  return "reason unknown";
}
