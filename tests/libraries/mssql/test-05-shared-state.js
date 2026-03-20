import assert from 'assert';
import mssqlBase from 'mssql/lib/base/index.js';

const mssql = mssqlBase.default || mssqlBase;
const sql = mssql.exports;

export const run = () => {
  class CustomClass {}

  sql.map.register(CustomClass, sql.VarChar(36));
  const mapped = sql.map.find((entry) => entry.js === CustomClass);
  assert.ok(mapped);
  assert.strictEqual(mapped.sql.type, sql.VarChar().type);

  const originalPromise = mssql.Promise;
  class WrappedPromise extends Promise {}

  mssql.Promise = WrappedPromise;
  assert.strictEqual(mssql.Promise, WrappedPromise);
  mssql.Promise = originalPromise;

  const customHandler = (value) => value + 1;
  mssql.valueHandler.set(sql.TYPES.Int, customHandler);
  assert.strictEqual(mssql.valueHandler.get(sql.TYPES.Int)(41), 42);
  mssql.valueHandler.delete(sql.TYPES.Int);
  assert.strictEqual(mssql.valueHandler.get(sql.TYPES.Int), undefined);

  return 'PASS: map registration, Promise override, and value handlers work';
};
