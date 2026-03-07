import assert from 'assert';
import { PgDialect } from 'drizzle-orm/pg-core';
import { fillPlaceholders, placeholder, sql } from 'drizzle-orm';

export const run = () => {
  const dialect = new PgDialect();
  const query = sql`select * from users where id = ${placeholder('id')} and status = ${'active'}`;
  const compiled = dialect.sqlToQuery(query);

  assert.strictEqual(compiled.sql, 'select * from users where id = $1 and status = $2');
  assert.strictEqual(compiled.params[0].name, 'id');
  assert.strictEqual(compiled.params[1], 'active');

  const filled = fillPlaceholders(compiled.params, { id: 42 });
  assert.deepStrictEqual(filled, [42, 'active']);

  return 'PASS: placeholder parameters are preserved and can be filled with runtime values';
};
