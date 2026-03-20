import assert from 'assert';
import { CronExpressionParser } from 'cron-parser';

export const run = () => {
  assert.throws(() => {
    CronExpressionParser.parse('0 0 * * 1', { strict: true });
  });

  assert.throws(() => {
    CronExpressionParser.parse('61 * * * *');
  });

  const macro = CronExpressionParser.parse('@hourly');
  assert.strictEqual(macro.stringify(true), '0 0 * * * *');

  return 'PASS: strict and invalid-expression validation works';
};
