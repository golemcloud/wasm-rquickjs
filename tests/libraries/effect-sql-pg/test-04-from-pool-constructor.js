import assert from 'node:assert';
import * as Pg from 'pg';
import * as Reactivity from '@effect/experimental/Reactivity';
import * as PgClient from '@effect/sql-pg/PgClient';
import * as Effect from 'effect/Effect';

export const run = async () => {
  const program = Effect.gen(function* () {
    const sql = yield* PgClient.fromPool({
      acquire: Effect.acquireRelease(
        Effect.sync(() =>
          new Pg.Pool({
            connectionString: 'postgres://alpha:beta@127.0.0.1:54320/sample',
            application_name: 'effect-sql-pg-from-pool',
          })
        ),
        (pool) => Effect.promise(() => pool.end())
      ),
    });

    assert.strictEqual(typeof sql.listen, 'function');
    assert.strictEqual(typeof sql.notify, 'function');
    assert.strictEqual(typeof sql.withTransaction, 'function');

    const compiled = sql`SELECT ${sql.json({ ok: true })}`.compile();
    assert.deepStrictEqual(compiled, ['SELECT $1', [{ ok: true }]]);
    assert.strictEqual(sql.config.applicationName, 'effect-sql-pg-from-pool');
  }).pipe(Effect.provide(Reactivity.layer));

  await Effect.runPromise(Effect.scoped(program));
  return 'PASS: fromPool builds PgClient with pg-specific methods';
};
