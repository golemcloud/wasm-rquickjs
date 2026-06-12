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

export const testRequirePackageExports = () => {
    try {
        const assert = require('assert');
        const fs = require('fs');

        fs.mkdirSync('/exports-app/node_modules/conditional-pkg', { recursive: true });
        fs.writeFileSync('/exports-app/node_modules/conditional-pkg/package.json', JSON.stringify({
            exports: {
                '.': {
                    import: './esm.mjs',
                    require: './cjs.cjs',
                    default: './default.js',
                },
                './feature': {
                    require: './feature.cjs',
                    default: './feature-default.js',
                },
                './import-only': {
                    import: './import-only.mjs',
                },
            },
        }));
        fs.writeFileSync('/exports-app/node_modules/conditional-pkg/esm.mjs', 'export default { mode: "esm" };');
        fs.writeFileSync('/exports-app/node_modules/conditional-pkg/cjs.cjs', 'module.exports = { mode: "cjs" };');
        fs.writeFileSync('/exports-app/node_modules/conditional-pkg/default.js', 'module.exports = { mode: "default" };');
        fs.writeFileSync('/exports-app/node_modules/conditional-pkg/feature.cjs', 'module.exports = { feature: "cjs" };');
        fs.writeFileSync('/exports-app/node_modules/conditional-pkg/feature-default.js', 'module.exports = { feature: "default" };');
        fs.writeFileSync('/exports-app/node_modules/conditional-pkg/import-only.mjs', 'export default { mode: "import" };');

        const appRequire = require('module').createRequire('/exports-app/app.js');
        assert.deepStrictEqual(appRequire('conditional-pkg'), { mode: 'cjs' });
        assert.deepStrictEqual(appRequire('conditional-pkg/feature'), { feature: 'cjs' });

        assert.throws(() => appRequire('conditional-pkg/import-only'), {
            code: 'ERR_PACKAGE_PATH_NOT_EXPORTED',
        });
        assert.throws(() => appRequire('conditional-pkg/private'), {
            code: 'ERR_PACKAGE_PATH_NOT_EXPORTED',
        });

        assert.strictEqual(appRequire.resolve('conditional-pkg'), '/exports-app/node_modules/conditional-pkg/cjs.cjs');
        assert.strictEqual(appRequire.resolve('conditional-pkg/feature'), '/exports-app/node_modules/conditional-pkg/feature.cjs');

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const testRequirePackageImports = () => {
    try {
        const assert = require('assert');
        const fs = require('fs');

        fs.mkdirSync('/imports-app', { recursive: true });
        fs.writeFileSync('/imports-app/package.json', JSON.stringify({
            imports: {
                '#dep': {
                    require: './dep.cjs',
                    default: './dep-default.js',
                },
                '#default-only': {
                    default: './default-only.js',
                },
                '#import-only': {
                    import: './import-only.mjs',
                },
            },
        }));
        fs.writeFileSync('/imports-app/dep.cjs', 'module.exports = { mode: "require" };');
        fs.writeFileSync('/imports-app/dep-default.js', 'module.exports = { mode: "default" };');
        fs.writeFileSync('/imports-app/default-only.js', 'module.exports = { mode: "default-only" };');
        fs.writeFileSync('/imports-app/import-only.mjs', 'export default { mode: "import" };');
        fs.writeFileSync('/imports-app/main.cjs', [
            'exports.dep = require("#dep");',
            'exports.defaultOnly = require("#default-only");',
            'exports.missing = function() { return require("#missing"); };',
            'exports.importOnly = function() { return require("#import-only"); };',
        ].join('\n'));

        const appRequire = require('module').createRequire('/imports-app/main.cjs');
        const mod = appRequire('./main.cjs');
        assert.deepStrictEqual(mod.dep, { mode: 'require' });
        assert.deepStrictEqual(mod.defaultOnly, { mode: 'default-only' });
        assert.throws(() => mod.missing(), { code: 'ERR_PACKAGE_IMPORT_NOT_DEFINED' });
        assert.throws(() => mod.importOnly(), { code: 'ERR_PACKAGE_IMPORT_NOT_DEFINED' });
        assert.strictEqual(appRequire.resolve('#dep'), '/imports-app/dep.cjs');

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const testRequirePackageMapEdgeCases = () => {
    try {
        const assert = require('assert');
        const fs = require('fs');
        const { createRequire } = require('module');

        fs.mkdirSync('/package-map-edge-app/node_modules/exported-pkg', { recursive: true });
        fs.writeFileSync('/package-map-edge-app/outside.js', 'module.exports = { escaped: true };');
        fs.writeFileSync('/package-map-edge-app/node_modules/exported-pkg/package.json', JSON.stringify({
            main: './main.js',
            exports: {
                './public': './public.js',
                './missing-selected': {
                    require: './missing.cjs',
                    default: './default.js',
                },
                './escape': './../outside.js',
                './nested-escape': './sub/../../outside.js',
                './node-modules-target': './sub/../node_modules/other/index.js',
                './dot-segment-target': './sub/../public.js',
                './encoded-dot-target': './%2e%2e/outside.js',
                './blocked-null': null,
                './blocked-false': false,
                './array-fallback': [
                    { browser: './browser.js' },
                    './public.js',
                ],
                './array-blocked': [
                    null,
                    './public.js',
                ],
                './array-invalid-fallback': [
                    '../outside.js',
                    './public.js',
                ],
                './condition-no-match-fallback': {
                    node: { browser: './browser.js' },
                    default: './public.js',
                },
                './no-ext': './real',
            },
        }));
        fs.writeFileSync('/package-map-edge-app/node_modules/exported-pkg/main.js', 'module.exports = { main: true };');
        fs.writeFileSync('/package-map-edge-app/node_modules/exported-pkg/private.js', 'module.exports = { private: true };');
        fs.writeFileSync('/package-map-edge-app/node_modules/exported-pkg/public.js', 'module.exports = { public: true };');
        fs.writeFileSync('/package-map-edge-app/node_modules/exported-pkg/default.js', 'module.exports = { defaulted: true };');
        fs.writeFileSync('/package-map-edge-app/node_modules/exported-pkg/real.js', 'module.exports = { extensionFallback: true };');

        const appRequire = createRequire('/package-map-edge-app/app.js');
        assert.deepStrictEqual(appRequire('exported-pkg/public'), { public: true });
        assert.throws(() => appRequire('exported-pkg'), { code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' });
        assert.throws(() => appRequire('exported-pkg/private.js'), { code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' });
        assert.throws(() => appRequire('exported-pkg/missing-selected'), { code: 'MODULE_NOT_FOUND' });
        assert.throws(() => appRequire('exported-pkg/escape'), { code: 'ERR_INVALID_PACKAGE_TARGET' });
        assert.throws(() => appRequire('exported-pkg/nested-escape'), { code: 'ERR_INVALID_PACKAGE_TARGET' });
        assert.throws(() => appRequire('exported-pkg/node-modules-target'), { code: 'ERR_INVALID_PACKAGE_TARGET' });
        assert.throws(() => appRequire('exported-pkg/dot-segment-target'), { code: 'ERR_INVALID_PACKAGE_TARGET' });
        assert.throws(() => appRequire('exported-pkg/encoded-dot-target'), { code: 'ERR_INVALID_PACKAGE_TARGET' });
        assert.throws(() => appRequire('exported-pkg/blocked-null'), { code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' });
        assert.throws(() => appRequire('exported-pkg/blocked-false'), { code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' });
        assert.deepStrictEqual(appRequire('exported-pkg/array-fallback'), { public: true });
        assert.throws(() => appRequire('exported-pkg/array-blocked'), { code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' });
        assert.deepStrictEqual(appRequire('exported-pkg/array-invalid-fallback'), { public: true });
        assert.deepStrictEqual(appRequire('exported-pkg/condition-no-match-fallback'), { public: true });
        assert.throws(() => appRequire('exported-pkg/no-ext'), { code: 'MODULE_NOT_FOUND' });

        fs.mkdirSync('/package-map-edge-app/node_modules/external-pkg', { recursive: true });
        fs.writeFileSync('/package-map-edge-app/node_modules/external-pkg/index.js', 'module.exports = { external: true };');
        fs.mkdirSync('/package-map-edge-app/node_modules/dep', { recursive: true });
        fs.writeFileSync('/package-map-edge-app/package.json', JSON.stringify({
            imports: {
                '#app-alias': './app-alias.js',
                '#external': 'external-pkg',
                '#fs': 'node:fs',
            },
        }));
        fs.writeFileSync('/package-map-edge-app/app-alias.js', 'module.exports = { appAlias: true };');
        fs.writeFileSync('/package-map-edge-app/node_modules/dep/index.js', [
            'exports.loadAppAlias = function() { return require("#app-alias"); };',
        ].join('\n'));

        assert.deepStrictEqual(appRequire('#external'), { external: true });
        assert.strictEqual(typeof appRequire('#fs').readFileSync, 'function');
        const dep = appRequire('dep');
        assert.throws(() => dep.loadAppAlias(), { code: 'ERR_PACKAGE_IMPORT_NOT_DEFINED' });

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};
