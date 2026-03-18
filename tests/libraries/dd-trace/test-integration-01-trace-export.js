import assert from 'node:assert';
import ddTrace from 'dd-trace';
import { flushTracer, getState, resetState, waitFor } from './integration-helpers.js';

export const run = async () => {
  process.env.DD_TRACE_ENABLED = 'true';
  process.env.DD_TRACE_AGENT_URL = 'http://localhost:18080';
  process.env.DD_INSTRUMENTATION_TELEMETRY_ENABLED = 'false';
  process.env.DD_REMOTE_CONFIGURATION_ENABLED = 'false';

  await resetState();

  const tracer = ddTrace.init({
    plugins: false,
    startupLogs: false,
    flushInterval: 20,
  });

  tracer.trace('library.ddtrace.integration.export', { resource: 'trace-export' }, (span) => {
    span.setTag('component', 'integration-test');
  });

  await flushTracer(tracer);
  await waitFor(async () => {
    const state = await getState();
    return state.traceRequests > 0;
  });

  const state = await getState();
  assert.ok(state.traceRequests >= 1, 'mock agent should receive at least one trace export');
  assert.ok(state.lastTracePath === '/v0.4/traces' || state.lastTracePath === '/v0.5/traces');

  return 'PASS: dd-trace exports spans to the mock Datadog agent over HTTP';
};
