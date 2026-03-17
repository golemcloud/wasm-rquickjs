import assert from 'assert';
import { ChromaClient } from 'chromadb';

const BASE_URL = 'http://localhost:18080';

export const run = async () => {
  const client = new ChromaClient({ path: BASE_URL });
  const name = `mock-records-${Date.now()}`;

  const collection = await client.createCollection({ name, embeddingFunction: null });

  await collection.add({
    ids: ['doc-1', 'doc-2'],
    embeddings: [
      [1, 0, 0],
      [0, 1, 0],
    ],
    documents: ['first doc', 'second doc'],
    metadatas: [{ group: 'A' }, { group: 'B' }],
  });

  const count = await collection.count();
  assert.strictEqual(count, 2);

  const getResult = await collection.get({
    ids: ['doc-1'],
    include: ['documents', 'metadatas', 'embeddings'],
  });
  assert.deepStrictEqual(getResult.ids, ['doc-1']);
  assert.deepStrictEqual(getResult.documents, ['first doc']);
  assert.deepStrictEqual(getResult.metadatas, [{ group: 'A' }]);

  const queryResult = await collection.query({
    queryEmbeddings: [[1, 0, 0]],
    nResults: 1,
    include: ['documents', 'metadatas', 'distances'],
  });
  assert.strictEqual(queryResult.ids.length, 1);
  assert.strictEqual(queryResult.ids[0][0], 'doc-1');
  assert.strictEqual(queryResult.documents[0][0], 'first doc');

  const deleted = await collection.delete({ ids: ['doc-2'] });
  assert.strictEqual(deleted.deleted, 1);

  await client.deleteCollection({ name });

  return 'PASS: record add/get/query/delete operations work over HTTP';
};
