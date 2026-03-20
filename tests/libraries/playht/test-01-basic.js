import assert from 'node:assert/strict';
import * as PlayHT from 'playht';

export const run = () => {
  const exported = Object.keys(PlayHT).sort();
  assert.ok(exported.includes('init'));
  assert.ok(exported.includes('generate'));
  assert.ok(exported.includes('stream'));
  assert.ok(exported.includes('listVoices'));
  assert.ok(exported.includes('clone'));
  assert.ok(exported.includes('deleteClone'));
  assert.ok(exported.includes('cache'));

  PlayHT.init({ apiKey: 'test-api-key', userId: 'test-user-id' });
  assert.equal(typeof PlayHT.cache.clearInferenceCoordinatesStoreForUser, 'function');
  PlayHT.cache.clearInferenceCoordinatesStoreForUser('test-user-id');

  return 'PASS: exports, init(), and cache helper are available';
};
