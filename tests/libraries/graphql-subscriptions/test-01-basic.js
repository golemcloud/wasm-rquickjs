import assert from 'assert';
import { PubSub } from 'graphql-subscriptions';

export const run = async () => {
  const pubsub = new PubSub();
  const received = [];

  const subId = await pubsub.subscribe('user.created', (payload) => {
    received.push(payload);
  });

  await pubsub.publish('user.created', { userCreated: { id: 1 } });
  await pubsub.publish('user.created', { userCreated: { id: 2 } });

  assert.strictEqual(received.length, 2, 'expected two payloads');
  assert.deepStrictEqual(received[0], { userCreated: { id: 1 } });
  assert.deepStrictEqual(received[1], { userCreated: { id: 2 } });

  pubsub.unsubscribe(subId);

  return 'PASS: PubSub publish/subscribe delivers payloads in order';
};
