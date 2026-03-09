import assert from 'assert';
import { PubSub } from 'graphql-subscriptions';

export const run = async () => {
  const pubsub = new PubSub();
  let calls = 0;

  const subId = await pubsub.subscribe('audit', () => {
    calls += 1;
  });

  await pubsub.publish('audit', { step: 1 });
  pubsub.unsubscribe(subId);
  await pubsub.publish('audit', { step: 2 });

  assert.strictEqual(calls, 1, 'unsubscribe should stop further deliveries');

  return 'PASS: PubSub unsubscribe removes active listener';
};
