import assert from 'assert';
import { isQueueStatus, isCompletedQueueStatus } from '@fal-ai/client';

export const run = () => {
  const inQueue = {
    status: 'IN_QUEUE',
    response_url: 'https://queue.fal.run/fal-ai/test-model/requests/req-1',
  };

  const completed = {
    status: 'COMPLETED',
    response_url: 'https://queue.fal.run/fal-ai/test-model/requests/req-1',
  };

  const invalid = {
    status: 'IN_QUEUE',
  };

  assert.ok(isQueueStatus(inQueue));
  assert.ok(isQueueStatus(completed));
  assert.ok(!isQueueStatus(invalid));

  assert.strictEqual(isCompletedQueueStatus(inQueue), false);
  assert.strictEqual(isCompletedQueueStatus(completed), true);

  return 'PASS: queue status type guards classify queue status payloads correctly';
};
