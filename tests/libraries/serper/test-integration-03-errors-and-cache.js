import assert from 'assert';
import { Serper } from 'serper';

const BASE_PATH = 'http://localhost:18080';

export const run = async () => {
  const unauthorizedClient = new Serper({
    apiKey: 'wrong-key',
    basePath: BASE_PATH,
    cache: false,
  });

  const unauthorizedResponse = await unauthorizedClient.search('unauthorized search');
  assert.strictEqual(unauthorizedResponse.error, 'Unauthorized');

  const cachedClient = new Serper({
    apiKey: 'test-serper-key',
    basePath: BASE_PATH,
    cache: true,
  });

  const cachedFirst = await cachedClient.search('cache integration');
  const cachedSecond = await cachedClient.search('cache integration');
  const uncachedDifferentQuery = await cachedClient.search('cache integration new query');

  assert.strictEqual(cachedFirst.requestId, cachedSecond.requestId);
  assert.notStrictEqual(cachedSecond.requestId, uncachedDifferentQuery.requestId);

  return 'PASS: unauthorized API key path and in-memory cache behavior work against mock server';
};
