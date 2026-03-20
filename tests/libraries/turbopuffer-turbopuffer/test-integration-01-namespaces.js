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

  const firstPage = await client.namespaces({ prefix: 'vec', page_size: 1 });
  assert.strictEqual(firstPage.namespaces.length, 1);
  assert.strictEqual(firstPage.namespaces[0].id, 'vec-alpha');
  assert.strictEqual(firstPage.hasNextPage(), true);

  const secondPage = await firstPage.getNextPage();
  assert.strictEqual(secondPage.namespaces.length, 1);
  assert.strictEqual(secondPage.namespaces[0].id, 'vec-beta');
  assert.strictEqual(secondPage.hasNextPage(), false);

  const allIds = [];
  for await (const namespace of client.namespaces({ prefix: 'vec' })) {
    allIds.push(namespace.id);
  }

  assert.deepStrictEqual(allIds, ['vec-alpha', 'vec-beta']);

  return 'PASS: namespaces() supports page iteration and async auto-pagination over HTTP';
};
