import assert from 'assert';
import PostgresClient from 'knex/lib/dialects/postgres/index.js';

export const run = () => {
  const client = new PostgresClient({ client: 'pg' });

  const base = client
    .queryBuilder()
    .table('events')
    .where('tenant_id', 7)
    .where('archived', false)
    .orderBy('created_at', 'desc');

  const cloned = base.clone().where('kind', 'audit').limit(3).toSQL();
  const original = base.toSQL();

  assert.ok(cloned.sql.includes('where "tenant_id" = ?'));
  assert.ok(cloned.sql.includes('"kind" = ?'));
  assert.ok(cloned.sql.includes('limit ?'));
  assert.deepStrictEqual(cloned.bindings, [7, false, 'audit', 3]);

  assert.ok(!original.sql.includes('"kind" = ?'));
  assert.ok(!original.sql.includes('limit ?'));
  assert.deepStrictEqual(original.bindings, [7, false]);

  return 'PASS: query cloning keeps original builder immutable';
};
