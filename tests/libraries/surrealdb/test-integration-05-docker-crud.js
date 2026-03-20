import assert from 'assert';
import { RecordId, Surreal } from 'surrealdb';

const BASE = 'http://localhost:18082';
const NAMESPACE = 'main';
const DATABASE = 'main';

export const run = async () => {
  const db = new Surreal();
  const record = new RecordId('person', `surrealdb_wasm_${Date.now()}_${Math.floor(Math.random() * 10000)}`);

  await db.connect(BASE);
  await db.signin({ username: 'root', password: 'root' });
  await db.use({ namespace: NAMESPACE, database: DATABASE });

  const created = await db.create(record).content({ name: 'Alice', age: 30 });
  assert.strictEqual(created.name, 'Alice');
  assert.strictEqual(created.age, 30);

  const selected = await db.select(record);
  assert.strictEqual(selected.name, 'Alice');
  assert.strictEqual(selected.age, 30);

  const updated = await db.update(record).merge({ age: 31 });
  assert.strictEqual(updated.age, 31);

  await db.delete(record);
  const missing = await db.select(record);
  assert.strictEqual(missing, undefined);

  await db.close();
  return 'PASS: Docker SurrealDB supports create/select/update/delete';
};
