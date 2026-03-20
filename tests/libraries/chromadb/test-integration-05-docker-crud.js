import assert from 'assert';
import { ChromaClient } from 'chromadb';

const BASE_URL = 'http://localhost:18081';

export const run = async () => {
  const client = new ChromaClient({ path: BASE_URL });
  const name = `docker-crud-${Date.now()}`;

  const collection = await client.createCollection({ name, embeddingFunction: null });

  await collection.add({
    ids: ['vec-a', 'vec-b'],
    embeddings: [
      [1, 0, 0],
      [0, 1, 0],
    ],
    documents: ['alpha', 'beta'],
    metadatas: [{ tag: 'a' }, { tag: 'b' }],
  });

  const initialCount = await collection.count();
  assert.strictEqual(initialCount, 2);

  const queryResult = await collection.query({
    queryEmbeddings: [[1, 0, 0]],
    nResults: 1,
    include: ['documents', 'metadatas', 'distances'],
  });
  assert.strictEqual(queryResult.ids[0][0], 'vec-a');

  await collection.upsert({
    ids: ['vec-a'],
    embeddings: [[0, 0, 1]],
    documents: ['alpha-updated'],
    metadatas: [{ tag: 'a2' }],
  });

  const updated = await collection.get({
    ids: ['vec-a'],
    include: ['documents', 'metadatas'],
  });
  assert.strictEqual(updated.documents[0], 'alpha-updated');
  assert.deepStrictEqual(updated.metadatas[0], { tag: 'a2' });

  const beforeDeleteCount = await collection.count();
  const deleted = await collection.delete({ ids: ['vec-b'] });
  assert.strictEqual(typeof deleted.deleted, 'number');

  const finalCount = await collection.count();
  assert.strictEqual(finalCount, beforeDeleteCount - 1);

  await client.deleteCollection({ name });

  return 'PASS: Docker Chroma CRUD (add/query/upsert/delete/count) works end-to-end';
};
