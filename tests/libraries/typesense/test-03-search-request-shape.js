import assert from 'assert';
import { Client } from 'typesense';

export const run = async () => {
  const client = new Client({
    nodes: [{ host: 'localhost', port: 8108, protocol: 'http' }],
    apiKey: 'test-api-key',
    randomizeNodes: false,
  });

  const documents = client.collections('books').documents();
  let captured;

  documents.apiCall.performRequest = async (...args) => {
    const [requestType, endpoint, requestOptions] = args;
    captured = { requestType, endpoint, requestOptions };
    return {
      facet_counts: [],
      found: 1,
      hits: [{ document: { id: '1', title: 'The Hobbit' }, text_match: 100 }],
      out_of: 1,
      page: 1,
      request_params: {
        collection_name: 'books',
        q: requestOptions.queryParameters.q,
      },
      search_time_ms: 1,
    };
  };

  const result = await documents.search({
    q: 'hobbit',
    query_by: 'title',
    filter_by: 'year:>=1937',
    page: 1,
    per_page: 2,
  });

  assert.strictEqual(captured.endpoint, '/collections/books/documents/search');
  assert.strictEqual(captured.requestType, 'get');
  assert.strictEqual(captured.requestOptions.queryParameters.q, 'hobbit');
  assert.strictEqual(captured.requestOptions.queryParameters.query_by, 'title');
  assert.strictEqual(captured.requestOptions.queryParameters.per_page, 2);
  assert.strictEqual(captured.requestOptions.bodyParameters, undefined);

  assert.strictEqual(result.found, 1);
  assert.strictEqual(result.hits[0].document.title, 'The Hobbit');

  return 'PASS: documents.search sends expected request payload and parses response';
};
