import assert from 'node:assert';
import * as PgClient from '@effect/sql-pg/PgClient';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
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
  const tableName = `effect_sql_pg_tx_${Date.now().toString(36)}`;

  const program = Effect.gen(function* () {
    const sql = yield* PgClient.PgClient;

    try {
      yield* sql`CREATE TABLE ${sql(tableName)} (id SERIAL PRIMARY KEY, note TEXT NOT NULL)`;

      const rollbackExit = yield* Effect.exit(
        sql.withTransaction(
          Effect.gen(function* () {
            yield* sql`INSERT INTO ${sql(tableName)} ${sql.insert({ note: 'rolled-back' })}`;
            return yield* Effect.fail(new Error('force rollback'));
          })
        )
      );
      assert.ok(Exit.isFailure(rollbackExit));

      const afterRollback = yield* sql`SELECT count(*)::int AS count FROM ${sql(tableName)}`;
      assert.strictEqual(afterRollback[0].count, 0);

      yield* sql.withTransaction(
        Effect.gen(function* () {
          yield* sql`INSERT INTO ${sql(tableName)} ${sql.insert({ note: 'committed' })}`;
        })
      );

      const afterCommit = yield* sql`SELECT note FROM ${sql(tableName)}`;
      assert.strictEqual(afterCommit.length, 1);
      assert.strictEqual(afterCommit[0].note, 'committed');
    } finally {
      yield* sql`DROP TABLE IF EXISTS ${sql(tableName)}`;
    }
  }).pipe(Effect.provide(liveLayer));

  await Effect.runPromise(Effect.scoped(program));
  return 'PASS: PgClient transaction rollback and commit semantics are correct';
};
