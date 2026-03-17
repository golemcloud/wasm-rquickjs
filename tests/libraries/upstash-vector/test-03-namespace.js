import assert from 'assert';
import { Index } from '@upstash/vector';

export const run = async () => {
  const calls = [];
  const requester = {
    request: async (req) => {
      calls.push(req);
      if (`${req.path}`.includes('upsert')) {
        return { result: 'Success' };
      }
      if (`${req.path}`.includes('query')) {
        return { result: [{ id: 'book-1', score: 0.99 }] };
      }
      throw new Error(`Unexpected endpoint: ${req.path}`);
    },
  };

  const index = new Index(requester);
  const books = index.namespace('books');

  await books.upsert({ id: 'book-1', vector: [1, 2, 3] });
  const results = await books.query({ vector: [1, 2, 3], topK: 1 });

  assert.strictEqual(results[0].id, 'book-1');
  assert.ok(`${calls[0].path}`.includes('/books'));
  assert.ok(`${calls[1].path}`.includes('/books'));

  return 'PASS: namespace-scoped methods route through namespace endpoints';
};
