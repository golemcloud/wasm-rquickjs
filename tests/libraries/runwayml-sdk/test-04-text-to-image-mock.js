import assert from 'node:assert';
import RunwayML from '@runwayml/sdk';

export const run = async () => {
  const requests = [];

  const client = new RunwayML({
    apiKey: 'rk_test_create',
    baseURL: 'http://localhost:18080',
    maxRetries: 0,
    fetch: async (url, init) => {
      const requestBody = init?.body ? JSON.parse(String(init.body)) : undefined;
      requests.push({
        url: String(url),
        method: init?.method,
        body: requestBody,
      });

      return new Response(JSON.stringify({ id: 'task-image-123' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    },
  });

  const createdTask = await client.textToImage.create({
    model: 'gen4_image',
    promptText: 'A lighthouse during sunrise',
    ratio: '1280:720',
  });

  assert.strictEqual(createdTask.id, 'task-image-123');
  assert.strictEqual(requests.length, 1);
  assert.strictEqual(requests[0].url, 'http://localhost:18080/v1/text_to_image');
  assert.strictEqual(requests[0].method?.toUpperCase(), 'POST');
  assert.deepStrictEqual(requests[0].body, {
    model: 'gen4_image',
    promptText: 'A lighthouse during sunrise',
    ratio: '1280:720',
  });

  return 'PASS: textToImage.create sends expected payload and returns task id';
};
