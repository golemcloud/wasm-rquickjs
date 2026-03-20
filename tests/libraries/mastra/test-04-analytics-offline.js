import assert from 'assert';
import { PosthogAnalytics } from 'mastra/dist/chunk-X6S75F7L.js';

export const run = async () => {
  const original = process.env.MASTRA_TELEMETRY_DISABLED;

  try {
    process.env.MASTRA_TELEMETRY_DISABLED = '1';

    const analytics = new PosthogAnalytics({
      version: '1.3.12',
      apiKey: 'phc_test_key',
      host: 'http://localhost:18080',
    });

    assert.strictEqual(analytics.isTelemetryEnabled(), false);

    const systemProperties = analytics.getSystemProperties();
    assert.strictEqual(systemProperties.cli_version, '1.3.12');
    assert.ok(typeof systemProperties.session_id === 'string');

    analytics.trackEvent('offline_test_event', { category: 'unit' });
    analytics.trackCommand({ command: 'create', status: 'success', args: ['demo'] });

    await analytics.shutdown();
  } finally {
    if (original === undefined) {
      delete process.env.MASTRA_TELEMETRY_DISABLED;
    } else {
      process.env.MASTRA_TELEMETRY_DISABLED = original;
    }
  }

  return 'PASS: analytics object works in telemetry-disabled mode without network calls';
};
