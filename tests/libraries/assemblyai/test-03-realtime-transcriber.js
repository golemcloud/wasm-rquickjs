import assert from 'assert';
import { AssemblyAI } from 'assemblyai';

export const run = () => {
  const client = new AssemblyAI({ apiKey: 'test-api-key' });
  const transcriber = client.realtime.transcriber({
    sampleRate: 16000,
    wordBoost: ['golem', 'wasm'],
    encoding: 'pcm_s16le',
  });

  const url = transcriber.connectionUrl();
  assert.strictEqual(url.protocol, 'wss:');
  assert.ok(url.pathname.endsWith('/v2/realtime/ws'));
  assert.strictEqual(url.searchParams.get('sample_rate'), '16000');
  assert.strictEqual(url.searchParams.get('encoding'), 'pcm_s16le');
  assert.ok(
    (url.searchParams.get('word_boost') || '').includes('golem'),
    'word boost terms should be encoded in the URL',
  );

  assert.throws(() => {
    transcriber.sendAudio(new Uint8Array([1, 2, 3]));
  }, /Socket is not open for communication/);

  return 'PASS: Realtime transcriber URL and pre-connect guards work';
};
