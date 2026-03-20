import assert from 'assert';
import { PosthogAnalytics } from 'mastra/dist/chunk-X6S75F7L.js';

const BASE = 'http://localhost:18080';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const requestJson = async (path, options = {}) => {
  const response = await fetch(`${BASE}${path}`, options);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
};

export const run = async () => {
  await requestJson('/reset', { method: 'POST' });

  const original = process.env.MASTRA_TELEMETRY_DISABLED;
  process.env.MASTRA_TELEMETRY_DISABLED = '1';

  try {
    const analytics = new PosthogAnalytics({
      version: '1.3.12',
      apiKey: 'phc_test_key',
      host: BASE,
    });

    analytics.trackEvent('should_not_be_sent', { type: 'disabled' });
    await sleep(300);
    await analytics.shutdown();
  } finally {
    if (original === undefined) {
      delete process.env.MASTRA_TELEMETRY_DISABLED;
    } else {
      process.env.MASTRA_TELEMETRY_DISABLED = original;
    }
  }

  const payload = await requestJson('/events');
  assert.strictEqual(payload.count, 0);

  return 'PASS: telemetry disabled flag prevents HTTP telemetry submission';
};
