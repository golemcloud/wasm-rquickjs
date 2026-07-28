import assert from 'node:assert';
import { getTableColumns, eq, sql } from 'drizzle-orm';
import { integer, pgTable, serial, text } from 'drizzle-orm/pg-core';

export const run = () => {
  const users = pgTable('users', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    age: integer('age'),
  });
  const columns = getTableColumns(users);
  assert.deepStrictEqual(Object.keys(columns).sort(), ['age', 'id', 'name']);
  const condition = eq(users.name, 'Alice');
  assert.strictEqual(typeof condition, 'object');
  assert.strictEqual(typeof sql`select 1`, 'object');
  return 'PASS: drizzle-orm schema helpers execute offline from installed node_modules';
};
