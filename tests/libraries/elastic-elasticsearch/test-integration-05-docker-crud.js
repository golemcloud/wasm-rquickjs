import assert from "assert";
import { Client } from "@elastic/elasticsearch";

const BASE_URL = "http://127.0.0.1:19200";
const INDEX = "wasm-rquickjs-elastic-books";

export const run = async () => {
  const client = new Client({ node: BASE_URL, requestTimeout: 10_000, maxRetries: 2 });

  try {
    await client.indices.delete({ index: INDEX }, { ignore: [404] });
  } catch {
    // no-op: index may not exist on first run
  }

  await client.indices.create({
    index: INDEX,
    mappings: {
      properties: {
        title: { type: "text" },
        rating: { type: "integer" },
      },
    },
  });

  await client.index({
    index: INDEX,
    id: "book-1",
    document: { title: "Elasticsearch Handbook", rating: 5 },
    refresh: "wait_for",
  });

  const bulkResponse = await client.bulk({
    refresh: "wait_for",
    operations: [
      { index: { _index: INDEX, _id: "book-2" } },
      { title: "WASM Runtime Internals", rating: 4 },
      { index: { _index: INDEX, _id: "book-3" } },
      { title: "Distributed Search Systems", rating: 5 },
    ],
  });

  assert.strictEqual(bulkResponse.errors, false);

  const getResponse = await client.get({ index: INDEX, id: "book-1" });
  assert.strictEqual(getResponse._source.rating, 5);

  await client.update({
    index: INDEX,
    id: "book-2",
    doc: { rating: 3 },
    refresh: "wait_for",
  });

  const searchResponse = await client.search({
    index: INDEX,
    query: { match: { title: "search" } },
  });

  assert.ok(searchResponse.hits.total.value >= 1);

  const countResponse = await client.count({ index: INDEX, query: { match_all: {} } });
  assert.strictEqual(countResponse.count, 3);

  await client.delete({ index: INDEX, id: "book-3", refresh: "wait_for" });
  const afterDelete = await client.count({ index: INDEX, query: { match_all: {} } });
  assert.strictEqual(afterDelete.count, 2);

  await client.indices.delete({ index: INDEX });
  await client.close();

  return "PASS: Docker Elasticsearch CRUD, bulk, search, and count APIs work";
};
