import assert from 'assert';
import { Cron, CronExpression, Interval, ScheduleModule, SchedulerRegistry, Timeout } from '@nestjs/schedule';

export const run = () => {
  assert.strictEqual(CronExpression.EVERY_SECOND, '* * * * * *');
  assert.strictEqual(CronExpression.EVERY_MINUTE, '*/1 * * * *');
  assert.strictEqual(CronExpression.EVERY_HOUR, '0 0-23/1 * * *');

  assert.strictEqual(typeof Cron, 'function');
  assert.strictEqual(typeof Interval, 'function');
  assert.strictEqual(typeof Timeout, 'function');
  assert.strictEqual(typeof ScheduleModule.forRoot, 'function');
  assert.strictEqual(typeof SchedulerRegistry, 'function');

  return 'PASS: CronExpression values and root module exports are available';
};
