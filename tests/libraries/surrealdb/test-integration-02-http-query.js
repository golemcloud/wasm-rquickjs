import assert from 'assert';
import { Surreal } from 'surrealdb';

const BASE = 'http://localhost:18080';

export const run = async () => {
  const db = new Surreal();

  await db.connect(BASE);
  await db.signin({ username: 'root', password: 'root' });
  await db.use({ namespace: 'test', database: 'test' });

  const [values] = await db.query('SELECT VALUE 42;').collect();
  assert.deepStrictEqual(values, [42]);

  await db.close();
  return 'PASS: HTTP mock server supports signin/use/query flow';
};
