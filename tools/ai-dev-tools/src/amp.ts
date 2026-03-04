import { execute } from "@sourcegraph/amp-sdk";
import path from "node:path";
import fs from "node:fs";
import logUpdate from "log-update";
import { REPO_ROOT, LOG_DIR } from "./paths.js";
import { testPathToFilter } from "./tests.js";

const MAX_PREVIEW_LINES = 20;

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

  const fileList = header.length > 0
    ? header.map(f => `${c.cyan}${f}${c.reset}`).join(", ")
    : `${c.dim}(unknown files)${c.reset}`;

  const summary = `${icon} ${toolName} ${fileList} ${c.dim}(${filesChanged} file${filesChanged !== 1 ? "s" : ""})${c.reset}`;

  if (diffLines.length === 0) return summary;

  const shown = diffLines.slice(0, PATCH_MAX_LINES);
  const remaining = diffLines.length - shown.length;
  const truncNote = remaining > 0 ? `\n    ${c.dim}… ${remaining} more line${remaining !== 1 ? "s" : ""}${c.reset}` : "";

  return `${summary}\n${shown.map(l => `    ${l}`).join("\n")}${truncNote}`;
}

function formatToolUse(name: string, input: Record<string, unknown>): string {
  const icon = `${c.magenta}▶${c.reset}`;
  const toolName = `${c.magenta}${c.bold}${name}${c.reset}`;

  switch (name) {
    case "Read": {
      const p = shortPath(String(input.path ?? ""));
      const range = input.read_range ? ` ${c.dim}L${(input.read_range as number[])[0]}-${(input.read_range as number[])[1]}${c.reset}` : "";
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
      const summary = keys.slice(0, 3).map(k => {
        const v = String(input[k] ?? "");
        return `${k}=${truncLine(v, 30)}`;
      }).join(", ");
      return `${icon} ${toolName} ${c.dim}${summary}${c.reset}`;
    }
  }
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
    : '';

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

export async function runAmp(
  prompt: string,
  category: string,
  targetTest: string,
  iteration: number,
  mode: "smart" | "deep" = "deep",
): Promise<AmpResult> {
  const ampLog = path.join(LOG_DIR, `amp-${iteration}-${Date.now()}.txt`);
  console.log(`  ${c.cyan}🤖 Launching amp agent${c.reset} ${c.dim}(iteration ${iteration}, mode: ${mode})${c.reset}`);
  console.log(`  ${c.dim}Log: ${ampLog}${c.reset}`);
  console.log();

  const logParts: string[] = [];
  const previewLines: string[] = [];
  let result = "";
  let isError = false;
  let toolCount = 0;
  let messageCount = 0;
  const startTime = Date.now();

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

  try {
    for await (const message of execute({
      prompt,
      options: {
        cwd: REPO_ROOT,
        dangerouslyAllowAll: true,
        mode,
        archive: true,
        labels: ["fix-node-compat", category.replace(/_/g, "-"), targetTest.replace(/[^a-zA-Z0-9-]/g, "-").slice(0, 32)],
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
            const rawText = `[tool_use] ${content.name}(${JSON.stringify(content.input)})\n`;
            logParts.push(rawText);
            pushPreview(`  ${formatToolUse(content.name, content.input as Record<string, unknown>)}`);
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
      }
    }
  } catch (err) {
    // The amp-sdk throws if the CLI process exits with a non-zero code, even
    // after it has already delivered a valid result message. If we captured a
    // result, treat the process exit as non-fatal.
    if (result) {
      logParts.push(`[warning] Amp CLI exited with non-zero code after delivering result: ${err}\n`);
    } else {
      isError = true;
      result = err instanceof Error ? err.message : String(err);
      logParts.push(`[error] ${result}\n`);
    }
  }

  if (!isError) {
    logUpdate(
      `  ${c.green}${c.bold}✓ Amp agent completed${c.reset} ${c.dim}(${elapsed(startTime)}, ${toolCount} tool calls, ${messageCount} messages)${c.reset}`,
    );
    logUpdate.done();
  } else {
    logUpdate(
      `  ${c.red}${c.bold}✗ Amp agent failed${c.reset} ${c.dim}(${elapsed(startTime)}, ${toolCount} tool calls)${c.reset}`,
    );
    logUpdate.done();
  }

  const output = logParts.join("");
  fs.writeFileSync(ampLog, output);

  return { output: result, isError };
}

export function buildPrioritizePrompt(
  category: string,
  skippedTests: { path: string; subtestName?: string; reason: string }[],
): string {
  const testList = skippedTests.map((t) => {
    const label = t.subtestName ? `${t.path}#${t.subtestName}` : t.path;
    return `- ${label} — ${t.reason}`;
  }).join("\n");

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

export async function runAmpPrioritize(
  prompt: string,
  category: string,
): Promise<AmpResult> {
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
      }
    }
  } catch (err) {
    if (result) {
      logParts.push(`[warning] Amp CLI exited with non-zero code after delivering result: ${err}\n`);
    } else {
      isError = true;
      result = err instanceof Error ? err.message : String(err);
      logParts.push(`[error] ${result}\n`);
    }
  }

  if (!isError) {
    console.log(`  ${c.green}✓ Prioritization complete${c.reset} ${c.dim}(${elapsed(startTime)})${c.reset}`);
  } else {
    console.log(`  ${c.red}✗ Prioritization failed${c.reset} ${c.dim}(${elapsed(startTime)})${c.reset}`);
  }

  fs.writeFileSync(ampLog, logParts.join(""));

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
