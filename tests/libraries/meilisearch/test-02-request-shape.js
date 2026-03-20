import assert from 'assert';
import { MeiliSearch } from 'meilisearch';

export const run = async () => {
  const calls = [];

  const client = new MeiliSearch({
    host: 'http://unused.example',
    apiKey: 'test-api-key',
    httpClient: async (url, init = {}) => {
      const parsedUrl = new URL(url);
      const body = init.body ? JSON.parse(init.body) : undefined;
      calls.push({
        method: init.method || 'GET',
        path: `${parsedUrl.pathname}${parsedUrl.search}`,
        headers: new Headers(init.headers),
        body,
      });

      if (parsedUrl.pathname.endsWith('/search')) {
        return {
          hits: [{ id: 1, title: 'Dune' }],
          offset: 0,
          limit: 20,
          estimatedTotalHits: 1,
          processingTimeMs: 1,
          query: body?.q || '',
        };
      }

      if (parsedUrl.pathname.endsWith('/documents/fetch')) {
        return {
          results: [{ id: 1, title: 'Dune' }],
          offset: 0,
          limit: 20,
          total: 1,
        };
      }

      throw new Error(`Unexpected request: ${init.method || 'GET'} ${parsedUrl.pathname}`);
    },
  });

  const index = client.index('books');
  const search = await index.search('dune', {
    limit: 2,
    filter: 'year > 1960',
  });
  const docs = await index.getDocuments({
    limit: 5,
    filter: 'genre = sci-fi',
  });

  assert.strictEqual(search.hits.length, 1);
  assert.strictEqual(search.hits[0].title, 'Dune');
  assert.strictEqual(docs.results.length, 1);

  assert.strictEqual(calls.length, 2);
  assert.strictEqual(calls[0].method, 'POST');
  assert.strictEqual(calls[0].path, '/indexes/books/search');
  assert.strictEqual(calls[0].body.q, 'dune');
  assert.strictEqual(calls[0].body.filter, 'year > 1960');
  assert.ok((calls[0].headers.get('authorization') || '').startsWith('Bearer '));

  assert.strictEqual(calls[1].method, 'POST');
  assert.strictEqual(calls[1].path, '/indexes/books/documents/fetch');
  assert.strictEqual(calls[1].body.filter, 'genre = sci-fi');

  return 'PASS: search and getDocuments build expected HTTP request shapes';
};
