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
    const result = await pool.request().query('SELECT 1+1 AS result');
    const value = result.recordset[0].result;
    if (value !== 2) {
      throw new Error(`Expected 2, got ${value}`);
    }
    return 'PASS: connected to SQL Server and executed SELECT 1+1';
  } finally {
    await pool.close();
  }
};
