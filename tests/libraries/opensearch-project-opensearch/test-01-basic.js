import assert from "assert";
import { Client } from "@opensearch-project/opensearch";
import { createApiMockHandler, createMockConnection, createMockState, unwrapBody } from "./utils.js";

export const run = async () => {
  const state = createMockState();
  const MockConnection = createMockConnection(createApiMockHandler(state));

  const client = new Client({
    node: "http://127.0.0.1:9200",
    Connection: MockConnection,
  });

  const pingResult = await client.ping();
  if (typeof pingResult === "boolean") {
    assert.strictEqual(pingResult, true);
  } else {
    assert.strictEqual(pingResult.statusCode, 200);
  }

  const infoResult = await client.info();
  const info = unwrapBody(infoResult);
  assert.strictEqual(info.cluster_name, "opensearch-test-cluster");
  assert.strictEqual(info.version.distribution, "opensearch");

  await assert.rejects(async () => {
    // Missing all client options should fail fast.
    // eslint-disable-next-line no-new
    new Client();
  }, /Missing node\(s\) option/);

  return "PASS: basic client construction and ping/info work with mocked transport";
};
