import assert from 'assert';
import { QueryBuilder, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { and, desc, eq, gte } from 'drizzle-orm';

export const run = () => {
  const users = pgTable('users', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    age: integer('age'),
    createdAt: timestamp('created_at').notNull(),
  });

  const qb = new QueryBuilder();
  const compiled = qb
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(and(eq(users.name, 'Ada'), gte(users.age, 18)))
    .orderBy(desc(users.createdAt))
    .limit(3)
    .toSQL();

  assert.strictEqual(
    compiled.sql,
    'select "id", "name" from "users" where ("users"."name" = $1 and "users"."age" >= $2) order by "users"."created_at" desc limit $3',
  );
  assert.deepStrictEqual(compiled.params, ['Ada', 18, 3]);

  return 'PASS: query builder compiles a filtered and ordered select statement';
};
