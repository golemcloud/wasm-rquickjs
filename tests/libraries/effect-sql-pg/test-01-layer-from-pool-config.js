import assert from 'node:assert';
import * as Pg from 'pg';
import * as PgClient from '@effect/sql-pg/PgClient';
import * as Effect from 'effect/Effect';
import * as Redacted from 'effect/Redacted';

const CONNECTION_STRING = 'postgres://effect_user:effect_pass@127.0.0.1:54320/effect_db';

export const run = async () => {
  const layer = PgClient.layerFromPool({
    acquire: Effect.acquireRelease(
      Effect.sync(() =>
        new Pg.Pool({
          connectionString: CONNECTION_STRING,
          application_name: 'effect-sql-pg-offline-tests',
        })
      ),
      (pool) => Effect.promise(() => pool.end())
    ),
  });

  const program = Effect.gen(function* () {
    const sql = yield* PgClient.PgClient;

    assert.strictEqual(sql.config.host, '127.0.0.1');
    assert.strictEqual(sql.config.port, 54320);
    assert.strictEqual(sql.config.database, 'effect_db');
    assert.strictEqual(sql.config.username, 'effect_user');
    assert.strictEqual(Redacted.value(sql.config.password), 'effect_pass');

    const dialect = sql.onDialect({
      pg: () => 'pg',
      sqlite: () => 'sqlite',
      mysql: () => 'mysql',
      mssql: () => 'mssql',
      clickhouse: () => 'clickhouse',
    });

    assert.strictEqual(dialect, 'pg');
  }).pipe(Effect.provide(layer));

  await Effect.runPromise(Effect.scoped(program));
  return 'PASS: layerFromPool parses config and reports pg dialect';
};
