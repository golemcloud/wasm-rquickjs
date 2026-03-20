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
  const program = Effect.gen(function* () {
    const sql = yield* MysqlClient.MysqlClient;
    const rows = yield* sql`SELECT 1 + 1 AS result`;

    assert.strictEqual(rows.length, 1);
    assert.strictEqual(Number(rows[0].result), 2);
  }).pipe(Effect.provide(liveLayer));

  await Effect.runPromise(Effect.scoped(program));
  return 'PASS: MysqlClient connects to MySQL and executes SELECT';
};
