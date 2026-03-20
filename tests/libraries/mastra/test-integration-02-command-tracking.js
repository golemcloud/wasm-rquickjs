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

  const executionResult = await analytics.trackCommandExecution({
    command: 'mastra-test-command',
    args: ['--example'],
    origin: 'oss',
    execution: async () => 'ok',
  });

  assert.strictEqual(executionResult, 'ok');

  await sleep(700);
  await analytics.shutdown();

  const payload = await requestJson('/events');
  const cliCommandEvent = payload.events.find((event) => event.event === 'cli_command');

  assert.ok(cliCommandEvent);
  assert.strictEqual(cliCommandEvent.properties.command, 'mastra-test-command');
  assert.strictEqual(cliCommandEvent.properties.status, 'success');

  return 'PASS: trackCommandExecution records successful command telemetry via HTTP';
};
