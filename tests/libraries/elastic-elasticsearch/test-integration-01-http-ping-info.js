import assert from "assert";
import { Client } from "@elastic/elasticsearch";

const BASE_URL = "http://127.0.0.1:18080";

export const run = async () => {
  const client = new Client({ node: BASE_URL });

  const ping = await client.ping();
  assert.strictEqual(ping, true);

  const info = await client.info();
  assert.strictEqual(info.cluster_name, "elastic-mock-cluster");
  assert.strictEqual(info.version.number, "9.4.0");

  await client.close();
  return "PASS: mock HTTP server ping/info works through Elasticsearch client";
};
