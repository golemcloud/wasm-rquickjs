import assert from 'assert';
import { Surreal } from 'surrealdb';

const BASE = 'http://localhost:18082';

export const run = async () => {
  const db = new Surreal();

  await db.connect(BASE);
  await db.signin({ username: 'root', password: 'root' });
  await db.use({ namespace: 'main', database: 'main' });

  const { version } = await db.version();
  assert.ok(typeof version === 'string' && version.length > 0);

  const [rows] = await db.query('RETURN 1;').collect();
  assert.strictEqual(rows, 1);

  await db.close();
  return 'PASS: Docker SurrealDB accepts connect/version/query over HTTP';
};
