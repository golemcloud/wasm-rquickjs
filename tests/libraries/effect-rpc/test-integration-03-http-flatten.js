import assert from 'node:assert';
import { FetchHttpClient } from '@effect/platform';
import { Rpc, RpcClient, RpcGroup, RpcSerialization } from '@effect/rpc';
import { Effect, Layer, Schema } from 'effect';

const BASE_URL = 'http://localhost:18080/rpc';

const Add = Rpc.make('math.Add', {
  payload: {
    a: Schema.Number,
    b: Schema.Number,
  },
  success: Schema.Number,
});

const Group = RpcGroup.make(Add);

const ClientLayer = RpcClient.layerProtocolHttp({ url: BASE_URL }).pipe(
  Layer.provide([FetchHttpClient.layer, RpcSerialization.layerJson])
);

export const run = async () => {
  const program = Effect.gen(function* () {
    const client = yield* RpcClient.make(Group, { flatten: true });
    const value = yield* client('math.Add', { a: 17, b: 25 });
    assert.strictEqual(value, 42);
  }).pipe(
    Effect.provide(ClientLayer),
    Effect.scoped
  );

  await Effect.runPromise(program);
  return 'PASS: HTTP protocol supports flat client invocation by tag';
};
