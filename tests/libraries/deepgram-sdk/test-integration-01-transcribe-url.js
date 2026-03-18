import assert from 'assert';
import { DeepgramClient } from '@deepgram/sdk';

const BASE = 'http://localhost:18080';

export const run = async () => {
  const client = new DeepgramClient({
    apiKey: 'mock-api-key',
    baseUrl: BASE,
  });

  const response = await client.listen.v1.media.transcribeUrl({
    url: 'https://example.com/audio.wav',
    model: 'nova-3',
    language: 'en',
    punctuate: true,
  });

  const transcript = response.results.channels[0].alternatives[0].transcript;
  assert.ok(transcript.includes('mock transcript for nova-3'));

  return 'PASS: transcribeUrl sends request and parses transcript response';
};
