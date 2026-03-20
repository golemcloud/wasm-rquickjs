import assert from "assert";
import { Client } from "@elastic/elasticsearch";
import Mock from "@elastic/elasticsearch-mock";

export const run = async () => {
  const mock = new Mock();

  mock.add({ method: "PUT", path: "/books/_doc/book-1" }, () => ({
    _index: "books",
    _id: "book-1",
    _version: 1,
    result: "created",
    _shards: { total: 1, successful: 1, failed: 0 },
    _seq_no: 0,
    _primary_term: 1,
  }));

  mock.add({ method: "GET", path: "/books/_doc/book-1" }, () => ({
    _index: "books",
    _id: "book-1",
    _version: 1,
    found: true,
    _source: {
      title: "The Hobbit",
      pages: 310,
    },
  }));

  mock.add({ method: "POST", path: "/books/_update/book-1" }, () => ({
    _index: "books",
    _id: "book-1",
    _version: 2,
    result: "updated",
    _shards: { total: 1, successful: 1, failed: 0 },
    _seq_no: 1,
    _primary_term: 1,
  }));

  mock.add({ method: "DELETE", path: "/books/_doc/book-1" }, () => ({
    _index: "books",
    _id: "book-1",
    _version: 3,
    result: "deleted",
    _shards: { total: 1, successful: 1, failed: 0 },
    _seq_no: 2,
    _primary_term: 1,
  }));

  const client = new Client({
    node: "http://127.0.0.1:9200",
    Connection: mock.getConnection(),
  });

  const indexResponse = await client.index({
    index: "books",
    id: "book-1",
    document: {
      title: "The Hobbit",
      pages: 310,
    },
  });
  assert.strictEqual(indexResponse.result, "created");

  const getResponse = await client.get({ index: "books", id: "book-1" });
  assert.strictEqual(getResponse.found, true);
  assert.strictEqual(getResponse._source.title, "The Hobbit");

  const updateResponse = await client.update({
    index: "books",
    id: "book-1",
    doc: { pages: 311 },
  });
  assert.strictEqual(updateResponse.result, "updated");

  const deleteResponse = await client.delete({ index: "books", id: "book-1" });
  assert.strictEqual(deleteResponse.result, "deleted");

  return "PASS: index/get/update/delete document APIs work with mocked transport";
};
