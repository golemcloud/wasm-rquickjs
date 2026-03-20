import assert from 'assert';
import mysql from 'mysql2/promise';

export const run = async () => {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 33061,
    user: 'testuser',
    password: 'testpass',
    database: 'testdb',
  });

  try {
    const [rows] = await connection.execute('SELECT 1+1 AS result');
    assert.strictEqual(rows.length, 1);
    assert.strictEqual(rows[0].result, 2);
    return 'PASS: mysql2 createConnection and SELECT 1+1 work';
  } finally {
    await connection.end();
  }
};
