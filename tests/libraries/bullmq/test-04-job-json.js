import assert from 'assert';
import { Job } from 'bullmq';

export const run = () => {
  const opts = {
    attempts: 3,
    delay: 1500,
    priority: 4,
    backoff: { type: 'fixed', delay: 2000 },
    removeOnComplete: true,
    sizeLimit: 1024,
  };

  const jsonOpts = Job.optsAsJSON(opts);
  const restored = Job.optsFromJSON(JSON.stringify(jsonOpts));

  assert.strictEqual(restored.attempts, 3);
  assert.strictEqual(restored.delay, 1500);
  assert.strictEqual(restored.priority, 4);
  assert.deepStrictEqual(restored.backoff, { type: 'fixed', delay: 2000 });
  assert.strictEqual(restored.removeOnComplete, true);
  assert.strictEqual(restored.sizeLimit, 1024);

  return 'PASS: Job option JSON serialization round-trips';
};
