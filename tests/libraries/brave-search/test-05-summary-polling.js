import assert from 'assert';
import { BraveSearchError, createClient } from './helpers.js';

export const run = async () => {
  const successClient = createClient('test-brave-key', { pollInterval: 1, maxPollAttempts: 3 });
  let attempts = 0;

  successClient.webSearch = async () => ({
    query: { original: 'summary test' },
    summarizer: { key: 'sum-1' },
  });

  successClient.summarizerSearch = async (key) => {
    attempts += 1;
    if (attempts < 2) {
      return { status: 'running' };
    }

    return {
      status: 'complete',
      summary: [{ type: 'text', data: `done for ${key}` }],
    };
  };

  const successResult = successClient.getSummarizedAnswer('summary test');
  const successSummary = await successResult.summary;
  assert.strictEqual(attempts, 2);
  assert.strictEqual(successSummary.status, 'complete');
  assert.strictEqual(successSummary.summary[0].data, 'done for sum-1');

  const noSummaryClient = createClient('test-brave-key');
  noSummaryClient.webSearch = async () => ({
    query: { original: 'no summary' },
  });

  const noSummaryResult = noSummaryClient.getSummarizedAnswer('no summary');
  assert.strictEqual(await noSummaryResult.summary, undefined);

  const failingClient = createClient('test-brave-key', { pollInterval: 1, maxPollAttempts: 2 });
  failingClient.webSearch = async () => ({
    query: { original: 'failing summary' },
    summarizer: { key: 'sum-fail' },
  });
  failingClient.summarizerSearch = async () => ({ status: 'failed' });

  await assert.rejects(
    () => failingClient.getSummarizedAnswer('failing summary').summary,
    (error) => error instanceof BraveSearchError && error.message === 'Summary generation failed'
  );

  return 'PASS: summary polling handles complete, missing, and failed states';
};
