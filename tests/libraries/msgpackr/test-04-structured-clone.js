import assert from 'assert';
import { Packr } from 'msgpackr';

export const run = () => {
  const shared = { marker: 'shared' };
  const original = {
    left: shared,
    right: shared,
    numbers: new Set([1, 2, 3]),
  };
  original.self = original;

  const packr = new Packr({ structuredClone: true });
  const decoded = packr.unpack(packr.pack(original));

  assert.strictEqual(decoded.self, decoded);
  assert.strictEqual(decoded.left, decoded.right);
  assert.ok(decoded.numbers instanceof Set);
  assert.deepStrictEqual([...decoded.numbers], [1, 2, 3]);

  return 'PASS: structuredClone preserves cycles, identity, and Set values';
};
