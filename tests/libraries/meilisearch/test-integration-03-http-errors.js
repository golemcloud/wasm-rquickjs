import assert from 'assert';
import { MeiliSearch } from 'meilisearch';

export const run = async () => {
  const client = new MeiliSearch({
    host: 'http://localhost:18080',
    apiKey: 'test-master-key',
  });

  await assert.rejects(
    () => client.getIndex('missing-http-index'),
    (error) => {
      assert.strictEqual(error.name, 'MeiliSearchApiError');
      assert.strictEqual(error.cause.code, 'index_not_found');
      return true;
    },
  );

  const deleted = await client.deleteIndexIfExists('missing-http-index');
  assert.strictEqual(deleted, false);

  return 'PASS: HTTP mock surfaces MeiliSearch API errors and deleteIndexIfExists fallback';
};
