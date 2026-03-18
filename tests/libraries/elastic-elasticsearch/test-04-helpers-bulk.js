import assert from "assert";
import { Client } from "@elastic/elasticsearch";
import Mock from "@elastic/elasticsearch-mock";

export const run = async () => {
  const mock = new Mock();

  mock.add({ method: "POST", path: "/_bulk" }, () => ({
    took: 3,
    errors: false,
    items: [
      { index: { _index: "books", _id: "1", status: 201, result: "created" } },
      { index: { _index: "books", _id: "2", status: 201, result: "created" } },
      { index: { _index: "books", _id: "3", status: 201, result: "created" } },
    ],
  }));

  const client = new Client({
    node: "http://127.0.0.1:9200",
    Connection: mock.getConnection(),
  });

  const docs = [
    { id: "1", title: "A" },
    { id: "2", title: "B" },
    { id: "3", title: "C" },
  ];

  const stats = await client.helpers.bulk({
    datasource: docs,
    retries: 0,
    onDocument(doc) {
      return {
        index: {
          _index: "books",
          _id: doc.id,
        },
      };
    },
  });

  assert.strictEqual(stats.total, 3);
  assert.strictEqual(stats.successful, 3);
  assert.strictEqual(stats.failed, 0);

  return "PASS: helpers.bulk streams operations and reports successful stats";
};
