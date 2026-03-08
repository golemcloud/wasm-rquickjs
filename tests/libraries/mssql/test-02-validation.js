import assert from 'assert';
import mssqlBase from 'mssql/lib/base/index.js';

const mssql = mssqlBase.default || mssqlBase;
const sql = mssql.exports;

export const run = () => {
  const table = new sql.Table('[dbo].[users]');
  table.create = true;

  table.columns.add('id', sql.Int, { nullable: false, primary: true });
  table.columns.add('name', sql.NVarChar(50), { nullable: false });
  table.columns.add('email', sql.NVarChar(100), { nullable: true });

  table.rows.add(1, 'Alice', 'alice@example.com');
  table.rows.add(2, 'Bob', null);

  const ddl = table.declare();
  assert.ok(ddl.includes('create table [dbo].[users]'));
  assert.ok(ddl.includes('[id] int'));
  assert.ok(ddl.includes('[name] nvarchar (50)'));
  assert.ok(ddl.includes('[email] nvarchar (100)'));

  const parsed = sql.Table.parseName('[analytics].[sales].[orders]');
  assert.deepStrictEqual(parsed, {
    name: 'orders',
    schema: 'sales',
    database: 'analytics',
  });

  table.rows.clear();
  assert.strictEqual(table.rows.length, 0);

  return 'PASS: table metadata helpers work without a live database';
};
