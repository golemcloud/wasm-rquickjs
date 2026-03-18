import assert from 'node:assert';
import * as MysqlClient from '@effect/sql-mysql2/MysqlClient';
import * as Effect from 'effect/Effect';
import * as Redacted from 'effect/Redacted';

const liveLayer = MysqlClient.layer({
  host: '127.0.0.1',
  port: 33062,
  username: 'testuser',
  password: Redacted.make('testpass'),
  database: 'testdb',
  poolConfig: {
    connectTimeout: 5000,
  },
});

export const run = async () => {
  const tableName = `effect_sql_mysql2_items_${Date.now().toString(36)}`;

  const program = Effect.gen(function* () {
    const sql = yield* MysqlClient.MysqlClient;

    try {
      yield* sql`CREATE TABLE ${sql(tableName)} (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, score INT NOT NULL)`;

      yield* sql`INSERT INTO ${sql(tableName)} ${sql.insert({ name: 'Ada', score: 7 })}`;

      const selected = yield* sql`SELECT name, score FROM ${sql(tableName)} WHERE name = ${'Ada'}`;
      assert.strictEqual(selected.length, 1);
      assert.strictEqual(selected[0].name, 'Ada');
      assert.strictEqual(Number(selected[0].score), 7);

      yield* sql`UPDATE ${sql(tableName)} SET ${sql.update({ score: 11 })} WHERE name = ${'Ada'}`;

      const updated = yield* sql`SELECT score FROM ${sql(tableName)} WHERE name = ${'Ada'}`;
      assert.strictEqual(updated.length, 1);
      assert.strictEqual(Number(updated[0].score), 11);

      yield* sql`DELETE FROM ${sql(tableName)} WHERE name = ${'Ada'}`;

      const afterDelete = yield* sql`SELECT COUNT(*) AS count FROM ${sql(tableName)}`;
      assert.strictEqual(Number(afterDelete[0].count), 0);
    } finally {
      yield* sql`DROP TABLE IF EXISTS ${sql(tableName)}`;
    }
  }).pipe(Effect.provide(liveLayer));

  await Effect.runPromise(Effect.scoped(program));
  return 'PASS: MysqlClient CRUD operations succeed against MySQL';
};
