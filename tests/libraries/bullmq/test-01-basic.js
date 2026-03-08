import assert from 'assert';
import { QueueKeys } from 'bullmq';

export const run = () => {
  const keys = new QueueKeys('bull');
  assert.strictEqual(keys.getQueueQualifiedName('jobs'), 'bull:jobs');
  assert.strictEqual(keys.toKey('jobs', 'wait'), 'bull:jobs:wait');

  const allKeys = keys.getKeys('jobs');
  assert.strictEqual(allKeys.active, 'bull:jobs:active');
  assert.strictEqual(allKeys.failed, 'bull:jobs:failed');
  assert.strictEqual(allKeys.events, 'bull:jobs:events');

  return 'PASS: QueueKeys generates expected Redis key names';
};
