import assert from 'assert';
import cron from 'node-cron';

export const run = async () => {
  const events = [];

  const task = cron.createTask('* * * * * *', () => 'ok');
  task.on('execution:started', (context) => {
    events.push(['started', !!context.execution]);
  });
  task.on('execution:finished', (context) => {
    events.push(['finished', context.execution?.result]);
  });

  task.start();
  await task.execute();
  task.stop();
  task.destroy();

  assert.deepStrictEqual(events[0], ['started', true], 'execution:started should fire first');
  assert.deepStrictEqual(events[1], ['finished', 'ok'], 'execution:finished should include result');

  let failedEventMessage = null;
  const failingTask = cron.createTask('* * * * * *', () => {
    throw new Error('boom');
  });

  failingTask.on('execution:failed', (context) => {
    failedEventMessage = context.execution?.error?.message ?? null;
  });

  failingTask.start();

  let threw = false;
  try {
    await failingTask.execute();
  } catch (error) {
    threw = true;
    assert.strictEqual(error.message, 'boom', 'execute should reject with original error');
  }

  failingTask.stop();
  failingTask.destroy();

  assert.strictEqual(threw, true, 'failing execute should throw');
  assert.strictEqual(failedEventMessage, 'boom', 'execution:failed should expose original error');

  return 'PASS: execution events and failure propagation work';
};
