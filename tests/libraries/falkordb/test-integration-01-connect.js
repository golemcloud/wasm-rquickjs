import assert from "assert";
import { FalkorDB } from "falkordb";

export const run = async () => {
  let db;
  try {
    db = await FalkorDB.connect({
      url: "redis://127.0.0.1:63795",
      connectTimeout: 5000,
    });

    const graphs = await db.list();
    assert.ok(Array.isArray(graphs));

    const timeoutConfig = await db.configGet("TIMEOUT");
    assert.ok(Array.isArray(timeoutConfig));
    assert.strictEqual(timeoutConfig[0], "TIMEOUT");
    assert.strictEqual(typeof timeoutConfig[1], "number");

    return "PASS: connected to FalkorDB and executed list/configGet commands";
  } finally {
    if (db) {
      await db.close();
    }
  }
};
