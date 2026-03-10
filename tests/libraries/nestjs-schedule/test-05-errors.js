import assert from 'assert';
import { SchedulerRegistry } from '@nestjs/schedule';

export const run = () => {
  const registry = new SchedulerRegistry();
  const intervalRef = setInterval(() => {}, 60_000);

  try {
    assert.throws(
      () => registry.getCronJob('missing-cron-job'),
      (error) => error instanceof Error && /missing-cron-job/.test(error.message)
    );

    registry.addInterval('duplicate-interval', intervalRef);
    assert.throws(
      () => registry.addInterval('duplicate-interval', intervalRef),
      (error) => error instanceof Error && /already exists/i.test(error.message)
    );

    registry.deleteInterval('duplicate-interval');
    assert.strictEqual(registry.doesExist('interval', 'duplicate-interval'), false);
  } finally {
    clearInterval(intervalRef);
  }

  return 'PASS: SchedulerRegistry reports missing and duplicate scheduler registration errors';
};
