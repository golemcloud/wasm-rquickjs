import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';

export const createReadableSpan = async (spanName = 'otlp-exporter-test-span') => {
  const inMemoryExporter = new InMemorySpanExporter();
  const provider = new BasicTracerProvider({
    spanProcessors: [new SimpleSpanProcessor(inMemoryExporter)],
  });

  const tracer = provider.getTracer('compat-suite', '1.0.0');
  const span = tracer.startSpan(spanName, {
    attributes: {
      'suite.name': 'otlp-http-exporter',
      'suite.case': spanName,
    },
  });

  span.addEvent('span-created');
  span.end();

  await provider.forceFlush();
  const [readableSpan] = inMemoryExporter.getFinishedSpans();
  await provider.shutdown();

  if (!readableSpan) {
    throw new Error('Failed to create a readable span for exporter tests');
  }

  return readableSpan;
};

export const exportSpans = (exporter, spans) =>
  new Promise((resolve) => {
    exporter.export(spans, (result) => resolve(result));
  });

export const resetMockServer = async (baseUrl) => {
  const response = await fetch(`${baseUrl}/__reset`, { method: 'POST' });
  if (!response.ok) {
    throw new Error(`Mock server reset failed with ${response.status}`);
  }
};

export const getMockRequests = async (baseUrl) => {
  const response = await fetch(`${baseUrl}/__requests`);
  if (!response.ok) {
    throw new Error(`Mock server request fetch failed with ${response.status}`);
  }
  return response.json();
};

export const exportSingleSpanThroughProvider = async (exporter, spanName, extraAttributes = {}) => {
  const provider = new BasicTracerProvider({
    spanProcessors: [new SimpleSpanProcessor(exporter)],
  });
  const tracer = provider.getTracer('compat-suite-integration', '1.0.0');

  const span = tracer.startSpan(spanName, {
    attributes: {
      'integration.name': spanName,
      ...extraAttributes,
    },
  });

  span.addEvent('integration-event', { ok: true });
  span.end();

  await provider.forceFlush();
  await provider.shutdown();
};
