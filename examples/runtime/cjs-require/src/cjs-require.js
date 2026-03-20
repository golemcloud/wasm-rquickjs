// Tests for CJS require() loader
// This is an ESM file (as all user modules are), but it tests globalThis.require

export const testRequireBuiltin = () => {
    try {
        const assert = require('assert');
        assert.ok(true);
        assert.strictEqual(1, 1);

        const path = require('path');
        assert.strictEqual(path.basename('/foo/bar.txt'), 'bar.txt');

        const nodeAssert = require('node:assert');
        assert.strictEqual(assert, nodeAssert);

        // require('module') should work
        const mod = require('module');
        assert.ok(mod.createRequire);
        assert.ok(Array.isArray(mod.builtinModules));

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const testRequireRelative = () => {
    try {
        const assert = require('assert');
        const fs = require('fs');

        fs.writeFileSync('/test-cjs-module.js', 'module.exports = { value: 42 };');
        const mod = require('/test-cjs-module.js');
        assert.strictEqual(mod.value, 42);

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const testRequireDirectory = () => {
    try {
        const assert = require('assert');
        const fs = require('fs');

        fs.mkdirSync('/mylib');
        fs.writeFileSync('/mylib/index.js', 'module.exports = { name: "mylib" };');
        const mylib = require('/mylib');
        assert.strictEqual(mylib.name, 'mylib');

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const testRequireCircular = () => {
    try {
        const assert = require('assert');
        const fs = require('fs');

        fs.writeFileSync('/circ-a.js', [
            "module.exports.loaded = false;",
            "const b = require('/circ-b.js');",
            "module.exports.loaded = true;",
            "module.exports.bValue = b.value;",
        ].join('\n'));
        fs.writeFileSync('/circ-b.js', [
            "const a = require('/circ-a.js');",
            "module.exports.value = 'from-b';",
            "module.exports.aLoadedDuringBInit = a.loaded;",
        ].join('\n'));

        const a = require('/circ-a.js');
        assert.strictEqual(a.loaded, true);
        assert.strictEqual(a.bValue, 'from-b');

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const testRequireCache = () => {
    try {
        const assert = require('assert');
        const fs = require('fs');

        fs.writeFileSync('/counter.js', [
            "var count = 0;",
            "module.exports.increment = function() { return ++count; };",
        ].join('\n'));

        const c1 = require('/counter.js');
        const c2 = require('/counter.js');
        assert.strictEqual(c1, c2);
        assert.strictEqual(c1.increment(), 1);
        assert.strictEqual(c2.increment(), 2);

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const testCreateRequire = () => {
    try {
        const assert = require('assert');
        const fs = require('fs');
        const { createRequire } = require('module');

        fs.mkdirSync('/app');
        fs.writeFileSync('/app/helper.js', 'module.exports = "hello from helper";');

        const appRequire = createRequire('/app/main.js');
        const helper = appRequire('./helper');
        assert.strictEqual(helper, 'hello from helper');

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const testRequireJson = () => {
    try {
        const assert = require('assert');
        const fs = require('fs');

        fs.writeFileSync('/data.json', '{"key": "value", "num": 123}');
        const data = require('/data.json');
        assert.strictEqual(data.key, 'value');
        assert.strictEqual(data.num, 123);

        // Also test auto-extension resolution
        fs.writeFileSync('/config.json', '{"debug": true}');
        const config = require('/config');
        assert.strictEqual(config.debug, true);

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const testRequireModuleExportsFunction = () => {
    try {
        const assert = require('assert');
        const fs = require('fs');

        fs.writeFileSync('/fn-module.js', 'module.exports = function(x) { return x * 2; };');
        const double = require('/fn-module.js');
        assert.strictEqual(typeof double, 'function');
        assert.strictEqual(double(21), 42);

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const testRequireModuleNotFound = () => {
    try {
        const assert = require('assert');

        var caught = false;
        try {
            require('/nonexistent-module');
        } catch (e) {
            caught = true;
            assert.strictEqual(e.code, 'MODULE_NOT_FOUND');
            assert.ok(e.message.includes('nonexistent-module'));
        }
        if (!caught) throw new Error('Should have thrown MODULE_NOT_FOUND');

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};
