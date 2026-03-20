import assert from 'node:assert';
import * as MysqlMigrator from '@effect/sql-mysql2/MysqlMigrator';
import * as Effect from 'effect/Effect';

export const run = async () => {
  const migrations = await Effect.runPromise(
    MysqlMigrator.fromRecord({
      '003_seed_data': Effect.void,
      '001_init_schema': Effect.void,
      '002_add_users': Effect.void,
      'not_a_migration': Effect.void,
    })
  );

  assert.deepStrictEqual(
    migrations.map(([id, name]) => [id, name]),
    [
      [1, 'init_schema'],
      [2, 'add_users'],
      [3, 'seed_data'],
    ]
  );

  const migrationError = new MysqlMigrator.MigrationError({
    reason: 'failed',
    message: 'boom',
  });

  assert.strictEqual(migrationError._tag, 'MigrationError');
  assert.strictEqual(migrationError.reason, 'failed');
  assert.strictEqual(migrationError.message, 'boom');

  return 'PASS: MysqlMigrator.fromRecord ordering and MigrationError shape are correct';
};
