import assert from 'node:assert';
import { Rpc, RpcGroup, RpcTest } from '@effect/rpc';
import { Effect, Schema } from 'effect';

const Sum = Rpc.make('Sum', {
  payload: {
    left: Schema.Number,
    right: Schema.Number,
  },
  success: Schema.Number,
});

const Group = RpcGroup.make(Sum);

export const run = async () => {
  const program = Effect.gen(function* () {
    const client = yield* RpcTest.makeClient(Group);
    const total = yield* client.Sum({ left: 21, right: 21 });
    assert.strictEqual(total, 42);
  }).pipe(
    Effect.provide(
      Group.toLayer({
        Sum: ({ left, right }) => Effect.succeed(left + right),
      })
    ),
    Effect.scoped
  );

  await Effect.runPromise(program);
  return 'PASS: RpcTest in-memory client executes unary RPC handlers';
};
