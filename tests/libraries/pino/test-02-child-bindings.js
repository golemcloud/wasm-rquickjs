import assert from 'assert';
import pino from 'pino';

export const run = () => {
  const lines = [];
  const logger = pino({ base: null }, {
    write: (chunk) => {
      lines.push(chunk.toString().trim());
    },
  });

  const child = logger.child({ requestId: 'req-123' });
  child.setBindings({ tenant: 'acme' });
  child.info({ stage: 'start' }, 'child logger');

  assert.strictEqual(lines.length, 1);
  const payload = JSON.parse(lines[0]);
  assert.strictEqual(payload.requestId, 'req-123');
  assert.strictEqual(payload.tenant, 'acme');
  assert.strictEqual(payload.stage, 'start');
  assert.strictEqual(payload.msg, 'child logger');

  return 'PASS: child logger bindings are merged into log lines';
};
