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

const streamToBuffer = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
};

export const run = async () => {
  PlayHT.init({ apiKey: 'mock-api-key', userId: 'mock-user-id' });

  const audioStream = await PlayHT.stream(
    'Hello from the PlayHT mock integration test.',
    {
      voiceEngine: 'PlayDialog',
      voiceId: 's3://voice-cloning-zero-shot/mock-voice/original/manifest.json',
      outputFormat: 'mp3',
    },
    mockConfig('/mock/stream/basic'),
  );

  const audio = await streamToBuffer(audioStream);
  assert.equal(audio.toString('utf8'), 'AUDIO_BASIC_OK');

  return 'PASS: stream() receives audio bytes from local HTTP mock server';
};
