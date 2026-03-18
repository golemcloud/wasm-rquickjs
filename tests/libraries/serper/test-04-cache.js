import assert from 'assert';
import { Serper } from 'serper';
import { createSearchPayload, parseJsonBody, withMockFetch } from './helpers.js';

export const run = async () => {
  let requestId = 0;

  return withMockFetch(
    (call) => {
      const requestBody = parseJsonBody(call);
      const page = requestBody.page ?? 1;
      requestId += 1;
      return {
        json: createSearchPayload(requestBody.q, page, requestId),
      };
    },
    async (calls) => {
      const cachedClient = new Serper({
        apiKey: 'test-serper-key',
        basePath: 'https://mock.serper.dev',
        cache: true,
      });

      const cachedFirst = await cachedClient.search('cache me');
      const cachedSecond = await cachedClient.search('cache me');

      assert.strictEqual(cachedFirst.requestId, 1);
      assert.strictEqual(cachedSecond.requestId, 1);
      assert.strictEqual(calls.length, 1);

      const uncachedClient = new Serper({
        apiKey: 'test-serper-key',
        basePath: 'https://mock.serper.dev',
        cache: false,
      });

      const uncachedFirst = await uncachedClient.search('cache me');
      const uncachedSecond = await uncachedClient.search('cache me');

      assert.strictEqual(uncachedFirst.requestId, 2);
      assert.strictEqual(uncachedSecond.requestId, 3);
      assert.strictEqual(calls.length, 3);

      return 'PASS: cache=true reuses prior response while cache=false performs new requests';
    },
  );
};
