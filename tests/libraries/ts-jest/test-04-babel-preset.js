import assert from 'assert';
import {
  createJsWithBabelPreset,
  JS_TRANSFORM_PATTERN,
  TS_TRANSFORM_PATTERN,
} from 'ts-jest';

export const run = () => {
  const preset = createJsWithBabelPreset();

  assert.strictEqual(preset.transform[JS_TRANSFORM_PATTERN], 'babel-jest');
  assert.strictEqual(preset.transform[TS_TRANSFORM_PATTERN][0], 'ts-jest');

  return 'PASS: createJsWithBabelPreset wires babel-jest and ts-jest transforms';
};
