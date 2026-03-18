import assert from 'assert';
import { SpanKind, SpanStatusCode, trace } from '@opentelemetry/api';

export const run = () => {
  const tracer = trace.getTracer('lib-test-opentelemetry-api', '1.0.0');

  const span = tracer.startSpan('basic-span', {
    kind: SpanKind.INTERNAL,
    attributes: {
      'test.case': 'basic-trace',
      'test.value': 42,
    },
  });

  const spanContext = span.spanContext();
  assert.ok(spanContext.traceId);
  assert.ok(spanContext.spanId);

  span
    .setAttribute('test.step', 'mutations')
    .addEvent('work.started')
    .setStatus({ code: SpanStatusCode.OK })
    .updateName('basic-span-renamed');

  const activeResult = tracer.startActiveSpan('active-span', (activeSpan) => {
    activeSpan.addEvent('inside.active.span');
    activeSpan.end();
    return 'active-span-finished';
  });

  assert.strictEqual(activeResult, 'active-span-finished');
  span.end();

  return 'PASS: trace API supports basic span lifecycle operations';
};
