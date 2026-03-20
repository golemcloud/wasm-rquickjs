import assert from 'assert';
import { AssemblyAI } from 'assemblyai';

export const run = () => {
  const client = new AssemblyAI({ apiKey: 'test-api-key' });

  const transcriber = client.streaming.transcriber({
    sampleRate: 16000,
    speechModel: 'universal-streaming-english',
    prompt: 'transcribe cleanly',
    languageDetection: true,
    formatTurns: true,
  });

  const url = transcriber.connectionUrl();
  assert.strictEqual(url.protocol, 'wss:');
  assert.ok(url.pathname.endsWith('/v3/ws'));
  assert.strictEqual(url.searchParams.get('sample_rate'), '16000');
  assert.strictEqual(url.searchParams.get('speech_model'), 'universal-streaming-english');
  assert.strictEqual(url.searchParams.get('language_detection'), 'true');
  assert.strictEqual(url.searchParams.get('format_turns'), 'true');

  assert.throws(() => {
    transcriber.sendAudio(new Uint8Array([4, 5, 6]));
  }, /Socket is not open for communication/);

  assert.throws(() => {
    transcriber.forceEndpoint();
  }, /Socket is not open for communication/);

  return 'PASS: Streaming transcriber URL and pre-connect guards work';
};
