import assert from 'assert';
import { MeiliSearch } from 'meilisearch';

export const run = async () => {
  const client = new MeiliSearch({
    host: 'http://localhost:17700',
    apiKey: 'test-master-key',
  });

  const indexUid = `books_docker_${Date.now()}`;
  const index = client.index(indexUid);

  await client.createIndex(indexUid, { primaryKey: 'id' }).waitTask({ timeout: 10_000, interval: 50 });
  await index
    .addDocuments([
      { id: 1, title: 'Dune', genre: 'sci-fi' },
      { id: 2, title: 'The Hobbit', genre: 'fantasy' },
    ])
    .waitTask({ timeout: 10_000, interval: 50 });

  const searchResult = await index.search('dune', { limit: 5 });
  assert.strictEqual(searchResult.hits.length, 1);
  assert.strictEqual(searchResult.hits[0].id, 1);
  assert.strictEqual(searchResult.hits[0].genre, 'sci-fi');

  await client.deleteIndex(indexUid).waitTask({ timeout: 10_000, interval: 50 });

  return 'PASS: Docker Meilisearch supports index/document CRUD and search';
};
