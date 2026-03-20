import assert from 'node:assert';
import { FetchHttpClient, HttpClient } from '@effect/platform';
import { Effect } from 'effect';

const BASE_URL = 'http://localhost:18080';

export const run = async () => {
  const program = Effect.gen(function* () {
    const response = yield* HttpClient.get(`${BASE_URL}/api/users`);
    assert.strictEqual(response.status, 200);

    const payload = yield* response.json;
    assert.ok(Array.isArray(payload));
    assert.strictEqual(payload.length, 2);
    assert.strictEqual(payload[0].name, 'Alice');
    assert.strictEqual(payload[1].name, 'Bob');
  }).pipe(Effect.provide(FetchHttpClient.layer));

  await Effect.runPromise(program);
  return 'PASS: FetchHttpClient GET request returns JSON payload';
};
