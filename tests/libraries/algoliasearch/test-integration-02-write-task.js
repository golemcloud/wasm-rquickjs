import assert from 'assert';
import { algoliasearch } from 'algoliasearch';
import { createFetchRequester } from './fetch-requester.js';

const client = algoliasearch('test-app', 'test-key', {
  requester: createFetchRequester(),
  hosts: [{ url: 'localhost', port: 18080, protocol: 'http', accept: 'readWrite' }],
  timeouts: { connect: 300, read: 2000, write: 2000 },
});

export const run = async () => {
  const saveResult = await client.saveObject({
    indexName: 'products',
    body: { objectID: 'integration-product', name: 'Integration Phone' },
  });

  assert.strictEqual(typeof saveResult.taskID, 'number');
  assert.strictEqual(saveResult.objectID, 'integration-product');

  const taskResult = await client.waitForTask({
    indexName: 'products',
    taskID: saveResult.taskID,
    maxRetries: 6,
    timeout: () => 0,
  });

  assert.strictEqual(taskResult.status, 'published');

  const fetched = await client.getObject({
    indexName: 'products',
    objectID: 'integration-product',
  });

  assert.strictEqual(fetched.name, 'Integration Phone');

  return 'PASS: write, task polling, and object retrieval work via mock HTTP server';
};
