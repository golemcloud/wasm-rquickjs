import assert from 'assert';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import * as lancedb from '@lancedb/lancedb';

export const run = async () => {
  const dbPath = mkdtempSync(path.join(tmpdir(), 'lancedb-test-02-'));

  try {
    const db = await lancedb.connect(dbPath);

    await db.createTable('first', [{ id: 1, vector: [1, 0] }]);
    await db.createTable('second', [{ id: 2, vector: [0, 1] }]);

    const names = await db.tableNames();
    assert.deepStrictEqual(names, ['first', 'second']);

    const paged = await db.tableNames({ limit: 1, startAfter: 'first' });
    assert.deepStrictEqual(paged, ['second']);

    await db.dropTable('first');
    const afterDrop = await db.tableNames();
    assert.deepStrictEqual(afterDrop, ['second']);

    await db.close();
    return 'PASS: tableNames pagination and dropTable work';
  } finally {
    rmSync(dbPath, { recursive: true, force: true });
  }
};
