import assert from 'assert';
import { VoyageAIClient } from 'voyageai';

export const run = async () => {
  let seenBody;

  const client = new VoyageAIClient({
    apiKey: 'test-key',
    fetch: async (url, init) => {
      const request = typeof url === 'object' && url !== null ? url : undefined;
      const bodyText = typeof init?.body === 'string'
        ? init.body
        : (typeof request?.clone === 'function' ? await request.clone().text() : '');
      seenBody = bodyText ? JSON.parse(bodyText) : {};
      return new Response(JSON.stringify({
        object: 'list',
        data: [
          { index: 1, relevance_score: 0.96, document: 'best match' },
          { index: 0, relevance_score: 0.42, document: 'second match' },
        ],
        model: 'rerank-2-lite',
        usage: { total_tokens: 9 },
      }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  });

  const result = await client.rerank({
    model: 'rerank-2-lite',
    query: 'best answer',
    documents: ['second match', 'best match'],
    topK: 1,
    returnDocuments: true,
  });

  assert.strictEqual(seenBody.model, 'rerank-2-lite');
  assert.ok(seenBody.top_k === 1 || seenBody.topK === 1);
  assert.ok(seenBody.return_documents === true || seenBody.returnDocuments === true);
  assert.strictEqual(result.data[0].index, 1);
  assert.ok((result.data[0].relevanceScore ?? result.data[0].relevance_score) > 0.9);
  assert.strictEqual(result.data[0].document, 'best match');

  return 'PASS: rerank() returns scored documents correctly';
};
