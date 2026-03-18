import assert from 'assert';
import * as Sentry from '@sentry/node';

const TEST_DSN = 'https://public@example.com/1';

export const run = async () => {
  const captured = [];

  Sentry.init({
    dsn: TEST_DSN,
    defaultIntegrations: false,
    transport: () => ({
      send: async () => ({ statusCode: 200 }),
      flush: async () => true,
    }),
    beforeSend: (event) => {
      captured.push(event);
      return event;
    },
  });

  const eventId = Sentry.captureMessage('offline basic message');
  assert.ok(eventId);

  const flushed = await Sentry.flush(2000);
  assert.strictEqual(flushed, true);
  assert.strictEqual(captured.length, 1);
  assert.strictEqual(captured[0].message, 'offline basic message');

  return 'PASS: captureMessage queues and flushes with a custom transport';
};
