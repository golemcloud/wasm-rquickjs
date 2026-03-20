import assert from 'assert';
import Receiver from './node_modules/ws/lib/receiver.js';

export const run = () => {
  let receivedMessage = null;
  let receivedBinaryFlag = null;

  const receiver = new Receiver({
    isServer: false,
    maxPayload: 1024,
  });

  receiver.on('message', (data, isBinary) => {
    receivedMessage = data.toString();
    receivedBinaryFlag = isBinary;
  });

  receiver.write(Buffer.from([0x81, 0x05, 0x68, 0x65, 0x6c, 0x6c, 0x6f]));

  assert.strictEqual(receivedMessage, 'hello');
  assert.strictEqual(receivedBinaryFlag, false);

  return 'PASS: Receiver decodes an unmasked text frame';
};
