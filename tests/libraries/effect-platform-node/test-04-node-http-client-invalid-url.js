import assert from 'node:assert';
import { HttpClient, HttpClientError } from '@effect/platform';
import { NodeHttpClient } from '@effect/platform-node';
import { Effect, Either } from 'effect';

export const run = async () => {
  const outcome = await Effect.runPromise(
    HttpClient.get('http://%zz').pipe(Effect.either, Effect.provide(NodeHttpClient.layer))
  );

  assert.ok(Either.isLeft(outcome));
  assert.ok(HttpClientError.isHttpClientError(outcome.left));
  assert.strictEqual(outcome.left._tag, 'RequestError');
  assert.strictEqual(outcome.left.reason, 'InvalidUrl');

  return 'PASS: NodeHttpClient surfaces invalid URL request errors';
};
