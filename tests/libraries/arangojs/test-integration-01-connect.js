import assert from "node:assert";
import { Database } from "arangojs";

const db = new Database({
  url: "http://127.0.0.1:18529",
  auth: { username: "root", password: "testpass" },
  databaseName: "_system",
});

export const run = async () => {
  try {
    const info = await db.version();
    assert.strictEqual(info.server, "arango");
    assert.match(info.version, /^\d+\.\d+\.\d+/);
    return "PASS: connected to ArangoDB and read server version metadata";
  } finally {
    db.close();
  }
};
