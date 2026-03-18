import assert from 'node:assert/strict';
import * as PlayHT from 'playht';

const assertInvalidInit = (settings) => {
  let thrown;
  try {
    PlayHT.init(settings);
  } catch (error) {
    thrown = error;
  }

  assert.ok(thrown, 'Expected init() to throw for invalid credentials');
  assert.match(String(thrown.message || thrown), /valid api key and user id/i);
};

export const run = () => {
  assertInvalidInit({ apiKey: '', userId: '' });
  assertInvalidInit({ apiKey: 'non-empty', userId: '' });
  assertInvalidInit({ apiKey: '', userId: 'non-empty' });

  return 'PASS: init() validates required API credentials';
};
