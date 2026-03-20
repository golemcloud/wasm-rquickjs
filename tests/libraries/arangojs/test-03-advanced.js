import assert from "node:assert";
import { Database } from "arangojs";
import { isArangoAnalyzer } from "arangojs/analyzers";
import { isArangoCollection } from "arangojs/collections";
import { isArangoGraph } from "arangojs/graphs";
import { isArangoView } from "arangojs/views";

export const run = () => {
  const db = new Database({
    url: "http://127.0.0.1:18529",
    databaseName: "offline_db",
  });

  const collection = db.collection("users");
  const graph = db.graph("social");
  const view = db.view("search_view");
  const analyzer = db.analyzer("text_en");

  assert.strictEqual(db.name, "offline_db");
  assert.strictEqual(collection.name, "users");
  assert.strictEqual(graph.name, "social");
  assert.strictEqual(view.name, "search_view");
  assert.strictEqual(analyzer.name, "text_en");

  assert.strictEqual(isArangoCollection(collection), true);
  assert.strictEqual(isArangoGraph(graph), true);
  assert.strictEqual(isArangoView(view), true);
  assert.strictEqual(isArangoAnalyzer(analyzer), true);

  return "PASS: database resource handles are created offline with expected identity";
};
