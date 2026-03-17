import assert from "assert";
import { Client } from "langsmith/client";

const RUN_A = "44444444-4444-7444-8444-444444444444";
const RUN_B = "55555555-5555-7555-8555-555555555555";

export const run = async () => {
  const client = new Client({
    apiUrl: "http://localhost:18080",
    apiKey: "test-key",
    autoBatchTracing: false,
    timeout_ms: 5000,
  });

  await client.createRun({
    id: RUN_A,
    name: "integration-list-a",
    run_type: "chain",
    inputs: { idx: 1 },
  });

  await client.createRun({
    id: RUN_B,
    name: "integration-list-b",
    run_type: "chain",
    inputs: { idx: 2 },
  });

  const listedRuns = [];
  for await (const item of client.listRuns({ limit: 50 })) {
    listedRuns.push(item);
  }

  const ids = new Set(listedRuns.map((r) => r.id));
  assert.strictEqual(ids.has(RUN_A), true);
  assert.strictEqual(ids.has(RUN_B), true);

  return "PASS: Client listRuns iterates over mocked HTTP response";
};
