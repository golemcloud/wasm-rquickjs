import assert from 'assert';
import Replicate, { parseProgressFromLogs } from 'replicate';

export const run = () => {
  const client = new Replicate({
    auth: 'r8_test_token',
    userAgent: 'wasm-rquickjs-test/1.0',
    baseUrl: 'https://api.replicate.com/v1',
  });

  assert.ok(client.predictions);
  assert.ok(client.models);
  assert.ok(client.trainings);
  assert.ok(client.deployments);
  assert.ok(client.files);

  const fromLogs = parseProgressFromLogs(' 33%|███▎| 33/100 [00:01<00:02]');
  assert.deepStrictEqual(fromLogs, {
    percentage: 0.33,
    current: 33,
    total: 100,
  });

  const fromPrediction = parseProgressFromLogs({ logs: '100%|██████████| 4/4 [00:01<00:00]' });
  assert.deepStrictEqual(fromPrediction, {
    percentage: 1,
    current: 4,
    total: 4,
  });

  return 'PASS: Replicate client constructs and progress parsing works';
};
