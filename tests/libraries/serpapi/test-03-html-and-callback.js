import assert from 'assert';
import { getHtml } from 'serpapi';
import { resetConfig, withMockHttpsGet } from './helpers.js';

export const run = async () => {
  resetConfig();

  let callbackValue;
  const htmlBody = '<html><body>Mock Search HTML</body></html>';

  const html = await withMockHttpsGet(
    { statusCode: 200, body: htmlBody },
    async (calls) =>
      getHtml(
        {
          engine: 'google',
          api_key: 'test-key',
          q: 'search html',
          timeout: 4321,
          requestOptions: {
            headers: { 'x-test-header': 'enabled' },
          },
        },
        (value) => {
          callbackValue = value;
        },
      ),
  );

  assert.strictEqual(html, htmlBody);
  assert.strictEqual(callbackValue, htmlBody);

  const request = await withMockHttpsGet(
    { statusCode: 200, body: htmlBody },
    async (calls) => {
      await getHtml({ engine: 'google', api_key: 'test-key', q: 'second call' });
      return calls[0];
    },
  );

  assert.ok(request.path.startsWith('/search?'));
  assert.ok(request.path.includes('output=html'));
  assert.ok(!request.path.includes('timeout='));
  assert.ok(!request.path.includes('requestOptions='));

  resetConfig();
  return 'PASS: getHtml returns HTML and invokes callback with request-only params filtered';
};
