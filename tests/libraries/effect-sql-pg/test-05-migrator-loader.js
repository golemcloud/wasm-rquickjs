import assert from 'node:assert';
import * as PgMigrator from '@effect/sql-pg/PgMigrator';
import * as Effect from 'effect/Effect';

export const run = async () => {
  const migrations = await Effect.runPromise(
    PgMigrator.fromRecord({
      '003_seed-data': Effect.void,
      '001_init-schema': Effect.void,
      '002_add-users': Effect.void,
      'not-a-migration': Effect.void,
    })
  );

  assert.deepStrictEqual(
    migrations.map(([id, name]) => [id, name]),
    [
      [1, 'init-schema'],
      [2, 'add-users'],
      [3, 'seed-data'],
    ]
  );

  const migrationError = new PgMigrator.MigrationError({
    reason: 'failed',
    message: 'boom',
  });

  assert.strictEqual(migrationError._tag, 'MigrationError');
  assert.strictEqual(migrationError.reason, 'failed');
  assert.strictEqual(migrationError.message, 'boom');

  return 'PASS: PgMigrator loader ordering and error type behavior are correct';
};
