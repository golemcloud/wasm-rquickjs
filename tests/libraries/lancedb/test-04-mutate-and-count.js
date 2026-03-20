import assert from 'assert';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import * as lancedb from '@lancedb/lancedb';

export const run = async () => {
  const dbPath = mkdtempSync(path.join(tmpdir(), 'lancedb-test-04-'));

  try {
    const db = await lancedb.connect(dbPath);
    const table = await db.createTable('items', [
      { id: 1, text: 'a', vector: [1, 0] },
      { id: 2, text: 'b', vector: [0, 1] },
    ]);

    await table.add([{ id: 3, text: 'c', vector: [1, 1] }]);

    const countBeforeDelete = await table.countRows();
    assert.strictEqual(countBeforeDelete, 3);

    await table.delete('id = 1');

    const countAfterDelete = await table.countRows();
    const filteredCount = await table.countRows('id > 1');
    assert.strictEqual(countAfterDelete, 2);
    assert.strictEqual(filteredCount, 2);

    await db.close();
    return 'PASS: add/delete/countRows work';
  } finally {
    rmSync(dbPath, { recursive: true, force: true });
  }
};
