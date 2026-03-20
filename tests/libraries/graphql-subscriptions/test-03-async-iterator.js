import assert from 'assert';
import { PubSub } from 'graphql-subscriptions';

export const run = async () => {
  const pubsub = new PubSub();
  const iterator = pubsub.asyncIterableIterator(['alpha', 'beta']);

  const pending = iterator.next();
  await pubsub.publish('alpha', { type: 'alpha', value: 1 });
  const first = await pending;

  assert.strictEqual(first.done, false);
  assert.deepStrictEqual(first.value, { type: 'alpha', value: 1 });

  await pubsub.publish('beta', { type: 'beta', value: 2 });
  const second = await iterator.next();

  assert.strictEqual(second.done, false);
  assert.deepStrictEqual(second.value, { type: 'beta', value: 2 });

  await iterator.return();

  return 'PASS: asyncIterableIterator receives events from multiple triggers';
};
