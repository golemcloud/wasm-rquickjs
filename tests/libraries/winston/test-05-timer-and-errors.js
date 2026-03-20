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
    format: winston.format.combine(
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    transports: [memory],
  });

  const profiler = logger.startTimer();
  profiler.done({ message: 'timed-operation', extra: 'ok' });

  const err = new Error('boom');
  logger.error(err);

  assert.strictEqual(memory.records.length, 2);
  assert.strictEqual(memory.records[0].message, 'timed-operation');
  assert.strictEqual(memory.records[0].extra, 'ok');
  assert.ok(typeof memory.records[0].durationMs === 'number');
  assert.ok(memory.records[0].durationMs >= 0);

  assert.strictEqual(memory.records[1].message, 'boom');
  assert.ok(typeof memory.records[1].stack === 'string');

  return 'PASS: profiler timers and errors format include timing and stack';
};
