import assert from 'node:assert';
import { FetchHttpClient } from '@effect/platform';
import { Rpc, RpcClient, RpcGroup, RpcSerialization } from '@effect/rpc';
import { Effect, Layer, Schema } from 'effect';

const BASE_URL = 'http://localhost:18080/rpc';

const Echo = Rpc.make('Echo', {
  payload: {
    message: Schema.String,
  },
  success: Schema.String,
});

const Group = RpcGroup.make(Echo);

const ClientLayer = RpcClient.layerProtocolHttp({ url: BASE_URL }).pipe(
  Layer.provide([FetchHttpClient.layer, RpcSerialization.layerJson])
);

export const run = async () => {
  const program = Effect.gen(function* () {
    const client = yield* RpcClient.make(Group);
    const value = yield* client.Echo({ message: 'hello-http' });
    assert.strictEqual(value, 'echo:hello-http');
  }).pipe(
    Effect.provide(ClientLayer),
    Effect.scoped
  );

  await Effect.runPromise(program);
  return 'PASS: HTTP protocol client performs unary Echo RPC';
};
