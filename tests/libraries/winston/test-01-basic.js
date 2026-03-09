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
  const logger = winston.createLogger({
    level: 'info',
    transports: [memory],
  });

  logger.log({ level: 'info', message: 'hello', scope: 'test' });
  logger.log({ level: 'debug', message: 'hidden-debug' });

  assert.strictEqual(memory.records.length, 1);
  assert.strictEqual(memory.records[0].message, 'hello');
  assert.strictEqual(memory.records[0].scope, 'test');

  return 'PASS: basic logger writes to a custom transport with level filtering';
};
