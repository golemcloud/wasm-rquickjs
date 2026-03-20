import assert from 'node:assert';
import * as MysqlClient from '@effect/sql-mysql2/MysqlClient';
import * as Statement from '@effect/sql/Statement';
import * as Effect from 'effect/Effect';

const toSnakeCase = (value) => value.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`);

const makeOfflineSql = (transform) =>
  Statement.make(Effect.die('offline compiler only'), MysqlClient.makeCompiler(transform), [], undefined);

export const run = async () => {
  const sql = makeOfflineSql(toSnakeCase);

  const insertCompiled = sql`INSERT INTO ${sql('auditLog')} ${sql.insert({
    eventType: 'created',
    attempts: 2,
  })}`.compile();
  assert.deepStrictEqual(insertCompiled, [
    'INSERT INTO `audit_log` (`event_type`,`attempts`) VALUES (?,?)',
    ['created', 2],
  ]);

  const updateCompiled = sql`UPDATE ${sql('auditLog')} SET ${sql.update({
    eventType: 'processed',
    attempts: 3,
  }, ['attempts'])} WHERE ${sql('id')} = ${42}`.compile();
  assert.deepStrictEqual(updateCompiled, [
    'UPDATE `audit_log` SET `event_type` = ? WHERE `id` = ?',
    ['processed', 42],
  ]);

  const inByColumnCompiled = sql`SELECT * FROM ${sql('auditLog')} WHERE ${sql.in('id', [4, 5])}`.compile();
  assert.deepStrictEqual(inByColumnCompiled, [
    'SELECT * FROM `audit_log` WHERE `id` IN (?,?)',
    [4, 5],
  ]);

  return 'PASS: insert/update/in helpers compile mysql placeholders correctly';
};
