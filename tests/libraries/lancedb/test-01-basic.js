import assert from 'assert';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import * as lancedb from '@lancedb/lancedb';

export const run = async () => {
  const dbPath = mkdtempSync(path.join(tmpdir(), 'lancedb-test-01-'));

  try {
    const db = await lancedb.connect(dbPath);
    const table = await db.createTable('items', [
      { id: 1, text: 'alpha', vector: [0.1, 0.2, 0.3] },
      { id: 2, text: 'beta', vector: [0.4, 0.5, 0.6] },
    ]);

    const rows = await table.query().select(['id', 'text']).limit(2).toArray();
    assert.strictEqual(rows.length, 2);
    assert.strictEqual(rows[0].id, 1);
    assert.strictEqual(rows[1].text, 'beta');

    await db.close();
    return 'PASS: connect/create/query works';
  } finally {
    rmSync(dbPath, { recursive: true, force: true });
  }
};
