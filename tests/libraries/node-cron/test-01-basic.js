import assert from 'assert';
import cron from 'node-cron';

export const run = () => {
  assert.strictEqual(typeof cron.schedule, 'function', 'schedule should be exported');
  assert.strictEqual(typeof cron.createTask, 'function', 'createTask should be exported');
  assert.strictEqual(typeof cron.validate, 'function', 'validate should be exported');
  assert.strictEqual(typeof cron.getTasks, 'function', 'getTasks should be exported');
  assert.strictEqual(typeof cron.getTask, 'function', 'getTask should be exported');

  const task = cron.createTask('* * * * * *', () => {}, { name: 'basic-task' });
  assert.ok(task.id.startsWith('task-'), 'task id should have task- prefix');
  assert.strictEqual(task.name, 'basic-task', 'task name should be assigned');
  assert.strictEqual(task.getStatus(), 'stopped', 'createTask should create stopped tasks');

  task.destroy();

  return 'PASS: basic exports and task creation work';
};
