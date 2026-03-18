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
    'مرحبا بالعالم',
    {
      voiceEngine: 'PlayDialog',
      voiceId: 's3://voice-cloning-zero-shot/mock-voice-1/original/manifest.json',
      voiceId2: 's3://voice-cloning-zero-shot/mock-voice-2/original/manifest.json',
      language: 'arabic',
      outputFormat: 'wav',
      turnPrefix: '[A]:',
      turnPrefix2: '[B]:',
      speed: 1.2,
    },
    mockConfig('/mock/stream/payload'),
  );

  const audio = await streamToBuffer(audioStream);
  assert.equal(audio.toString('utf8'), 'AUDIO_PAYLOAD_OK');

  return 'PASS: stream() sends expected PlayDialog payload fields to HTTP mock server';
};
