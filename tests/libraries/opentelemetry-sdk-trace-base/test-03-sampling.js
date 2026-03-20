import assert from 'assert';
import {
  AlwaysOffSampler,
  AlwaysOnSampler,
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';

export const run = async () => {
  const offExporter = new InMemorySpanExporter();
  const offProvider = new BasicTracerProvider({
    sampler: new AlwaysOffSampler(),
    spanProcessors: [new SimpleSpanProcessor(offExporter)],
  });

  const offTracer = offProvider.getTracer('test-sampler-off', '1.0.0');
  const offSpan = offTracer.startSpan('span-off');
  assert.strictEqual(offSpan.isRecording(), false, 'AlwaysOff should create non-recording span');
  offSpan.end();
  await offProvider.forceFlush();
  assert.strictEqual(offExporter.getFinishedSpans().length, 0, 'AlwaysOff should not export spans');

  const onExporter = new InMemorySpanExporter();
  const onProvider = new BasicTracerProvider({
    sampler: new AlwaysOnSampler(),
    spanProcessors: [new SimpleSpanProcessor(onExporter)],
  });

  const onTracer = onProvider.getTracer('test-sampler-on', '1.0.0');
  const onSpan = onTracer.startSpan('span-on');
  assert.strictEqual(onSpan.isRecording(), true, 'AlwaysOn should create recording span');
  onSpan.end();

  await onProvider.forceFlush();
  assert.strictEqual(onExporter.getFinishedSpans().length, 1, 'AlwaysOn should export spans');

  await offProvider.shutdown();
  await onProvider.shutdown();
  return 'PASS: AlwaysOff and AlwaysOn sampler decisions are respected';
};
