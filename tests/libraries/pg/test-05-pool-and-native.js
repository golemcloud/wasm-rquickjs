import assert from 'assert';
import pg from 'pg';

const { Pool, Query } = pg;

export const run = async () => {
  const pool = new Pool({ max: 2, idleTimeoutMillis: 1000 });

  assert.strictEqual(pool.totalCount, 0);
  assert.strictEqual(pool.idleCount, 0);
  assert.strictEqual(pool.waitingCount, 0);

  const query = new Query({
    name: 'select-answer',
    text: 'select $1::int as answer',
    values: [42],
    rowMode: 'array',
  });

  assert.strictEqual(query.name, 'select-answer');
  assert.strictEqual(query.text, 'select $1::int as answer');
  assert.deepStrictEqual(query.values, [42]);
  assert.strictEqual(query._rowMode, 'array');

  await pool.end();

  return 'PASS: Pool and Query objects initialize correctly without a database connection';
};
