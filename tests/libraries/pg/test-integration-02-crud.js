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
    // Create table
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_crud (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        value INT NOT NULL
      )
    `);

    // Clean up any leftover rows
    await client.query('DELETE FROM test_crud');

    // INSERT
    await client.query("INSERT INTO test_crud (name, value) VALUES ('alpha', 10)");
    await client.query("INSERT INTO test_crud (name, value) VALUES ('beta', 20)");
    await client.query("INSERT INTO test_crud (name, value) VALUES ('gamma', 30)");

    // SELECT
    const selectRes = await client.query('SELECT * FROM test_crud ORDER BY value');
    assert.strictEqual(selectRes.rows.length, 3);
    assert.strictEqual(selectRes.rows[0].name, 'alpha');
    assert.strictEqual(selectRes.rows[2].name, 'gamma');

    // UPDATE
    await client.query("UPDATE test_crud SET value = 99 WHERE name = 'beta'");
    const updateRes = await client.query("SELECT value FROM test_crud WHERE name = 'beta'");
    assert.strictEqual(updateRes.rows[0].value, 99);

    // DELETE
    await client.query("DELETE FROM test_crud WHERE name = 'alpha'");
    const deleteRes = await client.query('SELECT COUNT(*)::int AS cnt FROM test_crud');
    assert.strictEqual(deleteRes.rows[0].cnt, 2);

    // DROP table
    await client.query('DROP TABLE test_crud');
  } finally {
    await client.end();
  }

  return 'PASS: INSERT, SELECT, UPDATE, DELETE all work correctly';
};
