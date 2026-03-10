import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { CronExpressionParser, CronFileParser } from 'cron-parser';

export const run = () => {
  const expression = CronExpressionParser.parse('0 30 9 * * 1-5', {
    currentDate: '2026-03-09T08:00:00.000Z',
    tz: 'Europe/London',
  });

  const next = expression.next().toISOString();
  assert.strictEqual(next, '2026-03-09T09:30:00.000Z');

  const tempPath = path.join('.', 'cron-parser-temp.cron');
  fs.writeFileSync(tempPath, 'MAILTO=ops@example.com\n*/5 * * * * echo hello\n', 'utf8');

  const parsed = CronFileParser.parseFileSync(tempPath);
  fs.unlinkSync(tempPath);

  assert.strictEqual(parsed.variables.MAILTO, 'ops@example.com');
  assert.strictEqual(parsed.expressions.length, 1);
  assert.deepStrictEqual(Object.keys(parsed.errors), []);

  return 'PASS: timezone parsing and CronFileParser.parseFileSync work';
};
