import assert from 'node:assert';
import RunwayML from '@runwayml/sdk';

export const run = () => {
  const client = new RunwayML({
    apiKey: 'rk_test_basic',
  });

  assert.strictEqual(client.apiKey, 'rk_test_basic');
  assert.strictEqual(client.baseURL, 'https://api.dev.runwayml.com');
  assert.strictEqual(client.maxRetries, 2);
  assert.ok(client.tasks);
  assert.ok(client.textToImage);
  assert.ok(client.imageToVideo);

  return 'PASS: constructor defaults and core resource namespaces are available';
};
