import assert from 'assert';
import pino from 'pino';

export const run = () => {
  const infoLines = [];
  const errorLines = [];

  const streams = pino.multistream([
    { level: 'info', stream: { write: (line) => infoLines.push(line.toString().trim()) } },
    { level: 'error', stream: { write: (line) => errorLines.push(line.toString().trim()) } },
  ]);

  const logger = pino({ base: null }, streams);
  logger.info('info event');
  logger.error('error event');

  assert.strictEqual(infoLines.length, 2);
  assert.strictEqual(errorLines.length, 1);

  const infoPayload = JSON.parse(infoLines[0]);
  const errorPayload = JSON.parse(errorLines[0]);
  assert.strictEqual(infoPayload.msg, 'info event');
  assert.strictEqual(errorPayload.msg, 'error event');
  assert.strictEqual(errorPayload.level, 50);

  return 'PASS: multistream routes records by level threshold';
};
