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

  const namespace = client.namespace('schema-test');

  const updatedSchema = await namespace.updateSchema({
    schema: {
      title: {
        type: 'string',
        filterable: true,
      },
      vector: {
        type: '[2]f32',
        ann: { distance_metric: 'cosine_distance' },
      },
    },
  });

  assert.strictEqual(updatedSchema.title.type, 'string');
  assert.strictEqual(updatedSchema.vector.ann.distance_metric, 'cosine_distance');

  const schema = await namespace.schema();
  assert.strictEqual(schema.title.filterable, true);

  const existsBeforeDelete = await namespace.exists();
  assert.strictEqual(existsBeforeDelete, true);

  const metadata = await namespace.metadata();
  assert.strictEqual(typeof metadata.approx_row_count, 'number');
  assert.strictEqual(metadata.encryption.sse, true);

  const explain = await namespace.explainQuery({
    rank_by: ['title', 'BM25', 'alpha'],
    top_k: 1,
  });
  assert.ok(explain.plan_text.includes('Mock query plan'));

  const warm = await namespace.hintCacheWarm();
  assert.strictEqual(warm.status, 'ACCEPTED');

  const deleted = await namespace.deleteAll();
  assert.strictEqual(deleted.status, 'OK');

  const existsAfterDelete = await namespace.exists();
  assert.strictEqual(existsAfterDelete, false);

  return 'PASS: schema(), metadata(), explainQuery(), hintCacheWarm(), and deleteAll() work over HTTP';
};
