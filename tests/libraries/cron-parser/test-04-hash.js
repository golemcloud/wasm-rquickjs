import assert from 'assert';
import { CronExpressionParser } from 'cron-parser';

export const run = () => {
  const first = CronExpressionParser.parse('H * * * *', {
    hashSeed: 'seed-123',
    currentDate: '2026-01-01T00:00:00.000Z',
  });

  const second = CronExpressionParser.parse('H * * * *', {
    hashSeed: 'seed-123',
    currentDate: '2026-01-01T00:00:00.000Z',
  });

  assert.strictEqual(first.stringify(), second.stringify());

  const minute = first.fields.minute.values[0];
  assert.strictEqual(Number.isInteger(minute), true);
  assert.strictEqual(minute >= 0 && minute <= 59, true);

  const stepped = CronExpressionParser.parse('H/10 * * * *', {
    hashSeed: 'seed-step',
  });

  const values = stepped.fields.minute.values;
  assert.strictEqual(values.length > 1, true);

  const modulo = values[0] % 10;
  for (const value of values) {
    assert.strictEqual(value % 10, modulo);
  }

  return 'PASS: hash-seeded jitter expressions are deterministic';
};
