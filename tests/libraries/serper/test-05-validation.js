import assert from 'assert';
import { MissingApiKeyError, Serper } from 'serper';
import { createSearchPayload, parseJsonBody, withMockFetch } from './helpers.js';

export const run = async () => {
  const clientWithoutApiKey = new Serper({
    apiKey: '',
    basePath: 'https://mock.serper.dev',
  });

  await assert.rejects(
    clientWithoutApiKey.search('will fail'),
    (error) =>
      error instanceof MissingApiKeyError
      && error.message.includes('apiKey is required'),
  );

  await withMockFetch(
    {
      json: createSearchPayload('timeout check', 1, 1),
    },
    async (calls) => {
      const client = new Serper({
        apiKey: 'test-serper-key',
        basePath: 'https://mock.serper.dev',
        timeout: 4321,
        cache: false,
      });

      const result = await client.search({ q: 'timeout check', num: 10, country: 'us' });
      const requestBody = parseJsonBody(calls[0]);

      assert.strictEqual(requestBody.q, 'timeout check');
      assert.strictEqual(requestBody.num, 10);
      assert.strictEqual(requestBody.country, 'us');
      assert.ok(calls[0].options.signal);
      assert.strictEqual(calls[0].options.headers['x-api-key'], 'test-serper-key');
      assert.strictEqual(result.searchParameters.q, 'timeout check');
    },
  );

  return 'PASS: missing API key errors and request option propagation behave as expected';
};
