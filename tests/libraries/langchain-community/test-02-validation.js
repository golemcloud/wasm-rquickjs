import assert from 'assert';
import { Document } from '@langchain/core/documents';
import { BM25Retriever } from '@langchain/community/retrievers/bm25';

export const run = async () => {
  const docs = [
    new Document({ pageContent: 'Cats are agile house pets', metadata: { id: 'cats' } }),
    new Document({ pageContent: 'Dogs enjoy long walks', metadata: { id: 'dogs' } }),
    new Document({ pageContent: 'Many cats like sunny windows', metadata: { id: 'more-cats' } }),
  ];

  const retriever = BM25Retriever.fromDocuments(docs, { k: 2, includeScore: true });
  const results = await retriever.invoke('cats');

  assert.strictEqual(results.length, 2);
  assert.ok(results.every((doc) => typeof doc.metadata.bm25Score === 'number'));
  assert.ok(results[0].pageContent.toLowerCase().includes('cats'));

  return 'PASS: BM25Retriever returns scored in-memory document matches';
};
