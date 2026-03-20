import assert from 'node:assert';
import RunwayML from '@runwayml/sdk';

const BASE = 'http://localhost:18080';

export const run = async () => {
  const client = new RunwayML({
    apiKey: 'rk_test_integration',
    baseURL: BASE,
    maxRetries: 0,
  });

  const task = await client.textToImage.create({
    model: 'gen4_image',
    promptText: 'Golden retriever running through a meadow',
    ratio: '1280:720',
  });

  assert.strictEqual(task.id, 'task-image-gen4_image');

  return 'PASS: textToImage.create works end-to-end against local HTTP mock server';
};
