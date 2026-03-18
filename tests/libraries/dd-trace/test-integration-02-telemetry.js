import assert from 'node:assert';
import ddTrace from 'dd-trace';
import { getState, resetState, waitFor } from './integration-helpers.js';

export const run = async () => {
  process.env.DD_TRACE_ENABLED = 'true';
  process.env.DD_TRACE_AGENT_URL = 'http://localhost:18080';
  process.env.DD_INSTRUMENTATION_TELEMETRY_ENABLED = 'true';
  process.env.DD_REMOTE_CONFIGURATION_ENABLED = 'false';

  await resetState();

  const tracer = ddTrace.init({
    plugins: false,
    startupLogs: false,
  });

  assert.ok(tracer, 'init() should return a tracer instance');

  await waitFor(async () => {
    const state = await getState();
    return state.telemetryRequests > 0;
  }, 12000, 200);

  const state = await getState();
  assert.ok(state.telemetryRequests >= 1, 'mock agent should receive telemetry payloads');

  return 'PASS: dd-trace sends startup telemetry to the mock Datadog agent';
};
