import assert from 'assert';
import { tavily } from '@tavily/core';

const client = tavily({
  apiKey: 'tvly-test-key',
  apiBaseURL: 'http://localhost:18080',
  clientSource: 'wasm-rquickjs-test-integration',
});

export const run = async () => {
  const mapResult = await client.map('https://example.com', {
    includeUsage: true,
    maxDepth: 2,
  });

  assert.strictEqual(mapResult.requestId, 'req-map-1');
  assert.strictEqual(mapResult.baseUrl, 'https://example.com');
  assert.deepStrictEqual(mapResult.results, ['https://example.com', 'https://example.com/docs']);
  assert.strictEqual(mapResult.usage.credits, 3);

  const researchCreated = await client.research('Compare WASM runtimes', {
    model: 'mini',
  });

  assert.strictEqual(researchCreated.requestId, 'req-research-1');
  assert.strictEqual(researchCreated.status, 'queued');
  assert.strictEqual(researchCreated.model, 'mini');

  const researchResult = await client.getResearch('req-research-1');
  assert.strictEqual(researchResult.status, 'completed');
  assert.strictEqual(researchResult.request_id, 'req-research-1');
  assert.ok(typeof researchResult.content === 'string' && researchResult.content.includes('QuickJS'));

  return 'PASS: map, research, and getResearch work against mock Tavily API';
};
