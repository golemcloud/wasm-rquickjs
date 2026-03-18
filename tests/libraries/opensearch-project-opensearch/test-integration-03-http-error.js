import assert from "assert";
import { Client, errors } from "@opensearch-project/opensearch";

const client = new Client({
  node: "http://localhost:18080",
});

export const run = async () => {
  let sawResponseError = false;

  try {
    await client.get({ index: "books-http", id: "missing" });
  } catch (error) {
    sawResponseError = true;
    assert.ok(error instanceof errors.ResponseError);
    assert.strictEqual(error.statusCode, 404);
  }

  assert.strictEqual(sawResponseError, true);

  const ignored = await client.get({ index: "books-http", id: "missing" }, { ignore: [404] });
  assert.strictEqual((ignored.body ?? ignored).found, false);

  return "PASS: real HTTP 404 errors map to ResponseError and ignore handling";
};
