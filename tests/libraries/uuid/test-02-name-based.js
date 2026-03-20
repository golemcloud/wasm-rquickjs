import assert from "assert";
import { v3, v5, validate, version } from "uuid";

export const run = () => {
  const dnsNs = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
  const urlNs = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";

  const v3Id = v3("www.example.com", dnsNs);
  assert.strictEqual(validate(v3Id), true);
  assert.strictEqual(version(v3Id), 3);
  assert.strictEqual(v3("www.example.com", dnsNs), v3Id);
  assert.notStrictEqual(v3("www.example.com", dnsNs), v3("www.example.org", dnsNs));

  const v5Id = v5("www.example.com", dnsNs);
  assert.strictEqual(validate(v5Id), true);
  assert.strictEqual(version(v5Id), 5);
  assert.strictEqual(v5("www.example.com", dnsNs), v5Id);
  assert.strictEqual(v5("www.widgets.com", dnsNs), "21f7f8de-8051-5b89-8680-0195ef798b6a");
  assert.notStrictEqual(v3Id, v5Id);

  assert.strictEqual(v3.DNS, dnsNs);
  assert.strictEqual(v3.URL, urlNs);
  assert.strictEqual(v5.DNS, dnsNs);
  assert.strictEqual(v5.URL, urlNs);

  return "PASS: name-based UUID generation is deterministic";
};
