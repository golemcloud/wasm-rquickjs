import assert from 'assert';
import PostgresClient from 'knex/lib/dialects/postgres/index.js';

export const run = () => {
  const client = new PostgresClient({ client: 'pg' });

  const query = client
    .queryBuilder()
    .table('users')
    .insert({ id: 1, email: 'alice@example.com', updated_at: client.raw('CURRENT_TIMESTAMP') })
    .onConflict('id')
    .merge({ email: 'alice+new@example.com' })
    .returning(['id', 'email'])
    .toSQL();

  assert.ok(query.sql.includes('insert into "users"'));
  assert.ok(query.sql.includes('on conflict ("id") do update set'));
  assert.ok(query.sql.includes('returning "id", "email"'));
  assert.ok(query.bindings.includes('alice@example.com'));
  assert.ok(query.bindings.includes('alice+new@example.com'));

  return 'PASS: INSERT + ON CONFLICT MERGE + RETURNING compiles correctly';
};
