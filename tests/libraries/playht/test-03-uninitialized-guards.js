import assert from 'node:assert/strict';
import * as PlayHT from 'playht';

const NEEDS_INIT = /Initialize the PlayHT API first by calling init\(\)/;

export const run = async () => {
  await assert.rejects(() => PlayHT.generate('Hello world'), NEEDS_INIT);
  await assert.rejects(() => PlayHT.stream('Hello world'), NEEDS_INIT);
  await assert.rejects(() => PlayHT.listVoices(), NEEDS_INIT);
  await assert.rejects(() => PlayHT.clone('voice-name', 'https://example.com/sample.mp3'), NEEDS_INIT);
  await assert.rejects(() => PlayHT.deleteClone('voice-id'), NEEDS_INIT);

  return 'PASS: public API methods guard against missing init()';
};
