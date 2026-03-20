import assert from 'assert';
import mysql from 'mysql2';

export const run = () => {
  mysql.clearParserCache();
  mysql.setMaxParserCache(64);

  assert.strictEqual(typeof mysql.createQuery, 'function');
  const query = mysql.createQuery('SELECT ? + ? AS sum', [2, 3], () => {}, {
    rowsAsArray: false,
  });

  assert.strictEqual(typeof query, 'object');
  assert.strictEqual(query.sql, 'SELECT ? + ? AS sum');
  assert.strictEqual(typeof query.onResult, 'function');

  mysql.setMaxParserCache(15000);

  return 'PASS: parser cache controls and query object factory work without DB';
};
