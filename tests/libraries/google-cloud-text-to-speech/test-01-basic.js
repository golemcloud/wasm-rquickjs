import assert from 'assert';
import {
  TextToSpeechClient,
  TextToSpeechLongAudioSynthesizeClient,
} from '@google-cloud/text-to-speech/build/src/v1/index.js';
import protos from '@google-cloud/text-to-speech/build/protos/protos.js';

export const run = () => {
  assert.ok(TextToSpeechClient, 'TextToSpeechClient export should exist');
  assert.ok(TextToSpeechLongAudioSynthesizeClient, 'TextToSpeechLongAudioSynthesizeClient export should exist');

  assert.strictEqual(typeof TextToSpeechClient.prototype.listVoices, 'function');
  assert.strictEqual(typeof TextToSpeechClient.prototype.synthesizeSpeech, 'function');
  assert.strictEqual(typeof TextToSpeechClient.prototype.streamingSynthesize, 'function');

  assert.ok(protos.google?.cloud?.texttospeech?.v1, 'v1 protos should exist');
  assert.ok(protos.google?.longrunning, 'longrunning protos should exist');

  return 'PASS: v1 clients and proto entrypoints are available';
};
