import assert from 'assert';
import Database from 'better-sqlite3';

export const run = () => {
  const db = new Database(':memory:');
  db.exec('CREATE TABLE nums (n INTEGER NOT NULL)');

  const insert = db.prepare('INSERT INTO nums (n) VALUES (?)');
  insert.run(2);
  insert.run(4);
  insert.run(6);

  db.function('triple', (x) => x * 3);

  const stmt = db.prepare('SELECT triple(n) AS t FROM nums ORDER BY n');
  const values = [];
  for (const row of stmt.iterate()) {
    values.push(row.t);
  }

  assert.deepStrictEqual(values, [6, 12, 18]);
  db.close();
  return 'PASS: custom SQL functions and iterate() work';
};
