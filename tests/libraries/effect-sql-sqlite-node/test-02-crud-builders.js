import assert from 'node:assert';
import * as Effect from 'effect/Effect';
import * as SqliteClient from '@effect/sql-sqlite-node/SqliteClient';

const layer = SqliteClient.layer({
  filename: ':memory:',
  disableWAL: true,
});

export const run = async () => {
  const tableName = `items_${Date.now().toString(36)}`;

  const program = Effect.gen(function* () {
    const sql = yield* SqliteClient.SqliteClient;

    yield* sql`CREATE TABLE ${sql(tableName)} (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, score INTEGER NOT NULL)`;

    yield* sql`INSERT INTO ${sql(tableName)} ${sql.insert({ name: 'Ada', score: 7 })}`;
    yield* sql`INSERT INTO ${sql(tableName)} ${sql.insert({ name: 'Grace', score: 9 })}`;

    const selected = yield* sql`SELECT name, score FROM ${sql(tableName)} WHERE name IN ${sql.in(['Ada', 'Grace'])} ORDER BY score ASC`;
    assert.strictEqual(selected.length, 2);
    assert.strictEqual(selected[0].name, 'Ada');
    assert.strictEqual(Number(selected[1].score), 9);

    yield* sql`UPDATE ${sql(tableName)} SET ${sql.update({ score: 11 })} WHERE name = ${'Ada'}`;

    const updated = yield* sql`SELECT score FROM ${sql(tableName)} WHERE name = ${'Ada'}`;
    assert.strictEqual(updated.length, 1);
    assert.strictEqual(Number(updated[0].score), 11);

    yield* sql`DELETE FROM ${sql(tableName)} WHERE name = ${'Grace'}`;

    const remaining = yield* sql`SELECT COUNT(*) AS count FROM ${sql(tableName)}`;
    assert.strictEqual(Number(remaining[0].count), 1);
  }).pipe(Effect.provide(layer));

  await Effect.runPromise(Effect.scoped(program));
  return 'PASS: SqliteClient CRUD operations succeed with statement builders';
};
