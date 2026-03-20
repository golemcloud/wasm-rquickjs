import assert from 'assert';
import { AssemblyAI } from 'assemblyai';

export const run = () => {
  const client = new AssemblyAI({
    apiKey: 'test-api-key',
    baseUrl: 'http://localhost:18080/',
    streamingBaseUrl: 'http://localhost:18081/',
  });

  assert.strictEqual(
    client.files.params.baseUrl,
    'http://localhost:18080',
    'baseUrl should be normalized without trailing slash',
  );
  assert.strictEqual(
    client.transcripts.params.baseUrl,
    'http://localhost:18080',
    'transcripts should inherit normalized baseUrl',
  );

  assert.strictEqual(
    client.streaming.baseServiceParams.baseUrl,
    'http://localhost:18081/',
    'streaming service should use streamingBaseUrl as its API base',
  );

  return 'PASS: Constructor wiring and base URL normalization work';
};
