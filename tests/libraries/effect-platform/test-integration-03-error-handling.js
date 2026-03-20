import assert from 'node:assert';
import { FetchHttpClient, HttpClient, HttpClientError } from '@effect/platform';
import { Effect, Either } from 'effect';

const BASE_URL = 'http://localhost:18080';

export const run = async () => {
  const program = Effect.gen(function* () {
    const client = (yield* HttpClient.HttpClient).pipe(HttpClient.filterStatusOk);
    const outcome = yield* Effect.either(client.get(`${BASE_URL}/api/error`));

    assert.ok(Either.isLeft(outcome));
    assert.ok(HttpClientError.isHttpClientError(outcome.left));
    assert.strictEqual(outcome.left._tag, 'ResponseError');
    assert.strictEqual(outcome.left.reason, 'StatusCode');
    assert.strictEqual(outcome.left.response.status, 500);
  }).pipe(Effect.provide(FetchHttpClient.layer));

  await Effect.runPromise(program);
  return 'PASS: FetchHttpClient surfaces ResponseError for non-2xx status';
};
