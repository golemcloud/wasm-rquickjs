import assert from "assert";
import { Client } from "@elastic/elasticsearch";
import Mock from "@elastic/elasticsearch-mock";

export const run = async () => {
  const mock = new Mock();

  mock.add({ method: "HEAD", path: "/" }, () => ({}));
  mock.add({ method: "GET", path: "/" }, () => ({
    name: "elastic-test-node",
    cluster_name: "elastic-test-cluster",
    cluster_uuid: "mock-cluster-uuid",
    tagline: "You Know, for Search",
    version: {
      number: "9.4.0",
      build_flavor: "default",
      build_type: "docker",
      build_hash: "mock-hash",
      build_date: "2026-01-01T00:00:00.000Z",
      build_snapshot: false,
      lucene_version: "9.12.0",
      minimum_wire_compatibility_version: "8.0.0",
      minimum_index_compatibility_version: "8.0.0",
    },
  }));

  const client = new Client({
    node: "http://127.0.0.1:9200",
    Connection: mock.getConnection(),
  });

  const ping = await client.ping();
  assert.strictEqual(ping, true, "ping() should return true");

  const info = await client.info();
  assert.strictEqual(info.cluster_name, "elastic-test-cluster");
  assert.strictEqual(info.version.number, "9.4.0");

  return "PASS: basic ping/info APIs work with mocked transport";
};
