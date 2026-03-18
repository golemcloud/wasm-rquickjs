import assert from 'assert';
import { Client, Errors } from 'typesense';

const client = new Client({
  nodes: [{ host: 'localhost', port: 18108, protocol: 'http' }],
  apiKey: 'xyz',
  randomizeNodes: false,
  connectionTimeoutSeconds: 2,
});

export const run = async () => {
  const collectionName = `docker_books_crud_${Date.now()}`;

  await client.collections().create({
    name: collectionName,
    fields: [
      { name: 'title', type: 'string' },
      { name: 'genre', type: 'string', optional: true },
      { name: 'year', type: 'int32' },
    ],
    default_sorting_field: 'year',
  });

  try {
    await client.collections(collectionName).documents().create({ id: '1', title: 'The Hobbit', genre: 'fantasy', year: 1937 });
    await client.collections(collectionName).documents().create({ id: '2', title: 'Dune', genre: 'science fiction', year: 1965 });

    const byId = await client.collections(collectionName).documents('1').retrieve();
    assert.strictEqual(byId.title, 'The Hobbit');

    const search = await client.collections(collectionName).documents().search({
      q: 'dune',
      query_by: 'title',
    });
    assert.strictEqual(search.found, 1);
    assert.strictEqual(search.hits[0].document.id, '2');

    const multi = await client.multiSearch.perform({
      searches: [
        {
          collection: collectionName,
          q: '*',
          query_by: 'title',
          per_page: 10,
        },
      ],
    });
    assert.strictEqual(multi.results[0].found, 2);

    await client.collections(collectionName).documents('2').delete();
    await assert.rejects(
      () => client.collections(collectionName).documents('2').retrieve(),
      (error) => {
        assert.ok(error instanceof Errors.ObjectNotFound);
        return true;
      },
    );
  } finally {
    await client.collections(collectionName).delete();
  }

  return 'PASS: Docker Typesense supports document CRUD, search, and multi-search';
};
