import assert from 'assert';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

export const run = async () => {
  const exporter = new OTLPTraceExporter();

  assert.strictEqual(typeof exporter.export, 'function');
  assert.strictEqual(typeof exporter.forceFlush, 'function');
  assert.strictEqual(typeof exporter.shutdown, 'function');

  await exporter.forceFlush();
  await exporter.shutdown();
  await exporter.shutdown();

  return 'PASS: OTLPTraceExporter exposes expected lifecycle methods';
};
