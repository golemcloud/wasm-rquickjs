import assert from 'node:assert';
import ddTrace from 'dd-trace';
import formats from 'dd-trace/ext/formats';

export const run = () => {
  process.env.DD_TRACE_ENABLED = 'false';
  process.env.DD_INSTRUMENTATION_TELEMETRY_ENABLED = 'false';
  process.env.DD_REMOTE_CONFIGURATION_ENABLED = 'false';

  const tracer = ddTrace.init({
    plugins: false,
    startupLogs: false,
    traceId128BitGenerationEnabled: true,
    propagationStyleInject: ['datadog', 'tracecontext'],
    propagationStyleExtract: ['datadog', 'tracecontext'],
  });

  tracer.trace('library.ddtrace.propagation.parent', {}, (parentSpan) => {
    const carrier = {};
    tracer.inject(parentSpan.context(), formats.HTTP_HEADERS, carrier);

    assert.strictEqual(typeof carrier['x-datadog-trace-id'], 'string');
    assert.strictEqual(typeof carrier['x-datadog-parent-id'], 'string');
    assert.strictEqual(typeof carrier.traceparent, 'string');

    const extracted = tracer.extract(formats.HTTP_HEADERS, carrier);
    assert.ok(extracted, 'extract() should decode context from injected headers');

    const childSpan = tracer.startSpan('library.ddtrace.propagation.child', { childOf: extracted });
    const childCarrier = {};
    tracer.inject(childSpan.context(), formats.HTTP_HEADERS, childCarrier);
    childSpan.finish();

    assert.strictEqual(
      childCarrier['x-datadog-trace-id'],
      carrier['x-datadog-trace-id'],
      'child span should keep parent trace id',
    );
  });

  return 'PASS: inject()/extract() round-trips Datadog and W3C propagation headers';
};
