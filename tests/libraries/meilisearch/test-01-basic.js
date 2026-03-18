import assert from 'assert';
import { ErrorStatusCode, MeiliSearch } from 'meilisearch';

export const run = () => {
  const client = new MeiliSearch({
    host: 'http://localhost:7700',
    apiKey: 'test-master-key',
    timeout: 2000,
    defaultWaitOptions: {
      timeout: 3000,
      interval: 25,
    },
  });

  const index = client.index('books');

  assert.strictEqual(typeof client.index, 'function');
  assert.strictEqual(typeof client.getIndex, 'function');
  assert.strictEqual(typeof client.createIndex, 'function');
  assert.strictEqual(typeof client.deleteIndexIfExists, 'function');
  assert.strictEqual(typeof client.multiSearch, 'function');
  assert.strictEqual(typeof client.health, 'function');

  assert.strictEqual(index.uid, 'books');
  assert.strictEqual(typeof index.search, 'function');
  assert.strictEqual(typeof index.addDocuments, 'function');
  assert.strictEqual(typeof index.updateDocuments, 'function');
  assert.strictEqual(typeof index.getDocuments, 'function');
  assert.strictEqual(typeof index.deleteAllDocuments, 'function');

  assert.strictEqual(ErrorStatusCode.INDEX_NOT_FOUND, 'index_not_found');

  return 'PASS: MeiliSearch client/index constructors and exported APIs are available';
};
