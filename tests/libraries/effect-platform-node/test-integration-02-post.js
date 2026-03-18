import assert from 'node:assert';
import { HttpClient, HttpClientRequest } from '@effect/platform';
import { NodeHttpClient } from '@effect/platform-node';
import { Effect } from 'effect';

const BASE_URL = 'http://localhost:18080';

export const run = async () => {
  const program = Effect.gen(function* () {
    const request = yield* HttpClientRequest.post(`${BASE_URL}/api/users`).pipe(
      HttpClientRequest.bodyJson({ name: 'Charlie' })
    );

    const response = yield* HttpClient.execute(request);
    assert.strictEqual(response.status, 201);

    const payload = yield* response.json;
    assert.strictEqual(payload.id, 3);
    assert.strictEqual(payload.name, 'Charlie');
  }).pipe(Effect.provide(NodeHttpClient.layer));

  await Effect.runPromise(program);
  return 'PASS: NodeHttpClient POST request sends and receives JSON';
};
