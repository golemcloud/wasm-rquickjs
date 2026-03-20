import assert from 'assert';
import Database from 'better-sqlite3';

export const run = () => {
  const db = new Database(':memory:');
  db.exec('CREATE TABLE metrics (name TEXT, value REAL, active INTEGER)');

  const insert = db.prepare('INSERT INTO metrics (name, value, active) VALUES (@name, @value, @active)');
  insert.run({ name: 'cpu', value: 0.71, active: 1 });
  insert.run({ name: 'ram', value: 0.44, active: 0 });

  const rawRows = db.prepare('SELECT name, value, active FROM metrics ORDER BY name').raw().all();
  assert.strictEqual(rawRows.length, 2);
  assert.deepStrictEqual(rawRows[0], ['cpu', 0.71, 1]);
  assert.deepStrictEqual(rawRows[1], ['ram', 0.44, 0]);

  const plucked = db.prepare('SELECT name FROM metrics ORDER BY name').pluck().all();
  assert.deepStrictEqual(plucked, ['cpu', 'ram']);

  db.close();
  return 'PASS: named bindings plus raw/pluck result modes work';
};
