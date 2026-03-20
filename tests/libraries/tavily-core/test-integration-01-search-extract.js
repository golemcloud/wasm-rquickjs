import assert from 'assert';
import { tavily } from '@tavily/core';

const client = tavily({
  apiKey: 'tvly-test-key',
  apiBaseURL: 'http://localhost:18080',
  clientSource: 'wasm-rquickjs-test-integration',
});

export const run = async () => {
  const searchResult = await client.search('golem wasm quickjs', {
    includeAnswer: true,
    includeUsage: true,
    includeImages: true,
  });

  assert.strictEqual(searchResult.query, 'golem wasm quickjs');
  assert.strictEqual(searchResult.answer, 'Mock answer for golem wasm quickjs');
  assert.strictEqual(searchResult.requestId, 'req-search-1');
  assert.strictEqual(searchResult.results.length, 1);
  assert.strictEqual(searchResult.results[0].rawContent, 'Long markdown content');
  assert.strictEqual(searchResult.usage.credits, 2);
  assert.strictEqual(searchResult.images[0].url, 'https://example.com/img.png');

  const extractResult = await client.extract(['https://example.com/a', 'https://bad.invalid'], {
    includeImages: true,
    includeUsage: true,
  });

  assert.strictEqual(extractResult.requestId, 'req-extract-1');
  assert.strictEqual(extractResult.results.length, 1);
  assert.strictEqual(extractResult.results[0].rawContent, '# Extracted markdown');
  assert.strictEqual(extractResult.failedResults.length, 1);
  assert.strictEqual(extractResult.failedResults[0].url, 'https://bad.invalid');
  assert.strictEqual(extractResult.usage.credits, 1);

  return 'PASS: search and extract map Tavily API responses correctly';
};
