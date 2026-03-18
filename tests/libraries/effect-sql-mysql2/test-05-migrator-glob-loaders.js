import assert from 'node:assert';
import * as MysqlMigrator from '@effect/sql-mysql2/MysqlMigrator';
import * as Effect from 'effect/Effect';

export const run = async () => {
  const globMigrations = await Effect.runPromise(
    MysqlMigrator.fromGlob({
      './migrations/002_add-users.ts': async () => ({ default: Effect.void }),
      './migrations/001_init-schema.js': async () => ({ default: Effect.void }),
      './migrations/not-a-migration.txt': async () => ({ default: Effect.void }),
    })
  );

  assert.deepStrictEqual(
    globMigrations.map(([id, name]) => [id, name]),
    [
      [1, 'init-schema'],
      [2, 'add-users'],
    ]
  );

  const babelMigrations = await Effect.runPromise(
    MysqlMigrator.fromBabelGlob({
      _003_seedDataTs: Effect.void,
      _001_initSchemaJs: Effect.void,
      _002_addUsersTs: Effect.void,
      randomKey: Effect.void,
    })
  );

  assert.deepStrictEqual(
    babelMigrations.map(([id, name]) => [id, name]),
    [
      [1, 'initSchema'],
      [2, 'addUsers'],
      [3, 'seedData'],
    ]
  );

  return 'PASS: MysqlMigrator glob and babel-glob loaders parse and sort migrations';
};
