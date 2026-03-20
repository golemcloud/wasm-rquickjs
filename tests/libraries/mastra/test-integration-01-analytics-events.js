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

  const analytics = new PosthogAnalytics({
    version: '1.3.12',
    apiKey: 'phc_test_key',
    host: BASE,
  });

  analytics.trackEvent('integration_event', { channel: 'mock-server' });

  await sleep(700);
  await analytics.shutdown();

  const payload = await requestJson('/events');
  const names = payload.events.map((event) => event.event);

  assert.ok(names.includes('cli_session_start'));
  assert.ok(names.includes('integration_event'));

  return 'PASS: PosthogAnalytics sends session and custom events to mock HTTP server';
};
