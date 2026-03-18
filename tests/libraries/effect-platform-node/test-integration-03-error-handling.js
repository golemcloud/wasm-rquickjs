import assert from 'node:assert';
import { HttpClient, HttpClientError } from '@effect/platform';
import { NodeHttpClient } from '@effect/platform-node';
import { Effect, Either } from 'effect';

const BASE_URL = 'http://localhost:18080';

export const run = async () => {
  const outcome = await Effect.runPromise(
    Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient;
      const strictClient = client.pipe(HttpClient.filterStatusOk);
      return yield* strictClient.get(`${BASE_URL}/api/error`).pipe(Effect.either);
    }).pipe(Effect.provide(NodeHttpClient.layer))
  );

  assert.ok(Either.isLeft(outcome));
  assert.ok(HttpClientError.isHttpClientError(outcome.left));
  assert.strictEqual(outcome.left._tag, 'ResponseError');
  assert.strictEqual(outcome.left.response.status, 500);

  return 'PASS: NodeHttpClient reports non-2xx responses as ResponseError';
};
