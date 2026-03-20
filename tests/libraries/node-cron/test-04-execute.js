import assert from 'assert';
import cron from 'node-cron';

export const run = async () => {
  let syncCalled = false;

  const syncTask = cron.createTask('* * * * * *', (context) => {
    assert.ok(context.date instanceof Date, 'context.date should be Date');
    assert.ok(context.triggeredAt instanceof Date, 'context.triggeredAt should be Date');
    assert.strictEqual(typeof context.dateLocalIso, 'string', 'context.dateLocalIso should be string');
    syncCalled = true;
    return 'sync-result';
  });

  syncTask.start();
  const syncResult = await syncTask.execute();
  syncTask.stop();
  syncTask.destroy();

  assert.strictEqual(syncCalled, true, 'sync callback should execute');
  assert.strictEqual(syncResult, 'sync-result', 'sync execute() should return callback value');

  let asyncCalled = false;

  const asyncTask = cron.createTask('* * * * * *', async () => {
    asyncCalled = true;
    return 'async-result';
  });

  asyncTask.start();
  const asyncResult = await asyncTask.execute();
  asyncTask.stop();
  asyncTask.destroy();

  assert.strictEqual(asyncCalled, true, 'async callback should execute');
  assert.strictEqual(asyncResult, 'async-result', 'async execute() should return callback value');

  return 'PASS: execute() runs sync and async handlers';
};
