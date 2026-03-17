import assert from 'assert';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import * as lancedb from '@lancedb/lancedb';

export const run = async () => {
  const dbPath = mkdtempSync(path.join(tmpdir(), 'lancedb-test-03-'));

  try {
    const db = await lancedb.connect(dbPath);
    const table = await db.createTable('vectors', [
      { id: 1, vector: [1, 0, 0] },
      { id: 2, vector: [0, 1, 0] },
      { id: 3, vector: [0, 0, 1] },
    ]);

    const top = await table.vectorSearch([1, 0, 0]).limit(1).toArray();
    assert.strictEqual(top.length, 1);
    assert.strictEqual(top[0].id, 1);

    await db.close();
    return 'PASS: vectorSearch returns nearest row';
  } finally {
    rmSync(dbPath, { recursive: true, force: true });
  }
};
