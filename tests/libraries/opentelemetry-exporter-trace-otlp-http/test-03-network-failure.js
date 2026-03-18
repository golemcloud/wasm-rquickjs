import assert from 'assert';
import { ExportResultCode } from '@opentelemetry/core';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { createReadableSpan, exportSpans } from './helpers.js';

export const run = async () => {
  const exporter = new OTLPTraceExporter({
    url: 'http://localhost:1/v1/traces',
    timeoutMillis: 250,
    headers: {
      'x-suite': 'network-failure',
    },
  });

  const span = await createReadableSpan('network-failure-span');
  const result = await exportSpans(exporter, [span]);

  assert.strictEqual(result.code, ExportResultCode.FAILED, 'export should fail when collector is unreachable');
  assert.ok(result.error, 'failed export should include an error object');

  await exporter.shutdown();

  return 'PASS: exporter reports a failed result when collector endpoint is unreachable';
};
