import assert from 'assert';
import { HttpEngine, Surreal, ValidationError } from 'surrealdb';

const BASE = 'http://localhost:18080';

export const run = async () => {
  const db = new Surreal();

  await db.connect(BASE, { engine: HttpEngine });
  await db.use({ namespace: 'test', database: 'test' });

  await assert.rejects(async () => {
    await db.query('BAD_QUERY').collect();
  }, ValidationError);

  await db.close();
  return 'PASS: HTTP mock server propagates RPC validation errors';
};
