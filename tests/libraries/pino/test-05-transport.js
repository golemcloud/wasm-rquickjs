import assert from 'assert';
import pino from 'pino';

export const run = () => {
  const lines = [];
  const levelChanges = [];

  const logger = pino(
    {
      base: null,
      level: 'info',
      customLevels: {
        notice: 35,
      },
    },
    {
      write: (chunk) => {
        lines.push(JSON.parse(chunk.toString().trim()));
      },
    }
  );

  logger.on('level-change', (newLevel, newLevelVal, prevLevel, prevLevelVal) => {
    levelChanges.push({ newLevel, newLevelVal, prevLevel, prevLevelVal });
  });

  logger.info('first message');
  logger.level = 'error';
  logger.info('suppressed info');
  logger.error('second message');

  assert.strictEqual(levelChanges.length, 1);
  assert.strictEqual(levelChanges[0].newLevel, 'error');
  assert.strictEqual(levelChanges[0].prevLevel, 'info');

  assert.strictEqual(lines.length, 2);
  assert.strictEqual(lines[0].msg, 'first message');
  assert.strictEqual(lines[1].msg, 'second message');
  assert.strictEqual(lines[1].level, 50);

  return 'PASS: level changes and threshold filtering behave correctly';
};
