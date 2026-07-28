import assert from 'node:assert';
import cjsDefault, { alpha, bracketed } from 'cjs-basic';
import reexported, { alpha as reexportedAlpha, bracketed as reexportedBracketed } from 'cjs-reexport-pkg';

export const run = () => {
    assert.strictEqual(cjsDefault.alpha, 'alpha');
    assert.strictEqual(alpha, 'alpha');
    assert.strictEqual(bracketed, 'bracketed');
    assert.strictEqual(reexported.alpha, 'alpha');
    assert.strictEqual(reexportedAlpha, 'alpha');
    assert.strictEqual(reexportedBracketed, 'bracketed');
    return 'PASS: ESM imports named/default exports from installed CJS packages';
};
