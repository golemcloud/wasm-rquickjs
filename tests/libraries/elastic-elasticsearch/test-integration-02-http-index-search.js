import assert from "assert";
import { Client } from "@elastic/elasticsearch";

const BASE_URL = "http://127.0.0.1:18080";

export const run = async () => {
  const client = new Client({ node: BASE_URL });
  const index = "mock-books";

  await client.indices.create({ index });

  await client.index({
    index,
    id: "book-1",
    document: { title: "Elasticsearch in Action", kind: "guide" },
  });

  await client.index({
    index,
    id: "book-2",
    document: { title: "WebAssembly Runtime Notes", kind: "runtime" },
  });

  await client.indices.refresh({ index });

  const searchResponse = await client.search({
    index,
    query: { match: { title: "elastic" } },
  });

  assert.strictEqual(searchResponse.hits.total.value, 1);
  assert.strictEqual(searchResponse.hits.hits[0]._id, "book-1");

  const getResponse = await client.get({ index, id: "book-2" });
  assert.strictEqual(getResponse.found, true);
  assert.strictEqual(getResponse._source.kind, "runtime");

  await client.indices.delete({ index });
  await client.close();

  return "PASS: mock HTTP index/search/get flow works end-to-end";
};
