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

  Sentry.setUser({ id: 'user-42', email: 'user42@example.com' });
  Sentry.setTag('runtime', 'offline-node');
  Sentry.setContext('test-context', { source: 'scope-test' });
  Sentry.addBreadcrumb({ category: 'test', message: 'scope breadcrumb', level: 'info' });

  Sentry.captureException(new Error('scope boom'));

  const flushed = await Sentry.flush(2000);
  assert.strictEqual(flushed, true);
  assert.strictEqual(captured.length, 1);

  const event = captured[0];
  assert.strictEqual(event.user.id, 'user-42');
  assert.strictEqual(event.user.email, 'user42@example.com');
  assert.strictEqual(event.tags.runtime, 'offline-node');
  assert.strictEqual(event.contexts['test-context'].source, 'scope-test');
  assert.strictEqual(event.breadcrumbs[0].message, 'scope breadcrumb');
  assert.strictEqual(event.exception.values[0].value, 'scope boom');

  return 'PASS: user, tags, context, and breadcrumbs are attached to captured exceptions';
};
