import assert from 'assert';
import { ExportResultCode } from '@opentelemetry/core';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { CompressionAlgorithm } from '@opentelemetry/otlp-exporter-base';
import { createReadableSpan, exportSpans } from './helpers.js';

export const run = async () => {
  const exporter = new OTLPTraceExporter({
    url: 'http://localhost:1/v1/traces',
    timeoutMillis: 250,
    concurrencyLimit: 1,
    compression: CompressionAlgorithm.GZIP,
    keepAlive: false,
    userAgent: 'compat-suite/1.0',
    headers: {
      'x-custom-header': 'yes',
    },
  });

  const span = await createReadableSpan('options-span');
  const result = await exportSpans(exporter, [span]);

  assert.strictEqual(result.code, ExportResultCode.FAILED);
  assert.ok(result.error, 'failed export should include error details');

  await exporter.forceFlush();
  await exporter.shutdown();

  return 'PASS: exporter accepts advanced Node options and preserves lifecycle after failed exports';
};
