import assert from 'node:assert';
import ddTrace from 'dd-trace';

export const run = () => {
  process.env.DD_TRACE_ENABLED = 'false';
  process.env.DD_INSTRUMENTATION_TELEMETRY_ENABLED = 'false';
  process.env.DD_REMOTE_CONFIGURATION_ENABLED = 'false';

  const tracer = ddTrace.init({
    plugins: false,
    startupLogs: false,
  });

  tracer.setBaggageItem('tenant-id', 'acme');
  tracer.setBaggageItem('request-id', 'req-123');

  assert.strictEqual(tracer.getBaggageItem('tenant-id'), 'acme');
  assert.strictEqual(tracer.getAllBaggageItems()['request-id'], 'req-123');

  tracer.removeBaggageItem('tenant-id');
  const removed = tracer.getBaggageItem('tenant-id');
  assert.ok(removed === null || removed === undefined);

  tracer.removeAllBaggageItems();
  assert.deepStrictEqual(tracer.getAllBaggageItems(), {});

  return 'PASS: tracer-wide baggage setters/getters/remove APIs behave consistently';
};
