import assert from 'assert';
import mssqlBase from 'mssql/lib/base/index.js';

const mssql = mssqlBase.default || mssqlBase;

export const run = () => {
  const config = mssql.ConnectionPool.parseConnectionString(
    'Server=localhost,1433;Database=testdb;User Id=sa;Password=Secret123!;Encrypt=true;TrustServerCertificate=true;Connection Timeout=15'
  );

  assert.strictEqual(config.server, 'localhost');
  assert.strictEqual(config.port, 1433);
  assert.strictEqual(config.database, 'testdb');
  assert.strictEqual(config.user, 'sa');
  assert.strictEqual(config.password, 'Secret123!');
  assert.strictEqual(config.options.encrypt, true);
  assert.strictEqual(config.options.trustServerCertificate, true);
  assert.strictEqual(config.connectionTimeout, 15000);

  const pool = new mssql.ConnectionPool(config);
  assert.strictEqual(pool.connected, false);
  assert.strictEqual(pool.connecting, false);
  assert.strictEqual(pool.healthy, false);

  return 'PASS: connection string parsing and pool initialization work offline';
};
