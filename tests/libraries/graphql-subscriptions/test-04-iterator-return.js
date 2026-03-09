import assert from 'assert';
import { PubSub } from 'graphql-subscriptions';

export const run = async () => {
  const pubsub = new PubSub();
  const iterator = pubsub.asyncIterableIterator('events');

  const firstPending = iterator.next();
  await pubsub.publish('events', { id: 1 });
  const first = await firstPending;
  assert.strictEqual(first.done, false);
  assert.deepStrictEqual(first.value, { id: 1 });

  const closed = await iterator.return();
  assert.strictEqual(closed.done, true, 'return() should close the iterator');
  assert.strictEqual(closed.value, undefined);

  return 'PASS: iterator return() closes stream';
};
