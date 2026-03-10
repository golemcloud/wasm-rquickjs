import assert from 'assert';
import { decode, encode, pack, unpack } from 'msgpackr';

export const run = () => {
  const payload = {
    name: 'msgpackr',
    count: 3,
    active: true,
    tags: ['codec', 'binary'],
    nested: { ok: true },
  };

  const packed = pack(payload);
  assert.ok(packed instanceof Uint8Array, 'pack() must return binary output');
  assert.deepStrictEqual(unpack(packed), payload);

  const encoded = encode(payload);
  assert.deepStrictEqual(decode(encoded), payload);

  return 'PASS: basic pack/unpack and encode/decode aliases work';
};
