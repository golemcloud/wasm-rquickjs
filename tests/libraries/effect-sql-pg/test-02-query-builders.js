import assert from 'node:assert';
import * as Pg from 'pg';
import * as PgClient from '@effect/sql-pg/PgClient';
import * as Effect from 'effect/Effect';

const toSnakeCase = (value) => value.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`);

export const run = async () => {
  const layer = PgClient.layerFromPool({
    acquire: Effect.acquireRelease(
      Effect.sync(() => new Pg.Pool({ connectionString: 'postgres://u:p@127.0.0.1:54320/db' })),
      (pool) => Effect.promise(() => pool.end())
    ),
    transformQueryNames: toSnakeCase,
  });

  const program = Effect.gen(function* () {
    const sql = yield* PgClient.PgClient;

    const selectCompiled = sql`SELECT * FROM ${sql('userProfiles')} WHERE ${sql('userId')} IN ${sql.in([1, 2, 3])}`.compile();
    assert.deepStrictEqual(selectCompiled, [
      'SELECT * FROM "user_profiles" WHERE "user_id" IN ($1,$2,$3)',
      [1, 2, 3],
    ]);

    const insertCompiled = sql`INSERT INTO ${sql('auditLog')} ${sql.insert({
      eventType: 'created',
      payload: sql.json({ id: 1, name: 'Ada' }),
    })}`.compile();
    assert.deepStrictEqual(insertCompiled, [
      'INSERT INTO "audit_log" ("event_type","payload") VALUES ($1,$2)',
      ['created', { id: 1, name: 'Ada' }],
    ]);

    const updateCompiled = sql`UPDATE ${sql('auditLog')} SET ${sql.update({ processedAt: 'done' })} WHERE ${sql('id')} = ${1}`.compile();
    assert.deepStrictEqual(updateCompiled, [
      'UPDATE "audit_log" SET "processed_at" = $1 WHERE "id" = $2',
      ['done', 1],
    ]);
  }).pipe(Effect.provide(layer));

  await Effect.runPromise(Effect.scoped(program));
  return 'PASS: query builders compile pg SQL with transformed identifiers';
};
