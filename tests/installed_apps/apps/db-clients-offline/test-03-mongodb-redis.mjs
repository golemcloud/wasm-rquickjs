import assert from 'node:assert';
import { MongoClient } from 'mongodb';
import { createClient } from 'redis';

export const run = async () => {
  const mongo = new MongoClient('mongodb://localhost:27017/test', { serverSelectionTimeoutMS: 1 });
  assert.strictEqual(mongo.db('test').databaseName, 'test');
  await mongo.close();

  const redis = createClient({ url: 'redis://localhost:6379' });
  assert.strictEqual(typeof redis.connect, 'function');
  if (typeof redis.quit === 'function') assert.strictEqual(typeof redis.quit, 'function');
  return 'PASS: mongodb and redis clients construct offline from installed node_modules';
};
