import assert from 'assert';
import { CronExpressionParser } from 'cron-parser';

export const run = () => {
  const expression = CronExpressionParser.parse('*/15 * * * *', {
    currentDate: '2026-01-01T00:00:00.000Z',
  });

  const next = expression.next().toISOString();
  assert.strictEqual(next, '2026-01-01T00:15:00.000Z');

  const prev = expression.prev().toISOString();
  assert.strictEqual(prev, '2026-01-01T00:00:00.000Z');

  return 'PASS: basic next/prev iteration works';
};
