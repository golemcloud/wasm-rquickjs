import assert from "assert";
import { Client } from "@opensearch-project/opensearch";
import { unwrapBody } from "./utils.js";

const client = new Client({
  node: "http://localhost:18080",
});

export const run = async () => {
  await client.indices.create({ index: "books-http" });
  await client.index({
    index: "books-http",
    id: "1",
    body: { title: "Dune", genre: "sci-fi" },
  });
  await client.index({
    index: "books-http",
    id: "2",
    body: { title: "Project Hail Mary", genre: "sci-fi" },
  });
  await client.indices.refresh({ index: "books-http" });

  const search = unwrapBody(
    await client.search({
      index: "books-http",
      body: {
        query: {
          match: {
            genre: "sci-fi",
          },
        },
      },
    }),
  );

  assert.strictEqual(search.hits.total.value, 2);

  const getResult = unwrapBody(await client.get({ index: "books-http", id: "1" }));
  assert.strictEqual(getResult.found, true);
  assert.strictEqual(getResult._source.title, "Dune");

  await client.indices.delete({ index: "books-http" });

  return "PASS: real HTTP index/get/search lifecycle works against local OpenSearch mock server";
};
