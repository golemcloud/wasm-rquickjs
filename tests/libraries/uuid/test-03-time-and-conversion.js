import assert from "assert";
import { validate, v1, v1ToV6, v6, v6ToV1, v7, version } from "uuid";

const fixedRandom = new Uint8Array([
  0xc9, 0x56, 0x00, 0x5c, 0xcf, 0xb1, 0x11, 0xef,
  0x80, 0xc4, 0x00, 0x0c, 0x29, 0xda, 0xa4, 0xc6,
]);

export const run = () => {
  const v1Id = v1({ random: fixedRandom, msecs: 1700000000000, nsecs: 0, clockseq: 0x1234 });
  assert.strictEqual(validate(v1Id), true);
  assert.strictEqual(version(v1Id), 1);

  const convertedV6 = v1ToV6(v1Id);
  assert.strictEqual(validate(convertedV6), true);
  assert.strictEqual(version(convertedV6), 6);
  assert.strictEqual(v6ToV1(convertedV6), v1Id);

  const directV6 = v6({ random: fixedRandom, msecs: 1700000000000, nsecs: 0, clockseq: 0x1234 });
  assert.strictEqual(validate(directV6), true);
  assert.strictEqual(version(directV6), 6);

  const earlyV7 = v7({ random: fixedRandom, msecs: 1000, seq: 1 });
  const lateV7 = v7({ random: fixedRandom, msecs: 2000, seq: 1 });
  assert.strictEqual(validate(earlyV7), true);
  assert.strictEqual(validate(lateV7), true);
  assert.strictEqual(version(earlyV7), 7);
  assert.strictEqual(version(lateV7), 7);
  assert.ok(lateV7 > earlyV7);

  return "PASS: time-based UUIDs and conversions behave as expected";
};
