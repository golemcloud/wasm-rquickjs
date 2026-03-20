import assert from 'assert';
import cron from 'node-cron';

export const run = () => {
  const beforeSize = cron.getTasks().size;

  const task = cron.createTask('* * * * * *', () => {}, {
    name: 'lifecycle-task',
    maxExecutions: 3,
    noOverlap: true,
    maxRandomDelay: 5,
  });

  assert.strictEqual(task.getStatus(), 'stopped', 'task should start in stopped status');
  assert.strictEqual(cron.getTask(task.id), task, 'getTask should return created task');

  task.start();
  assert.strictEqual(task.getStatus(), 'idle', 'task should move to idle after start');

  const nextRun = task.getNextRun();
  assert.ok(nextRun instanceof Date, 'getNextRun should return a Date while running');

  task.stop();
  assert.strictEqual(task.getStatus(), 'stopped', 'task should move back to stopped after stop');

  task.destroy();
  assert.strictEqual(task.getStatus(), 'destroyed', 'task should move to destroyed after destroy');
  assert.strictEqual(cron.getTask(task.id), undefined, 'destroyed task should be removed from registry');
  assert.strictEqual(cron.getTasks().size, beforeSize, 'task registry size should be restored after destroy');

  return 'PASS: task lifecycle and registry behavior work';
};
