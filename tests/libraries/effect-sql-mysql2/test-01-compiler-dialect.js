import assert from 'node:assert';
import * as MysqlClient from '@effect/sql-mysql2/MysqlClient';
import * as Statement from '@effect/sql/Statement';
import * as Effect from 'effect/Effect';

const toSnakeCase = (value) => value.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`);

const makeOfflineSql = (transform) =>
  Statement.make(Effect.die('offline compiler only'), MysqlClient.makeCompiler(transform), [], undefined);

export const run = async () => {
  const sql = makeOfflineSql(toSnakeCase);

  const compiled = sql`SELECT * FROM ${sql('userProfiles')} WHERE ${sql('userId')} IN ${sql.in([1, 2, 3])}`.compile();
  assert.deepStrictEqual(compiled, [
    'SELECT * FROM `user_profiles` WHERE `user_id` IN (?,?,?)',
    [1, 2, 3],
  ]);

  const withoutTransform = sql`SELECT * FROM ${sql('userProfiles')} WHERE ${sql('userId')} = ${7}`.compile(true);
  assert.deepStrictEqual(withoutTransform, [
    'SELECT * FROM `userProfiles` WHERE `userId` = ?',
    [7],
  ]);

  const dialect = sql.onDialect({
    sqlite: () => 'sqlite',
    pg: () => 'pg',
    mysql: () => 'mysql',
    mssql: () => 'mssql',
    clickhouse: () => 'clickhouse',
  });
  assert.strictEqual(dialect, 'mysql');

  return 'PASS: makeCompiler builds mysql dialect SQL with identifier transforms';
};
