import assert from 'node:assert';
import { ShardingConfig } from '@effect/cluster';
import { Effect, Option } from 'effect';

export const run = async () => {
  assert.strictEqual(ShardingConfig.defaults.shardsPerGroup, 300);
  assert.strictEqual(ShardingConfig.defaults.runnerShardWeight, 1);
  assert.ok(Array.isArray(ShardingConfig.defaults.shardGroups));
  assert.ok(ShardingConfig.defaults.shardGroups.includes('default'));

  const customConfig = await Effect.runPromise(
    Effect.gen(function* () {
      return yield* ShardingConfig.ShardingConfig;
    }).pipe(
      Effect.provide(
        ShardingConfig.layer({
          shardsPerGroup: 64,
          runnerShardWeight: 2,
          shardGroups: ['default', 'priority'],
          simulateRemoteSerialization: false,
          runnerAddress: Option.none(),
          runnerListenAddress: Option.none(),
          preemptiveShutdown: false,
        })
      )
    )
  );

  assert.strictEqual(customConfig.shardsPerGroup, 64);
  assert.strictEqual(customConfig.runnerShardWeight, 2);
  assert.deepStrictEqual(customConfig.shardGroups, ['default', 'priority']);
  assert.strictEqual(customConfig.simulateRemoteSerialization, false);
  assert.strictEqual(Option.isNone(customConfig.runnerAddress), true);
  assert.strictEqual(Option.isNone(customConfig.runnerListenAddress), true);
  assert.strictEqual(customConfig.preemptiveShutdown, false);

  return 'PASS: ShardingConfig defaults and layer overrides are resolved correctly';
};
