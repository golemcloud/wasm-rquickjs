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
    url: `${BASE_URL}/custom-traces`,
    timeoutMillis: 5000,
    userAgent: 'compat-suite/1.0',
    headers: {
      authorization: 'Bearer local-test-token',
      'x-otlp-suite': 'headers',
    },
  });

  await exportSingleSpanThroughProvider(exporter, 'integration-headers-export', {
    'integration.case': 'headers',
  });

  const payload = await getMockRequests(BASE_URL);
  assert.strictEqual(payload.requests.length, 1, 'expected one OTLP HTTP request');

  const request = payload.requests[0];
  assert.strictEqual(request.path, '/custom-traces');
  assert.strictEqual(request.headers.authorization, 'Bearer local-test-token');
  assert.strictEqual(request.headers['x-otlp-suite'], 'headers');
  assert.match(request.headers['user-agent'] || '', /compat-suite\/1\.0/i);

  return 'PASS: exporter forwards configured headers and user-agent prefix';
};
