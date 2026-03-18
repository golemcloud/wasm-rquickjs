import assert from 'node:assert';
import { HttpClientRequest, UrlParams } from '@effect/platform';
import { Effect, Option } from 'effect';

export const run = async () => {
  const baseRequest = HttpClientRequest.post('http://localhost:18080/api/users');
  const withHeader = HttpClientRequest.setHeader(baseRequest, 'X-Request-Id', 'req-platform-node-1');
  const withQuery = HttpClientRequest.appendUrlParam(withHeader, 'source', 'effect-platform-node-test');
  const withAuth = HttpClientRequest.bearerToken(withQuery, 'token-abc');

  const asJson = await Effect.runPromise(HttpClientRequest.bodyJson(withAuth, { name: 'Charlie' }));
  assert.strictEqual(asJson.method, 'POST');
  assert.strictEqual(asJson.headers['x-request-id'], 'req-platform-node-1');
  assert.strictEqual(asJson.headers.authorization, 'Bearer token-abc');
  assert.strictEqual(asJson.body._tag, 'Uint8Array');

  const resolvedUrl = HttpClientRequest.toUrl(asJson);
  const resolvedUrlString = Option.match(resolvedUrl, {
    onNone: () => '',
    onSome: (url) => url.toString(),
  });
  assert.ok(resolvedUrlString.includes('source=effect-platform-node-test'));

  const asForm = HttpClientRequest.bodyUrlParams(asJson, UrlParams.fromInput({ page: 1, q: 'node' }));
  assert.strictEqual(asForm.body._tag, 'Uint8Array');

  return 'PASS: HttpClientRequest URL/header/body builders behave as expected';
};
