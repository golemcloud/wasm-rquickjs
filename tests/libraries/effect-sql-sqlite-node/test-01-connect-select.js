import assert from 'node:assert';
import * as Effect from 'effect/Effect';
import * as SqliteClient from '@effect/sql-sqlite-node/SqliteClient';

const layer = SqliteClient.layer({
  filename: ':memory:',
  disableWAL: true,
});

export const run = async () => {
  const program = Effect.gen(function* () {
    const sql = yield* SqliteClient.SqliteClient;
    const rows = yield* sql`SELECT 41 + 1 AS result`;

    assert.strictEqual(rows.length, 1);
    assert.strictEqual(Number(rows[0].result), 42);
  }).pipe(Effect.provide(layer));

  await Effect.runPromise(Effect.scoped(program));
  return 'PASS: SqliteClient can execute a basic SELECT query';
};
