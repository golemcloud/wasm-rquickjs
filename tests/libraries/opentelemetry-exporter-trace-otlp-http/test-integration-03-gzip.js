import assert from 'assert';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { CompressionAlgorithm } from '@opentelemetry/otlp-exporter-base';
import {
  exportSingleSpanThroughProvider,
  getMockRequests,
  resetMockServer,
} from './helpers.js';

const BASE_URL = 'http://localhost:18080';

export const run = async () => {
  await resetMockServer(BASE_URL);

  const exporter = new OTLPTraceExporter({
    url: `${BASE_URL}/gzip-traces`,
    timeoutMillis: 5000,
    compression: CompressionAlgorithm.GZIP,
  });

  await exportSingleSpanThroughProvider(exporter, 'integration-gzip-export', {
    'integration.case': 'gzip',
  });

  const payload = await getMockRequests(BASE_URL);
  assert.strictEqual(payload.requests.length, 1, 'expected one OTLP HTTP request');

  const request = payload.requests[0];
  assert.strictEqual(request.path, '/gzip-traces');
  assert.strictEqual(request.headers['content-encoding'], 'gzip');

  const body = JSON.parse(request.decodedBody);
  assert.ok(Array.isArray(body.resourceSpans), 'expected gzipped OTLP JSON payload');
  assert.ok(body.resourceSpans.length >= 1, 'expected at least one resource span');

  return 'PASS: exporter supports gzip OTLP payload compression over HTTP';
};
