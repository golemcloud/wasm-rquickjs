import assert from 'node:assert';
import dualDefault, { mode as dualMode } from 'dual-exports';
import { featureMode } from 'dual-exports/feature';
import aliasDefault, { aliasValue } from 'imports-alias';

export const run = () => {
    assert.strictEqual(dualDefault.mode, 'import');
    assert.strictEqual(dualMode, 'import');
    assert.strictEqual(featureMode, 'feature-import');
    assert.strictEqual(aliasDefault.value, 'aliased-dependency');
    assert.strictEqual(aliasValue, 'aliased-dependency');
    return 'PASS: package exports, subpaths, and imports aliases work from installed node_modules';
};
