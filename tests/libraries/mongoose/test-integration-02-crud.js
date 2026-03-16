import assert from 'assert';
import mongoose from 'mongoose';

export const run = async () => {
  await mongoose.connect('mongodb://127.0.0.1:27018/testdb');

  try {
    // Drop the collection if it exists (idempotent)
    const collections = await mongoose.connection.db.listCollections({ name: 'cruditems' }).toArray();
    if (collections.length > 0) {
      await mongoose.connection.db.dropCollection('cruditems');
    }

    // Define schema and model
    const itemSchema = new mongoose.Schema({
      name: { type: String, required: true },
      quantity: { type: Number, default: 0 },
    });
    const Item = mongoose.models.CrudItem || mongoose.model('CrudItem', itemSchema, 'cruditems');

    // CREATE
    const created = await Item.create({ name: 'widget', quantity: 10 });
    assert.strictEqual(created.name, 'widget');
    assert.strictEqual(created.quantity, 10);
    assert.ok(created._id);

    // READ
    const found = await Item.findOne({ name: 'widget' });
    assert.ok(found);
    assert.strictEqual(found.quantity, 10);

    // UPDATE
    await Item.updateOne({ name: 'widget' }, { $set: { quantity: 42 } });
    const updated = await Item.findOne({ name: 'widget' });
    assert.strictEqual(updated.quantity, 42);

    // DELETE
    await Item.deleteOne({ name: 'widget' });
    const count = await Item.countDocuments();
    assert.strictEqual(count, 0);

    // Clean up: drop collection
    await mongoose.connection.db.dropCollection('cruditems');
  } finally {
    await mongoose.disconnect();
  }

  return 'PASS: CREATE, READ, UPDATE, DELETE all work correctly with Mongoose';
};
