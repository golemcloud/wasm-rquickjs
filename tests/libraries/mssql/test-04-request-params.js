import assert from 'assert';
import mssqlBase from 'mssql/lib/base/index.js';

const mssql = mssqlBase.default || mssqlBase;
const sql = mssql.exports;

export const run = () => {
  const request = new mssql.Request();

  request.input('id', sql.Int, 7);
  request.input('name', 'Alice');
  request.output('count', sql.Int);
  request.replaceInput('id', sql.Int, 9);

  assert.strictEqual(request.parameters.id.value, 9);
  assert.strictEqual(request.parameters.id.type, sql.Int);
  assert.strictEqual(request.parameters.name.type, sql.NVarChar);
  assert.strictEqual(request.parameters.count.io, 2);

  const statement = request.template`select * from users where id = ${9} and name = ${'Alice'}`;
  assert.ok(statement.includes('@param1'));
  assert.ok(statement.includes('@param2'));

  const inList = request.template`select * from users where id in (${[1, 2, 3]})`;
  assert.ok(inList.includes('@param1_0'));
  assert.ok(inList.includes('@param1_1'));
  assert.ok(inList.includes('@param1_2'));

  return 'PASS: request parameter binding and template expansion work';
};
