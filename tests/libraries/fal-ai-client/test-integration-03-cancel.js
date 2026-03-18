import assert from 'assert';
import { createMockFalClient } from './helpers.js';

export const run = async () => {
  const client = createMockFalClient();

  const submitResult = await client.queue.submit('fal-ai/test-model', {
    input: { prompt: 'cancel me' },
  });

  assert.match(submitResult.request_id, /^queue-req-\d+$/);

  await client.queue.cancel('fal-ai/test-model', {
    requestId: submitResult.request_id,
  });

  const status = await client.queue.status('fal-ai/test-model', {
    requestId: submitResult.request_id,
  });

  assert.strictEqual(status.status, 'CANCELED');

  return 'PASS: queue.cancel() transitions request state to CANCELED';
};
