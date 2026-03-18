import assert from "assert";
import { Client, errors } from "@elastic/elasticsearch";

const BASE_URL = "http://127.0.0.1:18080";

export const run = async () => {
  const client = new Client({ node: BASE_URL });

  await assert.rejects(
    client.get({ index: "missing-index", id: "missing-doc" }),
    (err) => {
      assert.ok(err instanceof errors.ResponseError);
      assert.strictEqual(err.statusCode, 404);
      assert.strictEqual(err.body.status, 404);
      return true;
    },
  );

  await client.close();
  return "PASS: HTTP error responses map to Elasticsearch ResponseError";
};
