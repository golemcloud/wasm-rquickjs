import assert from 'assert';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import * as lancedb from '@lancedb/lancedb';

export const run = async () => {
  const dbPath = mkdtempSync(path.join(tmpdir(), 'lancedb-test-05-'));

  try {
    const db = await lancedb.connect(dbPath);
    const table = await db.createTable('versions', [{ id: 1, vector: [1, 0] }]);

    const v1 = await table.version();
    await table.add([{ id: 2, vector: [0, 1] }]);
    const v2 = await table.version();

    assert.ok(v2 > v1);

    await table.checkout(v1);
    const atV1 = await table.query().toArray();
    assert.strictEqual(atV1.length, 1);

    await table.checkoutLatest();
    const atLatest = await table.query().toArray();
    assert.strictEqual(atLatest.length, 2);

    await db.close();
    return 'PASS: table versioning checkout works';
  } finally {
    rmSync(dbPath, { recursive: true, force: true });
  }
};
