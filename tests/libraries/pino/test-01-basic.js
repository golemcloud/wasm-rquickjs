import assert from 'assert';
import pino from 'pino';

export const run = () => {
  const lines = [];
  const logger = pino({ base: null }, {
    write: (chunk) => {
      lines.push(chunk.toString().trim());
    },
  });

  logger.info({ answer: 42 }, 'hello %s', 'pino');

  assert.strictEqual(lines.length, 1);
  const payload = JSON.parse(lines[0]);
  assert.strictEqual(payload.level, 30);
  assert.strictEqual(payload.answer, 42);
  assert.strictEqual(payload.msg, 'hello pino');

  return 'PASS: basic logger writes structured JSON';
};
