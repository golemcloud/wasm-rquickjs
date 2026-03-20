import assert from 'assert';
import cron from 'node-cron';

export const run = () => {
  const validExpressions = [
    '* * * * *',
    '*/5 * * * *',
    '0 0 * * *',
    '0 9 * * Mon',
    '0 0 1 Jan *',
    '0 * * * * *',
  ];

  const invalidExpressions = [
    '60 * * * *',
    '* 24 * * *',
    '* * 32 * *',
    '* * * 13 *',
    '* * * * 8',
    'not-a-cron',
  ];

  for (const expression of validExpressions) {
    assert.strictEqual(cron.validate(expression), true, `${expression} should be valid`);
  }

  for (const expression of invalidExpressions) {
    assert.strictEqual(cron.validate(expression), false, `${expression} should be invalid`);
  }

  return 'PASS: cron expression validation works for valid and invalid inputs';
};
