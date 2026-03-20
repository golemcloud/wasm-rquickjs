import assert from 'node:assert';
import ddTrace from 'dd-trace';

export const run = async () => {
  process.env.DD_TRACE_ENABLED = 'false';
  process.env.DD_INSTRUMENTATION_TELEMETRY_ENABLED = 'false';
  process.env.DD_REMOTE_CONFIGURATION_ENABLED = 'false';

  const tracer = ddTrace.init({
    plugins: false,
    startupLogs: false,
  });

  const wrapped = tracer.wrap('library.ddtrace.wrap', { resource: 'callback-test' }, (value, callback) => {
    const activeSpan = tracer.scope().active();
    assert.ok(activeSpan, 'wrap() should activate span while running callback function');
    callback(null, {
      doubled: value * 2,
      spanId: activeSpan.context().toSpanId(),
    });
  });

  const result = await new Promise((resolve, reject) => {
    wrapped(21, (error, value) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(value);
    });
  });

  assert.deepStrictEqual(result.doubled, 42);
  assert.strictEqual(typeof result.spanId, 'string');
  return 'PASS: wrap() propagates an active span into callback-based code';
};
