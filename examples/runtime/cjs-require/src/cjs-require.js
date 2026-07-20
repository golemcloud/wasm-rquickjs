// Tests for CJS require() loader
// This is an ESM file (as all user modules are), but it tests globalThis.require
const require = globalThis.require;
if (typeof require !== 'function') {
    throw new Error('globalThis.require is not installed');
}

export const testRequireBuiltin = () => {
    try {
        const assert = require('assert');
        assert.ok(true);
        assert.strictEqual(1, 1);

        const path = require('path');
        assert.strictEqual(path.basename('/foo/bar.txt'), 'bar.txt');

        const nodeAssert = require('node:assert');
        assert.strictEqual(assert, nodeAssert);

        const fs = require('fs');
        const nodeFs = require('node:fs');
        assert.strictEqual(fs, nodeFs, 'require node:fs identity');
        assert.strictEqual(typeof require('_http_agent').Agent, 'function', 'require _http_agent');
        assert.strictEqual(typeof require('node:_http_agent').Agent, 'function', 'require node:_http_agent');
        assert.strictEqual(typeof require('node:test'), 'function', 'require node:test');
        assert.strictEqual(typeof require('node:sqlite'), 'object', 'require node:sqlite');
        assert.throws(() => require('test'), { code: 'MODULE_NOT_FOUND' }, 'require bare test');
        assert.throws(() => require('sqlite'), { code: 'MODULE_NOT_FOUND' }, 'require bare sqlite');
        assert.throws(() => require('node:unknown'), { code: 'ERR_UNKNOWN_BUILTIN_MODULE' }, 'require node:unknown');

        require.cache.fs = { exports: { marker: 'shadowed' } };
        assert.strictEqual(require('fs').marker, 'shadowed', 'bare builtin cache shadow');
        assert.strictEqual(require('node:fs'), nodeFs, 'node: builtin bypasses cache shadow');
        delete require.cache.fs;

        // require('module') should work
        const mod = require('module');
        assert.ok(mod.createRequire);
        assert.ok(Array.isArray(mod.builtinModules));
        assert.strictEqual(mod.isBuiltin('fs'), true, 'module.isBuiltin fs');
        assert.strictEqual(mod.isBuiltin('node:fs'), true, 'module.isBuiltin node:fs');
        assert.strictEqual(mod.isBuiltin('_http_agent'), true, 'module.isBuiltin _http_agent');
        assert.strictEqual(mod.isBuiltin('node:_http_agent'), true, 'module.isBuiltin node:_http_agent');
        assert.strictEqual(mod.isBuiltin('node:test'), true, 'module.isBuiltin node:test');
        assert.strictEqual(mod.isBuiltin('test'), false, 'module.isBuiltin bare test');
        assert.strictEqual(mod.isBuiltin('node:sqlite'), true, 'module.isBuiltin node:sqlite');
        assert.strictEqual(mod.isBuiltin('sqlite'), false, 'module.isBuiltin bare sqlite');
        assert.strictEqual(require.resolve('fs'), 'fs', 'require.resolve fs');
        assert.strictEqual(require.resolve('node:fs'), 'node:fs', 'require.resolve node:fs');
        assert.strictEqual(require.resolve('_http_agent'), '_http_agent', 'require.resolve _http_agent');
        assert.strictEqual(require.resolve('node:_http_agent'), 'node:_http_agent', 'require.resolve node:_http_agent');
        assert.strictEqual(require.resolve('node:test'), 'node:test', 'require.resolve node:test');
        assert.strictEqual(require.resolve('node:sqlite'), 'node:sqlite', 'require.resolve node:sqlite');
        assert.strictEqual(require.resolve.paths('fs'), null, 'require.resolve.paths fs');
        assert.strictEqual(require.resolve.paths('node:fs'), null, 'require.resolve.paths node:fs');
        assert.strictEqual(require.resolve.paths('_http_agent'), null, 'require.resolve.paths _http_agent');
        assert.strictEqual(require.resolve.paths('node:_http_agent'), null, 'require.resolve.paths node:_http_agent');
        assert.strictEqual(require.resolve.paths('test') === null, false, 'require.resolve.paths bare test');
        assert.strictEqual(require.resolve.paths('sqlite') === null, false, 'require.resolve.paths bare sqlite');

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
                './encoded-target': './sp%20ce.js',
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
        fs.writeFileSync('/exports-app/node_modules/conditional-pkg/sp ce.js', 'module.exports = { encoded: true };');
        fs.writeFileSync('/exports-app/node_modules/conditional-pkg/import-only.mjs', 'export default { mode: "import" };');

        const appRequire = require('module').createRequire('/exports-app/app.js');
        assert.deepStrictEqual(appRequire('conditional-pkg'), { mode: 'cjs' });
        assert.deepStrictEqual(appRequire('conditional-pkg/feature'), { feature: 'cjs' });
        assert.deepStrictEqual(appRequire('conditional-pkg/encoded-target'), { encoded: true });

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
                '#false-target': false,
                '#array-false-fallback': [
                    false,
                    './dep.cjs',
                ],
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
            'exports.invalidBare = function() { return require("#"); };',
            'exports.initialSlash = function() { return require("#/initialslash"); };',
            'exports.importOnly = function() { return require("#import-only"); };',
            'exports.falseTarget = function() { return require("#false-target"); };',
            'exports.arrayFalseFallback = require("#array-false-fallback");',
        ].join('\n'));

        const appRequire = require('module').createRequire('/imports-app/main.cjs');
        const mod = appRequire('./main.cjs');
        assert.deepStrictEqual(mod.dep, { mode: 'require' });
        assert.deepStrictEqual(mod.defaultOnly, { mode: 'default-only' });
        assert.throws(() => mod.missing(), { code: 'ERR_PACKAGE_IMPORT_NOT_DEFINED' });
        assert.throws(() => mod.invalidBare(), { code: 'ERR_INVALID_MODULE_SPECIFIER' });
        assert.throws(() => mod.initialSlash(), { code: 'ERR_INVALID_MODULE_SPECIFIER' });
        assert.throws(() => mod.importOnly(), { code: 'ERR_PACKAGE_IMPORT_NOT_DEFINED' });
        assert.throws(() => mod.falseTarget(), { code: 'ERR_INVALID_PACKAGE_TARGET' });
        assert.deepStrictEqual(mod.arrayFalseFallback, { mode: 'require' });
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
                './encoded-target': './sp%20ce.js',
                './trailing-pattern-slash*': './trailing-pattern-slash*index.js',
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
                './array-false-fallback': [
                    false,
                    './public.js',
                ],
                './array-missing-first': [
                    './missing.js',
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
                './directory': './subdir',
                './no-ext': './real',
            },
        }));
        fs.writeFileSync('/package-map-edge-app/node_modules/exported-pkg/main.js', 'module.exports = { main: true };');
        fs.writeFileSync('/package-map-edge-app/node_modules/exported-pkg/private.js', 'module.exports = { private: true };');
        fs.writeFileSync('/package-map-edge-app/node_modules/exported-pkg/public.js', 'module.exports = { public: true };');
        fs.writeFileSync('/package-map-edge-app/node_modules/exported-pkg/sp ce.js', 'module.exports = { encoded: true };');
        fs.writeFileSync('/package-map-edge-app/node_modules/exported-pkg/default.js', 'module.exports = { defaulted: true };');
        fs.writeFileSync('/package-map-edge-app/node_modules/exported-pkg/real.js', 'module.exports = { extensionFallback: true };');
        fs.mkdirSync('/package-map-edge-app/node_modules/exported-pkg/trailing-pattern-slash', { recursive: true });
        fs.writeFileSync('/package-map-edge-app/node_modules/exported-pkg/trailing-pattern-slash/index.js', 'module.exports = { trailingPattern: true };');
        fs.mkdirSync('/package-map-edge-app/node_modules/exported-pkg/subdir', { recursive: true });
        fs.writeFileSync('/package-map-edge-app/node_modules/exported-pkg/subdir/index.js', 'module.exports = { directory: true };');
        fs.writeFileSync('/package-map-edge-app/node_modules/exports-vs-file.js', 'module.exports = { wrong: true };');
        fs.mkdirSync('/package-map-edge-app/node_modules/exports-vs-file', { recursive: true });
        fs.writeFileSync('/package-map-edge-app/node_modules/exports-vs-file/package.json', JSON.stringify({ exports: './main.js' }));
        fs.writeFileSync('/package-map-edge-app/node_modules/exports-vs-file/main.js', 'module.exports = { exported: true };');
        fs.mkdirSync('/package-map-edge-app/node_modules/native-main', { recursive: true });
        fs.writeFileSync('/package-map-edge-app/node_modules/native-main/package.json', JSON.stringify({ main: 'addon' }));
        fs.writeFileSync('/package-map-edge-app/node_modules/native-main/addon.node', 'not a native addon');
        fs.mkdirSync('/package-map-edge-app/node_modules/native-main/addon', { recursive: true });
        fs.writeFileSync('/package-map-edge-app/node_modules/native-main/addon/index.js', 'module.exports = { wrong: true };');
        fs.mkdirSync('/package-map-edge-app/node_modules/native-subpath', { recursive: true });
        fs.writeFileSync('/package-map-edge-app/node_modules/native-subpath/feature.node', 'not a native addon');
        fs.mkdirSync('/package-map-edge-app/node_modules/native-index/feature', { recursive: true });
        fs.writeFileSync('/package-map-edge-app/node_modules/native-index/feature/index.node', 'not a native addon');
        fs.writeFileSync('/package-map-edge-app/node_modules/native-root.node', 'not a native addon');
        fs.mkdirSync('/package-map-edge-app/node_modules/native-root', { recursive: true });
        fs.writeFileSync('/package-map-edge-app/node_modules/native-root/index.js', 'module.exports = { wrong: true };');
        fs.writeFileSync('/package-map-edge-app/node_modules/dotted-pkg.js', 'module.exports = { dotted: true };');
        fs.mkdirSync('/package-map-edge-app/node_modules/dotted-subpath', { recursive: true });
        fs.writeFileSync('/package-map-edge-app/node_modules/dotted-subpath/foo.bar.js', 'module.exports = { dottedSubpath: true };');
        fs.mkdirSync('/package-map-edge-app/node_modules/dotted-main', { recursive: true });
        fs.writeFileSync('/package-map-edge-app/node_modules/dotted-main/package.json', JSON.stringify({ main: 'foo.bar' }));
        fs.writeFileSync('/package-map-edge-app/node_modules/dotted-main/foo.bar.js', 'module.exports = { dottedMain: true };');
        fs.mkdirSync('/package-map-edge-app/node_modules/mjs-not-implicit', { recursive: true });
        fs.writeFileSync('/package-map-edge-app/node_modules/mjs-not-implicit/feature.mjs', 'export default { wrong: true };');
        fs.writeFileSync('/package-map-edge-app/node_modules/mjs-not-implicit/feature.json', '{"json":true}');

        fs.mkdirSync('/package-map-edge-app/node_modules/#cjs', { recursive: true });
        fs.writeFileSync('/package-map-edge-app/node_modules/#cjs/index.js', 'module.exports = { hashPackage: true };');
        fs.mkdirSync('/package-map-edge-app/node_modules/self-invalid', { recursive: true });
        fs.writeFileSync('/package-map-edge-app/node_modules/self-invalid/package.json', JSON.stringify({
            name: 'self-invalid',
            exports: {
                '.': './index.js',
                './feature': './feature.js',
                bad: './bad.js',
            },
        }));
        fs.writeFileSync('/package-map-edge-app/node_modules/self-invalid/index.js', [
            'exports.loadFeature = function() { return require("self-invalid/feature"); };',
        ].join('\n'));
        fs.writeFileSync('/package-map-edge-app/node_modules/self-invalid/feature.js', 'module.exports = { feature: true };');

        const appRequire = createRequire('/package-map-edge-app/app.js');
        assert.deepStrictEqual(appRequire('exported-pkg/public'), { public: true });
        assert.deepStrictEqual(appRequire('exported-pkg/encoded-target'), { encoded: true });
        const cjsPackageWarnings = [];
        const onCjsPackageWarning = (warning) => cjsPackageWarnings.push(warning);
        process.on('warning', onCjsPackageWarning);
        try {
            assert.deepStrictEqual(appRequire('exported-pkg/trailing-pattern-slash/'), { trailingPattern: true });
            assert.deepStrictEqual(appRequire('exported-pkg/trailing-pattern-slash/'), { trailingPattern: true });
            globalThis.__wasm_rquickjs_drainNextTick();
        } finally {
            process.removeListener('warning', onCjsPackageWarning);
        }
        assert.deepStrictEqual(cjsPackageWarnings.map((warning) => warning.code), ['DEP0155']);
        assert.match(cjsPackageWarnings[0].message, /package at \/package-map-edge-app\/node_modules\/exported-pkg\/package\.json\./);
        assert.doesNotMatch(cjsPackageWarnings[0].message, / imported from /);
        assert.deepStrictEqual(appRequire('exported-pkg/array-blocked'), { public: true });
        assert.deepStrictEqual(appRequire('#cjs'), { hashPackage: true });
        assert.strictEqual(appRequire.resolve('#cjs'), '/package-map-edge-app/node_modules/#cjs/index.js');
        assert.throws(() => appRequire('exported-pkg'), { code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' });
        assert.throws(() => appRequire('exported-pkg/private.js'), { code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' });
        assert.throws(() => appRequire('exported-pkg/missing-selected'), { code: 'MODULE_NOT_FOUND' });
        assert.throws(() => appRequire('exported-pkg/escape'), { code: 'ERR_INVALID_PACKAGE_TARGET' });
        assert.throws(() => appRequire('exported-pkg/nested-escape'), { code: 'ERR_INVALID_PACKAGE_TARGET' });
        assert.throws(() => appRequire('exported-pkg/node-modules-target'), { code: 'ERR_INVALID_PACKAGE_TARGET' });
        assert.throws(() => appRequire('exported-pkg/dot-segment-target'), { code: 'ERR_INVALID_PACKAGE_TARGET' });
        assert.throws(() => appRequire('exported-pkg/encoded-dot-target'), { code: 'ERR_INVALID_PACKAGE_TARGET' });
        assert.throws(() => appRequire('exported-pkg/blocked-null'), { code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' });
        assert.throws(() => appRequire('exported-pkg/blocked-false'), { code: 'ERR_INVALID_PACKAGE_TARGET' });
        assert.deepStrictEqual(appRequire('exported-pkg/array-fallback'), { public: true });
        assert.deepStrictEqual(appRequire('exported-pkg/array-false-fallback'), { public: true });
        assert.deepStrictEqual(appRequire('exported-pkg/array-invalid-fallback'), { public: true });
        assert.deepStrictEqual(appRequire('exported-pkg/condition-no-match-fallback'), { public: true });
        assert.deepStrictEqual(appRequire('exports-vs-file'), { exported: true });
        assert.deepStrictEqual(appRequire('dotted-pkg.js'), { dotted: true });
        assert.deepStrictEqual(appRequire('dotted-subpath/foo.bar'), { dottedSubpath: true });
        assert.deepStrictEqual(appRequire('dotted-main'), { dottedMain: true });
        assert.deepStrictEqual(appRequire('mjs-not-implicit/feature'), { json: true });
        assert.throws(() => appRequire('exported-pkg/array-missing-first'), { code: 'MODULE_NOT_FOUND' });
        assert.throws(() => appRequire('exported-pkg/directory'), { code: 'MODULE_NOT_FOUND' });
        assert.throws(() => appRequire('exported-pkg/no-ext'), { code: 'MODULE_NOT_FOUND' });
        assert.throws(() => appRequire('native-main'), { code: 'ERR_DLOPEN_FAILED' });
        assert.throws(() => appRequire('native-subpath/feature'), { code: 'ERR_DLOPEN_FAILED' });
        assert.throws(() => appRequire('native-index/feature'), { code: 'ERR_DLOPEN_FAILED' });
        assert.throws(() => appRequire('native-root'), { code: 'ERR_DLOPEN_FAILED' });
        assert.throws(() => appRequire('self-invalid').loadFeature(), { code: 'ERR_INVALID_PACKAGE_CONFIG' });

        fs.mkdirSync('/package-map-edge-app/node_modules/external-pkg', { recursive: true });
        fs.writeFileSync('/package-map-edge-app/node_modules/external-pkg/index.js', 'module.exports = { external: true };');
        fs.mkdirSync('/package-map-edge-app/node_modules/dep', { recursive: true });
        fs.writeFileSync('/package-map-edge-app/package.json', JSON.stringify({
            imports: {
                '#app-alias': './app-alias.js',
                '#external': 'external-pkg',
                '#external-exact': 'dep/sub.js',
                '#external-extensionless': 'dep/sub',
                '#external-encoded-slash': 'missing-external/a%2Fb',
                '#external-encoded-backslash': 'missing-external/a%5Cb',
                '#relative-encoded-slash': './a%2Fb.js',
                '#relative-encoded-backslash': './a%5Cb.js',
                '#builtin': 'node:fs',
            },
        }));
        fs.writeFileSync('/package-map-edge-app/app-alias.js', 'module.exports = { appAlias: true };');
        fs.writeFileSync('/package-map-edge-app/node_modules/dep/sub.js', 'module.exports = { exact: true };');
        fs.writeFileSync('/package-map-edge-app/node_modules/dep/index.js', [
            'exports.loadAppAlias = function() { return require("#app-alias"); };',
        ].join('\n'));

        assert.deepStrictEqual(appRequire('#external'), { external: true });
        assert.deepStrictEqual(appRequire('#external-exact'), { exact: true });
        assert.throws(() => appRequire('#external-extensionless'), { code: 'MODULE_NOT_FOUND' });
        assert.throws(() => appRequire('#builtin'), { code: 'ERR_INVALID_PACKAGE_TARGET' });
        assert.throws(() => appRequire('#external-encoded-slash'), { code: 'MODULE_NOT_FOUND' });
        assert.throws(() => appRequire('#external-encoded-backslash'), { code: 'MODULE_NOT_FOUND' });
        assert.throws(() => appRequire('#relative-encoded-slash'), { code: 'ERR_INVALID_MODULE_SPECIFIER' });
        assert.throws(() => appRequire('#relative-encoded-backslash'), { code: 'ERR_INVALID_MODULE_SPECIFIER' });
        const dep = appRequire('dep');
        assert.throws(() => dep.loadAppAlias(), { code: 'MODULE_NOT_FOUND' });

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};
