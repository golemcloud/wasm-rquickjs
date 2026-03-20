import assert from 'node:assert';
import { FetchHttpClient, HttpClient, HttpClientRequest } from '@effect/platform';
import { K8sHttpClient } from '@effect/cluster';
import { Effect, Layer } from 'effect';

const BASE_URL = 'http://localhost:18080/api';

const k8sClientLayer = Layer.effect(
  K8sHttpClient.K8sHttpClient,
  Effect.gen(function* () {
    const client = yield* HttpClient.HttpClient;
    return client.pipe(
      HttpClient.mapRequest(HttpClientRequest.prependUrl(BASE_URL)),
      HttpClient.filterStatusOk
    );
  })
);

export const run = async () => {
  const pods = await Effect.runPromise(
    Effect.gen(function* () {
      const getPods = yield* K8sHttpClient.makeGetPods();
      return yield* getPods;
    }).pipe(
      Effect.provide(k8sClientLayer),
      Effect.provide(FetchHttpClient.layer)
    )
  );

  assert.strictEqual(pods.size, 2);
  assert.ok(pods.has('10.0.0.10'));
  assert.ok(pods.has('10.0.0.11'));
  assert.strictEqual(pods.get('10.0.0.10').isReady, true);
  assert.strictEqual(pods.get('10.0.0.11').isReady, false);
  assert.strictEqual(pods.get('10.0.0.11').isReadyOrInitializing, true);

  return 'PASS: K8sHttpClient.makeGetPods fetches and decodes pod map from HTTP endpoint';
};
