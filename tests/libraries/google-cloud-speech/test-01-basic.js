import assert from 'assert';
import { SpeechClient } from '@google-cloud/speech/build/src/v2/index.js';
import protos from '@google-cloud/speech/build/protos/protos.js';

export const run = () => {
  assert.ok(SpeechClient, 'v2 SpeechClient export should exist');
  assert.strictEqual(typeof SpeechClient.prototype.recognize, 'function');
  assert.strictEqual(typeof SpeechClient.prototype.getConfig, 'function');
  assert.ok(protos.google?.cloud?.speech?.v1, 'v1 protos should exist');
  assert.ok(protos.google?.cloud?.speech?.v2, 'v2 protos should exist');
  return 'PASS: v2 client and proto entrypoints are available';
};
