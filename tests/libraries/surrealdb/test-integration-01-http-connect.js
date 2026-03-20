import assert from 'assert';
import { HttpEngine, Surreal } from 'surrealdb';

const BASE = 'http://localhost:18080';

export const run = async () => {
  const db = new Surreal();

  await db.connect(BASE, { engine: HttpEngine });
  await db.health();
  const versionResult = await db.version();

  assert.strictEqual(versionResult.version, 'surrealdb-2.2.0');

  await db.close();
  return 'PASS: HTTP mock server supports connect/health/version flow';
};
