import assert from 'assert';
import { createMockFalClient } from './helpers.js';

export const run = async () => {
  const client = createMockFalClient();
  const queueUpdates = [];
  let enqueuedRequestId = null;

  const result = await client.subscribe('fal-ai/test-model', {
    input: { prompt: 'subscribe me' },
    pollInterval: 10,
    timeout: 5000,
    onEnqueue: (requestId) => {
      enqueuedRequestId = requestId;
    },
    onQueueUpdate: (update) => {
      queueUpdates.push(update.status);
    },
  });

  assert.match(enqueuedRequestId, /^queue-req-\d+$/);
  assert.deepStrictEqual(queueUpdates, ['IN_QUEUE', 'COMPLETED']);
  assert.strictEqual(result.requestId, `queue-result-${enqueuedRequestId}`);
  assert.deepStrictEqual(result.data, {
    output: 'queue:subscribe me',
  });

  return 'PASS: subscribe() polls queue status and returns final result';
};
