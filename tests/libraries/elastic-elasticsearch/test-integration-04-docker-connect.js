import assert from "assert";
import { Client } from "@elastic/elasticsearch";

const BASE_URL = "http://127.0.0.1:19200";

export const run = async () => {
  const client = new Client({ node: BASE_URL, requestTimeout: 10_000, maxRetries: 2 });

  const ping = await client.ping();
  assert.strictEqual(ping, true);

  const info = await client.info();
  assert.ok(info.version.number, "cluster version should be present");

  const health = await client.cluster.health();
  assert.ok(["green", "yellow", "red"].includes(health.status), `unexpected health status: ${health.status}`);

  await client.close();
  return "PASS: Docker Elasticsearch ping/info/cluster.health works";
};
