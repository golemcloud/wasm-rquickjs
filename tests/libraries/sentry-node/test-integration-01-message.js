import assert from 'assert';
import * as Sentry from '@sentry/node';

const BASE_URL = 'http://localhost:18080';

async function resetServer() {
  const response = await fetch(`${BASE_URL}/api/reset`, { method: 'POST' });
  assert.strictEqual(response.status, 200);
}

export const run = async () => {
  await resetServer();

  Sentry.init({
    dsn: 'http://public@localhost:18080/1',
    defaultIntegrations: false,
  });

  Sentry.captureMessage('integration message delivery');
  const flushed = await Sentry.flush(5000);
  assert.strictEqual(flushed, true);

  const stateResponse = await fetch(`${BASE_URL}/api/events`);
  assert.strictEqual(stateResponse.status, 200);
  const state = await stateResponse.json();

  assert.strictEqual(state.count, 1);
  assert.strictEqual(state.lastMessage, 'integration message delivery');

  return 'PASS: captureMessage sends an envelope to the mock HTTP endpoint';
};
