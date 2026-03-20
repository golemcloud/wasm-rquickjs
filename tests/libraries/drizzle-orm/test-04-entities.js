import assert from 'assert';
import { pgTable, serial } from 'drizzle-orm/pg-core';
import { Column, SQL, Table, getTableName, is, isSQLWrapper, isTable, sql } from 'drizzle-orm';

export const run = () => {
  const users = pgTable('users', {
    id: serial('id').primaryKey(),
  });

  const fragment = sql`select ${users.id} from ${users}`;

  assert.strictEqual(isTable(users), true);
  assert.strictEqual(is(users, Table), true);
  assert.strictEqual(is(users.id, Column), true);
  assert.strictEqual(is(fragment, SQL), true);
  assert.strictEqual(isSQLWrapper(fragment), true);
  assert.strictEqual(getTableName(users), 'users');

  return 'PASS: entity and SQL wrappers expose expected runtime type guards';
};
