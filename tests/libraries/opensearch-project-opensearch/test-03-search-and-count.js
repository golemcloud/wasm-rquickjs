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

  await client.indices.create({ index: "books" });
  await client.index({ index: "books", id: "1", body: { title: "Dune", genre: "sci-fi" } });
  await client.index({ index: "books", id: "2", body: { title: "Foundation", genre: "sci-fi" } });
  await client.index({ index: "books", id: "3", body: { title: "Clean Code", genre: "software" } });

  const searchResult = unwrapBody(
    await client.search({
      index: "books",
      body: {
        query: {
          match: {
            genre: "sci-fi",
          },
        },
      },
    }),
  );

  assert.strictEqual(searchResult.hits.total.value, 2);

  const titles = searchResult.hits.hits.map((hit) => hit._source.title).sort();
  assert.deepStrictEqual(titles, ["Dune", "Foundation"]);

  const countResult = unwrapBody(await client.count({ index: "books" }));
  assert.strictEqual(countResult.count, 3);

  return "PASS: search and count APIs return expected results with mocked transport";
};
