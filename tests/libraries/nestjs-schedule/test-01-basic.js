import assert from 'assert';
import 'reflect-metadata';
import { Cron, Interval, Timeout } from '@nestjs/schedule';

class TaskHost {
  onCron() {}
  onInterval() {}
  onTimeout() {}
}

const applyMethodDecorator = (decorator, methodName) => {
  const descriptor = Object.getOwnPropertyDescriptor(TaskHost.prototype, methodName);
  decorator(TaskHost.prototype, methodName, descriptor);
};

export const run = () => {
  applyMethodDecorator(Cron('*/15 * * * * *', { name: 'cron-job', disabled: true }), 'onCron');
  applyMethodDecorator(Interval('interval-job', 2500), 'onInterval');
  applyMethodDecorator(Timeout('timeout-job', 1500), 'onTimeout');

  const cronMethod = TaskHost.prototype.onCron;
  const intervalMethod = TaskHost.prototype.onInterval;
  const timeoutMethod = TaskHost.prototype.onTimeout;

  assert.deepStrictEqual(Reflect.getMetadata('SCHEDULE_CRON_OPTIONS', cronMethod), {
    cronTime: '*/15 * * * * *',
    name: 'cron-job',
    disabled: true,
  });
  assert.strictEqual(Reflect.getMetadata('SCHEDULER_NAME', cronMethod), 'cron-job');
  assert.strictEqual(Reflect.getMetadata('SCHEDULER_TYPE', cronMethod), 1);

  assert.deepStrictEqual(Reflect.getMetadata('SCHEDULE_INTERVAL_OPTIONS', intervalMethod), {
    timeout: 2500,
  });
  assert.strictEqual(Reflect.getMetadata('SCHEDULER_NAME', intervalMethod), 'interval-job');
  assert.strictEqual(Reflect.getMetadata('SCHEDULER_TYPE', intervalMethod), 3);

  assert.deepStrictEqual(Reflect.getMetadata('SCHEDULE_TIMEOUT_OPTIONS', timeoutMethod), {
    timeout: 1500,
  });
  assert.strictEqual(Reflect.getMetadata('SCHEDULER_NAME', timeoutMethod), 'timeout-job');
  assert.strictEqual(Reflect.getMetadata('SCHEDULER_TYPE', timeoutMethod), 2);

  return 'PASS: decorators write expected schedule metadata and scheduler types';
};
