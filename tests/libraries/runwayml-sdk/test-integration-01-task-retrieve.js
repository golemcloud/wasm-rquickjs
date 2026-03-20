import assert from 'node:assert';
import RunwayML from '@runwayml/sdk';

const BASE = 'http://localhost:18080';

export const run = async () => {
  const client = new RunwayML({
    apiKey: 'rk_test_integration',
    baseURL: BASE,
    maxRetries: 0,
  });

  const task = await client.tasks.retrieve('task-success');
  assert.strictEqual(task.id, 'task-success');
  assert.strictEqual(task.status, 'SUCCEEDED');
  assert.deepStrictEqual(task.output, ['https://cdn.example.com/output.mp4']);

  return 'PASS: tasks.retrieve works end-to-end against local HTTP mock server';
};
