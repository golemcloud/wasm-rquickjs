import assert from 'assert';
import { DeepgramClient } from '@deepgram/sdk';

const BASE = 'http://localhost:18080';

export const run = async () => {
  const client = new DeepgramClient({
    apiKey: 'mock-api-key',
    baseUrl: BASE,
  });

  const response = await client.read.v1.text.analyze({
    body: { text: 'Deepgram testing with a deterministic mock service' },
    summarize: 'v2',
  });

  assert.ok(response.results.summary.text.startsWith('summary:Deepgram tes'));

  return 'PASS: read.analyze sends body payload and parses summary';
};
