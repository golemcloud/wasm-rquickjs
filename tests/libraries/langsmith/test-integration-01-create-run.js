import assert from "assert";
import { Client } from "langsmith/client";

export const run = async () => {
  const client = new Client({
    apiUrl: "http://localhost:18080",
    apiKey: "test-key",
    autoBatchTracing: false,
    timeout_ms: 5000,
  });

  await client.createRun({
    id: "22222222-2222-7222-8222-222222222222",
    name: "integration-create-run",
    run_type: "chain",
    inputs: { ping: "pong" },
  });

  const runInfo = await client.readRun("22222222-2222-7222-8222-222222222222");
  assert.strictEqual(runInfo.id, "22222222-2222-7222-8222-222222222222");
  assert.strictEqual(runInfo.name, "integration-create-run");

  return "PASS: Client can create and read a run via HTTP mock server";
};
