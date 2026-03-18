import assert from 'node:assert';
import { FetchHttpClient } from '@effect/platform';
import { Rpc, RpcClient, RpcGroup, RpcSerialization } from '@effect/rpc';
import { Effect, Layer, Schema } from 'effect';

const BASE_URL = 'http://localhost:18080/rpc';

const HeaderEcho = Rpc.make('HeaderEcho', {
  payload: {
    key: Schema.String,
  },
  success: Schema.String,
});

const Group = RpcGroup.make(HeaderEcho);

const ClientLayer = RpcClient.layerProtocolHttp({ url: BASE_URL }).pipe(
  Layer.provide([FetchHttpClient.layer, RpcSerialization.layerJson])
);

export const run = async () => {
  const program = Effect.gen(function* () {
    const client = yield* RpcClient.make(Group);

    const result = yield* RpcClient.withHeaders(
      client.HeaderEcho({ key: 'x-rpc-test' }),
      { 'x-rpc-test': 'header-ok' }
    );

    assert.strictEqual(result, 'header-ok');
  }).pipe(
    Effect.provide(ClientLayer),
    Effect.scoped
  );

  await Effect.runPromise(program);
  return 'PASS: HTTP protocol forwards RpcClient.withHeaders values';
};
