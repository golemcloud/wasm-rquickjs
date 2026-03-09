import assert from 'assert';
import { createDefaultPreset } from 'ts-jest';

export const run = () => {
  const preset = createDefaultPreset({
    tsconfig: { strict: true, target: 'ES2020' },
    diagnostics: { warnOnly: true },
  });

  const options = preset.transform['^.+\\.tsx?$'][1];

  assert.strictEqual(options.tsconfig.strict, true);
  assert.strictEqual(options.tsconfig.target, 'ES2020');
  assert.strictEqual(options.diagnostics.warnOnly, true);

  return 'PASS: createDefaultPreset forwards ts-jest options into transform tuple';
};
