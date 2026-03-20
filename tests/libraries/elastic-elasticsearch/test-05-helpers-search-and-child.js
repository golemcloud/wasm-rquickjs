import assert from "assert";
import { Client } from "@elastic/elasticsearch";
import Mock from "@elastic/elasticsearch-mock";

export const run = async () => {
  const mock = new Mock();

  mock.add({ method: "HEAD", path: "/" }, () => ({}));
  mock.add({ method: "POST", path: "/books/_search" }, () => ({
    took: 1,
    timed_out: false,
    _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
    hits: {
      total: { value: 2, relation: "eq" },
      max_score: 1,
      hits: [
        { _index: "books", _id: "1", _score: 1, _source: { title: "Elastic 101", kind: "guide" } },
        { _index: "books", _id: "2", _score: 1, _source: { title: "Runtime Notes", kind: "internal" } },
      ],
    },
  }));

  const client = new Client({
    node: "http://127.0.0.1:9200",
    Connection: mock.getConnection(),
    headers: { "x-parent": "true" },
  });

  const child = client.child({ headers: { "x-tenant": "demo" } });
  const ping = await child.ping();
  assert.strictEqual(ping, true);

  const docs = await child.helpers.search({
    index: "books",
    query: { match_all: {} },
  });

  assert.strictEqual(docs.length, 2);
  assert.strictEqual(docs[0].title, "Elastic 101");

  return "PASS: child client and helpers.search return expected documents";
};
