import assert from 'assert';
import googleapisPkg from 'googleapis';

export const run = () => {
  const { GoogleApis } = googleapisPkg;
  const g = new GoogleApis();

  const supported = g.getSupportedAPIs();
  const apiNames = Object.keys(supported);

  assert.strictEqual(typeof supported, 'object');
  assert.ok(!Array.isArray(supported));
  assert.ok(apiNames.includes('drive'));
  assert.ok(apiNames.includes('customsearch'));
  assert.ok(apiNames.includes('youtube'));
  assert.ok(apiNames.length > 100);
  assert.deepStrictEqual(supported.customsearch, ['v1']);

  return 'PASS: getSupportedAPIs returns a large API catalog';
};
