import assert from 'assert';
import mongoose from 'mongoose';

export const run = async () => {
  await mongoose.connect('mongodb://127.0.0.1:27018/testdb');

  try {
    assert.strictEqual(mongoose.connection.readyState, 1);

    const admin = mongoose.connection.db.admin();
    const info = await admin.ping();
    assert.ok(info);
  } finally {
    await mongoose.disconnect();
  }

  assert.strictEqual(mongoose.connection.readyState, 0);

  return 'PASS: connected to MongoDB, verified readyState, pinged admin, disconnected';
};
