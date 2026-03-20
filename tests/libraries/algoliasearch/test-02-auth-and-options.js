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
  const queryAuthClient = algoliasearch('APP_ID', 'API_KEY', {
    requester: createEchoRequester(),
    baseHeaders: { 'x-base-header': 'base' },
    baseQueryParameters: { region: 'test' },
  });

  const queryAuth = await queryAuthClient.customPost(
    {
      path: '1/custom/endpoint',
      body: { hello: 'world' },
    },
    {
      headers: { 'x-extra-header': 'extra' },
      queryParameters: { feature: 'demo' },
    },
  );

  assert.strictEqual(queryAuth.method, 'POST');
  assert.deepStrictEqual(queryAuth.data, { hello: 'world' });
  assert.strictEqual(queryAuth.headers['x-base-header'], 'base');
  assert.strictEqual(queryAuth.headers['x-extra-header'], 'extra');
  assert.strictEqual(queryAuth.searchParams.region, 'test');
  assert.strictEqual(queryAuth.searchParams.feature, 'demo');
  assert.strictEqual(queryAuth.searchParams['x-algolia-api-key'], 'API_KEY');
  assert.strictEqual(queryAuth.searchParams['x-algolia-application-id'], 'APP_ID');

  const headerAuthClient = algoliasearch('APP_ID', 'HEADER_KEY', {
    requester: createEchoRequester(),
    authMode: 'WithinHeaders',
  });

  const headerAuth = await headerAuthClient.customGet({ path: '1/headers/check' });

  assert.strictEqual(headerAuth.headers['x-algolia-api-key'], 'HEADER_KEY');
  assert.strictEqual(headerAuth.headers['x-algolia-application-id'], 'APP_ID');
  assert.strictEqual(headerAuth.searchParams['x-algolia-api-key'], undefined);
  assert.strictEqual(headerAuth.searchParams['x-algolia-application-id'], undefined);

  return 'PASS: auth modes and request option merging work';
};
