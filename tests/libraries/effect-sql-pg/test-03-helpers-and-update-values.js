import assert from 'node:assert';
import * as Pg from 'pg';
import * as PgClient from '@effect/sql-pg/PgClient';
import * as Effect from 'effect/Effect';

export const run = async () => {
  const layer = PgClient.layerFromPool({
    acquire: Effect.acquireRelease(
      Effect.sync(() => new Pg.Pool({ connectionString: 'postgres://u:p@127.0.0.1:54320/db' })),
      (pool) => Effect.promise(() => pool.end())
    ),
  });

  const program = Effect.gen(function* () {
    const sql = yield* PgClient.PgClient;

    const whereCompiled = sql`SELECT * FROM users WHERE ${sql.join(' OR ')([sql`id = ${1}`, sql`id = ${2}`])}`.compile();
    assert.deepStrictEqual(whereCompiled, ['SELECT * FROM users WHERE (id = $1 OR id = $2)', [1, 2]]);

    const logicalCompiled = sql`SELECT * FROM users WHERE ${sql.and([
      sql`active = ${true}`,
      sql.or([sql`role = ${'admin'}`, sql`role = ${'editor'}`]),
    ])}`.compile();
    assert.deepStrictEqual(logicalCompiled, [
      'SELECT * FROM users WHERE (active = $1 AND (role = $2 OR role = $3))',
      [true, 'admin', 'editor'],
    ]);

    const updateValuesCompiled = sql`UPDATE users SET name = data.name FROM ${sql.updateValues(
      [{ name: 'Ada' }, { name: 'Grace' }],
      'data'
    )} WHERE users.id > ${0}`.compile();
    assert.deepStrictEqual(updateValuesCompiled, [
      'UPDATE users SET name = data.name FROM (values ($1),($2)) AS data("name") WHERE users.id > $3',
      ['Ada', 'Grace', 0],
    ]);

    const literalCompiled = sql`SELECT ${sql.literal('count(*)')} FROM users`.compile();
    assert.deepStrictEqual(literalCompiled, ['SELECT count(*) FROM users', []]);
  }).pipe(Effect.provide(layer));

  await Effect.runPromise(Effect.scoped(program));
  return 'PASS: helper combinators and updateValues compile correctly';
};
