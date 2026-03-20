import assert from 'node:assert/strict';
import * as PlayHT from 'playht';

const mockConfig = (path) => ({
  settings: {
    experimental: {
      v3: {
        customInferenceCoordinatesGenerator: async () => ({
          inferenceAddress: `http://localhost:18080${path}`,
          expiresAtMs: Date.now() + 60_000,
        }),
      },
    },
  },
});

export const run = async () => {
  PlayHT.init({ apiKey: 'mock-api-key', userId: 'mock-user-id' });

  let thrown;
  try {
    await PlayHT.stream(
      'This call should fail with an HTTP error.',
      {
        voiceEngine: 'PlayDialog',
        voiceId: 's3://voice-cloning-zero-shot/mock-voice/original/manifest.json',
        outputFormat: 'mp3',
      },
      mockConfig('/mock/stream/error'),
    );
  } catch (error) {
    thrown = error;
  }

  assert.ok(thrown, 'Expected stream() to throw for HTTP 429');
  assert.equal(thrown.statusCode, 429);
  assert.match(String(thrown.message || thrown), /429/);

  return 'PASS: stream() propagates HTTP errors from the mock server';
};
