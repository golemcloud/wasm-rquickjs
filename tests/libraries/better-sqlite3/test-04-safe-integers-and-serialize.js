import assert from 'assert';
import Database from 'better-sqlite3';

export const run = () => {
  const db = new Database(':memory:');
  db.exec('CREATE TABLE numbers (value INTEGER NOT NULL)');

  const big = 9007199254740993n;
  db.prepare('INSERT INTO numbers (value) VALUES (?)').run(big);

  const readBig = db.prepare('SELECT value FROM numbers').safeIntegers().pluck().get();
  assert.strictEqual(readBig, big);

  const serialized = db.serialize();
  assert.ok(Buffer.isBuffer(serialized));
  assert.ok(serialized.length > 0);

  const clone = new Database(serialized);
  const cloneValue = clone.prepare('SELECT value FROM numbers').safeIntegers().pluck().get();
  assert.strictEqual(cloneValue, big);

  clone.close();
  db.close();
  return 'PASS: safeIntegers and serialize/deserialize work';
};
