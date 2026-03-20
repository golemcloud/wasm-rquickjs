import assert from 'assert';
import { CronExpressionParser } from 'cron-parser';

export const run = () => {
  const expression = CronExpressionParser.parse('0 */2 * * *', {
    currentDate: '2026-01-01T00:00:00.000Z',
    endDate: '2026-01-01T10:00:00.000Z',
    tz: 'UTC',
  });

  const nextTwo = expression.take(2).map((d) => d.toISOString());
  assert.deepStrictEqual(nextTwo, [
    '2026-01-01T02:00:00.000Z',
    '2026-01-01T04:00:00.000Z',
  ]);

  expression.reset(new Date('2026-01-01T03:00:00.000Z'));
  assert.strictEqual(expression.includesDate(new Date('2026-01-01T04:00:00.000Z')), true);
  assert.strictEqual(expression.includesDate(new Date('2026-01-01T04:30:00.000Z')), false);
  assert.strictEqual(expression.stringify(), '0 */2 * * *');

  return 'PASS: take/reset/includesDate/stringify work';
};
