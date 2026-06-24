import assert from 'node:assert';
import { createConsola } from 'consola';
import { context, propagation, trace } from '@opentelemetry/api';

export const run = () => {
  const logs = [];
  const consola = createConsola({
    reporters: [{ log: (entry) => logs.push(entry) }],
  });
  consola.info('hello', { ok: true });
  assert.strictEqual(logs.length, 1);
  assert.strictEqual(logs[0].args[0], 'hello');

  const tracer = trace.getTracer('installed-app');
  assert.strictEqual(typeof tracer.startSpan, 'function');
  const carrier = {};
  propagation.inject(context.active(), carrier);
  assert.strictEqual(typeof carrier, 'object');
  return 'PASS: consola and OpenTelemetry API execute from installed ESM packages';
};
