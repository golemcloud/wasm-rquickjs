import assert from 'assert';
import pg from 'pg';

const { Client } = pg;

export const run = () => {
  const client = new Client({
    connectionString: 'postgres://alice:secret@db.example.com:5433/sample_db?application_name=compat-test&sslmode=require',
    statement_timeout: 2500,
  });

  assert.strictEqual(client.connectionParameters.user, 'alice');
  assert.strictEqual(client.connectionParameters.password, 'secret');
  assert.strictEqual(client.connectionParameters.host, 'db.example.com');
  assert.strictEqual(client.connectionParameters.port, 5433);
  assert.strictEqual(client.connectionParameters.database, 'sample_db');
  assert.strictEqual(client.connectionParameters.application_name, 'compat-test');
  assert.ok(client.connectionParameters.ssl);
  assert.strictEqual(client.connectionParameters.statement_timeout, 2500);

  return 'PASS: Client parses connection string and explicit config parameters';
};
