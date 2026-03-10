import assert from "assert";
import { parse, stringify, v4, v5 } from "uuid";

const fixedRandom = new Uint8Array([
  0x10, 0x91, 0x56, 0xbe, 0xc4, 0xfb, 0x41, 0xea,
  0xb1, 0xb4, 0xef, 0xe1, 0x67, 0x1c, 0x58, 0x36,
]);

export const run = () => {
  const target = new Uint8Array(20);
  const dnsNs = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

  const returned = v4({ random: fixedRandom }, target, 2);
  assert.strictEqual(returned, target);
  assert.deepStrictEqual(Array.from(target.slice(2, 18)), Array.from(parse(v4({ random: fixedRandom }))));

  const v5Target = new Uint8Array(20);
  v5("www.example.com", dnsNs, v5Target, 2);
  const v5String = stringify(v5Target.slice(2, 18));
  assert.strictEqual(v5String, v5("www.example.com", dnsNs));

  assert.throws(() => parse("not-a-uuid"), /Invalid UUID/);
  assert.throws(() => v4({ random: fixedRandom }, new Uint8Array(20), 10), /out of buffer bounds/i);

  return "PASS: buffer offset APIs and validation errors work";
};
