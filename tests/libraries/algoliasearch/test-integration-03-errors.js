import assert from 'assert';
import { algoliasearch } from 'algoliasearch';
import { createFetchRequester } from './fetch-requester.js';

const client = algoliasearch('test-app', 'test-key', {
  requester: createFetchRequester(),
  hosts: [{ url: 'localhost', port: 18080, protocol: 'http', accept: 'readWrite' }],
  timeouts: { connect: 300, read: 2000, write: 2000 },
});

export const run = async () => {
  let thrown;
  try {
    await client.getObject({
      indexName: 'products',
      objectID: 'missing-object',
    });
  } catch (error) {
    thrown = error;
  }

  assert.ok(thrown, 'Expected getObject to throw');
  assert.strictEqual(thrown.name, 'ApiError');
  assert.strictEqual(thrown.status, 404);

  return 'PASS: HTTP 404 responses propagate as ApiError';
};
