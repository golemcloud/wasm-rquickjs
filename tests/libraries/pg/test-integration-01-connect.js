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
    const res = await client.query('SELECT 1 + 1 AS result');
    assert.strictEqual(res.rows.length, 1);
    assert.strictEqual(res.rows[0].result, 2);
  } finally {
    await client.end();
  }

  return 'PASS: connected to PostgreSQL and executed SELECT 1+1';
};
