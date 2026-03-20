import assert from "assert";
import { Client } from "@opensearch-project/opensearch";
import { unwrapBody } from "./utils.js";

const client = new Client({
  node: "http://localhost:19210",
});

export const run = async () => {
  const pingResult = await client.ping();
  if (typeof pingResult === "boolean") {
    assert.strictEqual(pingResult, true);
  } else {
    assert.strictEqual(pingResult.statusCode, 200);
  }

  const info = unwrapBody(await client.info());
  assert.ok(String(info.version.number).length > 0);

  const health = unwrapBody(await client.cluster.health());
  assert.ok(["green", "yellow"].includes(health.status));

  return "PASS: docker OpenSearch connectivity (ping/info/cluster.health) works";
};
