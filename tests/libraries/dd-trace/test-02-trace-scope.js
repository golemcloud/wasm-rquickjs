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

  assert.strictEqual(tracer.scope().active(), null);

  let seenActiveSpan = null;
  const value = tracer.trace('library.ddtrace.scope', { resource: 'scope-test' }, (span) => {
    seenActiveSpan = tracer.scope().active();
    assert.ok(seenActiveSpan, 'trace() should activate span inside callback');
    span.setTag('test.case', 'scope');
    return 'trace-return-value';
  });

  assert.strictEqual(value, 'trace-return-value');
  assert.ok(seenActiveSpan, 'span should be visible in active scope');
  assert.strictEqual(typeof seenActiveSpan.context().toSpanId(), 'string');
  assert.strictEqual(tracer.scope().active(), null);

  return 'PASS: trace() activates scope and restores it after callback';
};
