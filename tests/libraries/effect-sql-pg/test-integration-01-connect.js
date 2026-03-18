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
  const program = Effect.gen(function* () {
    const sql = yield* PgClient.PgClient;
    const rows = yield* sql`SELECT 1 + 1 AS result`;

    assert.strictEqual(rows.length, 1);
    assert.strictEqual(rows[0].result, 2);
  }).pipe(Effect.provide(liveLayer));

  await Effect.runPromise(Effect.scoped(program));
  return 'PASS: PgClient connects to PostgreSQL and executes SELECT';
};
