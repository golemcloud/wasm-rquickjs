import assert from 'assert';
import { MeiliSearch } from 'meilisearch';

export const run = async () => {
  const client = new MeiliSearch({
    host: 'http://localhost:18080',
    apiKey: 'test-master-key',
  });

  const health = await client.health();
  assert.strictEqual(health.status, 'available');

  const healthy = await client.isHealthy();
  assert.strictEqual(healthy, true);

  return 'PASS: health and isHealthy work against HTTP mock server';
};
