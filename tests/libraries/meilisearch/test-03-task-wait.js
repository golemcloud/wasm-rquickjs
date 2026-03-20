import assert from 'assert';
import { MeiliSearch } from 'meilisearch';

const ENQUEUED_AT = '2026-01-01T00:00:00.000Z';
const STARTED_AT = '2026-01-01T00:00:00.050Z';
const FINISHED_AT = '2026-01-01T00:00:00.100Z';

export const run = async () => {
  let taskPolls = 0;

  const client = new MeiliSearch({
    host: 'http://unused.example',
    apiKey: 'test-api-key',
    httpClient: async (url, init = {}) => {
      const parsedUrl = new URL(url);
      const method = init.method || 'GET';

      if (method === 'POST' && parsedUrl.pathname === '/indexes/books/documents') {
        return {
          taskUid: 41,
          indexUid: 'books',
          status: 'enqueued',
          type: 'documentAdditionOrUpdate',
          enqueuedAt: ENQUEUED_AT,
        };
      }

      if (method === 'GET' && parsedUrl.pathname === '/tasks/41') {
        taskPolls += 1;
        if (taskPolls < 2) {
          return {
            uid: 41,
            indexUid: 'books',
            status: 'processing',
            type: 'documentAdditionOrUpdate',
            enqueuedAt: ENQUEUED_AT,
            startedAt: STARTED_AT,
          };
        }

        return {
          uid: 41,
          indexUid: 'books',
          status: 'succeeded',
          type: 'documentAdditionOrUpdate',
          enqueuedAt: ENQUEUED_AT,
          startedAt: STARTED_AT,
          finishedAt: FINISHED_AT,
          duration: 'PT0.05S',
        };
      }

      throw new Error(`Unexpected request: ${method} ${parsedUrl.pathname}`);
    },
  });

  const index = client.index('books');
  const enqueuedTaskPromise = index.addDocuments([{ id: 1, title: 'Dune' }]);

  assert.strictEqual(typeof enqueuedTaskPromise.waitTask, 'function');

  const enqueuedTask = await enqueuedTaskPromise;
  assert.strictEqual(enqueuedTask.status, 'enqueued');
  assert.strictEqual(enqueuedTask.taskUid, 41);

  const completedTask = await enqueuedTaskPromise.waitTask({ timeout: 500, interval: 10 });
  assert.strictEqual(completedTask.status, 'succeeded');
  assert.strictEqual(completedTask.uid, 41);
  assert.ok(taskPolls >= 2);

  return 'PASS: EnqueuedTaskPromise.waitTask polls tasks until completion';
};
