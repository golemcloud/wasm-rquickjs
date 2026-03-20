import assert from 'assert';
import pg from 'pg';

export const run = async () => {
  const client = new pg.Client({
    host: '127.0.0.1',
    port: 54320,
    user: 'testuser',
    password: 'testpass',
    database: 'testdb',
  });

  await client.connect();

  try {
    // Setup
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_txn (
        id SERIAL PRIMARY KEY,
        label TEXT NOT NULL
      )
    `);
    await client.query('DELETE FROM test_txn');

    // Test ROLLBACK: insert should not persist
    await client.query('BEGIN');
    await client.query("INSERT INTO test_txn (label) VALUES ('rolled_back')");
    await client.query('ROLLBACK');

    const afterRollback = await client.query('SELECT COUNT(*)::int AS cnt FROM test_txn');
    assert.strictEqual(afterRollback.rows[0].cnt, 0, 'Row should not exist after ROLLBACK');

    // Test COMMIT: insert should persist
    await client.query('BEGIN');
    await client.query("INSERT INTO test_txn (label) VALUES ('committed')");
    await client.query('COMMIT');

    const afterCommit = await client.query('SELECT COUNT(*)::int AS cnt FROM test_txn');
    assert.strictEqual(afterCommit.rows[0].cnt, 1, 'Row should exist after COMMIT');

    const row = await client.query('SELECT label FROM test_txn');
    assert.strictEqual(row.rows[0].label, 'committed');

    // Cleanup
    await client.query('DROP TABLE test_txn');
  } finally {
    await client.end();
  }

  return 'PASS: ROLLBACK discards and COMMIT persists as expected';
};
