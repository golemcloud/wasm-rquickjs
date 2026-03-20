import assert from "assert";
import { Client } from "langsmith/client";

export const run = async () => {
  const calls = [];

  const client = new Client({
    apiUrl: "http://localhost:18080",
    apiKey: "test-key",
    autoBatchTracing: false,
    fetchImplementation: async (url, init) => {
      calls.push({ url: String(url), method: init?.method ?? "GET" });
      return new Response("{}", {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    },
  });

  await client.createRun({
    id: "11111111-1111-7111-8111-111111111111",
    name: "offline-create-run",
    run_type: "chain",
    inputs: { ping: true },
  });

  assert.strictEqual(calls.length, 1);
  assert.strictEqual(calls[0].method, "POST");
  assert.ok(calls[0].url.includes("/runs"));

  return "PASS: Client supports custom fetch implementation";
};
