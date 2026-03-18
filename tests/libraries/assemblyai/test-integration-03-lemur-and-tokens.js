import assert from 'assert';
import { AssemblyAI } from 'assemblyai';

const client = new AssemblyAI({
  apiKey: 'test-api-key',
  baseUrl: 'http://127.0.0.1:18080',
  streamingBaseUrl: 'http://127.0.0.1:18080',
});

export const run = async () => {
  const summary = await client.lemur.summary({
    transcript_ids: ['tr_mock_1'],
    context: 'Summarize this transcript',
  });

  assert.strictEqual(summary.request_id, 'lemur_req_1');
  assert.match(summary.response, /tr_mock_1/);

  const realtimeToken = await client.realtime.createTemporaryToken({ expires_in: 120 });
  assert.strictEqual(realtimeToken, 'rt-temp-120');

  const streamingToken = await client.streaming.createTemporaryToken({ expires_in_seconds: 240 });
  assert.strictEqual(streamingToken, 'stream-temp-240');

  return 'PASS: LeMUR summary and temporary token APIs work against mock HTTP API';
};
