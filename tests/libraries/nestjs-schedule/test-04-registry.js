import assert from 'assert';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';

export const run = () => {
  const registry = new SchedulerRegistry();

  const intervalRef = setInterval(() => {}, 60_000);
  const timeoutRef = setTimeout(() => {}, 60_000);
  const cronRef = CronJob.from({
    cronTime: '*/30 * * * * *',
    onTick: () => {},
    start: false,
  });

  try {
    registry.addInterval('interval-a', intervalRef);
    registry.addTimeout('timeout-a', timeoutRef);
    registry.addCronJob('cron-a', cronRef);

    assert.strictEqual(registry.doesExist('interval', 'interval-a'), true);
    assert.strictEqual(registry.doesExist('timeout', 'timeout-a'), true);
    assert.strictEqual(registry.doesExist('cron', 'cron-a'), true);

    assert.strictEqual(registry.getInterval('interval-a'), intervalRef);
    assert.strictEqual(registry.getTimeout('timeout-a'), timeoutRef);
    assert.strictEqual(registry.getCronJob('cron-a'), cronRef);

    registry.deleteInterval('interval-a');
    registry.deleteTimeout('timeout-a');
    registry.deleteCronJob('cron-a');

    assert.strictEqual(registry.doesExist('interval', 'interval-a'), false);
    assert.strictEqual(registry.doesExist('timeout', 'timeout-a'), false);
    assert.strictEqual(registry.doesExist('cron', 'cron-a'), false);
  } finally {
    clearInterval(intervalRef);
    clearTimeout(timeoutRef);
    cronRef.stop();
  }

  return 'PASS: SchedulerRegistry add/get/delete operations work for interval/timeout/cron';
};
