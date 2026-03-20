import assert from 'assert';
import Database from 'better-sqlite3';

export const run = () => {
  const db = new Database(':memory:');
  db.exec('CREATE TABLE ledger (entry TEXT NOT NULL)');

  const insertEntry = db.prepare('INSERT INTO ledger (entry) VALUES (?)');
  const addMany = db.transaction((entries) => {
    for (const entry of entries) {
      insertEntry.run(entry);
    }
  });

  addMany(['one', 'two']);

  const addAndFail = db.transaction(() => {
    insertEntry.run('will-rollback');
    throw new Error('force rollback');
  });

  try {
    addAndFail();
    assert.fail('transaction should have thrown');
  } catch (err) {
    assert.strictEqual(err.message, 'force rollback');
  }

  const entries = db.prepare('SELECT entry FROM ledger ORDER BY rowid').pluck().all();
  assert.deepStrictEqual(entries, ['one', 'two']);

  db.close();
  return 'PASS: transaction commit and rollback behavior works';
};
