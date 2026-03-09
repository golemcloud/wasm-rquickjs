import assert from 'assert';
import { createDefaultPreset } from 'ts-jest';

export const run = () => {
  const preset = createDefaultPreset();

  assert.ok(preset.transform);
  assert.ok(preset.transform['^.+\\.tsx?$']);
  assert.strictEqual(preset.transform['^.+\\.tsx?$'][0], 'ts-jest');

  return 'PASS: createDefaultPreset returns ts-jest transform mapping';
};
