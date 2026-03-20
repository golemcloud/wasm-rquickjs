import assert from 'assert';
import {
  DelayedError,
  RateLimitError,
  UnrecoverableError,
  WaitingChildrenError,
  WaitingError,
  Worker,
} from 'bullmq';

export const run = () => {
  const delayed = new DelayedError();
  const rateLimited = new RateLimitError();
  const waiting = new WaitingError();
  const waitingChildren = new WaitingChildrenError();
  const unrecoverable = new UnrecoverableError('fatal');
  const fromWorker = Worker.RateLimitError();

  assert.ok(delayed instanceof Error);
  assert.ok(rateLimited instanceof Error);
  assert.ok(waiting instanceof Error);
  assert.ok(waitingChildren instanceof Error);
  assert.ok(unrecoverable instanceof Error);
  assert.ok(fromWorker instanceof RateLimitError);

  assert.strictEqual(unrecoverable.message, 'fatal');
  assert.strictEqual(rateLimited.message, 'bullmq:rateLimitExceeded');
  assert.strictEqual(delayed.message, 'bullmq:movedToDelayed');
  assert.strictEqual(waiting.message, 'bullmq:movedToWait');
  assert.strictEqual(waitingChildren.message, 'bullmq:movedToWaitingChildren');

  return 'PASS: BullMQ error classes expose expected messages and types';
};
