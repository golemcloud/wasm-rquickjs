import { execute } from "@sourcegraph/amp-sdk";
import path from "node:path";
import fs from "node:fs";
import logUpdate from "log-update";
import { REPO_ROOT, LOG_DIR } from "./paths.js";
import { testPathToFilter } from "./tests.js";

const MAX_PREVIEW_LINES = 30;

// ANSI color helpers
const c = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function elapsed(startMs: number): string {
  const s = Math.floor((Date.now() - startMs) / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m${sec}s` : `${sec}s`;
}

function truncLine(text: string, max = 120): string {
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

function shortPath(p: string): string {
  // Strip common prefixes for readability
  return p
    .replace(/^\/Users\/[^/]+\/projects\/[^/]+\/[^/]+\//, "")
    .replace(/^\/[^/]+\/[^/]+\/[^/]+\/[^/]+\/[^/]+\//, "");
}

const PATCH_MAX_LINES = 12;

function formatPatch(icon: string, toolName: string, patchText: string): string {
  const lines = patchText.split("\n");
  const header: string[] = [];
  const diffLines: string[] = [];
  let filesChanged = 0;

  for (const raw of lines) {
    const line = raw.trimEnd();
    // V4A format markers
    if (line.startsWith("*** Begin Patch") || line.startsWith("*** End Patch")) continue;

    // File headers
    if (line.startsWith("*** ") || line.startsWith("--- ") || line.startsWith("+++ ")) {
      // Extract file path from "*** path/to/file" or "+++ b/path/to/file"
      const filePath = line.replace(/^(\*{3}|---|\+{3})\s+(b\/)?/, "");
      if (filePath && !header.includes(filePath)) {
        header.push(shortPath(filePath));
        filesChanged++;
      }
      continue;
    }

    // Hunk headers
    if (line.startsWith("@@")) {
      diffLines.push(`${c.cyan}${truncLine(line, 80)}${c.reset}`);
      continue;
    }

    // Diff content
    if (line.startsWith("+")) {
      diffLines.push(`${c.green}${truncLine(line, 100)}${c.reset}`);
    } else if (line.startsWith("-")) {
      diffLines.push(`${c.red}${truncLine(line, 100)}${c.reset}`);
    } else if (line.length > 0) {
      diffLines.push(`${c.dim}${truncLine(line, 100)}${c.reset}`);
    }
  }

  const fileList =
    header.length > 0
      ? header.map((f) => `${c.cyan}${f}${c.reset}`).join(", ")
      : `${c.dim}(unknown files)${c.reset}`;

  const summary = `${icon} ${toolName} ${fileList} ${c.dim}(${filesChanged} file${filesChanged !== 1 ? "s" : ""})${c.reset}`;

  if (diffLines.length === 0) return summary;

  const shown = diffLines.slice(0, PATCH_MAX_LINES);
  const remaining = diffLines.length - shown.length;
  const truncNote =
    remaining > 0
      ? `\n    ${c.dim}… ${remaining} more line${remaining !== 1 ? "s" : ""}${c.reset}`
      : "";

  return `${summary}\n${shown.map((l) => `    ${l}`).join("\n")}${truncNote}`;
}

function formatToolUse(name: string, input: Record<string, unknown>): string {
  const icon = `${c.magenta}▶${c.reset}`;
  const toolName = `${c.magenta}${c.bold}${name}${c.reset}`;

  switch (name) {
    case "Read": {
      const p = shortPath(String(input.path ?? ""));
      const range = input.read_range
        ? ` ${c.dim}L${(input.read_range as number[])[0]}-${(input.read_range as number[])[1]}${c.reset}`
        : "";
      return `${icon} ${toolName} ${c.cyan}${p}${c.reset}${range}`;
    }
    case "edit_file": {
      const p = shortPath(String(input.path ?? ""));
      const old = String(input.old_str ?? "").split("\n")[0];
      return `${icon} ${toolName} ${c.cyan}${p}${c.reset} ${c.dim}${truncLine(old, 60)}${c.reset}`;
    }
    case "create_file": {
      const p = shortPath(String(input.path ?? ""));
      return `${icon} ${toolName} ${c.cyan}${p}${c.reset}`;
    }
    case "Bash": {
      const cmd = truncLine(String(input.cmd ?? ""), 90);
      const cwd = input.cwd ? ` ${c.dim}in ${shortPath(String(input.cwd))}${c.reset}` : "";
      return `${icon} ${toolName} ${c.yellow}$ ${cmd}${c.reset}${cwd}`;
    }
    case "Grep": {
      const pattern = String(input.pattern ?? "");
      const loc = input.path ? shortPath(String(input.path)) : input.glob ? String(input.glob) : "";
      return `${icon} ${toolName} ${c.yellow}/${pattern}/${c.reset} ${c.dim}in ${loc}${c.reset}`;
    }
    case "glob": {
      return `${icon} ${toolName} ${c.yellow}${input.filePattern}${c.reset}`;
    }
    case "finder": {
      const q = truncLine(String(input.query ?? ""), 80);
      return `${icon} ${toolName} ${c.dim}${q}${c.reset}`;
    }
    case "Task":
    case "oracle":
    case "librarian": {
      const q = truncLine(String(input.task ?? input.query ?? input.description ?? ""), 80);
      return `${icon} ${toolName} ${c.blue}${q}${c.reset}`;
    }
    case "apply_patch": {
      return formatPatch(icon, toolName, String(input.patchText ?? input.patch ?? ""));
    }
    case "web_search":
    case "read_web_page": {
      const target = truncLine(String(input.url ?? input.objective ?? ""), 80);
      return `${icon} ${toolName} ${c.blue}${target}${c.reset}`;
    }
    default: {
      const keys = Object.keys(input);
      const summary = keys
        .slice(0, 3)
        .map((k) => {
          const v = String(input[k] ?? "");
          return `${k}=${truncLine(v, 30)}`;
        })
        .join(", ");
      return `${icon} ${toolName} ${c.dim}${summary}${c.reset}`;
    }
  }
}

const TOOL_RESULT_PREVIEW_LINES = 6;

/** Try to extract the meaningful output from a tool result string.
 *  Many tool results come as JSON like {"output":"...","exitCode":0}. */
function extractToolOutput(raw: string): { text: string; exitCode?: number } {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && typeof parsed.output === "string") {
      return { text: parsed.output, exitCode: parsed.exitCode ?? undefined };
    }
  } catch {
    // Not JSON, use raw text
  }
  return { text: raw };
}

function formatToolResult(toolName: string, content: string, isError: boolean): string {
  const indent = "      ";

  // Collapse skill loads to a one-liner
  if (toolName === "skill") {
    const lineCount = content.split("\n").length;
    return `${indent}${c.dim}◀ skill loaded (${lineCount} lines)${c.reset}`;
  }

  const { text, exitCode } = extractToolOutput(content);
  const exitSuffix =
    exitCode != null && exitCode !== 0 ? ` ${c.red}(exit ${exitCode})${c.reset}` : "";

  const lines = text.split("\n").filter((l) => l.length > 0);
  if (lines.length === 0) {
    if (isError) return `${indent}${c.red}✗ (empty error result)${c.reset}${exitSuffix}`;
    return `${indent}${c.dim}◀ (empty result)${c.reset}${exitSuffix}`;
  }

  const shown = lines.slice(-TOOL_RESULT_PREVIEW_LINES);
  const omitted = lines.length - shown.length;
  const prefix = omitted > 0 ? `${indent}${c.dim}… ${omitted} more lines …${c.reset}\n` : "";
  const formatted = shown.map((l) => `${indent}${c.dim}${truncLine(l, 100)}${c.reset}`).join("\n");
  return `${prefix}${formatted}${exitSuffix}`;
}

export function buildBatchPrompt(
  category: string,
  groupName: string,
  tests: { path: string; subtestName?: string; reason: string }[],
  failureOutput: string,
): string {
  const testList = tests
    .map((t) => {
      const label = t.subtestName ? `${t.path}#${t.subtestName}` : t.path;
      return `- **${label}** — ${t.reason}`;
    })
    .join("\n");

  const testPaths = tests.map((t) => `tests/node_compat/suite/${t.path}`);
  const uniquePaths = [...new Set(testPaths)];
  const readList = uniquePaths.map((p) => `- ${p}`).join("\n");

  // Build combined filter for running all tests
  const filters = tests.map((t) => testPathToFilter(t.path, t.subtestName));
  const filterArgs = filters.join(" ");

  // Truncate failure output to last ~4000 chars
  const truncatedOutput = failureOutput.slice(-4000);

  return `\
You are working on the wasm-rquickjs project which wraps JavaScript in WebAssembly Components using QuickJS.

We are trying to make a GROUP of related Node.js compatibility tests pass. These tests all exercise related functionality in the node:http module. Rather than fixing one test at a time, implement the missing feature or fix the underlying issue that blocks this entire group.

## Test group: ${groupName} (${tests.length} tests)

${testList}

## Current failure output (truncated)
${truncatedOutput}

## Your task

1. **Read ALL test files first** to understand the full API contract being tested:
${readList}
2. Use the librarian tool to learn about the Node.js HTTP API being tested (check Node.js v22 docs).
3. Identify the common missing feature or bug in the skeleton code that blocks these tests.
4. Read the current implementation:
   - crates/wasm-rquickjs/skeleton/src/builtin/node_http.js — HTTP module JS wrapper
   - crates/wasm-rquickjs/skeleton/src/builtin/node_http.rs — HTTP module native bridge
5. Implement the fix. Follow the project's hybrid native+JS pattern for built-in modules.
6. **IMPORTANT**: Do NOT modify any vendored test files (tests/node_compat/suite/*).
7. After making changes, clean and rebuild:
   - Run: ./cleanup-skeleton.sh
   - Then run the batch tests: cargo test --test node_compat -- --nocapture --include-ignored ${filterArgs} 2>&1 | tee /tmp/test-output.txt
8. Also run all ${category} tests to check for regressions:
   cargo test --test node_compat parallel__test_${category} -- --nocapture 2>&1 | tee /tmp/test-output.txt
9. If after analysis you determine these tests CANNOT pass (e.g., requires features fundamentally unavailable in WASM), explain why and state 'CANNOT_FIX: <reason>'. Consult the oracle tool to confirm this assessment before giving up.

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
- ALL node:http outgoing HTTP requests must go through wasi:http (the native Rust NodeHttpClientRequest) — do not try to circumvent that using sockets
- **NEVER introduce localhost side-channels.** Do NOT intercept socket writes to capture HTTP response metadata (status messages, headers, HTTP version) and pass them to the client via globalThis queues keyed by port. Do NOT check isLoopbackHostname() to selectively apply captured metadata. The wasi:http protocol has real limitations (no status message, no HTTP version, limited header control). If a test fails because it depends on features wasi:http cannot provide, mark it as skipped in config.jsonc with "skip": true and "reason": "wasi:http does not expose <feature>" — do NOT fake the behavior for localhost only.
- When touching core request/response plumbing in node_http.js or node_http.rs, consult the oracle tool for architectural review.

Respond with either:
- 'FIXED' if all (or most) tests now pass (include what you changed)
- 'CANNOT_FIX: <reason>' if it's fundamentally impossible
- 'PARTIAL: <explanation>' if you made progress but couldn't fully fix it`;
}

export function buildAmpPrompt(
  category: string,
  targetTest: string,
  targetReason: string,
  failureOutput: string,
  subtestName?: string,
): string {
  const filt = testPathToFilter(targetTest, subtestName);
  const truncatedOutput = failureOutput.slice(-4000);

  const subtestInfo = subtestName
    ? `\n- **Subtest**: ${subtestName} (this is one of multiple sub-tests in the file; focus on the specific block/test case that this subtest targets)`
    : "";

  return `\
You are working on the wasm-rquickjs project which wraps JavaScript in WebAssembly Components using QuickJS.

We are trying to make a Node.js compatibility test pass. The test is a vendored upstream Node.js test from v22.14.0.

## Test to fix
- **Test file**: tests/node_compat/suite/${targetTest}
- **Current skip reason**: ${targetReason}${subtestInfo}

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
- ALL node:http outgoing HTTP requests must go through wasi:http (the native Rust NodeHttpClientRequest) — do not try to circumvent that using sockets
- **NEVER introduce localhost side-channels.** Do NOT intercept socket writes to capture HTTP response metadata (status messages, headers, HTTP version) and pass them to the client via globalThis queues keyed by port. Do NOT check isLoopbackHostname() to selectively apply captured metadata. The wasi:http protocol has real limitations (no status message, no HTTP version, limited header control). If a test fails because it depends on features wasi:http cannot provide, mark it as skipped in config.jsonc with "skip": true and "reason": "wasi:http does not expose <feature>" — do NOT fake the behavior for localhost only.

Respond with either:
- 'FIXED' if the test now passes (include what you changed)
- 'CANNOT_FIX: <reason>' if it's fundamentally impossible
- 'PARTIAL: <explanation>' if you made progress but couldn't fully fix it`;
}

export interface AmpResult {
  output: string;
  isError: boolean;
}

const CREDIT_EXHAUSTION_PATTERNS = [
  /credit/i,
  /rate.?limit/i,
  /quota/i,
  /exceeded/i,
  /overloaded/i,
  /too many requests/i,
  /429/,
];

export function isCreditsExhausted(output: string): boolean {
  return CREDIT_EXHAUSTION_PATTERNS.some((p) => p.test(output));
}

export async function runAmpWithSkill(
  prompt: string,
  taskLabel: string,
  libraryName: string,
  iteration: number,
  mode: "smart" | "deep" = "deep",
): Promise<AmpResult> {
  const safeLabel = libraryName
    .replace(/[^a-zA-Z0-9-]/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "")
    .slice(0, 32);
  return runAmpGeneric(prompt, [taskLabel, safeLabel], iteration, mode);
}

export async function runAmp(
  prompt: string,
  category: string,
  targetTest: string,
  iteration: number,
  mode: "smart" | "deep" = "deep",
): Promise<AmpResult> {
  return runAmpGeneric(
    prompt,
    [
      "fix-node-compat",
      category.replace(/_/g, "-"),
      targetTest.replace(/[^a-zA-Z0-9-]/g, "-").slice(0, 32),
    ],
    iteration,
    mode,
  );
}

const AMP_TIMEOUT_MS = 45 * 60 * 1000; // 45 minutes

async function runAmpGeneric(
  prompt: string,
  labels: string[],
  iteration: number,
  mode: "smart" | "deep" = "deep",
): Promise<AmpResult> {
  const ampLog = path.join(LOG_DIR, `amp-${iteration}-${Date.now()}.txt`);
  console.log(
    `  ${c.cyan}🤖 Launching amp agent${c.reset} ${c.dim}(iteration ${iteration}, mode: ${mode}, timeout: ${AMP_TIMEOUT_MS / 60000}m)${c.reset}`,
  );
  console.log(`  ${c.dim}Log: ${ampLog}${c.reset}`);
  console.log();

  const logParts: string[] = [];
  const previewLines: string[] = [];
  let result = "";
  let isError = false;
  let toolCount = 0;
  let messageCount = 0;
  const toolNames = new Map<string, string>(); // tool_use_id → tool name
  const startTime = Date.now();
  const abortController = new AbortController();

  function statusHeader(): string {
    const parts = [
      `${c.cyan}${c.bold}⚡ Amp Agent${c.reset}`,
      `${c.dim}│${c.reset}`,
      `${c.yellow}⏱ ${elapsed(startTime)}${c.reset}`,
      `${c.dim}│${c.reset}`,
      `${c.blue}💬 ${messageCount}${c.reset}`,
      `${c.magenta}🔧 ${toolCount}${c.reset}`,
    ];
    return parts.join(" ");
  }

  function pushPreview(text: string) {
    for (const line of text.split("\n")) {
      if (line.length > 0) {
        previewLines.push(truncLine(line));
        if (previewLines.length > MAX_PREVIEW_LINES) {
          previewLines.shift();
        }
      }
    }
    logUpdate(`${statusHeader()}\n${c.dim}${"─".repeat(60)}${c.reset}\n${previewLines.join("\n")}`);
  }

  const timeoutId = setTimeout(() => {
    abortController.abort();
  }, AMP_TIMEOUT_MS);

  try {
    for await (const message of execute({
      prompt,
      signal: abortController.signal,
      options: {
        cwd: REPO_ROOT,
        dangerouslyAllowAll: true,
        mode,
        archive: true,
        labels,
      },
    })) {
      if (message.type === "system") {
        const rawText = `[system] session=${message.session_id}\n[system] tools=${message.tools.join(", ")}\n`;
        logParts.push(rawText);
        pushPreview(`${c.dim}● session: ${message.session_id}${c.reset}`);
      } else if (message.type === "assistant") {
        messageCount++;
        for (const content of message.message.content) {
          if (content.type === "text") {
            logParts.push(content.text);
            for (const line of content.text.split("\n")) {
              const trimmed = line.trim();
              if (trimmed.length > 0) {
                pushPreview(`  ${trimmed}`);
              }
            }
          } else if (content.type === "tool_use") {
            toolCount++;
            toolNames.set(content.id, content.name);
            const rawText = `[tool_use] ${content.name}(${JSON.stringify(content.input)})\n`;
            logParts.push(rawText);
            pushPreview(
              `  ${formatToolUse(content.name, content.input as Record<string, unknown>)}`,
            );
          }
        }
      } else if (message.type === "user") {
        for (const content of message.message.content) {
          if (content.type === "tool_result") {
            const resultText = content.content ?? "";
            const toolName = toolNames.get(content.tool_use_id) ?? "unknown";
            // Log the full result to the log file (truncated for very large results)
            const logText =
              resultText.length > 8000
                ? resultText.slice(0, 4000) + "\n... (truncated) ...\n" + resultText.slice(-4000)
                : resultText;
            logParts.push(
              `[tool_result ${toolName} id=${content.tool_use_id} error=${content.is_error}]\n${logText}\n`,
            );
            // Show a preview of the tail of the result
            pushPreview(formatToolResult(toolName, resultText, content.is_error));
          }
        }
      } else if (message.type === "result") {
        if (message.is_error) {
          logParts.push(`[error] ${message.error}\n`);
          pushPreview(`  ${c.red}${c.bold}✗ Error: ${message.error}${c.reset}`);
          result = message.error;
          isError = true;
        } else {
          logParts.push(`[result] ${message.result}\n`);
          pushPreview(`  ${c.green}${c.bold}✓ Result: ${message.result}${c.reset}`);
          result = message.result;
        }
        // Treat result as terminal — don't wait for iterator cleanup which may
        // never settle, causing Node to drain the event loop and exit silently.
        break;
      }
    }
  } catch (err) {
    if (abortController.signal.aborted) {
      // Timeout reached
      isError = true;
      result = `TIMEOUT: Amp agent exceeded ${AMP_TIMEOUT_MS / 60000} minute limit`;
      logParts.push(`[timeout] ${result}\n`);
    } else if (result || toolCount > 0) {
      // The amp-sdk throws if the CLI process exits with a non-zero code, even
      // after it has already delivered a valid result message. If we captured a
      // result (or the agent made progress via tool calls), treat the process
      // exit as non-fatal.
      logParts.push(
        `[warning] Amp CLI exited with non-zero code after delivering result: ${err}\n`,
      );
    } else {
      isError = true;
      result = err instanceof Error ? err.message : String(err);
      logParts.push(`[error] ${result}\n`);
    }
  } finally {
    clearTimeout(timeoutId);
    try {
      if (!isError) {
        logUpdate(
          `  ${c.green}${c.bold}✓ Amp agent completed${c.reset} ${c.dim}(${elapsed(startTime)}, ${toolCount} tool calls, ${messageCount} messages)${c.reset}`,
        );
      } else {
        logUpdate(
          `  ${c.red}${c.bold}✗ Amp agent failed${c.reset} ${c.dim}(${elapsed(startTime)}, ${toolCount} tool calls)${c.reset}`,
        );
      }
      logUpdate.done();
    } catch (e) {
      console.error("  ⚠ logUpdate error (non-fatal):", e);
    }

    try {
      fs.writeFileSync(ampLog, logParts.join(""));
    } catch (e) {
      console.error("  ⚠ Failed to write amp log:", e);
    }
  }

  return { output: result, isError };
}

export function buildPrioritizePrompt(
  category: string,
  skippedTests: { path: string; subtestName?: string; reason: string }[],
): string {
  const testList = skippedTests
    .map((t) => {
      const label = t.subtestName ? `${t.path}#${t.subtestName}` : t.path;
      return `- ${label} — ${t.reason}`;
    })
    .join("\n");

  return `\
You are helping prioritize Node.js compatibility tests for the wasm-rquickjs project.

Below is a list of ${skippedTests.length} currently-skipped tests for the '${category}' category.
Each test has a path and a skip reason explaining why it is currently failing.

## Skipped tests
${testList}

## Your task

Pick the 10 tests from this list that you think would have the **most impact** on increasing overall test coverage if fixed. Consider:
- Tests that likely require small or shared fixes (fixing one may fix many)
- Tests covering core/fundamental APIs that other tests may depend on
- Tests with reasons suggesting simple missing functionality vs. fundamental impossibility
- Tests that cover commonly-used Node.js APIs

Respond with EXACTLY a JSON array of the 10 test identifiers (path or path#subtestName) you recommend, ordered from highest to lowest priority. Example:

\`\`\`json
["parallel/test-foo.js", "parallel/test-bar.js#subtest1", "parallel/test-baz.js"]
\`\`\`

If there are fewer than 10 skipped tests, include all of them in priority order.
Respond ONLY with the JSON array, no other text.`;
}

export async function runAmpPrioritize(prompt: string, category: string): Promise<AmpResult> {
  const ampLog = path.join(LOG_DIR, `amp-prioritize-${Date.now()}.txt`);
  console.log(`  ${c.cyan}🤖 Launching amp agent for test prioritization${c.reset}`);
  console.log(`  ${c.dim}Log: ${ampLog}${c.reset}`);

  const logParts: string[] = [];
  let result = "";
  let isError = false;
  const startTime = Date.now();

  try {
    for await (const message of execute({
      prompt,
      options: {
        cwd: REPO_ROOT,
        mode: "smart",
        archive: true,
        labels: ["fix-node-compat", category.replace(/_/g, "-"), "prioritize"],
      },
    })) {
      if (message.type === "assistant") {
        for (const content of message.message.content) {
          if (content.type === "text") {
            logParts.push(content.text);
          } else if (content.type === "tool_use") {
            logParts.push(`[tool_use] ${content.name}(${JSON.stringify(content.input)})\n`);
          }
        }
      } else if (message.type === "result") {
        if (message.is_error) {
          logParts.push(`[error] ${message.error}\n`);
          result = message.error;
          isError = true;
        } else {
          logParts.push(`[result] ${message.result}\n`);
          result = message.result;
        }
        break;
      }
    }
  } catch (err) {
    if (result) {
      logParts.push(
        `[warning] Amp CLI exited with non-zero code after delivering result: ${err}\n`,
      );
    } else {
      isError = true;
      result = err instanceof Error ? err.message : String(err);
      logParts.push(`[error] ${result}\n`);
    }
  } finally {
    if (!isError) {
      console.log(
        `  ${c.green}✓ Prioritization complete${c.reset} ${c.dim}(${elapsed(startTime)})${c.reset}`,
      );
    } else {
      console.log(
        `  ${c.red}✗ Prioritization failed${c.reset} ${c.dim}(${elapsed(startTime)})${c.reset}`,
      );
    }

    try {
      fs.writeFileSync(ampLog, logParts.join(""));
    } catch (e) {
      console.error("  ⚠ Failed to write prioritize log:", e);
    }
  }

  return { output: result, isError };
}

export function parsePrioritizeResult(output: string): string[] | null {
  // Try to extract a JSON array from the output
  const jsonMatch = output.match(/\[[\s\S]*?\]/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    if (Array.isArray(parsed) && parsed.every((s) => typeof s === "string")) {
      return parsed;
    }
  } catch {
    // Fall through
  }
  return null;
}

export function classifyAmpResult(output: string): "FIXED" | "CANNOT_FIX" | "PARTIAL" | "UNCLEAR" {
  for (const line of output.split("\n")) {
    const trimmed = line.trim();
    if (/^CANNOT_FIX\b/i.test(trimmed)) return "CANNOT_FIX";
    if (/^FIXED\b/i.test(trimmed)) return "FIXED";
    if (/^PARTIAL\b/i.test(trimmed)) return "PARTIAL";
  }
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
