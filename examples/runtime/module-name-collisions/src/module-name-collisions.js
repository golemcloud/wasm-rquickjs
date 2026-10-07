import assert from 'node:assert/strict';
import applicationCrypto, { marker as applicationMarker } from 'crypto';
import * as nodeCrypto from 'node:crypto';
import { createRequire } from 'node:module';

export const testModuleNameCollisions = () => {
    assert.strictEqual(applicationCrypto, 'application crypto module');
    assert.strictEqual(applicationMarker, 'application crypto module');
    const require = createRequire(import.meta.url);
    const requiredNodeCrypto = require('node:crypto');
    assert.strictEqual(require('crypto'), requiredNodeCrypto);
    assert.strictEqual(nodeCrypto.default, requiredNodeCrypto);
    assert.strictEqual(
        nodeCrypto.createHash('sha256').update('private builtin imports').digest('hex').length,
        64,
    );
    return true;
};
