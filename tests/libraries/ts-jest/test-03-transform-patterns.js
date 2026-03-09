import assert from 'assert';
import {
  ESM_TS_JS_TRANSFORM_PATTERN,
  ESM_TS_TRANSFORM_PATTERN,
  TS_JS_TRANSFORM_PATTERN,
  TS_TRANSFORM_PATTERN,
} from 'ts-jest';

export const run = () => {
  assert.strictEqual(new RegExp(TS_TRANSFORM_PATTERN).test('file.ts'), true);
  assert.strictEqual(new RegExp(TS_TRANSFORM_PATTERN).test('file.js'), false);
  assert.strictEqual(new RegExp(ESM_TS_TRANSFORM_PATTERN).test('file.mts'), true);
  assert.strictEqual(new RegExp(TS_JS_TRANSFORM_PATTERN).test('file.jsx'), true);
  assert.strictEqual(new RegExp(ESM_TS_JS_TRANSFORM_PATTERN).test('file.mjs'), true);

  return 'PASS: transform regex constants match expected file suffixes';
};
