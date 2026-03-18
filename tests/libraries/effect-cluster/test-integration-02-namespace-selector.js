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
      const getPods = yield* K8sHttpClient.makeGetPods({
        namespace: 'payments',
        labelSelector: 'app=payments',
      });
      return yield* getPods;
    }).pipe(
      Effect.provide(k8sClientLayer),
      Effect.provide(FetchHttpClient.layer)
    )
  );

  assert.strictEqual(pods.size, 1);
  assert.ok(pods.has('10.1.0.7'));
  assert.strictEqual(pods.get('10.1.0.7').status.hostIP, '192.168.2.7');
  assert.strictEqual(pods.get('10.1.0.7').isReady, true);

  return 'PASS: K8sHttpClient.makeGetPods applies namespace and labelSelector query filtering';
};
