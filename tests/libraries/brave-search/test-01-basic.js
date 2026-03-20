import assert from 'assert';
import { createClient } from './helpers.js';

export const run = async () => {
  const client = createClient('test-brave-key', { pollInterval: 10, maxPollAttempts: 2 });

  for (const method of [
    'webSearch',
    'imageSearch',
    'newsSearch',
    'getSummarizedAnswer',
    'localPoiSearch',
    'localDescriptionsSearch',
  ]) {
    assert.strictEqual(typeof client[method], 'function', `Expected ${method} to be a function`);
  }

  assert.strictEqual(client.baseUrl, 'https://api.search.brave.com/res/v1');
  assert.strictEqual(client.pollInterval, 10);
  assert.strictEqual(client.maxPollAttempts, 2);

  client.webSearch = async () => ({
    query: { original: 'what is quickjs' },
    summarizer: { key: 'mock-summary-key' },
  });

  client.pollForSummary = async (key) => ({
    status: 'complete',
    summary: [{ type: 'text', data: `summary for ${key}` }],
  });

  const { webSearch, summary } = client.getSummarizedAnswer('what is quickjs');
  const webResponse = await webSearch;
  const summaryResponse = await summary;

  assert.strictEqual(webResponse.query.original, 'what is quickjs');
  assert.strictEqual(summaryResponse.status, 'complete');
  assert.strictEqual(summaryResponse.summary[0].data, 'summary for mock-summary-key');

  return 'PASS: BraveSearch class initializes and exposes expected methods';
};
