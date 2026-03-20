import assert from 'assert';
import mysql from 'mysql2/promise';

export const run = async () => {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 33061,
    user: 'testuser',
    password: 'testpass',
    database: 'testdb',
  });

  try {
    // Create table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS test_crud (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        value INT NOT NULL
      )
    `);

    // Clean up any previous data
    await connection.execute('DELETE FROM test_crud');

    // Insert
    const [insertResult] = await connection.execute(
      'INSERT INTO test_crud (name, value) VALUES (?, ?)',
      ['alpha', 10],
    );
    assert.strictEqual(insertResult.affectedRows, 1);
    const insertedId = insertResult.insertId;

    // Select
    const [selectRows] = await connection.execute(
      'SELECT * FROM test_crud WHERE id = ?',
      [insertedId],
    );
    assert.strictEqual(selectRows.length, 1);
    assert.strictEqual(selectRows[0].name, 'alpha');
    assert.strictEqual(selectRows[0].value, 10);

    // Update
    const [updateResult] = await connection.execute(
      'UPDATE test_crud SET value = ? WHERE id = ?',
      [42, insertedId],
    );
    assert.strictEqual(updateResult.affectedRows, 1);

    // Verify update
    const [updatedRows] = await connection.execute(
      'SELECT value FROM test_crud WHERE id = ?',
      [insertedId],
    );
    assert.strictEqual(updatedRows[0].value, 42);

    // Delete
    const [deleteResult] = await connection.execute(
      'DELETE FROM test_crud WHERE id = ?',
      [insertedId],
    );
    assert.strictEqual(deleteResult.affectedRows, 1);

    // Drop table
    await connection.execute('DROP TABLE IF EXISTS test_crud');

    return 'PASS: mysql2 CRUD operations (INSERT, SELECT, UPDATE, DELETE) work';
  } finally {
    await connection.end();
  }
};
