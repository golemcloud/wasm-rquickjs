import assert from 'node:assert';
import { Headers, Url, UrlParams } from '@effect/platform';
import { Either, Option } from 'effect';

export const run = () => {
  const parsed = Url.fromString('https://example.com/root?a=1');
  assert.ok(Either.isRight(parsed));

  const invalid = Url.fromString('http://%zz');
  assert.ok(Either.isLeft(invalid));

  const updatedUrl = Url.mutate(parsed.right, (url) => {
    url.pathname = '/v1/items';
  });
  const withPort = Url.setPort(updatedUrl, 8080);
  const withHash = Url.setHash(withPort, 'fragment');
  assert.strictEqual(withHash.pathname, '/v1/items');
  assert.strictEqual(withHash.port, '8080');
  assert.strictEqual(withHash.hash, '#fragment');

  const params = UrlParams.fromInput({ page: 1, active: true, tags: ['a', 'b'] });
  const record = UrlParams.toRecord(params);
  assert.strictEqual(record.page, '1');
  assert.strictEqual(record.active, 'true');
  assert.deepStrictEqual(record.tags, ['a', 'b']);

  const firstTag = UrlParams.getFirst(params, 'tags');
  assert.strictEqual(
    Option.match(firstTag, {
      onNone: () => '',
      onSome: (value) => value,
    }),
    'a'
  );

  const headers = Headers.fromInput({
    'Content-Type': 'application/json',
    Authorization: 'Bearer token',
    'X-Test': 'value',
  });
  assert.strictEqual(headers['content-type'], 'application/json');
  assert.strictEqual(headers.authorization, 'Bearer token');

  const withoutAuth = Headers.remove(headers, 'Authorization');
  assert.strictEqual(withoutAuth.authorization, undefined);
  assert.strictEqual(withoutAuth['x-test'], 'value');

  return 'PASS: URL, query params, and headers APIs work';
};
