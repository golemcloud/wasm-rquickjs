import assert from 'node:assert/strict';
import * as PlayHT from 'playht';

export const run = async () => {
  PlayHT.init({ apiKey: 'test-api-key', userId: 'test-user-id' });

  let thrown;
  try {
    await PlayHT.generate('PlayHT turbo generation test', { voiceEngine: 'PlayHT2.0-turbo' });
  } catch (error) {
    thrown = error;
  }

  assert.ok(thrown, 'Expected generate() to reject PlayHT2.0-turbo');
  assert.match(String(thrown.message || thrown), /only supported for streaming/i);

  return 'PASS: generate() rejects stream-only PlayHT2.0-turbo engine';
};
