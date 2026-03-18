import assert from 'node:assert';
import { Rpc, RpcGroup, RpcTest } from '@effect/rpc';
import { Chunk, Effect, Schema, Stream } from 'effect';

const Numbers = Rpc.make('Numbers', {
  payload: {
    count: Schema.Number,
  },
  success: Schema.Number,
  stream: true,
});

const Group = RpcGroup.make(Numbers.prefix('math.'));

export const run = async () => {
  const program = Effect.gen(function* () {
    const client = yield* RpcTest.makeClient(Group, { flatten: true });
    const values = yield* Stream.runCollect(client('math.Numbers', { count: 4 }));
    assert.deepStrictEqual(Chunk.toReadonlyArray(values), [1, 2, 3, 4]);
  }).pipe(
    Effect.provide(
      Group.toLayer({
        'math.Numbers': ({ count }) => Stream.fromIterable(Array.from({ length: count }, (_, i) => i + 1)),
      })
    ),
    Effect.scoped
  );

  await Effect.runPromise(program);
  return 'PASS: RpcTest supports stream RPCs and flat client mode';
};
