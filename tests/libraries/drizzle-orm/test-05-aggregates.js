import assert from 'assert';
import { QueryBuilder, integer, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { count, eq, sql, sum } from 'drizzle-orm';

export const run = () => {
  const orders = pgTable('orders', {
    id: serial('id').primaryKey(),
    customerId: integer('customer_id').notNull(),
    status: text('status').notNull(),
    amount: integer('amount').notNull(),
  });

  const qb = new QueryBuilder();
  const compiled = qb
    .select({
      customerId: orders.customerId,
      totalAmount: sum(orders.amount),
      itemCount: count(orders.id),
    })
    .from(orders)
    .where(eq(orders.status, 'paid'))
    .groupBy(orders.customerId)
    .having(sql`sum(${orders.amount}) > ${100}`)
    .orderBy(orders.customerId)
    .toSQL();

  assert.strictEqual(
    compiled.sql,
    'select "customer_id", sum("amount"), count("id") from "orders" where "orders"."status" = $1 group by "orders"."customer_id" having sum("orders"."amount") > $2 order by "orders"."customer_id"',
  );
  assert.deepStrictEqual(compiled.params, ['paid', 100]);

  return 'PASS: aggregate query generation supports group by and having clauses';
};
