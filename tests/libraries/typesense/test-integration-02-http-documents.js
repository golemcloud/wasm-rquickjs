import assert from 'assert';
import { Client } from 'typesense';

const client = new Client({
  nodes: [{ host: 'localhost', port: 18080, protocol: 'http' }],
  apiKey: 'test-api-key',
  randomizeNodes: false,
  connectionTimeoutSeconds: 2,
});

const collectionName = 'mock_books_docs';

export const run = async () => {
  await client.collections().create({
    name: collectionName,
    fields: [
      { name: 'title', type: 'string' },
      { name: 'genre', type: 'string', optional: true },
    ],
  });

  try {
    await client.collections(collectionName).documents().create({ id: '1', title: 'The Hobbit', genre: 'fantasy' });
    await client.collections(collectionName).documents().create({ id: '2', title: 'Dune', genre: 'science fiction' });

    const fetched = await client.collections(collectionName).documents('1').retrieve();
    assert.strictEqual(fetched.title, 'The Hobbit');

    const search = await client.collections(collectionName).documents().search({
      q: 'hobbit',
      query_by: 'title',
    });
    assert.strictEqual(search.found, 1);
    assert.strictEqual(search.hits[0].document.id, '1');

    const multi = await client.multiSearch.perform({
      searches: [
        {
          collection: collectionName,
          q: 'dune',
          query_by: 'title',
        },
      ],
    });
    assert.strictEqual(multi.results.length, 1);
    assert.strictEqual(multi.results[0].found, 1);
    assert.strictEqual(multi.results[0].hits[0].document.id, '2');
  } finally {
    await client.collections(collectionName).delete();
  }

  return 'PASS: document create/retrieve/search/multi-search work against HTTP mock server';
};
