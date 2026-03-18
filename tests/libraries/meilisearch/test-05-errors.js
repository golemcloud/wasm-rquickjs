import assert from 'assert';
import { MeiliSearch } from 'meilisearch';

export const run = async () => {
  const requestErrorClient = new MeiliSearch({
    host: 'http://unused.example',
    apiKey: 'test-api-key',
    httpClient: async (url, init = {}) => {
      const parsedUrl = new URL(url);
      const method = init.method || 'GET';

      throw new Error(`synthetic network failure for ${method} ${parsedUrl.pathname}`);
    },
  });

  await assert.rejects(
    () => requestErrorClient.getIndex('missing'),
    (error) => {
      assert.strictEqual(error.name, 'MeiliSearchRequestError');
      assert.ok(typeof error.message === 'string' && error.message.includes('/indexes/missing'));
      assert.ok(error.cause instanceof Error);
      assert.ok(error.cause.message.includes('synthetic network failure'));
      return true;
    },
  );

  let pollCount = 0;
  const failedTaskClient = new MeiliSearch({
    host: 'http://unused.example',
    apiKey: 'test-api-key',
    httpClient: async (url, init = {}) => {
      const parsedUrl = new URL(url);
      const method = init.method || 'GET';

      if (method === 'POST' && parsedUrl.pathname === '/indexes/books/documents') {
        return {
          taskUid: 9,
          indexUid: 'books',
          status: 'enqueued',
          type: 'documentAdditionOrUpdate',
          enqueuedAt: '2026-01-01T00:00:00.000Z',
        };
      }

      if (method === 'GET' && parsedUrl.pathname === '/tasks/9') {
        pollCount += 1;
        return {
          uid: 9,
          indexUid: 'books',
          status: 'failed',
          type: 'documentAdditionOrUpdate',
          enqueuedAt: '2026-01-01T00:00:00.000Z',
          startedAt: '2026-01-01T00:00:00.050Z',
          finishedAt: '2026-01-01T00:00:00.080Z',
          error: {
            message: 'Synthetic task failure',
            code: 'internal',
            type: 'internal',
            link: 'https://docs.meilisearch.com/errors#internal',
          },
        };
      }

      throw new Error(`Unexpected request: ${method} ${parsedUrl.pathname}`);
    },
  });

  const taskPromise = failedTaskClient.index('books').addDocuments([{ id: 1, title: 'Dune' }]);
  const failedTask = await taskPromise.waitTask({ timeout: 1000, interval: 5 });

  assert.ok(pollCount >= 1);
  assert.strictEqual(failedTask.status, 'failed');
  assert.strictEqual(failedTask.uid, 9);
  assert.strictEqual(failedTask.error.code, 'internal');

  return 'PASS: request failures and failed task states are surfaced through typed objects';
};
