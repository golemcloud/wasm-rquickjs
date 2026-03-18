import assert from 'assert';
import { DeepgramClient } from '@deepgram/sdk';

export const run = async () => {
  const client = new DeepgramClient({ apiKey: 'test-api-key' });

  const listenSocket = await client.listen.v1.createConnection({
    model: 'nova-3',
    language: 'en',
    punctuate: true,
  });

  assert.strictEqual(listenSocket.socket._url, 'wss://api.deepgram.com/v1/listen');
  assert.strictEqual(listenSocket.socket._queryParameters.model, 'nova-3');
  assert.strictEqual(listenSocket.socket._queryParameters.language, 'en');
  assert.strictEqual(listenSocket.socket._queryParameters.punctuate, true);
  assert.strictEqual(listenSocket.socket.readyState, listenSocket.socket.CLOSED);

  const speakSocket = await client.speak.v1.createConnection({
    model: 'aura-2-thalia-en',
    encoding: 'linear16',
  });

  assert.strictEqual(speakSocket.socket._url, 'wss://api.deepgram.com/v1/speak');
  assert.strictEqual(speakSocket.socket._queryParameters.model, 'aura-2-thalia-en');
  assert.strictEqual(speakSocket.socket._queryParameters.encoding, 'linear16');
  assert.strictEqual(speakSocket.socket.readyState, speakSocket.socket.CLOSED);

  return 'PASS: websocket client construction and query parameter wiring';
};
