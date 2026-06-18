const assert = require('node:assert');
const { Client, Pool } = require('pg');
const mysql = require('mysql2');

exports.run = () => {
  const pgClient = new Client({ host: 'localhost', port: 5432, user: 'u', password: 'p', database: 'd' });
  assert.strictEqual(pgClient.connectionParameters.host, 'localhost');
  const pool = new Pool({ max: 1 });
  assert.strictEqual(typeof pool.query, 'function');
  pool.end();

  assert.strictEqual(typeof mysql.createConnection, 'function');
  assert.strictEqual(typeof mysql.createPool, 'function');
  assert.strictEqual(typeof mysql.format('select ? as value', [1]), 'string');
  return 'PASS: pg and mysql2 clients construct offline from installed node_modules';
};
