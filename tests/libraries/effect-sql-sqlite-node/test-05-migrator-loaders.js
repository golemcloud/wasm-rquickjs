import assert from 'node:assert';
import * as Effect from 'effect/Effect';
import * as SqliteMigrator from '@effect/sql-sqlite-node/SqliteMigrator';

export const run = async () => {
  const fromRecord = await Effect.runPromise(
    SqliteMigrator.fromRecord({
      '003_seed_data': Effect.void,
      '001_init_schema': Effect.void,
      '002_add_users': Effect.void,
      'not_a_migration': Effect.void,
    })
  );

  assert.deepStrictEqual(
    fromRecord.map(([id, name]) => [id, name]),
    [
      [1, 'init_schema'],
      [2, 'add_users'],
      [3, 'seed_data'],
    ]
  );

  const fromGlob = await Effect.runPromise(
    SqliteMigrator.fromGlob({
      './migrations/002_add-users.ts': async () => ({ default: Effect.void }),
      './migrations/001_init-schema.js': async () => ({ default: Effect.void }),
      './migrations/not-a-migration.txt': async () => ({ default: Effect.void }),
    })
  );

  assert.deepStrictEqual(
    fromGlob.map(([id, name]) => [id, name]),
    [
      [1, 'init-schema'],
      [2, 'add-users'],
    ]
  );

  const migrationError = new SqliteMigrator.MigrationError({
    reason: 'failed',
    message: 'boom',
  });

  assert.strictEqual(migrationError._tag, 'MigrationError');
  assert.strictEqual(migrationError.reason, 'failed');
  assert.strictEqual(migrationError.message, 'boom');

  return 'PASS: SqliteMigrator record/glob loaders and MigrationError behave as expected';
};
