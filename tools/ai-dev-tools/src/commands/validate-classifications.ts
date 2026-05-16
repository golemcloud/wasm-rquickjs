import fs from "node:fs";
import path from "node:path";
import { runAmp } from "../amp.js";
import { REPO_ROOT } from "../paths.js";

const DEFAULT_RESULTS = "tmp/node-compat-validation/results.jsonl";
const DEFAULT_TRIAGE_LOG = "tmp/node-compat-validation/triage.jsonl";

const ACTIONABLE_STATUSES = new Set([
  "mismatch",
  "stale-pass",
  "mismatch-pass",
  "missing-reason",
  "needs-triage",
  "needs-triage-pass",
]);

interface ValidationRecord {
  key: string;
  path: string;
  category: string;
  reason?: string | null;
  actual?: {
    result?: string;
    message?: string;
  };
  validation: string;
  elapsed_ms?: number;
}

interface ValidateClassificationsOptions {
  dryRun?: boolean;
  resultsPath?: string;
  triageLogPath?: string;
  limit?: number;
}

export async function validateClassificationsCommand(
  options: ValidateClassificationsOptions,
): Promise<void> {
  const resultsPath = path.resolve(REPO_ROOT, options.resultsPath ?? DEFAULT_RESULTS);
  const triageLogPath = path.resolve(REPO_ROOT, options.triageLogPath ?? DEFAULT_TRIAGE_LOG);

  const records = loadValidationRecords(resultsPath);
  const processed = loadProcessedKeys(triageLogPath);
  const actionable = records.filter(
    (record) => ACTIONABLE_STATUSES.has(record.validation) && !processed.has(record.key),
  );
  const selected = options.limit === undefined ? actionable : actionable.slice(0, options.limit);

  console.log(`Loaded ${records.length} validation record(s) from ${resultsPath}`);
  console.log(`${processed.size} already triaged according to ${triageLogPath}`);
  console.log(`${actionable.length} actionable record(s), processing ${selected.length}`);

  if (options.dryRun) {
    for (const [idx, record] of selected.entries()) {
      console.log(`\n--- DRY RUN ${idx + 1}/${selected.length}: ${record.key} ---`);
      console.log(buildPrompt(record));
    }
    return;
  }

  if (selected.length === 0) return;

  fs.mkdirSync(path.dirname(triageLogPath), { recursive: true });
  const triageLog = fs.createWriteStream(triageLogPath, { flags: "a" });
  try {
    let iteration = processed.size + 1;
    for (const record of selected) {
      console.log(`\n=== ${record.key} (${record.validation}) ===`);
      const prompt = buildPrompt(record);
      const result = await runAmp(prompt, "classification", record.key, iteration, "deep");
      triageLog.write(
        JSON.stringify({
          key: record.key,
          validation: record.validation,
          ampError: result.isError,
          ampOutput: result.output,
          timestamp: new Date().toISOString(),
        }) + "\n",
      );
      iteration++;
    }
  } finally {
    triageLog.end();
  }
}

function loadValidationRecords(resultsPath: string): ValidationRecord[] {
  if (!fs.existsSync(resultsPath)) {
    throw new Error(`Validation results not found: ${resultsPath}`);
  }

  const records: ValidationRecord[] = [];
  for (const [idx, line] of fs.readFileSync(resultsPath, "utf-8").split("\n").entries()) {
    if (line.trim() === "") continue;
    try {
      const record = JSON.parse(line) as ValidationRecord;
      if (!record.key || !record.validation) {
        throw new Error("missing key or validation");
      }
      records.push(record);
    } catch (err) {
      throw new Error(`Invalid JSONL record at ${resultsPath}:${idx + 1}: ${err}`);
    }
  }
  return records;
}

function loadProcessedKeys(triageLogPath: string): Set<string> {
  const processed = new Set<string>();
  if (!fs.existsSync(triageLogPath)) return processed;

  for (const line of fs.readFileSync(triageLogPath, "utf-8").split("\n")) {
    if (line.trim() === "") continue;
    try {
      const record = JSON.parse(line) as { key?: string };
      if (record.key) processed.add(record.key);
    } catch {
      // Ignore partial/corrupt trailing lines so an interrupted append does not block resuming.
    }
  }
  return processed;
}

function buildPrompt(record: ValidationRecord): string {
  const actualResult = record.actual?.result ?? "unknown";
  const actualMessage = truncate(record.actual?.message ?? "", 6000);
  const [testPath, subtestName] = record.key.split("#", 2);
  const target = subtestName
    ? `test file ${testPath}, split subtest ${subtestName}`
    : `test file ${testPath}`;

  return `\
We are validating the Node.js compatibility classification config for wasm-rquickjs.

Target: ${target}
Current config category: ${record.category}
Current config reason: ${record.reason ?? "<none>"}
Validator status: ${record.validation}
Observed result from the validation harness: ${actualResult}

Observed message/output:
\`\`\`
${actualMessage || "<none>"}
\`\`\`

Please inspect the vendored test under tests/node_compat/suite and the runtime/common shims only as needed to decide whether the current config classification and reason are correct.

Your task is to update tests/node_compat/config.jsonc for this one entry only, using the category model:
- runnable: public API test that should pass; if it fails because our implementation is wrong, keep it runnable and report that it is a runtime bug rather than hiding it.
- known-gap: public API is missing or incomplete but is in scope for wasm-rquickjs.
- wasi-impossible: requires capabilities WASI Preview 2 cannot provide (forking, threads, unsupported TLS/server transport limits, interactive terminal, etc.).
- engine-difference: depends on V8 behavior QuickJS cannot reasonably mirror.
- node-internals: depends on Node.js internals/implementation details, such as --expose-internals, internalBinding, or require('internal/...').
- unevaluated: only if there is not enough information to classify it after inspection.

Rules:
- Do not modify vendored tests under tests/node_compat/suite.
- Do not change runtime implementation in this task; this pass is only for classification/reason correction.
- Preserve split structure. If only one subtest needs a different category, update only that subtest.
- Prefer a short specific reason for every non-runnable category.
- If the test should stay runnable and failing, make no config change and clearly say it is a runtime bug to fix later.
- After editing, run the narrowest no-run compile check if appropriate; do not run the full node_compat suite.

Finish with one of these prefixes:
CONFIG_UPDATED: <brief summary>
NO_CONFIG_CHANGE_RUNTIME_BUG: <brief explanation>
NO_CONFIG_CHANGE_CORRECT: <brief explanation>
NEEDS_HUMAN: <brief explanation>
`;
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : value.slice(0, max - 3) + "...";
}
