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

  const createIndex = unwrapBody(await client.indices.create({ index: "books" }));
  assert.strictEqual(createIndex.acknowledged, true);

  const indexResult = unwrapBody(
    await client.index({
      index: "books",
      id: "doc-1",
      body: { title: "Dune", year: 1965, author: "Frank Herbert" },
    }),
  );
  assert.strictEqual(indexResult.result, "created");

  const updateResult = unwrapBody(
    await client.update({
      index: "books",
      id: "doc-1",
      body: { doc: { year: 1966 } },
    }),
  );
  assert.strictEqual(updateResult.result, "updated");

  const getResult = unwrapBody(
    await client.get({
      index: "books",
      id: "doc-1",
    }),
  );
  assert.strictEqual(getResult.found, true);
  assert.strictEqual(getResult._source.title, "Dune");
  assert.strictEqual(getResult._source.year, 1966);

  const deleteResult = unwrapBody(
    await client.delete({
      index: "books",
      id: "doc-1",
    }),
  );
  assert.strictEqual(deleteResult.result, "deleted");

  await assert.rejects(async () => {
    await client.get({ index: "books" });
  }, /Missing required parameter: id/);

  return "PASS: document CRUD APIs work with mocked transport";
};
