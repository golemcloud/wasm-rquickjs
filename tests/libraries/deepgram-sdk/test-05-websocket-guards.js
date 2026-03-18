import assert from 'assert';
import { DeepgramClient } from '@deepgram/sdk';

export const run = async () => {
  const client = new DeepgramClient({ apiKey: 'test-api-key' });

  const listenSocket = await client.listen.v1.createConnection({
    model: 'nova-3',
  });

  assert.throws(
    () => listenSocket.sendMedia(new Uint8Array([1, 2, 3])),
    /Socket is not open\./
  );
  assert.throws(() => listenSocket.sendFinalize(), /Socket is not open\./);

  const speakSocket = await client.speak.v1.createConnection({
    model: 'aura-2-thalia-en',
  });
  assert.throws(() => speakSocket.sendText({ type: 'Speak', text: 'hello' }), /Socket is not open\./);
  assert.throws(() => speakSocket.sendFlush(), /Socket is not open\./);

  return 'PASS: websocket send guards before connect';
};
