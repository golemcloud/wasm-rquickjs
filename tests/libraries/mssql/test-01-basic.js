import assert from 'assert';
import mssqlBase from 'mssql/lib/base/index.js';

const mssql = mssqlBase.default || mssqlBase;
const sql = mssql.exports;

export const run = () => {
  assert.strictEqual(sql.MAX, 65535);
  assert.strictEqual(sql.ISOLATION_LEVEL.READ_COMMITTED, 2);

  const defaultStringType = sql.getTypeByValue('hello');
  const intType = sql.getTypeByValue(42);
  const bigIntType = sql.getTypeByValue(2147483648);
  const floatType = sql.getTypeByValue(3.5);
  const boolType = sql.getTypeByValue(true);
  const dateType = sql.getTypeByValue(new Date('2024-01-01T00:00:00Z'));
  const bufferType = sql.getTypeByValue(Buffer.from('abc'));

  assert.strictEqual(defaultStringType, sql.NVarChar);
  assert.strictEqual(intType, sql.Int);
  assert.strictEqual(bigIntType, sql.BigInt);
  assert.strictEqual(floatType, sql.Float);
  assert.strictEqual(boolType, sql.Bit);
  assert.strictEqual(dateType, sql.DateTime);
  assert.strictEqual(bufferType, sql.VarBinary);

  return 'PASS: type inference and base constants work';
};
