import assert from 'assert';
import * as Sentry from '@sentry/node';

const TEST_DSN = 'https://public@example.com/1';

export const run = async () => {
  Sentry.init({
    dsn: TEST_DSN,
    defaultIntegrations: false,
    tracesSampleRate: 1.0,
    transport: () => ({
      send: async () => ({ statusCode: 200 }),
      flush: async () => true,
    }),
  });

  let sentryTraceHeader = '';
  let baggageHeader = '';

  await Sentry.startSpan({ name: 'parent-span', op: 'test.operation' }, async (span) => {
    sentryTraceHeader = Sentry.spanToTraceHeader(span);
    baggageHeader = Sentry.spanToBaggageHeader(span) || '';

    const traceData = Sentry.getTraceData();
    assert.ok(traceData['sentry-trace']);

    await Sentry.startSpan({ name: 'child-span', op: 'test.child' }, () => {
      return undefined;
    });
  });

  assert.match(sentryTraceHeader, /^[0-9a-f]{32}-[0-9a-f]{16}-[01]$/);
  assert.strictEqual(typeof baggageHeader, 'string');

  return 'PASS: span creation exposes trace headers and trace metadata';
};
