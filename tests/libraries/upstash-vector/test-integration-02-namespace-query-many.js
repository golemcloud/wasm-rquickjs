import assert from 'assert';
import { Index } from '@upstash/vector';

export const run = async () => {
  const index = new Index({
    url: 'http://localhost:18080',
    token: 'test-token',
  });

  const books = index.namespace('books');

  await books.upsert([
    { id: 'book-1', vector: [1, 0, 0], metadata: { title: 'Dune' } },
    { id: 'book-2', vector: [0, 1, 0], metadata: { title: 'Foundation' } },
  ]);

  const queryManyResult = await index.queryMany(
    [
      { vector: [1, 0, 0], topK: 2, includeMetadata: true },
      { vector: [0, 1, 0], topK: 1, includeMetadata: true },
    ],
    { namespace: 'books' },
  );

  assert.strictEqual(queryManyResult.length, 2);
  assert.strictEqual(queryManyResult[0].length, 2);
  assert.strictEqual(queryManyResult[1].length, 2);
  assert.strictEqual(queryManyResult[0][0].id, 'book-1');

  return 'PASS: namespace queryMany works over HTTP';
};
