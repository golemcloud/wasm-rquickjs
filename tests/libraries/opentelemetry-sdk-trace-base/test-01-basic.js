import assert from 'assert';
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';

export const run = async () => {
  const exporter = new InMemorySpanExporter();
  const provider = new BasicTracerProvider({
    spanProcessors: [new SimpleSpanProcessor(exporter)],
  });

  const tracer = provider.getTracer('test-basic', '1.0.0');

  const span = tracer.startSpan('basic-span', {
    attributes: {
      'component.name': 'compat-suite',
      'component.version': '1.0.0',
    },
  });

  span.setAttribute('custom.flag', true);
  span.addEvent('work.started', { step: 1 });
  span.recordException(new Error('expected test exception'));
  span.end();

  await provider.forceFlush();

  const spans = exporter.getFinishedSpans();
  assert.strictEqual(spans.length, 1, 'expected one exported span');

  const exported = spans[0];
  assert.strictEqual(exported.name, 'basic-span');
  assert.strictEqual(exported.attributes['component.name'], 'compat-suite');
  assert.strictEqual(exported.attributes['custom.flag'], true);
  assert.ok(exported.events.length >= 2, 'expected at least two events');

  const exceptionEvent = exported.events.find((e) => e.name === 'exception');
  assert.ok(exceptionEvent, 'expected exception event from recordException');

  await provider.shutdown();
  return 'PASS: basic tracer provider + span export flow works';
};
