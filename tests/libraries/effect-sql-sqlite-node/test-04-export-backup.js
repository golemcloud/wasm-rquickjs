import assert from 'node:assert';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import * as Effect from 'effect/Effect';
import * as SqliteClient from '@effect/sql-sqlite-node/SqliteClient';

const layer = SqliteClient.layer({
  filename: ':memory:',
  disableWAL: true,
});

export const run = async () => {
  const backupPath = path.join(os.tmpdir(), `effect-sql-sqlite-node-${Date.now().toString(36)}.db`);

  try {
    const program = Effect.gen(function* () {
      const sql = yield* SqliteClient.SqliteClient;

      yield* sql`CREATE TABLE payloads (id INTEGER PRIMARY KEY AUTOINCREMENT, value TEXT NOT NULL)`;
      yield* sql`INSERT INTO payloads ${sql.insert({ value: 'alpha' })}`;

      const bytes = yield* sql.export;
      assert.ok(bytes instanceof Uint8Array);
      assert.ok(bytes.length > 0);

      const metadata = yield* sql.backup(backupPath);
      assert.ok(metadata.totalPages >= 1);
      assert.ok(metadata.remainingPages >= 0);
    }).pipe(Effect.provide(layer));

    await Effect.runPromise(Effect.scoped(program));

    const stat = await fs.stat(backupPath);
    assert.ok(stat.size > 0);

    return 'PASS: SqliteClient export and backup produce non-empty SQLite snapshots';
  } finally {
    await fs.rm(backupPath, { force: true });
  }
};
