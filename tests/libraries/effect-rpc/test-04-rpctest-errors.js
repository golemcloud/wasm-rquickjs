import assert from 'node:assert';
import { Rpc, RpcGroup, RpcTest } from '@effect/rpc';
import { Effect, Schema } from 'effect';

const FailAlways = Rpc.make('FailAlways', {
  payload: {
    reason: Schema.String,
  },
  success: Schema.String,
  error: Schema.String,
});

const Group = RpcGroup.make(FailAlways);

export const run = async () => {
  const program = Effect.gen(function* () {
    const client = yield* RpcTest.makeClient(Group);

    const exit = yield* Effect.exit(client.FailAlways({ reason: 'boom' }));
    assert.strictEqual(exit._tag, 'Failure');
    assert.strictEqual(exit.cause._tag, 'Fail');
    assert.strictEqual(exit.cause.error, 'boom');
  }).pipe(
    Effect.provide(
      Group.toLayer({
        FailAlways: ({ reason }) => Effect.fail(reason),
      })
    ),
    Effect.scoped
  );

  await Effect.runPromise(program);
  return 'PASS: RpcTest preserves typed RPC failure values';
};
