import assert from 'node:assert';
import { Entity, ShardingConfig } from '@effect/cluster';
import { Rpc } from '@effect/rpc';
import { Effect, Option, Ref, Schema } from 'effect';

const Increment = Rpc.make('Increment', {
  payload: {
    by: Schema.Number,
  },
  success: Schema.Number,
});

const Get = Rpc.make('Get', {
  payload: {},
  success: Schema.Number,
});

const CounterEntity = Entity.make('CounterEntity', [Increment, Get]);

const CounterLayer = CounterEntity.toLayer(
  Effect.gen(function* () {
    const ref = yield* Ref.make(0);

    return {
      Increment: (request) => Ref.updateAndGet(ref, (value) => value + request.payload.by),
      Get: () => Ref.get(ref),
    };
  })
);

export const run = async () => {
  const program = Effect.gen(function* () {
    const makeClient = yield* Entity.makeTestClient(CounterEntity, CounterLayer);
    const client = yield* makeClient('counter-1');

    const first = yield* client.Increment({ by: 2 });
    const second = yield* client.Increment({ by: 5 });
    const current = yield* client.Get({});

    assert.strictEqual(first, 2);
    assert.strictEqual(second, 7);
    assert.strictEqual(current, 7);
  }).pipe(
    Effect.provide(
      ShardingConfig.layer({
        runnerAddress: Option.none(),
      })
    ),
    Effect.scoped
  );

  await Effect.runPromise(program);
  return 'PASS: Entity.makeTestClient executes handlers and preserves in-entity state';
};
