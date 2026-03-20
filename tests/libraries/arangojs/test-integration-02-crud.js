import assert from "node:assert";
import { Database } from "arangojs";

const db = new Database({
  url: "http://127.0.0.1:18529",
  auth: { username: "root", password: "testpass" },
  databaseName: "_system",
});

export const run = async () => {
  const collectionName = "lib_test_arangojs_docs";
  const collection = db.collection(collectionName);

  try {
    if (await collection.exists()) {
      await collection.drop();
    }

    await db.createCollection(collectionName);

    const inserted = await collection.save({ name: "alice", score: 1 });
    assert.ok(inserted._key, "save should return a document key");

    const fetched = await collection.document(inserted._key);
    assert.strictEqual(fetched.name, "alice");
    assert.strictEqual(fetched.score, 1);

    await collection.update(inserted._key, { score: 2 });
    const updated = await collection.document(inserted._key);
    assert.strictEqual(updated.score, 2);

    await collection.remove(inserted._key);
    const removed = await collection.document(inserted._key, true);
    assert.strictEqual(removed, null);

    return "PASS: collection create/insert/read/update/delete workflow succeeds";
  } finally {
    try {
      if (await collection.exists()) {
        await collection.drop();
      }
    } finally {
      db.close();
    }
  }
};
