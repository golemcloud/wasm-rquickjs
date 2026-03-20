import assert from "assert";
import { Client } from "@elastic/elasticsearch";
import Mock from "@elastic/elasticsearch-mock";

export const run = async () => {
  const mock = new Mock();

  mock.add({ method: "POST", path: "/books/_search" }, () => ({
    took: 2,
    timed_out: false,
    _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
    hits: {
      total: { value: 2, relation: "eq" },
      max_score: 1,
      hits: [
        {
          _index: "books",
          _id: "book-1",
          _score: 1,
          _source: { title: "Elasticsearch Guide", tags: ["search", "elastic"] },
        },
        {
          _index: "books",
          _id: "book-2",
          _score: 1,
          _source: { title: "WASM Patterns", tags: ["wasm", "runtime"] },
        },
      ],
    },
  }));

  mock.add({ method: "POST", path: "/books/_count" }, () => ({
    count: 2,
    _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
  }));

  const client = new Client({
    node: "http://127.0.0.1:9200",
    Connection: mock.getConnection(),
  });

  const searchResponse = await client.search({
    index: "books",
    query: { match: { title: "guide" } },
    size: 10,
  });

  assert.strictEqual(searchResponse.hits.total.value, 2);
  assert.strictEqual(searchResponse.hits.hits[0]._source.title, "Elasticsearch Guide");

  const countResponse = await client.count({
    index: "books",
    query: { match_all: {} },
  });

  assert.strictEqual(countResponse.count, 2);

  return "PASS: search and count APIs return expected hit/count structures";
};
