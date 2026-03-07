import assert from 'assert';
import PostgresClient from 'knex/lib/dialects/postgres/index.js';

export const run = () => {
  const client = new PostgresClient({ client: 'pg' });

  const statements = client
    .schemaBuilder()
    .createTable('orders', (table) => {
      table.increments('id');
      table.integer('user_id').notNullable();
      table.decimal('total', 10, 2).notNullable().defaultTo(0);
      table.timestamp('created_at').defaultTo(client.raw('CURRENT_TIMESTAMP'));
      table.unique(['user_id', 'created_at']);
    })
    .toSQL();

  assert.ok(Array.isArray(statements));
  assert.ok(statements.length >= 1);
  assert.ok(statements[0].sql.includes('create table "orders"'));
  assert.ok(statements[0].sql.includes('"id" serial primary key'));
  assert.ok(statements[0].sql.includes('"total" decimal(10, 2) not null default'));

  return 'PASS: schema builder generates CREATE TABLE DDL statements';
};
