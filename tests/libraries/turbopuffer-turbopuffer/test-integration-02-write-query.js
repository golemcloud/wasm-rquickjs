import assert from 'assert';
import Turbopuffer from '@turbopuffer/turbopuffer';

const BASE_URL = 'http://localhost:18080';

export const run = async () => {
  const client = new Turbopuffer({
    apiKey: 'tpuf_test_key',
    baseURL: BASE_URL,
    region: null,
    maxRetries: 0,
  });

  const namespace = client.namespace('vec-test');

  const writeRes = await namespace.write({
    upsert_rows: [
      { id: 'doc-1', vector: [0.1, 0.2], title: 'alpha document' },
      { id: 'doc-2', vector: [0.2, 0.1], title: 'beta document' },
    ],
    distance_metric: 'cosine_distance',
    return_affected_ids: true,
  });

  assert.strictEqual(writeRes.status, 'OK');
  assert.strictEqual(writeRes.rows_upserted, 2);
  assert.deepStrictEqual(writeRes.upserted_ids, ['doc-1', 'doc-2']);

  const queryRes = await namespace.query({
    rank_by: ['vector', 'ANN', [0.1, 0.2]],
    top_k: 1,
    include_attributes: true,
  });

  assert.strictEqual(queryRes.rows.length, 1);
  assert.strictEqual(queryRes.rows[0].id, 'doc-1');

  const multiRes = await namespace.multiQuery({
    queries: [
      { top_k: 1, rank_by: ['vector', 'ANN', [0.1, 0.2]] },
      { top_k: 1, filters: ['title', 'Eq', 'beta document'] },
    ],
  });

  assert.strictEqual(multiRes.results.length, 2);
  assert.strictEqual(multiRes.results[0].rows[0].id, 'doc-1');

  return 'PASS: write(), query(), and multiQuery() execute against the HTTP transport';
};
