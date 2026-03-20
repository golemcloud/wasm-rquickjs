import assert from "assert";
import { Client } from "langsmith/client";

const RUN_ID = "33333333-3333-7333-8333-333333333333";

export const run = async () => {
  const client = new Client({
    apiUrl: "http://localhost:18080",
    apiKey: "test-key",
    autoBatchTracing: false,
    timeout_ms: 5000,
  });

  await client.createRun({
    id: RUN_ID,
    name: "integration-update-run",
    run_type: "chain",
    inputs: { value: 1 },
  });

  await client.updateRun(RUN_ID, {
    outputs: { doubled: 2 },
    error: null,
    end_time: new Date().toISOString(),
  });

  const runInfo = await client.readRun(RUN_ID);
  assert.strictEqual(runInfo.outputs.doubled, 2);

  return "PASS: Client can patch run outputs via HTTP mock server";
};
