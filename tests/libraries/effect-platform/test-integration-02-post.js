import assert from 'node:assert';
import { FetchHttpClient, HttpClient, HttpClientRequest } from '@effect/platform';
import { Effect } from 'effect';

const BASE_URL = 'http://localhost:18080';

export const run = async () => {
  const program = Effect.gen(function* () {
    const request = HttpClientRequest.bodyUnsafeJson(
      HttpClientRequest.post(`${BASE_URL}/api/users`),
      { name: 'Charlie' }
    );

    const response = yield* HttpClient.execute(request);
    assert.strictEqual(response.status, 201);

    const payload = yield* response.json;
    assert.strictEqual(payload.name, 'Charlie');
    assert.strictEqual(payload.id, 3);
  }).pipe(Effect.provide(FetchHttpClient.layer));

  await Effect.runPromise(program);
  return 'PASS: FetchHttpClient POST sends and receives JSON';
};
