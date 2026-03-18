import assert from 'assert';
import { TextToSpeechClient } from '@google-cloud/text-to-speech/build/src/v1/index.js';
import { fallback as fallbackGax } from 'google-gax';

if (!fallbackGax.loggingUtils) {
  fallbackGax.loggingUtils = {
    log: () => ({ info: () => {}, warn: () => {}, error: () => {}, debug: () => {} }),
  };
}

export const run = async () => {
  const client = new TextToSpeechClient({ fallback: true }, fallbackGax);

  const modelName = client.modelPath('project-a', 'us-central1', 'model-a');
  assert.strictEqual(modelName, 'projects/project-a/locations/us-central1/models/model-a');
  assert.strictEqual(client.matchProjectFromModelName(modelName), 'project-a');
  assert.strictEqual(client.matchLocationFromModelName(modelName), 'us-central1');
  assert.strictEqual(client.matchModelFromModelName(modelName), 'model-a');

  assert.strictEqual(TextToSpeechClient.servicePath, 'texttospeech.googleapis.com');

  await client.close();
  return 'PASS: path template helpers build and parse resource names';
};
