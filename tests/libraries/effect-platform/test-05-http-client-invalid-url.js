import assert from 'node:assert';
import { FetchHttpClient, HttpClient, HttpClientError } from '@effect/platform';
import { Effect, Either } from 'effect';

export const run = async () => {
  const outcome = await Effect.runPromise(
    HttpClient.get('http://%zz').pipe(Effect.either, Effect.provide(FetchHttpClient.layer))
  );

  assert.ok(Either.isLeft(outcome));
  assert.ok(HttpClientError.isHttpClientError(outcome.left));
  assert.strictEqual(outcome.left._tag, 'RequestError');
  assert.strictEqual(outcome.left.reason, 'InvalidUrl');

  return 'PASS: HttpClient emits RequestError for invalid URLs';
};
