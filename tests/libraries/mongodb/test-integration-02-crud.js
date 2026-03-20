import { MongoClient } from "mongodb";
import assert from "assert";

export async function run() {
  const url = "mongodb://127.0.0.1:27019";
  const client = new MongoClient(url, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  });

  try {
    await client.connect();
    const db = client.db("wasm_rquickjs_test");
    const col = db.collection("crud_test");

    // Clean up from any previous run
    await col.drop().catch(() => {});

    // insertOne
    const insertResult = await col.insertOne({ name: "Alice", age: 30 });
    assert.ok(insertResult.insertedId, "insertOne should return insertedId");

    // findOne
    const found = await col.findOne({ name: "Alice" });
    assert.strictEqual(found.name, "Alice");
    assert.strictEqual(found.age, 30);

    // updateOne
    const updateResult = await col.updateOne(
      { name: "Alice" },
      { $set: { age: 31 } },
    );
    assert.strictEqual(updateResult.modifiedCount, 1);

    // Verify update
    const updated = await col.findOne({ name: "Alice" });
    assert.strictEqual(updated.age, 31);

    // deleteOne
    const deleteResult = await col.deleteOne({ name: "Alice" });
    assert.strictEqual(deleteResult.deletedCount, 1);

    // Verify deletion
    const count = await col.countDocuments();
    assert.strictEqual(count, 0);

    // Clean up
    await col.drop();

    return "PASS: CRUD operations (insert, find, update, delete) all work";
  } finally {
    await client.close();
  }
}
