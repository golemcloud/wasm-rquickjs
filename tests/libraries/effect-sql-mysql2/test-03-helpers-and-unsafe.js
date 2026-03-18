import assert from 'node:assert';
import * as MysqlClient from '@effect/sql-mysql2/MysqlClient';
import * as Statement from '@effect/sql/Statement';
import * as Effect from 'effect/Effect';

const toSnakeCase = (value) => value.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`);

const makeOfflineSql = (transform) =>
  Statement.make(Effect.die('offline compiler only'), MysqlClient.makeCompiler(transform), [], undefined);

export const run = async () => {
  const sql = makeOfflineSql(toSnakeCase);

  const logicalCompiled = sql`SELECT * FROM users WHERE ${sql.and([
    sql`active = ${true}`,
    sql.or([sql`role = ${'admin'}`, sql`role = ${'editor'}`]),
  ])}`.compile();
  assert.deepStrictEqual(logicalCompiled, [
    'SELECT * FROM users WHERE (active = ? AND (role = ? OR role = ?))',
    [true, 'admin', 'editor'],
  ]);

  const joinedCompiled = sql`SELECT * FROM users WHERE ${sql.join(' OR ')([sql`id = ${1}`, sql`id = ${2}`])}`.compile();
  assert.deepStrictEqual(joinedCompiled, ['SELECT * FROM users WHERE (id = ? OR id = ?)', [1, 2]]);

  const csvCompiled = sql`SELECT ${sql.csv(['id', 'created_at'])} FROM ${sql('auditLog')}`.compile();
  assert.deepStrictEqual(csvCompiled, ['SELECT id, created_at FROM `audit_log`', []]);

  const literalCompiled = sql`SELECT ${sql.literal('count(*)')} FROM ${sql('auditLog')}`.compile();
  assert.deepStrictEqual(literalCompiled, ['SELECT count(*) FROM `audit_log`', []]);

  const unsafeCompiled = sql.unsafe('SELECT ? + ? AS sum', [10, 7]).compile();
  assert.deepStrictEqual(unsafeCompiled, ['SELECT ? + ? AS sum', [10, 7]]);

  return 'PASS: logical, csv, literal, and unsafe statement helpers compile for mysql';
};
