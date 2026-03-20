import assert from 'assert';
import { createClient } from './helpers.js';

export const run = async () => {
  const defaultClient = createClient('test-brave-key');
  assert.strictEqual(defaultClient.pollInterval, 500);
  assert.strictEqual(defaultClient.maxPollAttempts, 20);

  const customClient = createClient('test-brave-key', { pollInterval: 3, maxPollAttempts: 4 });
  assert.strictEqual(customClient.pollInterval, 3);
  assert.strictEqual(customClient.maxPollAttempts, 4);

  customClient.webSearch = async () => ({
    query: { original: 'no summary key' },
  });

  const withoutSummary = customClient.getSummarizedAnswer('no summary key');
  assert.strictEqual(await withoutSummary.summary, undefined);

  customClient.webSearch = async () => ({
    query: { original: 'summary key present' },
    summarizer: { key: 'summary-id-1' },
  });

  customClient.pollForSummary = async (key) => ({
    status: 'complete',
    summary: [{ type: 'text', data: `ready:${key}` }],
  });

  const withSummary = customClient.getSummarizedAnswer('summary key present');
  assert.strictEqual((await withSummary.summary).summary[0].data, 'ready:summary-id-1');

  return 'PASS: polling defaults, overrides, and summary key detection behave correctly';
};
