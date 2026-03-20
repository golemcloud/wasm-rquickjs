import assert from 'assert';
import { algoliasearch } from 'algoliasearch';
import { createFetchRequester } from './fetch-requester.js';

const client = algoliasearch('test-app', 'test-key', {
  requester: createFetchRequester(),
  hosts: [{ url: 'localhost', port: 18080, protocol: 'http', accept: 'readWrite' }],
  timeouts: { connect: 300, read: 2000, write: 2000 },
});

export const run = async () => {
  const single = await client.searchSingleIndex({
    indexName: 'products',
    searchParams: { query: 'tablet' },
  });

  assert.strictEqual(single.hits.length, 2);
  assert.strictEqual(single.hits[0].name, 'Phone tablet');

  const multi = await client.search({
    requests: [{ indexName: 'products', query: 'laptop' }],
  });

  assert.strictEqual(multi.results.length, 1);
  assert.strictEqual(multi.results[0].hits[0].name, 'Phone laptop');

  return 'PASS: search requests work against mock HTTP server';
};
