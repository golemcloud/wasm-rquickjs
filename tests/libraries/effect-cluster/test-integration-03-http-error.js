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
  let failure;

  try {
    await Effect.runPromise(
      Effect.gen(function* () {
        const getPods = yield* K8sHttpClient.makeGetPods({
          labelSelector: 'app=error',
        });
        return yield* getPods;
      }).pipe(
        Effect.provide(k8sClientLayer),
        Effect.provide(FetchHttpClient.layer)
      )
    );
  } catch (error) {
    failure = error;
  }

  assert.ok(failure, 'expected request to fail on forced 500 response');
  const message = String(failure?.message ?? failure);
  assert.ok(
    message.includes('non 2xx status code (500') || message.includes('StatusCode: non 2xx status code (500'),
    `expected a 500 status failure message, got: ${message}`
  );
  assert.ok(message.includes('/v1/pods'));

  return 'PASS: K8sHttpClient.makeGetPods surfaces non-2xx HTTP responses as ResponseError';
};
