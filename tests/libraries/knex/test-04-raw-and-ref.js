import assert from 'assert';
import PostgresClient from 'knex/lib/dialects/postgres/index.js';

export const run = () => {
  const client = new PostgresClient({ client: 'pg' });

  const rawExpr = client.raw('?? = ?', ['users.id', 42]).toSQL();
  assert.strictEqual(rawExpr.sql, '"users"."id" = ?');
  assert.deepStrictEqual(rawExpr.bindings, [42]);

  const query = client
    .queryBuilder()
    .table('users')
    .select(client.ref('users.id').as('uid'))
    .whereRaw('?? > ?', ['users.id', 10])
    .toSQL();

  assert.ok(query.sql.includes('select "users"."id" as "uid"'));
  assert.ok(query.sql.includes('where "users"."id" > ?'));
  assert.deepStrictEqual(query.bindings, [10]);

  return 'PASS: raw expressions and identifier references compile as expected';
};
