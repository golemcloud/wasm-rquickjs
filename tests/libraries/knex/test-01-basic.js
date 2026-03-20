import assert from 'assert';
import PostgresClient from 'knex/lib/dialects/postgres/index.js';

export const run = () => {
  const client = new PostgresClient({ client: 'pg' });

  const query = client
    .queryBuilder()
    .table('users')
    .select('id', 'email')
    .where('active', true)
    .orderBy('email', 'asc')
    .limit(5)
    .toSQL();

  assert.ok(query.sql.includes('from "users"'));
  assert.ok(query.sql.includes('where "active" = ?'));
  assert.ok(query.sql.includes('order by "email" asc'));
  assert.ok(query.sql.includes('limit ?'));
  assert.deepStrictEqual(query.bindings, [true, 5]);

  return 'PASS: basic SELECT query compiles to SQL with bindings';
};
