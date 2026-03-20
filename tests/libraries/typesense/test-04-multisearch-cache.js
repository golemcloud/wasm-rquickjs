import assert from 'assert';
import { Client } from 'typesense';

export const run = async () => {
  const client = new Client({
    nodes: [{ host: 'localhost', port: 8108, protocol: 'http' }],
    apiKey: 'test-api-key',
    randomizeNodes: false,
    cacheSearchResultsForSeconds: 120,
  });

  let requestCount = 0;
  client.apiCall.performRequest = async (...args) => {
    const [, endpoint] = args;
    requestCount += 1;
    assert.strictEqual(endpoint, '/multi_search');
    return {
      results: [
        {
          found: 1,
          hits: [{ document: { id: '1', title: 'The Hobbit' }, text_match: 100 }],
          out_of: 1,
          page: 1,
          search_time_ms: 1,
          request_params: { collection_name: 'books', q: 'hobbit' },
        },
      ],
    };
  };

  const payload = {
    searches: [
      {
        collection: 'books',
        q: 'hobbit',
        query_by: 'title',
      },
    ],
  };

  const first = await client.multiSearch.perform(payload);
  const second = await client.multiSearch.perform(payload);
  assert.strictEqual(requestCount, 1);
  assert.deepStrictEqual(second, first);

  client.multiSearch.clearCache();
  await client.multiSearch.perform(payload);
  assert.strictEqual(requestCount, 2);

  return 'PASS: multiSearch cache deduplicates repeated searches and clearCache invalidates it';
};
