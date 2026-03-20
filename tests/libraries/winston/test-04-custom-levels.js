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
  const levels = {
    fatal: 0,
    warn: 1,
    info: 2,
    debug: 3,
  };

  const memory = new MemoryTransport();
  const logger = winston.createLogger({
    levels,
    level: 'warn',
    transports: [memory],
  });

  logger.debug('ignore me');
  logger.warn('warning-event');

  assert.strictEqual(logger.isLevelEnabled('fatal'), true);
  assert.strictEqual(logger.isLevelEnabled('debug'), false);
  assert.strictEqual(memory.records.length, 1);
  assert.strictEqual(memory.records[0].message, 'warning-event');
  assert.strictEqual(memory.records[0].level, 'warn');

  return 'PASS: custom levels and isLevelEnabled behave consistently';
};
