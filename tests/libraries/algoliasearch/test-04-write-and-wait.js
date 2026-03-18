import assert from 'assert';
import { algoliasearch } from 'algoliasearch';

const createWriteRequester = () => {
  let taskPollCount = 0;

  return {
    async send(endRequest) {
      const url = new URL(endRequest.url);
      const path = url.pathname;

      if (endRequest.method === 'POST' && path === '/1/indexes/products') {
        return {
          status: 200,
          isTimedOut: false,
          content: JSON.stringify({
            taskID: 42,
            objectID: 'product-1',
            createdAt: '2026-03-18T00:00:00.000Z',
          }),
        };
      }

      if (endRequest.method === 'GET' && path === '/1/indexes/products/task/42') {
        taskPollCount += 1;
        return {
          status: 200,
          isTimedOut: false,
          content: JSON.stringify({
            status: taskPollCount < 2 ? 'notPublished' : 'published',
          }),
        };
      }

      return {
        status: 404,
        isTimedOut: false,
        content: JSON.stringify({ message: `No mocked route for ${endRequest.method} ${path}` }),
      };
    },
  };
};

export const run = async () => {
  const client = algoliasearch('APP_ID', 'API_KEY', {
    requester: createWriteRequester(),
  });

  const saveResult = await client.saveObject({
    indexName: 'products',
    body: { objectID: 'product-1', name: 'Phone' },
  });

  assert.strictEqual(saveResult.taskID, 42);
  assert.strictEqual(saveResult.objectID, 'product-1');

  const taskResult = await client.waitForTask({
    indexName: 'products',
    taskID: saveResult.taskID,
    maxRetries: 5,
    timeout: () => 0,
  });

  assert.strictEqual(taskResult.status, 'published');

  return 'PASS: write operation and waitForTask polling work';
};
