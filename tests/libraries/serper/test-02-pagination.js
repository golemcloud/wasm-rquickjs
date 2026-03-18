import assert from 'assert';
import { Serper } from 'serper';
import { createSearchPayload, parseJsonBody, withMockFetch } from './helpers.js';

export const run = async () =>
  withMockFetch(
    (call) => {
      const requestBody = parseJsonBody(call);
      const page = requestBody.page ?? 1;
      return {
        json: createSearchPayload(requestBody.q, page, page),
      };
    },
    async (calls) => {
      const client = new Serper({
        apiKey: 'test-serper-key',
        basePath: 'https://mock.serper.dev',
        cache: false,
      });

      const first = await client.search({ q: 'oranges', page: 3 });
      const next = await first.nextPage();
      const prev = await next.prevPage();
      const direct = await first.toPage(7);

      assert.strictEqual(first.searchParameters.page, 3);
      assert.strictEqual(next.searchParameters.page, 4);
      assert.strictEqual(prev.searchParameters.page, 3);
      assert.strictEqual(direct.searchParameters.page, 7);

      assert.deepStrictEqual(
        calls.map((call) => parseJsonBody(call).page ?? 1),
        [3, 4, 3, 7],
      );

      return 'PASS: pagination helpers nextPage/prevPage/toPage request expected page numbers';
    },
  );
