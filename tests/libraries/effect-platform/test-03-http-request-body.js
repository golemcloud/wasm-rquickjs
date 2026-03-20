import assert from 'node:assert';
import { HttpClientRequest, UrlParams } from '@effect/platform';
import { Effect, Option } from 'effect';

export const run = async () => {
  const baseRequest = HttpClientRequest.post('http://localhost:18080/api/users');
  const enriched = HttpClientRequest.setHeader(baseRequest, 'X-Request-Id', 'req-01');
  const withQuery = HttpClientRequest.appendUrlParam(enriched, 'source', 'effect-platform-test');
  const withAuth = HttpClientRequest.bearerToken(withQuery, 'token-123');

  const asJson = await Effect.runPromise(HttpClientRequest.bodyJson(withAuth, { name: 'Charlie' }));

  assert.strictEqual(asJson.method, 'POST');
  assert.strictEqual(asJson.headers['x-request-id'], 'req-01');
  assert.strictEqual(asJson.headers.authorization, 'Bearer token-123');
  assert.strictEqual(asJson.body._tag, 'Uint8Array');

  const resolvedUrl = HttpClientRequest.toUrl(asJson);
  const urlString = Option.match(resolvedUrl, {
    onNone: () => '',
    onSome: (url) => url.toString(),
  });
  assert.ok(urlString.includes('source=effect-platform-test'));

  const withFormEncoding = HttpClientRequest.bodyUrlParams(asJson, UrlParams.fromInput({ a: 1, b: 'two' }));
  assert.strictEqual(withFormEncoding.body._tag, 'Uint8Array');

  return 'PASS: HttpClientRequest builders and body encoders work';
};
