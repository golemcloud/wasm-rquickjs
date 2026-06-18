import assert from 'node:assert';
import fetch from 'node-fetch';
import ky from 'ky';

export const run = async () => {
  const fetched = await fetch('data:application/json,%7B%22hello%22%3A%22node-fetch%22%7D');
  assert.deepStrictEqual(await fetched.json(), { hello: 'node-fetch' });

  const api = ky.create({ prefixUrl: 'https://example.invalid' });
  assert.strictEqual(typeof api.get, 'function');
  assert.strictEqual(typeof api.post, 'function');
  return 'PASS: node-fetch and ky load from installed ESM packages';
};
