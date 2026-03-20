import assert from 'assert';
import Database from 'better-sqlite3';

export const run = () => {
  const db = new Database(':memory:');
  db.exec('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL)');

  const insert = db.prepare('INSERT INTO users (name) VALUES (?)');
  insert.run('Ada');
  insert.run('Linus');

  const first = db.prepare('SELECT id, name FROM users WHERE name = ?').get('Ada');
  assert.strictEqual(first.name, 'Ada');
  assert.strictEqual(first.id, 1);

  const allNames = db.prepare('SELECT name FROM users ORDER BY id').pluck().all();
  assert.deepStrictEqual(allNames, ['Ada', 'Linus']);

  db.close();
  return 'PASS: basic database open/insert/get/all works';
};
