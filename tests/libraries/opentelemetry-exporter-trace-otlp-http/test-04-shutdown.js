import assert from 'assert';
import { ExportResultCode } from '@opentelemetry/core';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { createReadableSpan, exportSpans } from './helpers.js';

export const run = async () => {
  const exporter = new OTLPTraceExporter({
    url: 'http://localhost:4318/v1/traces',
    timeoutMillis: 500,
  });

  await exporter.shutdown();

  const span = await createReadableSpan('post-shutdown-span');
  const result = await exportSpans(exporter, [span]);

  assert.strictEqual(result.code, ExportResultCode.FAILED);
  assert.ok(result.error, 'post-shutdown export should fail with an error');

  return 'PASS: exporter reports a failed export result after shutdown';
};
