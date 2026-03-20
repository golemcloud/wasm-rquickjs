import assert from 'assert';
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';

class HookProcessor {
  constructor() {
    this.events = [];
    this.forceFlushed = false;
    this.isShutdown = false;
    this.endingHookAttribute = undefined;
    this.onEndSawEnded = undefined;
  }

  onStart(span) {
    this.events.push(`onStart:${span.name}`);
  }

  onEnding(span) {
    this.events.push(`onEnding:${span.name}:${span.isRecording()}`);
    span.setAttribute('hook.added', 'yes');
  }

  onEnd(span) {
    this.events.push(`onEnd:${span.name}:${span.ended}`);
    this.endingHookAttribute = span.attributes['hook.added'];
    this.onEndSawEnded = span.ended;
  }

  async forceFlush() {
    this.forceFlushed = true;
  }

  async shutdown() {
    this.isShutdown = true;
  }
}

export const run = async () => {
  const hookProcessor = new HookProcessor();
  const exporter = new InMemorySpanExporter();

  const provider = new BasicTracerProvider({
    spanProcessors: [
      hookProcessor,
      new SimpleSpanProcessor(exporter),
    ],
  });

  const tracer = provider.getTracer('test-processors', '1.0.0');
  const span = tracer.startSpan('hooked-span');
  span.end();

  await provider.forceFlush();
  assert.strictEqual(hookProcessor.forceFlushed, true, 'provider.forceFlush should call processor.forceFlush');

  assert.deepStrictEqual(hookProcessor.events, [
    'onStart:hooked-span',
    'onEnding:hooked-span:true',
    'onEnd:hooked-span:true',
  ]);
  assert.strictEqual(hookProcessor.endingHookAttribute, 'yes');
  assert.strictEqual(hookProcessor.onEndSawEnded, true);

  const [exported] = exporter.getFinishedSpans();
  assert.ok(exported, 'expected one exported span');
  assert.strictEqual(exported.attributes['hook.added'], 'yes');

  await provider.shutdown();
  assert.strictEqual(hookProcessor.isShutdown, true, 'provider.shutdown should call processor.shutdown');

  return 'PASS: custom span processor hooks run in expected order with flush/shutdown';
};
