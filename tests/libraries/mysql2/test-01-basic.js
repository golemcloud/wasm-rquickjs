import assert from 'assert';
import mysql from 'mysql2';

export const run = () => {
  const escapedValue = mysql.escape("O'Reilly");
  assert.strictEqual(escapedValue, "'O\\'Reilly'");

  const escapedIdentifier = mysql.escapeId('users.profile');
  assert.strictEqual(escapedIdentifier, '`users`.`profile`');

  const formatted = mysql.format(
    'SELECT ? AS value, ? AS text, ? AS generated',
    [7, "D'Angelo", mysql.raw('NOW()')],
  );
  assert.strictEqual(formatted, "SELECT 7 AS value, 'D\\'Angelo' AS text, NOW() AS generated");

  return 'PASS: mysql2 escaping and SQL formatting helpers work';
};
