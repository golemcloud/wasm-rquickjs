import assert from 'assert';
import mysql from 'mysql2/promise';

export const run = async () => {
  const escapedValue = mysql.escape('hello');
  assert.strictEqual(escapedValue, "'hello'");

  const formatted = mysql.format('SELECT ? AS first, ? AS second', [1, 2]);
  assert.strictEqual(formatted, 'SELECT 1 AS first, 2 AS second');

  const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    database: 'testdb',
    connectionLimit: 1,
  });

  assert.strictEqual(typeof pool.query, 'function');
  assert.strictEqual(typeof pool.execute, 'function');
  assert.strictEqual(typeof pool.end, 'function');

  await pool.end();

  const cluster = mysql.createPoolCluster({ defaultSelector: 'RANDOM' });
  cluster.add('REPLICA', {
    host: '127.0.0.1',
    user: 'root',
    database: 'testdb',
  });

  const namespace = cluster.of('REPLICA', 'RANDOM');
  assert.strictEqual(typeof namespace.getConnection, 'function');

  await cluster.end();

  return 'PASS: mysql2/promise helpers and pool wrappers initialize without DB';
};
