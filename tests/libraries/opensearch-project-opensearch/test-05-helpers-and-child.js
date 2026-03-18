import assert from "assert";
import { Client } from "@opensearch-project/opensearch";
import { errors } from "@opensearch-project/opensearch";
import { createApiMockHandler, createMockConnection, createMockState, unwrapBody } from "./utils.js";

export const run = async () => {
  const state = createMockState();
  const MockConnection = createMockConnection(createApiMockHandler(state));

  const client = new Client({
    node: "http://127.0.0.1:9200",
    auth: {
      username: "admin",
      password: "admin",
    },
    Connection: MockConnection,
  });

  const child = client.child({
    headers: {
      "x-test-scope": "child",
    },
  });

  await child.indices.create({ index: "movies" });
  await child.index({ index: "movies", id: "1", body: { title: "Interstellar", year: 2014 } });

  const helperResults = await child.helpers.search({
    index: "movies",
    body: {
      query: {
        match: {
          title: "Inter",
        },
      },
    },
  });

  assert.strictEqual(helperResults.length, 1);
  assert.strictEqual(helperResults[0].title, "Interstellar");

  let sawResponseError = false;
  try {
    await child.get({ index: "movies", id: "does-not-exist" });
  } catch (error) {
    sawResponseError = true;
    assert.ok(error instanceof errors.ResponseError);
    assert.strictEqual(error.statusCode, 404);
  }
  assert.strictEqual(sawResponseError, true);

  const ignoredMissing = await child.get(
    { index: "movies", id: "does-not-exist" },
    { ignore: [404] },
  );
  const ignoredBody = unwrapBody(ignoredMissing);
  assert.strictEqual(ignoredBody.found, false);

  return "PASS: child client, helpers.search, and response error handling work as expected";
};
