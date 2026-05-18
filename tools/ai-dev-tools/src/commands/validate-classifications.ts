import fs from "node:fs";
import path from "node:path";
import { runAmp } from "../amp.js";
import { REPO_ROOT } from "../paths.js";

const DEFAULT_RESULTS = "tmp/node-compat-validation/results.jsonl";
const DEFAULT_TRIAGE_LOG = "tmp/node-compat-validation/triage.jsonl";
const DEFAULT_BATCH_SIZE = 10;

const ACTIONABLE_STATUSES = new Set([
  "mismatch",
  "stale-pass",
  "mismatch-pass",
  "missing-reason",
  "ok-observed-gap",
  "ok-observed-impossible",
  "ok-observed-engine-difference",
  "ok-observed-internals",
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
  batchSize?: number;
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
  const batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE;
  const batches = buildBatches(selected, batchSize);

  console.log(`Loaded ${records.length} validation record(s) from ${resultsPath}`);
  console.log(`${processed.size} already triaged according to ${triageLogPath}`);
  console.log(
    `${actionable.length} actionable record(s), processing ${selected.length} in ${batches.length} batch(es) of up to ${batchSize}`,
  );

  if (options.dryRun) {
    for (const [idx, batch] of batches.entries()) {
      console.log(
        `\n--- DRY RUN BATCH ${idx + 1}/${batches.length}: ${batchLabel(batch)} (${batch.length} record(s)) ---`,
      );
      console.log(buildBatchPrompt(batch));
    }
    return;
  }

  if (selected.length === 0) return;

  fs.mkdirSync(path.dirname(triageLogPath), { recursive: true });
  const triageLog = fs.createWriteStream(triageLogPath, { flags: "a" });
  try {
    let iteration = processed.size + 1;
    for (const batch of batches) {
      const label = batchLabel(batch);
      console.log(`\n=== ${label} (${batch.length} record(s)) ===`);
      const prompt = buildBatchPrompt(batch);
      const result = await runAmp(prompt, "classification", label, iteration, "deep");
      triageLog.write(
        JSON.stringify({
          keys: batch.map((record) => record.key),
          validations: countBy(batch, (record) => record.validation),
          categories: countBy(batch, (record) => record.category),
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
      const record = JSON.parse(line) as { key?: string; keys?: string[] };
      if (record.key) processed.add(record.key);
      if (Array.isArray(record.keys)) {
        for (const key of record.keys) processed.add(key);
      }
    } catch {
      // Ignore partial/corrupt trailing lines so an interrupted append does not block resuming.
    }
  }
  return processed;
}

function buildBatches(records: ValidationRecord[], batchSize: number): ValidationRecord[][] {
  const groups = new Map<string, ValidationRecord[]>();
  for (const record of records) {
    const groupKey = `${record.validation}\u0000${record.category}`;
    const group = groups.get(groupKey) ?? [];
    group.push(record);
    groups.set(groupKey, group);
  }

  const batches: ValidationRecord[][] = [];
  for (const group of groups.values()) {
    for (let offset = 0; offset < group.length; offset += batchSize) {
      batches.push(group.slice(offset, offset + batchSize));
    }
  }
  return batches;
}

function buildBatchPrompt(records: ValidationRecord[]): string {
  const cases = records.map(formatCaseForPrompt).join("\n\n");
  const validations = JSON.stringify(countBy(records, (record) => record.validation));
  const categories = JSON.stringify(countBy(records, (record) => record.category));

  return `\
We are validating the Node.js compatibility classification config for wasm-rquickjs.

This is a batched classification pass. The batch contains ${records.length} validation records.
Validation status counts: ${validations}
Current config category counts: ${categories}

## Cases

${cases}

Please inspect the vendored tests under tests/node_compat/suite and the runtime/common shims only as needed to decide whether each current config classification and reason is correct.

Your task is to update tests/node_compat/config.jsonc for these entries only, using the category model:
- runnable: public API test that should pass; if it fails because our implementation is wrong, keep it runnable and report that it is a runtime bug rather than hiding it.
- known-gap: public API is missing or incomplete but is in scope for wasm-rquickjs.
- wasi-impossible: requires capabilities WASI Preview 2 cannot provide (forking, threads, unsupported TLS/server transport limits, interactive terminal, etc.).
- engine-difference: depends on V8 behavior QuickJS cannot reasonably mirror.
- node-internals: depends on Node.js internals/implementation details, such as --expose-internals, internalBinding, or require('internal/...').
- unevaluated: only if there is not enough information to classify it after inspection.

Batching guidance:
- Look for shared root causes across the batch and apply the same category/reason consistently where appropriate.
- It is okay to leave some entries unchanged if their current category and reason are correct.
- Do not over-generalize: if one item in the batch differs semantically, classify it separately.

Rules:
- Do not modify vendored tests under tests/node_compat/suite.
- Do not change runtime implementation in this task; this pass is only for classification/reason correction.
- Preserve split structure. If only one subtest needs a different category, update only that subtest.
- Prefer a short specific reason for every non-runnable category.
- If a test should stay runnable and failing, make no config change for that entry and clearly say it is a runtime bug to fix later.
- After editing, run the narrowest no-run compile check if appropriate; do not run the full node_compat suite.

Finish with one of these prefixes:
CONFIG_UPDATED: <brief summary of entries changed and entries left unchanged>
NO_CONFIG_CHANGE_RUNTIME_BUG: <brief explanation>
NO_CONFIG_CHANGE_CORRECT: <brief explanation>
NEEDS_HUMAN: <brief explanation>
`;
}

function formatCaseForPrompt(record: ValidationRecord): string {
  const actualResult = record.actual?.result ?? "unknown";
  const actualMessage = truncate(record.actual?.message ?? "", 2000);
  const [testPath, subtestName] = record.key.split("#", 2);
  const target = subtestName
    ? `test file ${testPath}, split subtest ${subtestName}`
    : `test file ${testPath}`;

  return `\
### ${record.key}

- Target: ${target}
- Current config category: ${record.category}
- Current config reason: ${record.reason ?? "<none>"}
- Validator status: ${record.validation}
- Observed result from the validation harness: ${actualResult}

Observed message/output:
\`\`\`
${actualMessage || "<none>"}
\`\`\`
`;
}

function batchLabel(records: ValidationRecord[]): string {
  const first = records[0];
  const suffix = records.length === 1 ? first.key : `${first.key}-plus-${records.length - 1}`;
  return `${first.validation}-${first.category}-${suffix}`;
}

function countBy<T>(items: T[], key: (item: T) => string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const k = key(item);
    counts[k] = (counts[k] ?? 0) + 1;
  }
  return counts;
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : value.slice(0, max - 3) + "...";
}
