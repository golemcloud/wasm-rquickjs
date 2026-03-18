import assert from 'node:assert';
import * as PgClient from '@effect/sql-pg/PgClient';
import * as Effect from 'effect/Effect';
import * as Redacted from 'effect/Redacted';

const liveLayer = PgClient.layer({
  host: '127.0.0.1',
  port: 54320,
  username: 'testuser',
  password: Redacted.make('testpass'),
  database: 'testdb',
  connectTimeout: 5000,
});

export const run = async () => {
  const tableName = `effect_sql_pg_items_${Date.now().toString(36)}`;

  const program = Effect.gen(function* () {
    const sql = yield* PgClient.PgClient;

    try {
      yield* sql`CREATE TABLE ${sql(tableName)} (id SERIAL PRIMARY KEY, name TEXT NOT NULL, score INT NOT NULL)`;

      const inserted = yield* sql`INSERT INTO ${sql(tableName)} ${sql.insert({ name: 'Ada', score: 7 })} RETURNING id, name, score`;
      assert.strictEqual(inserted.length, 1);
      assert.strictEqual(inserted[0].name, 'Ada');
      assert.strictEqual(inserted[0].score, 7);

      const selected = yield* sql`SELECT id, name, score FROM ${sql(tableName)} WHERE id = ${inserted[0].id}`;
      assert.strictEqual(selected.length, 1);
      assert.strictEqual(selected[0].name, 'Ada');

      yield* sql`UPDATE ${sql(tableName)} SET ${sql.update({ score: 11 })} WHERE id = ${inserted[0].id}`;

      const updated = yield* sql`SELECT score FROM ${sql(tableName)} WHERE id = ${inserted[0].id}`;
      assert.strictEqual(updated[0].score, 11);

      yield* sql`DELETE FROM ${sql(tableName)} WHERE id = ${inserted[0].id}`;

      const afterDelete = yield* sql`SELECT count(*)::int AS count FROM ${sql(tableName)}`;
      assert.strictEqual(afterDelete[0].count, 0);
    } finally {
      yield* sql`DROP TABLE IF EXISTS ${sql(tableName)}`;
    }
  }).pipe(Effect.provide(liveLayer));

  await Effect.runPromise(Effect.scoped(program));
  return 'PASS: PgClient CRUD operations succeed against PostgreSQL';
};
