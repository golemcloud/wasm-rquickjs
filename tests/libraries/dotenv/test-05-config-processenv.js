import assert from 'assert';
import fs from 'fs';
import dotenv from 'dotenv';

export const run = () => {
  const pathCandidates = ['fixtures/config.env', 'tests/libraries/dotenv/fixtures/config.env'];
  const envPath = pathCandidates.find((candidate) => fs.existsSync(candidate)) ?? pathCandidates[0];

  const targetEnv = { EXISTING: 'keep' };

  const resultNoOverride = dotenv.config({ path: envPath, processEnv: targetEnv });
  if (resultNoOverride.error) throw resultNoOverride.error;
  assert.strictEqual(targetEnv.EXISTING, 'keep');
  assert.strictEqual(targetEnv.NEW_VALUE, '42');

  const resultOverride = dotenv.config({ path: envPath, processEnv: targetEnv, override: true });
  if (resultOverride.error) throw resultOverride.error;
  assert.strictEqual(targetEnv.EXISTING, 'from-file');

  return 'PASS: config loads from file into custom processEnv and honors override';
};
