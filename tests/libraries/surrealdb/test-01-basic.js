import assert from 'assert';
import { RecordId, Surreal, Table } from 'surrealdb';

export const run = () => {
  const table = new Table('person');
  const rid = new RecordId('person', 'alice');

  assert.strictEqual(table.toString(), 'person');
  assert.strictEqual(rid.toString(), 'person:alice');

  const db = new Surreal();
  const compiled = db.create(rid).content({ name: 'Alice', age: 30 }).compile();

  assert.ok(compiled.query.includes('CREATE'));
  assert.ok(compiled.query.includes('CONTENT'));
  assert.ok(Object.values(compiled.bindings).some((v) => v === rid));
  assert.ok(Object.values(compiled.bindings).some((v) => v && v.name === 'Alice'));

  return 'PASS: basic value construction and create-query compilation work';
};
