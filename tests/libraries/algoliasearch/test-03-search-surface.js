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
  const client = algoliasearch('APP_ID', 'API_KEY', {
    requester: createEchoRequester(),
  });

  const single = await client.searchSingleIndex({
    indexName: 'products',
    searchParams: { query: 'phone', hitsPerPage: 3 },
  });
  assert.strictEqual(single.method, 'POST');
  assert.strictEqual(single.path, '/1/indexes/products/query');
  assert.strictEqual(single.data.query, 'phone');
  assert.strictEqual(single.data.hitsPerPage, 3);

  const multi = await client.search({
    requests: [
      { indexName: 'products', query: 'phone' },
      { indexName: 'categories', type: 'facet', facet: 'brand', facetQuery: 'alp' },
    ],
  });
  assert.strictEqual(multi.path, '/1/indexes/*/queries');
  assert.strictEqual(multi.data.requests.length, 2);

  const facet = await client.searchForFacetValues({
    indexName: 'products',
    facetName: 'brand',
    searchForFacetValuesRequest: { query: 'alp', maxFacetHits: 5 },
  });
  assert.strictEqual(facet.path, '/1/indexes/products/facets/brand/query');
  assert.strictEqual(facet.data.query, 'alp');

  return 'PASS: search endpoints are constructed correctly';
};
