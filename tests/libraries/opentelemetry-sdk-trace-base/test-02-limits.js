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
    spanLimits: {
      attributeCountLimit: 2,
      attributeValueLengthLimit: 4,
      eventCountLimit: 2,
    },
  });

  const tracer = provider.getTracer('test-limits', '1.0.0');
  const span = tracer.startSpan('limits-span');

  span.setAttribute('alpha', '123456');
  span.setAttribute('beta', 'keep');
  span.setAttribute('gamma', 'drop-me');

  span.addEvent('event-1');
  span.addEvent('event-2');
  span.addEvent('event-3');
  span.addEvent('event-4');

  span.end();
  await provider.forceFlush();

  const [exported] = exporter.getFinishedSpans();
  assert.ok(exported, 'expected exported span');

  assert.deepStrictEqual(Object.keys(exported.attributes).sort(), ['alpha', 'beta']);
  assert.strictEqual(exported.attributes.alpha, '1234');
  assert.strictEqual(exported.attributes.beta, 'keep');
  assert.strictEqual(exported.droppedAttributesCount, 1);

  assert.strictEqual(exported.events.length, 2);
  assert.deepStrictEqual(exported.events.map((e) => e.name), ['event-3', 'event-4']);
  assert.strictEqual(exported.droppedEventsCount, 2);

  await provider.shutdown();
  return 'PASS: span limits truncate and drop overflow data as expected';
};
