import assert from 'assert';
import { SpeechClient } from '@google-cloud/speech/build/src/v2/index.js';
import { fallback as fallbackGax } from 'google-gax';

if (!fallbackGax.loggingUtils) {
  fallbackGax.loggingUtils = {
    log: () => ({ info: () => {}, warn: () => {}, error: () => {}, debug: () => {} }),
  };
}

export const run = () => {
  const client = new SpeechClient({ fallback: true }, fallbackGax);

  const recognizerName = client.recognizerPath('project-a', 'us-central1', 'recognizer-a');
  assert.strictEqual(
    recognizerName,
    'projects/project-a/locations/us-central1/recognizers/recognizer-a',
  );
  assert.strictEqual(client.matchProjectFromRecognizerName(recognizerName), 'project-a');
  assert.strictEqual(client.matchLocationFromRecognizerName(recognizerName), 'us-central1');
  assert.strictEqual(client.matchRecognizerFromRecognizerName(recognizerName), 'recognizer-a');

  const customClassName = client.customClassPath('project-a', 'us-central1', 'class-a');
  assert.strictEqual(
    customClassName,
    'projects/project-a/locations/us-central1/customClasses/class-a',
  );
  assert.strictEqual(client.matchCustomClassFromCustomClassName(customClassName), 'class-a');

  const phraseSetName = client.phraseSetPath('project-a', 'us-central1', 'phrase-a');
  assert.strictEqual(phraseSetName, 'projects/project-a/locations/us-central1/phraseSets/phrase-a');
  assert.strictEqual(client.matchPhraseSetFromPhraseSetName(phraseSetName), 'phrase-a');

  assert.strictEqual(client.configPath('project-a', 'us-central1'), 'projects/project-a/locations/us-central1/config');
  assert.strictEqual(client.locationPath('project-a', 'us-central1'), 'projects/project-a/locations/us-central1');
  assert.strictEqual(client.projectPath('project-a'), 'projects/project-a');

  return 'PASS: v2 path template helpers build and parse resource names';
};
