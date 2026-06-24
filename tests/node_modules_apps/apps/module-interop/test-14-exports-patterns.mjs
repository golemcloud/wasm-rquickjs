import assert from 'node:assert';
import feature from 'pattern-exports/features/alpha';
import syncFeature from 'pattern-exports/sync/beta';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export const run = () => {
  assert.deepStrictEqual(feature, { feature: 'alpha' });
  assert.deepStrictEqual(syncFeature, { branch: 'module-sync', name: 'beta' });
  assert.deepStrictEqual(require('pattern-exports/cjs/gamma'), { branch: 'require', name: 'gamma' });
  return 'PASS: package exports wildcard patterns resolve for ESM, module-sync, and CJS require';
};
