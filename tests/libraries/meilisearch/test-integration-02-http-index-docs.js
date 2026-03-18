import assert from 'assert';
import { MeiliSearch } from 'meilisearch';

export const run = async () => {
  const client = new MeiliSearch({
    host: 'http://localhost:18080',
    apiKey: 'test-master-key',
  });

  const indexUid = `books_http_${Date.now()}`;
  const index = client.index(indexUid);

  await client.createIndex(indexUid, { primaryKey: 'id' }).waitTask({ timeout: 4000, interval: 20 });
  await index
    .addDocuments([
      { id: 1, title: 'Dune' },
      { id: 2, title: 'The Hobbit' },
    ])
    .waitTask({ timeout: 4000, interval: 20 });

  const searchResult = await index.search('dune', { limit: 5 });
  assert.strictEqual(searchResult.hits.length, 1);
  assert.strictEqual(searchResult.hits[0].id, 1);

  await client.deleteIndex(indexUid).waitTask({ timeout: 4000, interval: 20 });

  return 'PASS: index create/add/search/delete flow works against HTTP mock server';
};
