import assert from 'assert';
import { algoliasearch } from 'algoliasearch';

const createEchoRequester = () => ({
  async send(endRequest) {
    const url = new URL(endRequest.url);
    return {
      status: 200,
      isTimedOut: false,
      content: JSON.stringify({
        method: endRequest.method,
        path: url.pathname,
        headers: endRequest.headers,
        searchParams: Object.fromEntries(url.searchParams.entries()),
        data: endRequest.data ? JSON.parse(endRequest.data) : null,
      }),
    };
  },
});

export const run = async () => {
  assert.throws(() => algoliasearch('', 'key'), /appId/);
  assert.throws(() => algoliasearch('app', ''), /apiKey/);

  const client = algoliasearch('APP_ID', 'API_KEY', {
    requester: createEchoRequester(),
  });

  assert.strictEqual(client.appId, 'APP_ID');
  assert.strictEqual(client.apiKey, 'API_KEY');

  const first = await client.customGet({ path: '1/test/ping' });
  assert.strictEqual(first.path, '/1/test/ping');
  assert.strictEqual(first.method, 'GET');
  assert.strictEqual(first.searchParams['x-algolia-application-id'], 'APP_ID');
  assert.strictEqual(first.searchParams['x-algolia-api-key'], 'API_KEY');

  client.setClientApiKey({ apiKey: 'UPDATED_KEY' });
  const second = await client.customGet({ path: '1/test/ping' });
  assert.strictEqual(second.searchParams['x-algolia-api-key'], 'UPDATED_KEY');

  return 'PASS: constructor validation and API key mutation work';
};
