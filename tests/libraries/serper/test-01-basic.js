import assert from 'assert';
import { Serper } from 'serper';
import { createSearchPayload, parseJsonBody, withMockFetch } from './helpers.js';

export const run = async () =>
  withMockFetch(
    {
      json: createSearchPayload('coffee beans', 1, 1),
    },
    async (calls) => {
      const client = new Serper({
        apiKey: 'test-serper-key',
        basePath: 'https://mock.serper.dev',
        cache: false,
      });

      const result = await client.search('coffee beans');

      assert.strictEqual(calls.length, 1);
      assert.strictEqual(calls[0].url, 'https://mock.serper.dev/search');
      assert.strictEqual(calls[0].options.method, 'POST');
      assert.strictEqual(calls[0].options.headers['x-api-key'], 'test-serper-key');
      assert.strictEqual(calls[0].options.headers['content-type'], 'application/json');
      assert.deepStrictEqual(parseJsonBody(calls[0]), { q: 'coffee beans' });

      assert.strictEqual(result.searchParameters.q, 'coffee beans');
      assert.strictEqual(result.organic.length, 1);
      assert.strictEqual(result.organic[0].title, 'coffee beans result page 1');

      return 'PASS: search() sends expected request and parses organic search response';
    },
  );
