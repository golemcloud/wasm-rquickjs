import assert from 'assert';
import Exa, { ExaError } from 'exa-js';

export const run = async () => {
  const exa = new Exa('test-api-key', 'http://localhost:18080');

  let researchIndex = 0;
  const researchStatuses = ['queued', 'running', 'completed'];
  exa.research.get = async () => ({
    id: 'research-1',
    status: researchStatuses[researchIndex++] ?? 'completed',
  });

  const completedResearch = await exa.research.pollUntilFinished('research-1', {
    pollInterval: 1,
    timeoutMs: 200,
  });
  assert.strictEqual(completedResearch.status, 'completed');
  assert.ok(researchIndex >= 3);

  let websetIndex = 0;
  const websetStatuses = ['building', 'indexing', 'idle'];
  const seenStatuses = [];
  exa.websets.get = async () => ({
    id: 'webset-1',
    status: websetStatuses[websetIndex++] ?? 'idle',
  });

  const idleWebset = await exa.websets.waitUntilIdle('webset-1', {
    pollInterval: 1,
    timeout: 200,
    onPoll: (status) => seenStatuses.push(status),
  });
  assert.strictEqual(idleWebset.status, 'idle');
  assert.deepStrictEqual(seenStatuses.slice(0, 3), websetStatuses);

  exa.research.get = async () => ({ id: 'research-2', status: 'running' });
  await assert.rejects(
    exa.research.pollUntilFinished('research-2', {
      pollInterval: 1,
      timeoutMs: 5,
    }),
    /Polling timeout/
  );

  exa.websets.get = async () => ({ id: 'webset-2', status: 'running' });
  await assert.rejects(
    exa.websets.waitUntilIdle('webset-2', {
      pollInterval: 1,
      timeout: 5,
    }),
    (err) => {
      assert.ok(err instanceof ExaError);
      assert.match(err.message, /did not reach idle state/);
      return true;
    }
  );

  return 'PASS: polling helpers handle completion and timeout paths';
};
