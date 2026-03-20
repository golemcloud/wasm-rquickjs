import assert from "assert";
import { Client } from "@opensearch-project/opensearch";
import { createApiMockHandler, createMockConnection, createMockState, unwrapBody } from "./utils.js";

export const run = async () => {
  const state = createMockState();
  let sawNdjson = false;

  const MockConnection = createMockConnection(
    createApiMockHandler(state, {
      onBulk: (params, localState, parseNdjsonLines) => {
        const contentType = params.headers["content-type"] || "";
        sawNdjson = contentType.includes("application/x-ndjson");

        const lines = parseNdjsonLines(params.body || "");
        assert.strictEqual(lines.length, 4, "bulk request should serialize actions and documents as NDJSON");

        const books = localState.indexes.get("books") || new Map();
        books.set("1", lines[1]);
        books.set("2", lines[3]);
        localState.indexes.set("books", books);

        return {
          statusCode: 200,
          body: {
            took: 1,
            errors: false,
            items: [
              { index: { _index: "books", _id: "1", status: 201, result: "created" } },
              { index: { _index: "books", _id: "2", status: 201, result: "created" } },
            ],
          },
        };
      },
    }),
  );

  const client = new Client({
    node: "http://127.0.0.1:9200",
    Connection: MockConnection,
  });

  const bulkResult = unwrapBody(
    await client.bulk({
      body: [
        { index: { _index: "books", _id: "1" } },
        { title: "Dune" },
        { index: { _index: "books", _id: "2" } },
        { title: "Foundation" },
      ],
    }),
  );

  assert.strictEqual(sawNdjson, true, "bulk content type should be NDJSON");
  assert.strictEqual(bulkResult.errors, false);
  assert.strictEqual(bulkResult.items.length, 2);

  return "PASS: bulk API serializes NDJSON payload and parses response correctly";
};
