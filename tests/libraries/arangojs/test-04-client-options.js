import assert from "node:assert";
import { Database } from "arangojs";

export const run = () => {
  const db = new Database({
    url: ["http://127.0.0.1:18529", "http://127.0.0.1:18530"],
    databaseName: "_system",
  });

  assert.strictEqual(db.useBasicAuth("root", "testpass"), db);
  assert.strictEqual(db.useBearerAuth("example-token"), db);
  assert.strictEqual(db.useAccessToken("access-token"), db);

  const anotherDb = db.database("other_db");
  assert.strictEqual(anotherDb.name, "other_db");
  assert.strictEqual(typeof anotherDb.collection("events").save, "function");
  assert.strictEqual(typeof anotherDb.graph("social").get, "function");

  return "PASS: auth helpers and database cloning APIs are usable without network I/O";
};
