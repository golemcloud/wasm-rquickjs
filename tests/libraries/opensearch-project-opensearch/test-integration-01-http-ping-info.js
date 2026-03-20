import assert from "assert";
import { Client } from "@opensearch-project/opensearch";
import { unwrapBody } from "./utils.js";

const client = new Client({
  node: "http://localhost:18080",
});

export const run = async () => {
  const pingResult = await client.ping();
  if (typeof pingResult === "boolean") {
    assert.strictEqual(pingResult, true);
  } else {
    assert.strictEqual(pingResult.statusCode, 200);
  }

  const info = unwrapBody(await client.info());
  assert.strictEqual(info.version.distribution, "opensearch");
  assert.strictEqual(info.cluster_name, "opensearch-mock-cluster");

  return "PASS: real HTTP ping/info works against local OpenSearch mock server";
};
