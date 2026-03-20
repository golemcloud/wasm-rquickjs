import assert from 'assert';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import {
  exportSingleSpanThroughProvider,
  getMockRequests,
  resetMockServer,
} from './helpers.js';

const BASE_URL = 'http://localhost:18080';

export const run = async () => {
  await resetMockServer(BASE_URL);

  const exporter = new OTLPTraceExporter({
    url: `${BASE_URL}/v1/traces`,
    timeoutMillis: 5000,
  });

  await exportSingleSpanThroughProvider(exporter, 'integration-basic-export', {
    'integration.case': 'basic',
  });

  const payload = await getMockRequests(BASE_URL);
  assert.strictEqual(payload.requests.length, 1, 'expected one OTLP HTTP request');

  const request = payload.requests[0];
  assert.strictEqual(request.method, 'POST');
  assert.strictEqual(request.path, '/v1/traces');
  assert.match(request.headers['content-type'] || '', /application\/json/i);

  const body = JSON.parse(request.decodedBody);
  assert.ok(Array.isArray(body.resourceSpans), 'expected OTLP JSON resourceSpans');
  assert.ok(body.resourceSpans.length >= 1, 'expected at least one resource span');

  return 'PASS: exporter sends OTLP JSON payload to the configured collector endpoint';
};
