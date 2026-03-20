import assert from 'node:assert';
import RunwayML from '@runwayml/sdk';

export const run = async () => {
  const requests = [];

  const client = new RunwayML({
    apiKey: 'rk_test_mock',
    baseURL: 'http://localhost:18080',
    maxRetries: 0,
    fetch: async (url, init) => {
      requests.push({
        url: String(url),
        method: init?.method,
        headers: new Headers(init?.headers),
      });

      return new Response(
        JSON.stringify({
          id: 'task-success',
          createdAt: '2025-01-01T00:00:00.000Z',
          status: 'SUCCEEDED',
          output: ['https://cdn.example.com/video.mp4'],
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    },
  });

  const task = await client.tasks.retrieve('task-success');
  assert.strictEqual(task.id, 'task-success');
  assert.strictEqual(task.status, 'SUCCEEDED');
  assert.strictEqual(task.output.length, 1);

  assert.strictEqual(requests.length, 1);
  assert.strictEqual(requests[0].url, 'http://localhost:18080/v1/tasks/task-success');
  assert.strictEqual(requests[0].method?.toUpperCase(), 'GET');
  assert.strictEqual(requests[0].headers.get('authorization'), 'Bearer rk_test_mock');
  assert.strictEqual(requests[0].headers.get('x-runway-version'), '2024-11-06');

  return 'PASS: tasks.retrieve sends expected request shape and parses succeeded response';
};
