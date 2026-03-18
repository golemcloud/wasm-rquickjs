import assert from 'node:assert';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as SqliteClient from '@effect/sql-sqlite-node/SqliteClient';

const layer = SqliteClient.layer({
  filename: ':memory:',
  disableWAL: true,
});

export const run = async () => {
  const tableName = `tx_${Date.now().toString(36)}`;

  const program = Effect.gen(function* () {
    const sql = yield* SqliteClient.SqliteClient;

    yield* sql`CREATE TABLE ${sql(tableName)} (id INTEGER PRIMARY KEY AUTOINCREMENT, note TEXT NOT NULL)`;

    const rollbackExit = yield* Effect.exit(
      sql.withTransaction(
        Effect.gen(function* () {
          yield* sql`INSERT INTO ${sql(tableName)} ${sql.insert({ note: 'rolled-back' })}`;
          return yield* Effect.fail(new Error('force rollback'));
        })
      )
    );
    assert.ok(Exit.isFailure(rollbackExit));

    const afterRollback = yield* sql`SELECT COUNT(*) AS count FROM ${sql(tableName)}`;
    assert.strictEqual(Number(afterRollback[0].count), 0);

    yield* sql.withTransaction(
      Effect.gen(function* () {
        yield* sql`INSERT INTO ${sql(tableName)} ${sql.insert({ note: 'committed' })}`;
      })
    );

    const afterCommit = yield* sql`SELECT note FROM ${sql(tableName)}`;
    assert.strictEqual(afterCommit.length, 1);
    assert.strictEqual(afterCommit[0].note, 'committed');
  }).pipe(Effect.provide(layer));

  await Effect.runPromise(Effect.scoped(program));
  return 'PASS: SqliteClient transaction rollback and commit semantics are correct';
};
