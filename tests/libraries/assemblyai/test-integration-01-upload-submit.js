import assert from 'assert';
import { AssemblyAI } from 'assemblyai';

const client = new AssemblyAI({
  apiKey: 'test-api-key',
  baseUrl: 'http://127.0.0.1:18080',
  streamingBaseUrl: 'http://127.0.0.1:18080',
});

export const run = async () => {
  const uploadUrl = await client.files.upload(new Uint8Array([1, 2, 3, 4]));
  assert.ok(uploadUrl.startsWith('https://cdn.mock.local/uploaded-4.wav'));

  const queued = await client.transcripts.submit({
    audio_url: uploadUrl,
    speaker_labels: true,
  });

  assert.strictEqual(queued.id, 'tr_mock_1');
  assert.strictEqual(queued.status, 'queued');

  return 'PASS: files.upload and transcripts.submit work against mock HTTP API';
};
