import assert from 'assert';
import { MeiliSearch } from 'meilisearch';

export const run = async () => {
  const client = new MeiliSearch({
    host: 'http://localhost:17700',
    apiKey: 'test-master-key',
  });

  const health = await client.health();
  assert.strictEqual(health.status, 'available');

  const version = await client.getVersion();
  assert.ok(typeof version.pkgVersion === 'string');
  assert.ok(version.pkgVersion.length > 0);

  return 'PASS: connected to Docker Meilisearch and fetched health/version';
};
