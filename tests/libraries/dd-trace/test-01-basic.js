import assert from 'node:assert';
import tracer from 'dd-trace';

export const run = () => {
  const span = tracer.startSpan('library.ddtrace.noop-before-init');
  span.setTag('library', 'dd-trace');
  span.finish();

  assert.strictEqual(tracer.scope().active(), null);
  return 'PASS: dd-trace no-op span APIs work before init()';
};
