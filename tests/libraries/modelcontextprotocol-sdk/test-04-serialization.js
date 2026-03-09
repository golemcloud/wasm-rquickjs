import assert from 'assert';
import { Buffer } from 'buffer';
import { ReadBuffer, deserializeMessage, serializeMessage } from '@modelcontextprotocol/sdk/shared/stdio.js';

export const run = () => {
  const message = {
    jsonrpc: '2.0',
    id: 7,
    method: 'ping',
    params: {
      tag: 'offline-test',
    },
  };

  const serialized = serializeMessage(message);
  assert.ok(serialized.endsWith('\n'));

  const parsed = deserializeMessage(serialized.trim());
  assert.strictEqual(parsed.id, 7);
  assert.strictEqual(parsed.method, 'ping');

  const readBuffer = new ReadBuffer();
  const bytes = Buffer.from(serialized, 'utf8');

  for (let i = 0; i < bytes.length; i += 3) {
    readBuffer.append(bytes.subarray(i, i + 3));
  }

  const recovered = readBuffer.readMessage();
  assert.ok(recovered);
  assert.strictEqual(recovered.id, 7);
  assert.strictEqual(recovered.params.tag, 'offline-test');

  return 'PASS: serialize/deserialize and ReadBuffer chunk reassembly work';
};
