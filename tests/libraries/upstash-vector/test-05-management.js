import assert from 'assert';
import { Index } from '@upstash/vector';

export const run = async () => {
  const requester = {
    request: async (req) => {
      if (`${req.path}`.includes('info')) {
        return {
          result: {
            vectorCount: 2,
            pendingVectorCount: 0,
            dimension: 3,
            similarityFunction: 'cosine',
            namespaces: { books: 1, docs: 1 },
          },
        };
      }
      if (`${req.path}`.includes('list-namespaces')) {
        return { result: ['books', 'docs'] };
      }
      if (`${req.path}`.includes('delete-namespace/')) {
        return { result: 'Success' };
      }
      throw new Error(`Unexpected endpoint: ${req.path}`);
    },
  };

  const index = new Index(requester);

  const info = await index.info();
  const namespaces = await index.listNamespaces();
  const deleted = await index.deleteNamespace('docs');

  assert.strictEqual(info.vectorCount, 2);
  assert.deepStrictEqual(namespaces, ['books', 'docs']);
  assert.strictEqual(deleted, 'Success');

  return 'PASS: info and namespace-management APIs return expected shapes';
};
