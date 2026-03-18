import assert from 'assert';
import { Surreal } from 'surrealdb';

const BASE = 'http://localhost:18080';

export const run = async () => {
  const db = new Surreal();

  await db.connect(BASE);
  await db.health();
  const { version } = await db.version();

  assert.strictEqual(version, 'surrealdb-2.2.0');

  await db.close();
  return 'PASS: HTTP mock server supports connect/health/version flow';
};
