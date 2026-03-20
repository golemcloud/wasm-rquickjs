import assert from 'assert';
import { Pinecone } from '@pinecone-database/pinecone';

export const run = async () => {
  const pc = new Pinecone({
    apiKey: 'test-api-key',
    controllerHostUrl: 'http://localhost:18080',
    maxRetries: 0,
  });

  const embeddings = await pc.inference.embed({
    model: 'llama-text-embed-v2',
    inputs: ['hello pinecone'],
  });

  assert.strictEqual(embeddings.model, 'llama-text-embed-v2');
  assert.strictEqual(embeddings.vectorType, 'dense');
  assert.ok(Array.isArray(embeddings.data));
  assert.deepStrictEqual(embeddings.data[0].values, [0.11, 0.22, 0.33]);

  const rerank = await pc.inference.rerank({
    model: 'bge-reranker-v2-m3',
    query: 'best match',
    documents: ['doc-1', 'doc-2'],
    topN: 1,
    rankFields: ['text'],
    returnDocuments: true,
  });

  assert.ok(Array.isArray(rerank.data));
  assert.strictEqual(rerank.data[0].index, 1);
  assert.strictEqual(rerank.data[0].score, 0.98);

  return 'PASS: inference embed/rerank work via HTTP mock server';
};
