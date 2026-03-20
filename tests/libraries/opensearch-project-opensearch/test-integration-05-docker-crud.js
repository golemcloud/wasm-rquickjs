import assert from "assert";
import { Client } from "@opensearch-project/opensearch";
import { unwrapBody } from "./utils.js";

const client = new Client({
  node: "http://localhost:19210",
});

export const run = async () => {
  await client.indices.delete({ index: "books-docker" }, { ignore: [404] });

  try {
    await client.indices.create({
      index: "books-docker",
      body: {
        settings: {
          index: {
            number_of_shards: 1,
            number_of_replicas: 0,
          },
        },
        mappings: {
          properties: {
            title: { type: "text" },
            year: { type: "integer" },
          },
        },
      },
    });

    await client.index({ index: "books-docker", id: "1", body: { title: "Dune", year: 1965 } });
    await client.index({ index: "books-docker", id: "2", body: { title: "Foundation", year: 1951 } });

    const bulk = unwrapBody(
      await client.bulk({
        body: [
          { index: { _index: "books-docker", _id: "3" } },
          { title: "Hyperion", year: 1989 },
        ],
        refresh: true,
      }),
    );
    assert.strictEqual(bulk.errors, false);

    await client.indices.refresh({ index: "books-docker" });

    const search = unwrapBody(
      await client.search({
        index: "books-docker",
        body: {
          query: {
            match: {
              title: "foundation",
            },
          },
        },
      }),
    );

    assert.strictEqual(search.hits.total.value, 1);
    assert.strictEqual(search.hits.hits[0]._source.title, "Foundation");

    const count = unwrapBody(await client.count({ index: "books-docker" }));
    assert.strictEqual(count.count, 3);

    return "PASS: docker OpenSearch CRUD + search + bulk operations work";
  } finally {
    await client.indices.delete({ index: "books-docker" }, { ignore: [404] });
  }
};
