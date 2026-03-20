import assert from 'assert';
import Sender from './node_modules/ws/lib/sender.js';

export const run = () => {
  const payload = Buffer.from('hello');
  const chunks = Sender.frame(payload, {
    fin: true,
    rsv1: false,
    opcode: 0x1,
    mask: true,
    readOnly: true,
  });

  const frame = Buffer.concat(chunks);

  assert.strictEqual(frame[0], 0x81);
  assert.strictEqual((frame[1] & 0x80) === 0x80, true);
  assert.strictEqual(frame[1] & 0x7f, payload.length);

  const mask = frame.subarray(2, 6);
  const maskedPayload = frame.subarray(6);
  const decoded = Buffer.alloc(maskedPayload.length);
  for (let i = 0; i < maskedPayload.length; i += 1) {
    decoded[i] = maskedPayload[i] ^ mask[i & 3];
  }

  assert.strictEqual(decoded.toString(), 'hello');

  return 'PASS: Sender.frame creates valid masked text frames';
};
