import assert from 'assert';
import { decodeIter, encodeIter, pack, unpackMultiple } from 'msgpackr';

function concatBuffers(parts) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    merged.set(part, offset);
    offset += part.length;
  }
  return merged;
}

export const run = () => {
  const values = [
    { id: 1, label: 'one' },
    'two',
    3,
    true,
  ];

  const concatenated = concatBuffers(values.map((value) => pack(value)));
  const unpacked = unpackMultiple(concatenated);
  assert.deepStrictEqual(unpacked, values);

  const encodedParts = [...encodeIter(values)];
  const decodedParts = [...decodeIter(encodedParts)];
  assert.deepStrictEqual(decodedParts, values);

  return 'PASS: unpackMultiple and iterator helpers decode sequential payloads';
};
