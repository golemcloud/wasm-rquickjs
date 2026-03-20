import assert from 'assert';
import { Serper } from 'serper';

const BASE_PATH = 'http://localhost:18080';

export const run = async () => {
  const client = new Serper({
    apiKey: 'test-serper-key',
    basePath: BASE_PATH,
    cache: false,
  });

  const firstPage = await client.search({ q: 'serper integration search', page: 1 });
  const secondPage = await firstPage.nextPage();

  assert.strictEqual(firstPage.searchParameters.q, 'serper integration search');
  assert.strictEqual(firstPage.searchParameters.page, 1);
  assert.strictEqual(secondPage.searchParameters.page, 2);
  assert.ok(secondPage.requestId > firstPage.requestId);

  return 'PASS: search + nextPage perform real HTTP requests against the mock Serper API';
};
