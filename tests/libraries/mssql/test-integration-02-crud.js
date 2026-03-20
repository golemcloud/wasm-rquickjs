import sql from 'mssql';

export const run = async () => {
  const config = {
    server: '127.0.0.1',
    port: 14330,
    user: 'sa',
    password: 'TestPass123!',
    database: 'master',
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
  };

  const pool = await sql.connect(config);
  try {
    // Clean up if table exists from a previous run
    await pool.request().query(`
      IF OBJECT_ID('dbo.wasm_rquickjs_test', 'U') IS NOT NULL
        DROP TABLE dbo.wasm_rquickjs_test
    `);

    // CREATE
    await pool.request().query(`
      CREATE TABLE dbo.wasm_rquickjs_test (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        value INT NOT NULL
      )
    `);

    // INSERT
    await pool.request()
      .input('name', sql.NVarChar, 'alice')
      .input('value', sql.Int, 42)
      .query('INSERT INTO dbo.wasm_rquickjs_test (name, value) VALUES (@name, @value)');

    await pool.request()
      .input('name', sql.NVarChar, 'bob')
      .input('value', sql.Int, 99)
      .query('INSERT INTO dbo.wasm_rquickjs_test (name, value) VALUES (@name, @value)');

    // SELECT
    const selectResult = await pool.request().query('SELECT * FROM dbo.wasm_rquickjs_test ORDER BY id');
    if (selectResult.recordset.length !== 2) {
      throw new Error(`Expected 2 rows, got ${selectResult.recordset.length}`);
    }
    if (selectResult.recordset[0].name !== 'alice' || selectResult.recordset[0].value !== 42) {
      throw new Error(`Row 0 mismatch: ${JSON.stringify(selectResult.recordset[0])}`);
    }

    // UPDATE
    await pool.request()
      .input('newValue', sql.Int, 100)
      .input('name', sql.NVarChar, 'alice')
      .query('UPDATE dbo.wasm_rquickjs_test SET value = @newValue WHERE name = @name');

    const updated = await pool.request()
      .input('name', sql.NVarChar, 'alice')
      .query('SELECT value FROM dbo.wasm_rquickjs_test WHERE name = @name');
    if (updated.recordset[0].value !== 100) {
      throw new Error(`Expected updated value 100, got ${updated.recordset[0].value}`);
    }

    // DELETE
    await pool.request()
      .input('name', sql.NVarChar, 'bob')
      .query('DELETE FROM dbo.wasm_rquickjs_test WHERE name = @name');

    const afterDelete = await pool.request().query('SELECT COUNT(*) AS cnt FROM dbo.wasm_rquickjs_test');
    if (afterDelete.recordset[0].cnt !== 1) {
      throw new Error(`Expected 1 row after delete, got ${afterDelete.recordset[0].cnt}`);
    }

    // DROP
    await pool.request().query('DROP TABLE dbo.wasm_rquickjs_test');

    return 'PASS: CRUD operations completed successfully';
  } finally {
    await pool.close();
  }
};
