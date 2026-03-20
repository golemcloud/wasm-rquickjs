import assert from 'assert';
import pg from 'pg';

export const run = () => {
  const escapedIdentifier = pg.escapeIdentifier('users"table');
  assert.strictEqual(escapedIdentifier, '"users""table"');

  const escapedLiteral = pg.escapeLiteral("O'Reilly");
  assert.strictEqual(escapedLiteral, "'O''Reilly'");

  return 'PASS: escapeIdentifier and escapeLiteral format SQL-safe output';
};
