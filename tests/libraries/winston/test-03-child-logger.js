import assert from 'assert';
import winston from 'winston';

class MemoryTransport extends winston.Transport {
  constructor(opts = {}) {
    super(opts);
    this.records = [];
  }

  log(info, callback) {
    this.records.push({ ...info });
    callback();
  }
}

export const run = () => {
  const memory = new MemoryTransport();
  const parent = winston.createLogger({
    level: 'info',
    defaultMeta: { service: 'billing' },
    transports: [memory],
  });

  const child = parent.child({ requestId: 'req-42' });
  child.info('child-log', { userId: 'u-1' });

  assert.strictEqual(memory.records.length, 1);
  assert.strictEqual(memory.records[0].service, 'billing');
  assert.strictEqual(memory.records[0].requestId, 'req-42');
  assert.strictEqual(memory.records[0].message, 'child-log');

  return 'PASS: child logger merges parent and child metadata';
};
