import assert from 'assert';
import { createDefaultEsmPreset, TS_EXT_TO_TREAT_AS_ESM } from 'ts-jest';

export const run = () => {
  const preset = createDefaultEsmPreset();
  const transform = preset.transform['^.+\\.m?tsx?$'];

  assert.ok(Array.isArray(preset.extensionsToTreatAsEsm));
  assert.deepStrictEqual(preset.extensionsToTreatAsEsm, TS_EXT_TO_TREAT_AS_ESM);
  assert.ok(transform);
  assert.strictEqual(transform[0], 'ts-jest');
  assert.strictEqual(transform[1].useESM, true);

  return 'PASS: createDefaultEsmPreset enables ESM transformer options';
};
