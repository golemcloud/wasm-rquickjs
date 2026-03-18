import assert from 'assert';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

export const run = async () => {
  const exporter = new OTLPTraceExporter({
    url: 'http://localhost:4318/v1/traces',
    timeoutMillis: 500,
    concurrencyLimit: 2,
    headers: {
      'x-suite': 'lifecycle',
    },
  });

  await exporter.forceFlush();
  await exporter.forceFlush();

  assert.strictEqual(typeof exporter.shutdown, 'function');

  await exporter.shutdown();
  await exporter.shutdown();

  return 'PASS: forceFlush/shutdown lifecycle calls succeed with explicit exporter config';
};
