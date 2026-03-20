import assert from 'assert';
import { ConnectionUnavailableError, Surreal } from 'surrealdb';

export const run = async () => {
  const db = new Surreal();

  await assert.rejects(async () => {
    await db.version();
  }, ConnectionUnavailableError);

  await assert.rejects(async () => {
    await db.health();
  }, ConnectionUnavailableError);

  return 'PASS: disconnected clients raise ConnectionUnavailableError for remote calls';
};
