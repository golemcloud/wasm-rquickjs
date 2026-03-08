import assert from 'assert';
import { AsyncFifoQueue } from 'bullmq';

export const run = async () => {
  const fifo = new AsyncFifoQueue();

  fifo.add(Promise.resolve('first'));
  fifo.add(Promise.resolve('second'));

  assert.strictEqual(fifo.numTotal(), 2);

  const first = await fifo.fetch();
  const second = await fifo.fetch();

  assert.strictEqual(first, 'first');
  assert.strictEqual(second, 'second');
  assert.strictEqual(fifo.numPending(), 0);
  assert.strictEqual(fifo.numQueued(), 0);
  assert.strictEqual(fifo.numTotal(), 0);

  return 'PASS: AsyncFifoQueue preserves FIFO ordering';
};
