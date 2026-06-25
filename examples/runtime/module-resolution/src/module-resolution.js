import assert from 'node:assert';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

async function expectImportError(specifier, code) {
    let thrown = false;
    try {
        await import(specifier);
    } catch (error) {
        thrown = true;
        assert.strictEqual(error && error.code, code, error && error.stack ? error.stack : String(error));
    }
    if (!thrown) {
        throw new Error(`Expected import(${specifier}) to throw ${code}`);
    }
}

async function expectImportRejectsMessage(specifier, pattern) {
    let thrown = false;
    try {
        await import(specifier);
    } catch (error) {
        thrown = true;
        assert.match(String(error && error.message), pattern, error && error.stack ? `${error.message}\n${error.stack}` : String(error));
    }
    if (!thrown) {
        throw new Error(`Expected import(${specifier}) to reject`);
    }
}

async function expectImportRejectsCode(specifier, code) {
    let thrown = false;
    try {
        await import(specifier);
    } catch (error) {
        thrown = true;
        assert.strictEqual(error && error.code, code, error && error.stack ? error.stack : String(error));
    }
    if (!thrown) {
        throw new Error(`Expected import(${specifier}) to reject with ${code}`);
    }
}

function writeImportEntry(path, specifier) {
    fs.writeFileSync(path, `export default await import(${JSON.stringify(specifier)});`);
}

export const testEsmPackageMapEdgeCases = async () => {
    try {
        fs.mkdirSync('/esm-package-map-edge-app/node_modules/exported-pkg', { recursive: true });
        fs.writeFileSync('/esm-package-map-edge-app/outside.mjs', 'export default { escaped: true };');
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/exported-pkg/package.json', JSON.stringify({
            type: 'module',
            main: './main.mjs',
            exports: {
                './public': './public.mjs',
                './condition-order': {
                    default: './default.mjs',
                    import: './import.mjs',
                },
                './escape': './../outside.mjs',
                './nested-escape': './sub/../../outside.mjs',
                './node-modules-target': './sub/../node_modules/other/index.mjs',
                './dot-segment-target': './sub/../public.mjs',
                './encoded-dot-target': './%2e%2e/outside.mjs',
                './blocked-null': null,
                './blocked-false': false,
                './array-fallback': [
                    { browser: './browser.mjs' },
                    './public.mjs',
                ],
                './array-blocked': [
                    null,
                    './public.mjs',
                ],
                './array-invalid-fallback': [
                    '../outside.mjs',
                    './public.mjs',
                ],
                './condition-no-match-fallback': {
                    node: { browser: './browser.mjs' },
                    default: './public.mjs',
                },
                './no-ext': './real',
            },
        }));
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/exported-pkg/main.mjs', 'export default { main: true };');
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/exported-pkg/private.mjs', 'export default { private: true };');
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/exported-pkg/public.mjs', 'export default { public: true };');
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/exported-pkg/default.mjs', 'export default { condition: "default" };');
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/exported-pkg/import.mjs', 'export default { condition: "import" };');
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/exported-pkg/real.mjs', 'export default { extensionFallback: true };');

        fs.writeFileSync('/esm-package-map-edge-app/entry.mjs', [
            'export const publicValue = (await import("exported-pkg/public")).default;',
            'export const conditionOrder = (await import("exported-pkg/condition-order")).default;',
            'export const arrayFallback = (await import("exported-pkg/array-fallback")).default;',
            'export const arrayInvalidFallback = (await import("exported-pkg/array-invalid-fallback")).default;',
            'export const conditionNoMatchFallback = (await import("exported-pkg/condition-no-match-fallback")).default;',
        ].join('\n'));

        const entry = await import('/esm-package-map-edge-app/entry.mjs');
        assert.deepStrictEqual(entry.publicValue, { public: true });
        assert.deepStrictEqual(entry.conditionOrder, { condition: 'default' });
        assert.deepStrictEqual(entry.arrayFallback, { public: true });
        assert.deepStrictEqual(entry.arrayInvalidFallback, { public: true });
        assert.deepStrictEqual(entry.conditionNoMatchFallback, { public: true });

        writeImportEntry('/esm-package-map-edge-app/missing-root.mjs', 'exported-pkg');
        writeImportEntry('/esm-package-map-edge-app/private-subpath.mjs', 'exported-pkg/private.mjs');
        writeImportEntry('/esm-package-map-edge-app/escape-subpath.mjs', 'exported-pkg/escape');
        writeImportEntry('/esm-package-map-edge-app/nested-escape-subpath.mjs', 'exported-pkg/nested-escape');
        writeImportEntry('/esm-package-map-edge-app/node-modules-target-subpath.mjs', 'exported-pkg/node-modules-target');
        writeImportEntry('/esm-package-map-edge-app/dot-segment-target-subpath.mjs', 'exported-pkg/dot-segment-target');
        writeImportEntry('/esm-package-map-edge-app/encoded-dot-target-subpath.mjs', 'exported-pkg/encoded-dot-target');
        writeImportEntry('/esm-package-map-edge-app/blocked-null-subpath.mjs', 'exported-pkg/blocked-null');
        writeImportEntry('/esm-package-map-edge-app/blocked-false-subpath.mjs', 'exported-pkg/blocked-false');
        writeImportEntry('/esm-package-map-edge-app/array-blocked-subpath.mjs', 'exported-pkg/array-blocked');
        writeImportEntry('/esm-package-map-edge-app/no-ext-subpath.mjs', 'exported-pkg/no-ext');

        await expectImportError('/esm-package-map-edge-app/missing-root.mjs', 'ERR_PACKAGE_PATH_NOT_EXPORTED');
        await expectImportError('/esm-package-map-edge-app/private-subpath.mjs', 'ERR_PACKAGE_PATH_NOT_EXPORTED');
        await expectImportError('/esm-package-map-edge-app/escape-subpath.mjs', 'ERR_INVALID_PACKAGE_TARGET');
        await expectImportError('/esm-package-map-edge-app/nested-escape-subpath.mjs', 'ERR_INVALID_PACKAGE_TARGET');
        await expectImportError('/esm-package-map-edge-app/node-modules-target-subpath.mjs', 'ERR_INVALID_PACKAGE_TARGET');
        await expectImportError('/esm-package-map-edge-app/dot-segment-target-subpath.mjs', 'ERR_INVALID_PACKAGE_TARGET');
        await expectImportError('/esm-package-map-edge-app/encoded-dot-target-subpath.mjs', 'ERR_INVALID_PACKAGE_TARGET');
        await expectImportError('/esm-package-map-edge-app/blocked-null-subpath.mjs', 'ERR_PACKAGE_PATH_NOT_EXPORTED');
        await expectImportError('/esm-package-map-edge-app/blocked-false-subpath.mjs', 'ERR_PACKAGE_PATH_NOT_EXPORTED');
        await expectImportError('/esm-package-map-edge-app/array-blocked-subpath.mjs', 'ERR_PACKAGE_PATH_NOT_EXPORTED');
        await expectImportError('/esm-package-map-edge-app/no-ext-subpath.mjs', 'ERR_MODULE_NOT_FOUND');

        fs.mkdirSync('/esm-package-map-edge-app/node_modules/external-pkg', { recursive: true });
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/external-pkg/package.json', JSON.stringify({
            type: 'module',
            exports: './index.mjs',
        }));
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/external-pkg/index.mjs', 'export default { external: true };');
        fs.mkdirSync('/esm-package-map-edge-app/node_modules/dep', { recursive: true });
        fs.writeFileSync('/esm-package-map-edge-app/package.json', JSON.stringify({
            imports: {
                '#app-alias': './app-alias.mjs',
                '#external': 'external-pkg',
                '#fs': 'node:fs',
            },
        }));
        fs.writeFileSync('/esm-package-map-edge-app/app-alias.mjs', 'export default { appAlias: true };');
        fs.writeFileSync('/esm-package-map-edge-app/imports-entry.mjs', [
            'import external from "#external";',
            'import fs from "#fs";',
            'export default external;',
            'export const readFileSyncType = typeof fs.readFileSync;',
        ].join('\n'));
        fs.writeFileSync('/esm-package-map-edge-app/node_modules/dep/index.mjs', [
            'import appAlias from "#app-alias";',
            'export default appAlias;',
        ].join('\n'));
        fs.writeFileSync('/esm-package-map-edge-app/imports-boundary-entry.mjs', 'export default await import("dep");');

        const importsEntry = await import('/esm-package-map-edge-app/imports-entry.mjs');
        assert.deepStrictEqual(importsEntry.default, { external: true });
        assert.strictEqual(importsEntry.readFileSyncType, 'function');
        await expectImportError('/esm-package-map-edge-app/imports-boundary-entry.mjs', 'ERR_PACKAGE_IMPORT_NOT_DEFINED');

        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const testEsmEncodedRelativePaths = async () => {
    try {
        fs.mkdirSync('/esm-encoded-relative-app/sub', { recursive: true });
        fs.writeFileSync('/esm-encoded-relative-app/sub/test-esm-ok.mjs', 'export default "ok";');
        fs.writeFileSync('/esm-encoded-relative-app/sub/test-esm-comma,.mjs', 'export default "comma";');
        fs.writeFileSync('/esm-encoded-relative-app/sub/test-esm-double-encoding-native%20.mjs', 'export default "percent";');
        fs.writeFileSync('/esm-encoded-relative-app/sub/blocked.mjs', 'export default "blocked";');
        fs.writeFileSync('/esm-encoded-relative-app/entry.mjs', [
            'import ok from "./sub/test-%65%73%6d-ok.mjs";',
            'import comma from "./sub/test-esm-comma%2c.mjs";',
            'import percent from "./sub/test-esm-double-encoding-native%2520.mjs";',
            'export default { ok, comma, percent };',
        ].join('\n'));

        assert.deepStrictEqual((await import('/esm-encoded-relative-app/entry.mjs')).default, {
            ok: 'ok',
            comma: 'comma',
            percent: 'percent',
        });
        await expectImportRejectsCode('/esm-encoded-relative-app/sub%2Fblocked.mjs', 'ERR_INVALID_MODULE_SPECIFIER');
        await expectImportRejectsCode('/esm-encoded-relative-app/sub%5Cblocked.mjs', 'ERR_INVALID_MODULE_SPECIFIER');
        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const testCjsDirectNamedExports = async () => {
    try {
        fs.mkdirSync('/cjs-named-export-app', { recursive: true });
        fs.writeFileSync('/cjs-named-export-app/direct.cjs', [
            'exports.foo = "foo";',
            'module.exports.bar = "bar";',
            'exports["baz"] = "baz";',
            'module.exports["π"] = "pi";',
            'exports["invalid identifier"] = "invalid";',
            'module.exports["?invalid"] = "question";',
            'exports.package = "reserved";',
            '// exports.commentOnly = "no";',
            '/* module.exports.blockCommentOnly = "no"; */',
            'const text = "exports.stringOnly = no";',
        ].join('\n'));
        fs.writeFileSync('/cjs-named-export-app/bracket-only.js', [
            'exports["bracketOnly"] = "bracket";',
        ].join('\n'));
        fs.writeFileSync('/cjs-named-export-app/define-only.js', [
            'Object.defineProperty(exports, "definedOnly", { value: "defined" });',
        ].join('\n'));
        fs.writeFileSync('/cjs-named-export-app/false-positives.cjs', [
            'const myexports = {};',
            'myexports.fake1 = "no";',
            'const obj = { exports: {} };',
            'obj.exports.fake2 = "no";',
            'const notmodule = {};',
            'notmodule.exports = {};',
            'notmodule.exports.fake3 = "no";',
            'if (exports.fake4 === "no") {}',
            'if (module.exports.fake5 == "no") {}',
            'const re = /exports.fake6 = "no"/;',
            'exports.real = "yes";',
        ].join('\n'));
        fs.writeFileSync('/cjs-named-export-app/direct-entry.mjs', [
            'import def, { foo, bar, baz, π, package as packageExport } from "./direct.cjs";',
            'import { bracketOnly } from "./bracket-only.js";',
            'import { definedOnly } from "./define-only.js";',
            'import * as ns from "./direct.cjs";',
            'import * as fp from "./false-positives.cjs";',
            'export default {',
            '  def, foo, bar, baz, pi: π, packageExport, bracketOnly, definedOnly,',
            '  invalidIdentifier: ns["invalid identifier"],',
            '  questionInvalid: ns["?invalid"],',
            '  hasCommentOnly: Object.prototype.hasOwnProperty.call(ns, "commentOnly"),',
            '  hasBlockCommentOnly: Object.prototype.hasOwnProperty.call(ns, "blockCommentOnly"),',
            '  hasStringOnly: Object.prototype.hasOwnProperty.call(ns, "stringOnly"),',
            '  falsePositiveKeys: Object.keys(fp).filter((key) => key !== "default" && key !== "real"),',
            '  real: fp.real,',
            '};',
        ].join('\n'));

        const result = (await import('/cjs-named-export-app/direct-entry.mjs')).default;
        assert.strictEqual(result.foo, 'foo');
        assert.strictEqual(result.bar, 'bar');
        assert.strictEqual(result.baz, 'baz');
        assert.strictEqual(result.pi, 'pi');
        assert.strictEqual(result.packageExport, 'reserved');
        assert.strictEqual(result.bracketOnly, 'bracket');
        assert.strictEqual(result.definedOnly, 'defined');
        assert.strictEqual(result.invalidIdentifier, 'invalid');
        assert.strictEqual(result.questionInvalid, 'question');
        assert.strictEqual(result.def.foo, 'foo');
        assert.strictEqual(result.def['π'], 'pi');
        assert.deepStrictEqual(result.falsePositiveKeys, []);
        assert.strictEqual(result.real, 'yes');
        assert.strictEqual(result.hasCommentOnly, false);
        assert.strictEqual(result.hasBlockCommentOnly, false);
        assert.strictEqual(result.hasStringOnly, false);
        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const testCjsDefinePropertyNamedExports = async () => {
    try {
        fs.mkdirSync('/cjs-define-export-app', { recursive: true });
        fs.writeFileSync('/cjs-define-export-app/define.cjs', [
            'const dep = { value: "getter-value" };',
            'Object.defineProperty(exports, "valueExport", { value: "value" });',
            'Object.defineProperty(exports, "getterExport", { enumerable: true, get: function () { return dep.value; } });',
            'Object.defineProperty(module.exports, "moduleGetter", { enumerable: true, get() { return dep.value; } });',
            'Object.defineProperty(exports, "unsafe", { enumerable: true, get() { return dynamic(); } });',
            'Object.defineProperty(exports, "unsafeValueWord", { enumerable: true, get() { return value(); } });',
        ].join('\n'));
        fs.writeFileSync('/cjs-define-export-app/define-entry.mjs', [
            'import { valueExport, getterExport, moduleGetter } from "./define.cjs";',
            'import * as ns from "./define.cjs";',
            'export default {',
            '  valueExport, getterExport, moduleGetter,',
            '  hasUnsafe: Object.prototype.hasOwnProperty.call(ns, "unsafe"),',
            '  hasUnsafeValueWord: Object.prototype.hasOwnProperty.call(ns, "unsafeValueWord"),',
            '};',
        ].join('\n'));

        const result = (await import('/cjs-define-export-app/define-entry.mjs')).default;
        assert.strictEqual(result.valueExport, 'value');
        assert.strictEqual(result.getterExport, 'getter-value');
        assert.strictEqual(result.moduleGetter, 'getter-value');
        assert.strictEqual(result.hasUnsafe, false);
        assert.strictEqual(result.hasUnsafeValueWord, false);
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
};

export const testCjsReexportNamedExports = async () => {
    try {
        fs.mkdirSync('/cjs-reexport-app', { recursive: true });
        fs.writeFileSync('/cjs-reexport-app/dep.cjs', [
            'exports.alpha = "alpha";',
            'exports.beta = "beta";',
        ].join('\n'));
        fs.writeFileSync('/cjs-reexport-app/reexport.cjs', 'module.exports = require("./dep.cjs");');
        fs.writeFileSync('/cjs-reexport-app/transpiler.cjs', [
            'var _dep = require("./dep.cjs");',
            'Object.keys(_dep).forEach(function (key) {',
            '  if (key === "default" || key === "__esModule") return;',
            '  Object.defineProperty(exports, key, {',
            '    enumerable: true,',
            '    get: function () { return _dep[key]; }',
            '  });',
            '});',
        ].join('\n'));
        fs.writeFileSync('/cjs-reexport-app/not-reexport.cjs', [
            'var _dep = require("./dep.cjs");',
            'Object.keys(_dep).forEach(console.log);',
            'exports.own = "own";',
        ].join('\n'));
        fs.writeFileSync('/cjs-reexport-app/reexport-entry.mjs', [
            'import { alpha, beta } from "./reexport.cjs";',
            'import { alpha as transAlpha, beta as transBeta } from "./transpiler.cjs";',
            'import * as nonReexport from "./not-reexport.cjs";',
            'export default {',
            '  alpha, beta, transAlpha, transBeta,',
            '  nonReexportKeys: Object.keys(nonReexport).filter((key) => key !== "default" && key !== "own"),',
            '  nonReexportOwn: nonReexport.own,',
            '};',
        ].join('\n'));

        const result = (await import('/cjs-reexport-app/reexport-entry.mjs')).default;
        assert.deepStrictEqual(result, {
            alpha: 'alpha',
            beta: 'beta',
            transAlpha: 'alpha',
            transBeta: 'beta',
            nonReexportKeys: [],
            nonReexportOwn: 'own',
        });
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
};

export const testCjsAnalyzerFalsePositiveGuards = async () => {
    try {
        fs.mkdirSync('/cjs-analyzer-guards-app', { recursive: true });
        fs.writeFileSync('/cjs-analyzer-guards-app/esm-with-cjs-text.js', [
            '// exports.commentOnly = "no";',
            'const text = "module.exports = {}; require(";',
            'const re = /exports.regexOnly = "no"/;',
            'const fn = () => /module.exports.arrowRegexOnly = "no"/;',
            'if (typeof module !== "undefined" && module.exports === undefined) {}',
            'const require = () => ({ value: 64 });',
            'const dep = require("./dep.cjs");',
            'export const value = 42;',
            'export const requireValue = dep.value;',
        ].join('\n'));
        fs.writeFileSync('/cjs-analyzer-guards-app/esm-entry.mjs', [
            'import { value, requireValue } from "./esm-with-cjs-text.js";',
            'export default { value, requireValue };',
        ].join('\n'));
        assert.deepStrictEqual((await import('/cjs-analyzer-guards-app/esm-entry.mjs')).default, { value: 42, requireValue: 64 });

        fs.writeFileSync('/cjs-analyzer-guards-app/whitespace-module.js', 'module /*x*/ . /*y*/ exports = { value: "module" };');
        fs.writeFileSync('/cjs-analyzer-guards-app/whitespace-entry.mjs', [
            'import mod from "./whitespace-module.js";',
            'export default mod.value;',
        ].join('\n'));
        assert.strictEqual((await import('/cjs-analyzer-guards-app/whitespace-entry.mjs')).default, 'module');

        fs.writeFileSync('/cjs-analyzer-guards-app/false-positives.cjs', [
            'const myexports = {};',
            'myexports.fake1 = "no";',
            'const obj = { exports: {} };',
            'obj.exports.fake2 = "no";',
            'const notmodule = {};',
            'notmodule.exports = {};',
            'notmodule.exports.fake3 = "no";',
            'if (exports.fake4 === "no") {}',
            'if (module.exports.fake5 == "no") {}',
            'function f() { return /exports.fake6 = "no"/; }',
            'const g = () => /module.exports.fake7 = "no"/;',
            'exports.real = "yes";',
        ].join('\n'));
        fs.writeFileSync('/cjs-analyzer-guards-app/unsafe-define.cjs', [
            'Object.defineProperty(exports, "unsafeStringReturn", { enumerable: true, get() { const s = "return dep.value"; return dynamic(); } });',
            'Object.defineProperty(exports, "unsafeRegexValue", { enumerable: true, get() { return /value:/; } });',
            'Object.defineProperty(exports, "unsafeRegexDescriptor", { enumerable: /value:/ });',
            'Object.defineProperty(exports, "unsafeNestedValue", { enumerable: true, get() { return { value: dynamic() }; } });',
            'Object.defineProperty(exports, "unsafeMultipleReturn", { enumerable: true, get() { return dep.value; return dynamic(); } });',
            'Object.defineProperty(exports, "unsafeConditionalReturn", { enumerable: true, get() { if (dep) return dep.value; return dynamic(); } });',
            'exports.safe = "yes";',
        ].join('\n'));
        fs.writeFileSync('/cjs-analyzer-guards-app/dep.cjs', 'exports.alpha = "alpha";');
        fs.writeFileSync('/cjs-analyzer-guards-app/dep-nested.cjs', 'exports.nested = { beta: "beta" };');
        fs.writeFileSync('/cjs-analyzer-guards-app/not-reexport.cjs', [
            'var _dep = require("./dep.cjs");',
            'var other = {};',
            'Object.keys(_dep).forEach(function (key) {',
            '  const msg = "Object.defineProperty(exports, key, { get: function () { return _dep[key]; } })";',
            '});',
            'Object.keys(_dep).forEach(function (key) {',
            '  Object.defineProperty(other, key, { value: 1 });',
            '  exports;',
            '  function unrelated() { return _dep[key]; }',
            '});',
            'exports.own = "own";',
        ].join('\n'));
        fs.writeFileSync('/cjs-analyzer-guards-app/unicode-reexport.cjs', [
            'var _dep = require("./dep.cjs");',
            'Object.keys(_dep).forEach(function (key) {',
            '  const π = 1;',
            '  Object.defineProperty(exports, key, { enumerable: true, get: function () { return _dep[key]; } });',
            '});',
        ].join('\n'));
        fs.writeFileSync('/cjs-analyzer-guards-app/continuation.cjs', [
            'module.exports = require("./dep.cjs").nested;',
        ].join('\n'));
        fs.writeFileSync('/cjs-analyzer-guards-app/binding-continuation.cjs', [
            'var dep = require("./dep-nested.cjs").nested;',
            'Object.keys(dep).forEach(function (key) {',
            '  Object.defineProperty(exports, key, { enumerable: true, get: function () { return dep[key]; } });',
            '});',
            'exports.own = "own";',
        ].join('\n'));
        fs.writeFileSync('/cjs-analyzer-guards-app/guards-entry.mjs', [
            'import * as fp from "./false-positives.cjs";',
            'import * as unsafe from "./unsafe-define.cjs";',
            'import * as nonReexport from "./not-reexport.cjs";',
            'import * as unicodeReexport from "./unicode-reexport.cjs";',
            'import * as continuation from "./continuation.cjs";',
            'import * as bindingContinuation from "./binding-continuation.cjs";',
            'export default {',
            '  fpKeys: Object.keys(fp).filter((key) => key !== "default" && key !== "real"),',
            '  real: fp.real,',
            '  unsafeKeys: Object.keys(unsafe).filter((key) => key !== "default" && key !== "safe"),',
            '  safe: unsafe.safe,',
            '  nonReexportKeys: Object.keys(nonReexport).filter((key) => key !== "default" && key !== "own"),',
            '  own: nonReexport.own,',
            '  unicodeAlpha: unicodeReexport.alpha,',
            '  continuationKeys: Object.keys(continuation).filter((key) => key !== "default"),',
            '  bindingContinuationKeys: Object.keys(bindingContinuation).filter((key) => key !== "default" && key !== "own"),',
            '  bindingContinuationOwn: bindingContinuation.own,',
            '};',
        ].join('\n'));

        const result = (await import('/cjs-analyzer-guards-app/guards-entry.mjs')).default;
        assert.deepStrictEqual(result.fpKeys, []);
        assert.strictEqual(result.real, 'yes');
        assert.deepStrictEqual(result.unsafeKeys, []);
        assert.strictEqual(result.safe, 'yes');
        assert.deepStrictEqual(result.nonReexportKeys, []);
        assert.strictEqual(result.own, 'own');
        assert.strictEqual(result.unicodeAlpha, 'alpha');
        assert.deepStrictEqual(result.continuationKeys, []);
        assert.deepStrictEqual(result.bindingContinuationKeys, []);
        assert.strictEqual(result.bindingContinuationOwn, 'own');
        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const testCjsSharedLoaderIdentity = async () => {
    try {
        fs.mkdirSync('/cjs-shared-loader-app', { recursive: true });
        fs.writeFileSync('/cjs-shared-loader-app/shared.cjs', [
            'globalThis.__sharedLoaderCount = (globalThis.__sharedLoaderCount || 0) + 1;',
            'exports.count = globalThis.__sharedLoaderCount;',
            'exports.marker = "shared";',
        ].join('\n'));
        fs.writeFileSync('/cjs-shared-loader-app/named.cjs', [
            'globalThis.__sharedNamedCount = (globalThis.__sharedNamedCount || 0) + 1;',
            'exports.alpha = "alpha";',
            'module.exports.beta = "beta";',
            'exports.count = globalThis.__sharedNamedCount;',
        ].join('\n'));
        fs.writeFileSync('/cjs-shared-loader-app/esm-first.mjs', [
            'import { createRequire } from "node:module";',
            'import shared from "./shared.cjs";',
            'const require = createRequire(import.meta.url);',
            'const required = require("./shared.cjs");',
            'required.fromRequire = "mutated";',
            'const resolved = require.resolve("./shared.cjs");',
            'export default {',
            '  same: shared === required,',
            '  count: globalThis.__sharedLoaderCount,',
            '  sharedFromRequire: shared.fromRequire,',
            '  cacheExportsSame: require.cache[resolved].exports === shared,',
            '};',
        ].join('\n'));
        fs.writeFileSync('/cjs-shared-loader-app/cjs-first.cjs', [
            'exports.run = async function () {',
            '  const required = require("./shared.cjs");',
            '  required.fromCjsFirst = "yes";',
            '  const imported = await import("./shared.cjs");',
            '  const resolved = require.resolve("./shared.cjs");',
            '  return {',
            '    same: imported.default === required,',
            '    count: globalThis.__sharedLoaderCount,',
            '    importedMutation: imported.default.fromCjsFirst,',
            '    cacheExportsSame: require.cache[resolved].exports === imported.default,',
            '  };',
            '};',
        ].join('\n'));
        fs.writeFileSync('/cjs-shared-loader-app/named-entry.mjs', [
            'import { createRequire } from "node:module";',
            'import namedDefault, { alpha, beta, count } from "./named.cjs";',
            'const require = createRequire(import.meta.url);',
            'const required = require("./named.cjs");',
            'export default {',
            '  same: namedDefault === required,',
            '  alpha, beta, count,',
            '  loadCount: globalThis.__sharedNamedCount,',
            '};',
        ].join('\n'));
        fs.mkdirSync('/cjs-shared-loader-app/type-module/node_modules/dep-without-package-json', { recursive: true });
        fs.writeFileSync('/cjs-shared-loader-app/type-module/package.json', JSON.stringify({ type: 'module' }));
        fs.writeFileSync('/cjs-shared-loader-app/type-module/index.js', [
            'import dep from "dep-without-package-json/dep.js";',
            'export default { esm: true, dep };',
        ].join('\n'));
        fs.writeFileSync('/cjs-shared-loader-app/type-module/node_modules/dep-without-package-json/dep.js', [
            'globalThis.__sharedBoundaryCount = (globalThis.__sharedBoundaryCount || 0) + 1;',
            'module.exports = { cjs: true, count: globalThis.__sharedBoundaryCount };',
        ].join('\n'));
        fs.writeFileSync('/cjs-shared-loader-app/handled.js', 'exports.source = "source";');

        globalThis.__sharedLoaderCount = 0;
        globalThis.__sharedNamedCount = 0;
        globalThis.__sharedBoundaryCount = 0;

        const esmFirst = (await import('/cjs-shared-loader-app/esm-first.mjs')).default;
        assert.deepStrictEqual(esmFirst, {
            same: true,
            count: 1,
            sharedFromRequire: 'mutated',
            cacheExportsSame: true,
        });

        const cjsFirst = await (await import('/cjs-shared-loader-app/cjs-first.cjs')).default.run();
        assert.deepStrictEqual(cjsFirst, {
            same: true,
            count: 1,
            importedMutation: 'yes',
            cacheExportsSame: true,
        });

        const named = (await import('/cjs-shared-loader-app/named-entry.mjs')).default;
        assert.deepStrictEqual(named, {
            same: true,
            alpha: 'alpha',
            beta: 'beta',
            count: 1,
            loadCount: 1,
        });

        const { createRequire } = await import('node:module');
        const require = createRequire('/cjs-shared-loader-app/main.cjs');
        const originalJsHandler = require.extensions['.js'];
        try {
            require.extensions['.js'] = (module) => {
                module.exports = { fromExtension: true };
            };
            const handled = (await import('/cjs-shared-loader-app/handled.js')).default;
            assert.deepStrictEqual(handled, { fromExtension: true });
            assert.strictEqual(require('/cjs-shared-loader-app/handled.js'), handled);
        } finally {
            require.extensions['.js'] = originalJsHandler;
        }

        const boundary = (await import('/cjs-shared-loader-app/type-module/index.js')).default;
        assert.deepStrictEqual(boundary, {
            esm: true,
            dep: { cjs: true, count: 1 },
        });

        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const testModuleSyntaxDetectionAndDiagnostics = async () => {
    try {
        fs.mkdirSync('/module-syntax-app/package-without-type', { recursive: true });
        fs.writeFileSync('/module-syntax-app/loose.js', [
            'export default "loose-module";',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/static-source.mjs', [
            'export const named = "named";',
            'export default "source-default";',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/static-import-side-effect.js', [
            'import "./static-source.mjs";',
            'export default "side-effect-import";',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/static-import-default.js', [
            'import value from "./static-source.mjs";',
            'export default value;',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/static-import-named.js', [
            'import { named } from "./static-source.mjs";',
            'export default named;',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/static-import-namespace.js', [
            'import * as ns from "./static-source.mjs";',
            'export default ns.named;',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/static-export-list.js', [
            'const listed = "listed";',
            'export { listed as default };',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/static-export-star.js', [
            'export * from "./static-source.mjs";',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/tla-only.js', [
            'globalThis.__moduleSyntaxTlaOnly = "before";',
            'await Promise.resolve();',
            'globalThis.__moduleSyntaxTlaOnly = "after";',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/tla-require-only.js', [
            'await Promise.resolve();',
            'globalThis.__moduleSyntaxTlaRequireOnly = true;',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/mixed-export-cjs.js', [
            'export default "esm-wins";',
            'if (false) module.exports = { wrong: true };',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/local-cjs-names.js', [
            'const require = 1;',
            'const module = 2;',
            'const exports = 3;',
            'export default { require, module, exports };',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/create-require-idiom.js', [
            'import { createRequire } from "node:module";',
            'const require = createRequire(import.meta.url);',
            'export default { kind: typeof require, resolved: require.resolve("./false-positive.cjs") };',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/entry-main-dep.cjs', [
            'module.exports = {',
            '  isMain: require.main === module,',
            '  mainFilename: require.main && require.main.filename,',
            '  processMainFilename: process.mainModule && process.mainModule.filename,',
            '};',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/entry-main.cjs', [
            'const dep = require("./entry-main-dep.cjs");',
            'module.exports = {',
            '  isMain: require.main === module,',
            '  processMain: process.mainModule === module,',
            '  mainFilename: require.main && require.main.filename,',
            '  processMainFilename: process.mainModule && process.mainModule.filename,',
            '  dep,',
            '};',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/entry-main-dep.mjs', [
            'export const main = import.meta.main;',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/entry-main.mjs', [
            'import { main as depMain } from "./entry-main-dep.mjs";',
            'export default { main: import.meta.main, depMain };',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/package-without-type/package.json', JSON.stringify({ main: 'index.js' }));
        fs.writeFileSync('/module-syntax-app/package-without-type/noext-esm', [
            'export default "extensionless-module";',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/false-positive.cjs', [
            'const a = "export default no";',
            'const b = /import { nope } from "x"/;',
            '// export const commentOnly = 1;',
            '/* import "comment-only"; */',
            'exports.value = "cjs";',
        ].join('\n'));
        fs.mkdirSync('/module-syntax-app/type-module', { recursive: true });
        fs.writeFileSync('/module-syntax-app/type-module/package.json', JSON.stringify({ type: 'module' }));
        fs.writeFileSync('/module-syntax-app/type-module/cjs.js', 'module.exports = "wrong-extension";');
        fs.writeFileSync('/module-syntax-app/type-module/require.js', 'require("x");');
        fs.writeFileSync('/module-syntax-app/type-module/exports.js', 'exports = {};');
        fs.writeFileSync('/module-syntax-app/type-module/filename.js', 'console.log(__filename);');
        fs.writeFileSync('/module-syntax-app/type-module/dirname.js', 'console.log(__dirname);');
        fs.writeFileSync('/module-syntax-app/type-module/local-require.js', 'const require = 1; export default require;');
        fs.writeFileSync('/module-syntax-app/type-module/dep.mjs', 'export default 2;');
        fs.writeFileSync('/module-syntax-app/type-module/import-module.js', 'import module from "./dep.mjs"; export default module;');
        fs.writeFileSync('/module-syntax-app/type-module/object-exports.js', 'export default { exports: 3 };');
        fs.writeFileSync('/module-syntax-app/query.mjs', [
            'globalThis.__queryModuleCount = (globalThis.__queryModuleCount || 0) + 1;',
            'export const count = globalThis.__queryModuleCount;',
            'export const url = import.meta.url;',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/relative-query-entry.mjs', [
            'const one = await import("./query.mjs?relative-one");',
            'const two = await import("./query.mjs?relative-two");',
            'export default {',
            '  one: one.count,',
            '  two: two.count,',
            '  oneUrl: one.url,',
            '  twoUrl: two.url,',
            '};',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/attr-data.json', JSON.stringify({ one: 1 }));
        fs.writeFileSync('/module-syntax-app/attr-cjs.cjs', [
            'exports.data = require("./attr-data.json");',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/attr-entry.mjs', [
            'import data from "./attr-data.json" with { type: "json" };',
            'import dataWithQuery from "./attr-data.json?cache" with { type: "json" };',
            'import cjs from "./attr-cjs.cjs";',
            'export default {',
            '  data,',
            '  dataWithQuery,',
            '  sameAsCjs: data === cjs.data,',
            '  querySameAsCjs: dataWithQuery === cjs.data,',
            '};',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/attr-missing.mjs', [
            'import data from "./attr-data.json";',
            'export default data;',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/attr-type-mismatch.mjs', [
            'import value from "./static-source.mjs" with { type: "json" };',
            'export default value;',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/attr-unsupported.mjs', [
            'import data from "./attr-data.json" with { type: "unsupported" };',
            'export default data;',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/attr-data-url-entry.mjs', [
            'import data from "data:application/json,{%22two%22:2}" with { type: "json" };',
            'export default data;',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/attr-data-url-missing.mjs', [
            'import data from "data:application/json,{%22two%22:2}";',
            'export default data;',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/member-false-positive.js', [
            'const obj = { import: 1 };',
            'obj.import;',
            'const = ;',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/property-false-positive.js', [
            '({ export: 1 });',
            'const = ;',
        ].join('\n'));
        fs.writeFileSync('/module-syntax-app/dynamic-import-false-positive.js', [
            'import("./static-source.mjs");',
            'const = ;',
        ].join('\n'));

        const { createRequire } = await import('node:module');
        const require = createRequire('/module-syntax-app/main.cjs');

        assert.strictEqual(require('/module-syntax-app/loose.js').default, 'loose-module');
        assert.strictEqual(require('/module-syntax-app/static-import-side-effect.js').default, 'side-effect-import');
        assert.strictEqual(require('/module-syntax-app/static-import-default.js').default, 'source-default');
        assert.strictEqual(require('/module-syntax-app/static-import-named.js').default, 'named');
        assert.strictEqual(require('/module-syntax-app/static-import-namespace.js').default, 'named');
        assert.strictEqual(require('/module-syntax-app/static-export-list.js').default, 'listed');
        assert.strictEqual(require('/module-syntax-app/static-export-star.js').named, 'named');
        assert.strictEqual(require('/module-syntax-app/package-without-type/noext-esm').default, 'extensionless-module');
        assert.deepStrictEqual(require('/module-syntax-app/false-positive.cjs'), { value: 'cjs' });
        globalThis.__moduleSyntaxTlaOnly = undefined;
        await import('/module-syntax-app/tla-only.js');
        assert.strictEqual(globalThis.__moduleSyntaxTlaOnly, 'after');
        assert.throws(() => require('/module-syntax-app/tla-require-only.js'), /async|top-level await|ERR_REQUIRE_ASYNC_MODULE/i);
        assert.strictEqual(require('/module-syntax-app/mixed-export-cjs.js').default, 'esm-wins');
        assert.strictEqual((await import('/module-syntax-app/mixed-export-cjs.js')).default, 'esm-wins');
        assert.deepStrictEqual(require('/module-syntax-app/local-cjs-names.js').default, {
            require: 1,
            module: 2,
            exports: 3,
        });
        const createRequireIdiom = require('/module-syntax-app/create-require-idiom.js').default;
        assert.deepStrictEqual(createRequireIdiom, {
            kind: 'function',
            resolved: '/module-syntax-app/false-positive.cjs',
        });

        const originalArgv = process.argv.slice();
        const originalMainModule = process.mainModule;
        const originalRequireMain = {
            id: require.main.id,
            filename: require.main.filename,
            path: require.main.path,
            exports: require.main.exports,
            loaded: require.main.loaded,
            parent: require.main.parent,
            children: require.main.children.slice(),
            paths: require.main.paths ? require.main.paths.slice() : require.main.paths,
        };
        try {
            process.argv[1] = '/module-syntax-app/entry-main.cjs';
            const cjsMain = require('/module-syntax-app/entry-main.cjs');
            assert.deepStrictEqual(cjsMain, {
                isMain: true,
                processMain: true,
                mainFilename: '/module-syntax-app/entry-main.cjs',
                processMainFilename: '/module-syntax-app/entry-main.cjs',
                dep: {
                    isMain: false,
                    mainFilename: '/module-syntax-app/entry-main.cjs',
                    processMainFilename: '/module-syntax-app/entry-main.cjs',
                },
            });

            process.argv[1] = '/module-syntax-app/entry-main.mjs';
            const esmMain = (await import('/module-syntax-app/entry-main.mjs')).default;
            assert.deepStrictEqual(esmMain, { main: true, depMain: false });
        } finally {
            Object.assign(require.main, originalRequireMain);
            process.argv = originalArgv;
            process.mainModule = originalMainModule;
        }

        await expectImportRejectsMessage('/module-syntax-app/type-module/cjs.js', /use the '\.cjs' file extension/);
        await expectImportRejectsMessage('/module-syntax-app/type-module/require.js', /require is not defined.*use the '\.cjs' file extension/);
        await expectImportRejectsMessage('/module-syntax-app/type-module/exports.js', /exports is not defined.*use the '\.cjs' file extension/);
        await expectImportRejectsMessage('/module-syntax-app/type-module/filename.js', /__filename is not defined.*use the '\.cjs' file extension/);
        await expectImportRejectsMessage('/module-syntax-app/type-module/dirname.js', /__dirname is not defined.*use the '\.cjs' file extension/);
        assert.strictEqual((await import('/module-syntax-app/type-module/local-require.js')).default, 1);
        assert.strictEqual((await import('/module-syntax-app/type-module/import-module.js')).default, 2);
        assert.deepStrictEqual((await import('/module-syntax-app/type-module/object-exports.js')).default, { exports: 3 });
        await expectImportRejectsMessage('data:text/javascript,require;', /require.*not defined/i);
        await expectImportRejectsMessage('data:text/javascript,exports={};', /exports.*not defined/i);
        await expectImportRejectsMessage('data:text/javascript,require_custom;', /^(?!.*in ES module scope)(?!.*use import instead).*$/);

        const propertyKeyModule = await import('data:text/javascript,export default { require: 1 };');
        assert.deepStrictEqual(propertyKeyModule.default, { require: 1 });
        const localBindingModule = await import('data:text/javascript,const module = 1; export default module;');
        assert.strictEqual(localBindingModule.default, 1);
        const importBindingModule = await import('data:text/javascript,import require from "data:text/javascript,export default 1"; export default require;');
        assert.strictEqual(importBindingModule.default, 1);
        const namespaceImportBindingModule = await import('data:text/javascript,import * as module from "data:text/javascript,export default 1"; export default module.default;');
        assert.strictEqual(namespaceImportBindingModule.default, 1);
        const namedImportBindingModule = await import('data:text/javascript,import { value as exports } from "data:text/javascript,export const value = 1"; export default exports;');
        assert.strictEqual(namedImportBindingModule.default, 1);
        const functionParamModule = await import('data:text/javascript,function f(require) { return require; } export default f(1);');
        assert.strictEqual(functionParamModule.default, 1);
        const arrowParamModule = await import('data:text/javascript,export default ((require) => require)(1);');
        assert.strictEqual(arrowParamModule.default, 1);
        const methodNameModule = await import('data:text/javascript,export default { require() { return 1; }, f(module) { return module; } }.f(2);');
        assert.strictEqual(methodNameModule.default, 2);
        const asyncMethodModule = await import('data:text/javascript,export default { async require() { return 1; } };');
        assert.strictEqual(await asyncMethodModule.default.require(), 1);
        const generatorMethodModule = await import('data:text/javascript,export default { *module() { yield 1; } }.module().next().value;');
        assert.strictEqual(generatorMethodModule.default, 1);
        const getterMethodModule = await import('data:text/javascript,export default { get exports() { return 1; } }.exports;');
        assert.strictEqual(getterMethodModule.default, 1);
        const stringKeyMethodModule = await import('data:text/javascript,export default { "x"(require) { return require; } }.x(1);');
        assert.strictEqual(stringKeyMethodModule.default, 1);
        const commentedMethodModule = await import('data:text/javascript,export default { /* comment */ require() { return 1; } }.require();');
        assert.strictEqual(commentedMethodModule.default, 1);
        const generatorModule = await import('data:text/javascript,function* module() { yield 1; } export default module().next().value;');
        assert.strictEqual(generatorModule.default, 1);
        const multiDeclarationModule = await import('data:text/javascript,const a = 0,\n  require = 1;\nexport default require;');
        assert.strictEqual(multiDeclarationModule.default, 1);
        const destructuringModule = await import('data:text/javascript,const {\n  module\n} = { module: 1 };\nexport default module;');
        assert.strictEqual(destructuringModule.default, 1);
        const memberNameModule = await import('data:text/javascript,export default import.meta.require;');
        assert.strictEqual(memberNameModule.default, undefined);

        globalThis.__queryModuleCount = 0;
        const queryBase = pathToFileURL('/module-syntax-app/query.mjs').href;
        const queryOne = await import(`${queryBase}?one`);
        const queryTwo = await import(`${queryBase}?two`);
        assert.strictEqual(queryOne.count, 1);
        assert.strictEqual(queryTwo.count, 2);
        assert.match(queryOne.url, /\?one$/);
        assert.match(queryTwo.url, /\?two$/);
        const relativeQuery = (await import('/module-syntax-app/relative-query-entry.mjs')).default;
        assert.deepStrictEqual(relativeQuery, {
            one: 3,
            two: 4,
            oneUrl: 'file:///module-syntax-app/query.mjs?relative-one',
            twoUrl: 'file:///module-syntax-app/query.mjs?relative-two',
        });
        const attrEntry = (await import('/module-syntax-app/attr-entry.mjs')).default;
        assert.deepStrictEqual(attrEntry, {
            data: { one: 1 },
            dataWithQuery: { one: 1 },
            sameAsCjs: true,
            querySameAsCjs: true,
        });
        assert.deepStrictEqual((await import('/module-syntax-app/attr-data-url-entry.mjs')).default, { two: 2 });
        await expectImportRejectsCode('/module-syntax-app/attr-missing.mjs', 'ERR_IMPORT_ATTRIBUTE_MISSING');
        await expectImportRejectsCode('/module-syntax-app/attr-type-mismatch.mjs', 'ERR_IMPORT_ATTRIBUTE_TYPE_INCOMPATIBLE');
        await expectImportRejectsCode('/module-syntax-app/attr-unsupported.mjs', 'ERR_IMPORT_ATTRIBUTE_UNSUPPORTED');
        await expectImportRejectsCode('/module-syntax-app/attr-data-url-missing.mjs', 'ERR_IMPORT_ATTRIBUTE_MISSING');

        assert.throws(() => require('/module-syntax-app/member-false-positive.js'), /unexpected|expecting|SyntaxError/i);
        assert.throws(() => require('/module-syntax-app/property-false-positive.js'), /unexpected|expecting|SyntaxError/i);
        assert.throws(() => require('/module-syntax-app/dynamic-import-false-positive.js'), /unexpected|expecting|SyntaxError/i);

        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const testCjsPackageReexportNamedExports = async () => {
    try {
        fs.mkdirSync('/cjs-package-reexport-app/node_modules/pkg', { recursive: true });
        fs.writeFileSync('/cjs-package-reexport-app/node_modules/pkg/index.js', [
            'exports.alpha = "alpha";',
            'exports.beta = "beta";',
        ].join('\n'));
        fs.writeFileSync('/cjs-package-reexport-app/node_modules/pkg/subpath.js', [
            'exports.sub = "sub";',
        ].join('\n'));
        fs.writeFileSync('/cjs-package-reexport-app/reexport-package.cjs', 'module.exports = require("pkg");');
        fs.writeFileSync('/cjs-package-reexport-app/reexport-subpath.cjs', 'module.exports = require("pkg/subpath");');
        fs.writeFileSync('/cjs-package-reexport-app/node_modules/file-pkg.js', 'exports.file = "file";');
        fs.writeFileSync('/cjs-package-reexport-app/reexport-file-package.cjs', 'module.exports = require("file-pkg");');

        fs.mkdirSync('/cjs-package-reexport-app/node_modules/exported-pkg', { recursive: true });
        fs.writeFileSync('/cjs-package-reexport-app/node_modules/exported-pkg/package.json', JSON.stringify({
            exports: {
                '.': './main.cjs',
                './feature': './feature.cjs',
                './condition': {
                    import: './import.mjs',
                    'module-sync': './sync.cjs',
                    require: './require.cjs',
                    default: './default.cjs',
                },
            },
        }));
        fs.writeFileSync('/cjs-package-reexport-app/node_modules/exported-pkg/main.cjs', 'exports.main = "main";');
        fs.writeFileSync('/cjs-package-reexport-app/node_modules/exported-pkg/feature.cjs', 'exports.feature = "feature";');
        fs.writeFileSync('/cjs-package-reexport-app/node_modules/exported-pkg/sync.cjs', 'exports.condition = "module-sync";');
        fs.writeFileSync('/cjs-package-reexport-app/node_modules/exported-pkg/require.cjs', 'exports.condition = "require";');
        fs.writeFileSync('/cjs-package-reexport-app/node_modules/exported-pkg/default.cjs', 'exports.condition = "default";');
        fs.writeFileSync('/cjs-package-reexport-app/node_modules/exported-pkg/import.mjs', 'export const condition = "import";');
        fs.writeFileSync('/cjs-package-reexport-app/reexport-exported-root.cjs', 'module.exports = require("exported-pkg");');
        fs.writeFileSync('/cjs-package-reexport-app/reexport-exported-feature.cjs', 'module.exports = require("exported-pkg/feature");');
        fs.writeFileSync('/cjs-package-reexport-app/reexport-exported-condition.cjs', 'module.exports = require("exported-pkg/condition");');

        fs.writeFileSync('/cjs-package-reexport-app/package.json', JSON.stringify({
            imports: {
                '#dep': './imports-target.cjs',
            },
        }));
        fs.writeFileSync('/cjs-package-reexport-app/imports-target.cjs', 'exports.imported = "imported";');
        fs.writeFileSync('/cjs-package-reexport-app/reexport-imports.cjs', 'module.exports = require("#dep");');

        fs.mkdirSync('/cjs-package-reexport-app/node_modules/transitive-pkg', { recursive: true });
        fs.writeFileSync('/cjs-package-reexport-app/node_modules/transitive-pkg/index.js', [
            'exports.gamma = "gamma";',
            'exports.delta = "delta";',
        ].join('\n'));
        fs.writeFileSync('/cjs-package-reexport-app/reexport-transpiler.cjs', [
            'var dep = require("transitive-pkg");',
            'Object.keys(dep).forEach(function (key) {',
            '  Object.defineProperty(exports, key, {',
            '    enumerable: true,',
            '    get: function () { return dep[key]; }',
            '  });',
            '});',
        ].join('\n'));

        fs.mkdirSync('/cjs-package-reexport-app/node_modules/cycle-pkg', { recursive: true });
        fs.writeFileSync('/cjs-package-reexport-app/cycle-a.cjs', [
            'module.exports = require("cycle-pkg");',
            'exports.a = "a";',
        ].join('\n'));
        fs.writeFileSync('/cjs-package-reexport-app/node_modules/cycle-pkg/index.js', [
            'module.exports = require("../../cycle-a.cjs");',
            'exports.b = "b";',
        ].join('\n'));

        fs.writeFileSync('/cjs-package-reexport-app/reexport-continuation.cjs', [
            'var ignored = require("pkg").nested;',
            'exports.own = "own";',
        ].join('\n'));

        fs.writeFileSync('/cjs-package-reexport-app/package-entry.mjs', [
            'import packageDefault, { alpha, beta } from "./reexport-package.cjs";',
            'import { sub } from "./reexport-subpath.cjs";',
            'import { file } from "./reexport-file-package.cjs";',
            'import { main } from "./reexport-exported-root.cjs";',
            'import { feature } from "./reexport-exported-feature.cjs";',
            'import { condition } from "./reexport-exported-condition.cjs";',
            'import { imported } from "./reexport-imports.cjs";',
            'import { gamma, delta } from "./reexport-transpiler.cjs";',
            'import * as continuation from "./reexport-continuation.cjs";',
            'import * as cycle from "./cycle-a.cjs";',
            'export default {',
            '  alpha, beta, defaultAlpha: packageDefault.alpha, sub, file, main, feature, condition, imported, gamma, delta,',
            '  continuationKeys: Object.keys(continuation).filter((key) => key !== "default" && key !== "own"),',
            '  continuationOwn: continuation.own,',
            '  cycleKeys: Object.keys(cycle).filter((key) => key !== "default").sort(),',
            '};',
        ].join('\n'));

        const result = (await import('/cjs-package-reexport-app/package-entry.mjs')).default;
        assert.deepStrictEqual(result, {
            alpha: 'alpha',
            beta: 'beta',
            defaultAlpha: 'alpha',
            sub: 'sub',
            file: 'file',
            main: 'main',
            feature: 'feature',
            condition: 'module-sync',
            imported: 'imported',
            gamma: 'gamma',
            delta: 'delta',
            continuationKeys: [],
            continuationOwn: 'own',
            cycleKeys: ['a', 'b'],
        });
        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const testFindPackageJson = async () => {
    try {
        const { createRequire, findPackageJSON } = await import('node:module');
        const require = createRequire('/find-package-json-app/entry.cjs');

        fs.mkdirSync('/find-package-json-app/node_modules/pkg/subfolder', { recursive: true });
        fs.mkdirSync('/find-package-json-app/node_modules/pkg/subfolder2', { recursive: true });
        fs.mkdirSync('/find-package-json-app/node_modules/pkg2', { recursive: true });
        fs.mkdirSync('/find-package-json-app/packages/nested/sub-pkg-cjs', { recursive: true });
        fs.mkdirSync('/find-package-json-app/packages/nested/sub-pkg-esm', { recursive: true });

        fs.writeFileSync('/find-package-json-app/package.json', JSON.stringify({ name: 'root-app' }));
        fs.writeFileSync('/find-package-json-app/packages/nested/package.json', JSON.stringify({ name: 'nested-parent' }));
        fs.writeFileSync('/find-package-json-app/packages/nested/sub-pkg-cjs/index.cjs', [
            'const { findPackageJSON } = require("node:module");',
            'module.exports = findPackageJSON("..", __filename);',
        ].join('\n'));
        fs.writeFileSync('/find-package-json-app/packages/nested/sub-pkg-esm/index.mjs', [
            'import { findPackageJSON } from "node:module";',
            'export default findPackageJSON("..", import.meta.url);',
        ].join('\n'));

        fs.writeFileSync('/find-package-json-app/node_modules/pkg/subfolder/index.js', 'module.exports = { subfolder: true };');
        fs.writeFileSync('/find-package-json-app/node_modules/pkg/subfolder/package.json', JSON.stringify({
            name: 'pkg-subfolder',
            secretNumberSubfolder: 11,
        }));
        fs.writeFileSync('/find-package-json-app/node_modules/pkg/subfolder2/index.js', 'module.exports = { subfolder2: true };');
        fs.writeFileSync('/find-package-json-app/node_modules/pkg/subfolder2/package.json', JSON.stringify({
            name: 'pkg-subfolder2',
            secretNumberSubfolder2: 22,
        }));
        fs.writeFileSync('/find-package-json-app/node_modules/pkg/package.json', JSON.stringify({
            name: 'pkg',
            exports: './subfolder/index.js',
            secretNumberPkgRoot: 33,
        }));
        fs.writeFileSync('/find-package-json-app/node_modules/pkg2/package.json', JSON.stringify({
            name: 'pkg2',
            main: '/find-package-json-app/node_modules/pkg/subfolder2/index.js',
            secretNumberPkg2: 44,
        }));

        assert.throws(
            () => findPackageJSON(),
            { code: 'ERR_MISSING_ARGS' },
        );

        for (const invalidBase of [null, {}, [], Symbol('invalid'), () => {}, true, false, 1, 0]) {
            assert.throws(
                () => findPackageJSON('', invalidBase),
                { code: 'ERR_INVALID_ARG_TYPE' },
            );
        }

        const basePath = '/find-package-json-app/entry.mjs';
        const baseUrl = pathToFileURL(basePath);
        const subfolderPackageJson = '/find-package-json-app/node_modules/pkg/subfolder/package.json';
        const nestedPackageJson = '/find-package-json-app/packages/nested/package.json';
        const pkgRootPackageJson = '/find-package-json-app/node_modules/pkg/package.json';
        const pkg2RootPackageJson = '/find-package-json-app/node_modules/pkg2/package.json';

        assert.strictEqual(
            findPackageJSON('./node_modules/pkg/subfolder/index.js', baseUrl.href),
            subfolderPackageJson,
        );
        assert.strictEqual(
            findPackageJSON(new URL('./node_modules/pkg/subfolder/index.js', baseUrl), baseUrl),
            subfolderPackageJson,
        );
        assert.strictEqual(
            findPackageJSON('./node_modules/pkg/subfolder/index.js', basePath),
            subfolderPackageJson,
        );

        const cjsParentPackageJson = require('/find-package-json-app/packages/nested/sub-pkg-cjs/index.cjs');
        assert.strictEqual(cjsParentPackageJson, nestedPackageJson);

        const esmParentPackageJson = (await import('/find-package-json-app/packages/nested/sub-pkg-esm/index.mjs')).default;
        assert.strictEqual(esmParentPackageJson, nestedPackageJson);

        assert.strictEqual(findPackageJSON('pkg', baseUrl), pkgRootPackageJson);
        assert.strictEqual(findPackageJSON('pkg2', baseUrl), pkg2RootPackageJson);

        const pkgResolved = require.resolve('pkg', { paths: ['/find-package-json-app'] });
        assert.strictEqual(findPackageJSON(pkgResolved), subfolderPackageJson);
        assert.strictEqual(findPackageJSON(pathToFileURL(pkgResolved).href), subfolderPackageJson);
        assert.strictEqual(findPackageJSON(pathToFileURL(pkgResolved)), subfolderPackageJson);

        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const testRequireEsmErrorHandling = async () => {
    try {
        fs.mkdirSync('/require-esm-errors-app', { recursive: true });
        fs.writeFileSync('/require-esm-errors-app/runtime-error.mjs', [
            'throw new Error("hello");',
        ].join('\n'));
        fs.writeFileSync('/require-esm-errors-app/reference-error.mjs', [
            'Object.defineProperty(exports, "__esModule", { value: true });',
        ].join('\n'));
        fs.writeFileSync('/require-esm-errors-app/ambiguous-reference.js', [
            'Object.defineProperty(exports, "__esModule", { value: true });',
            'const require = () => {};',
        ].join('\n'));
        fs.writeFileSync('/require-esm-errors-app/valid-transpiled.js', [
            'Object.defineProperty(exports, "__esModule", { value: true });',
            'exports.foo = "foo";',
        ].join('\n'));

        const { createRequire } = await import('node:module');
        const require = createRequire('/require-esm-errors-app/main.cjs');

        assert.throws(() => require('/require-esm-errors-app/runtime-error.mjs'), {
            message: 'hello',
        });
        assert.throws(() => require('/require-esm-errors-app/reference-error.mjs'), {
            name: 'ReferenceError',
        });
        assert.throws(() => require('/require-esm-errors-app/ambiguous-reference.js'), {
            name: 'ReferenceError',
        });
        assert.strictEqual(require('/require-esm-errors-app/valid-transpiled.js').foo, 'foo');

        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const testRequireEsmTlaRetry = async () => {
    try {
        fs.mkdirSync('/require-esm-tla-app', { recursive: true });
        fs.writeFileSync('/require-esm-tla-app/tla-success.mjs', [
            'await Promise.resolve();',
            'export const hello = "world";',
        ].join('\n'));

        const { createRequire } = await import('node:module');
        const require = createRequire('/require-esm-tla-app/main.cjs');

        assert.throws(() => require('/require-esm-tla-app/tla-success.mjs'), {
            code: 'ERR_REQUIRE_ASYNC_MODULE',
        });

        const first = await import('/require-esm-tla-app/tla-success.mjs');
        const second = await import('/require-esm-tla-app/tla-success.mjs');
        assert.strictEqual(first.hello, 'world');
        assert.strictEqual(second.hello, 'world');
        assert.strictEqual(first, second);

        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const testRequireEsmCycleGuards = async () => {
    try {
        fs.mkdirSync('/require-esm-cycle-app', { recursive: true });
        fs.writeFileSync('/require-esm-cycle-app/a.mjs', [
            'import { createRequire } from "node:module";',
            'const require = createRequire(import.meta.url);',
            'let cycleCode;',
            'try {',
            '  require("./a.mjs");',
            '} catch (error) {',
            '  cycleCode = error && error.code;',
            '}',
            'export const value = 1;',
            'export { cycleCode };',
        ].join('\n'));
        fs.writeFileSync('/require-esm-cycle-app/syntax-detected.js', [
            'import { createRequire } from "node:module";',
            'const require = createRequire(import.meta.url);',
            'let cycleCode;',
            'try {',
            '  require("./syntax-detected.js");',
            '} catch (error) {',
            '  cycleCode = error && error.code;',
            '}',
            'export const value = 2;',
            'export { cycleCode };',
        ].join('\n'));

        const { createRequire } = await import('node:module');
        const require = createRequire('/require-esm-cycle-app/main.cjs');

        const ns = require('/require-esm-cycle-app/a.mjs');
        assert.strictEqual(ns.value, 1);
        assert.strictEqual(ns.cycleCode, 'ERR_REQUIRE_CYCLE_MODULE');
        const detected = require('/require-esm-cycle-app/syntax-detected.js');
        assert.strictEqual(detected.value, 2);
        assert.strictEqual(detected.cycleCode, 'ERR_REQUIRE_CYCLE_MODULE');
        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const testCjsSymlinkCircularCache = async () => {
    try {
        const { createRequire } = await import('node:module');
        const root = '/cjs-symlink-cycle-app';
        const moduleA = `${root}/node_modules/moduleA`;
        const moduleB = `${root}/node_modules/moduleB`;
        const moduleALink = `${moduleB}/node_modules/moduleA`;
        const moduleBLink = `${moduleA}/node_modules/moduleB`;

        fs.mkdirSync(`${moduleA}/node_modules`, { recursive: true });
        fs.mkdirSync(`${moduleB}/node_modules`, { recursive: true });
        fs.symlinkSync(moduleA, moduleALink);
        fs.symlinkSync(moduleB, moduleBLink);
        fs.writeFileSync(`${root}/index.cjs`, 'module.exports = require("moduleA");');
        fs.writeFileSync(`${moduleA}/index.js`, 'module.exports = { b: require("moduleB") };');
        fs.writeFileSync(`${moduleB}/index.js`, 'module.exports = { a: require("moduleA") };');

        const require = createRequire(`${root}/index.cjs`);
        const obj = require(`${root}/index.cjs`);
        assert.ok(obj);
        assert.ok(obj.b);
        assert.ok(obj.b.a);
        assert.ok(!obj.b.a.b);

        const cacheKeys = Object.keys(require.cache).filter((key) => key.startsWith(root));
        assert.strictEqual(cacheKeys.some((key) => key.includes('/moduleA/node_modules/moduleB/')), false);
        assert.strictEqual(cacheKeys.some((key) => key.includes('/moduleB/node_modules/moduleA/')), false);

        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const testCjsNodeModuleLoadingCompat = async () => {
    try {
        const { createRequire } = await import('node:module');
        const root = '/cjs-node-module-loading-app';
        const require = createRequire(`${root}/entry.cjs`);

        fs.mkdirSync(`${root}/missing-main-with-index`, { recursive: true });
        fs.writeFileSync(`${root}/missing-main-with-index/package.json`, JSON.stringify({ main: 'missing.js' }));
        fs.writeFileSync(`${root}/missing-main-with-index/index.js`, 'module.exports = { ok: true };');
        assert.deepStrictEqual(require(`${root}/missing-main-with-index`), { ok: true });

        fs.mkdirSync(`${root}/missing-main-no-index`, { recursive: true });
        fs.writeFileSync(`${root}/missing-main-no-index/package.json`, JSON.stringify({ main: 'missing.js' }));
        assert.throws(() => require(`${root}/missing-main-no-index`), {
            code: 'MODULE_NOT_FOUND',
            path: `${root}/missing-main-no-index/package.json`,
            requestPath: `${root}/missing-main-no-index`,
        });

        require.extensions['.test'] = function(module, filename) {
            const content = fs.readFileSync(filename, 'utf8').replace('VALUE', 'module.exports.value');
            module._compile(content, filename);
        };
        fs.writeFileSync(`${root}/custom.test`, 'VALUE = 42;');
        assert.strictEqual(require(`${root}/custom`).value, 42);

        fs.mkdirSync(`${root}/parent/child/node_modules/target`, { recursive: true });
        fs.writeFileSync(`${root}/parent/child/node_modules/target/index.js`, 'module.exports = { from: "child" };');
        fs.writeFileSync(`${root}/parent/child/index.js`, 'exports.module = module; exports.loaded = require("target");');
        fs.writeFileSync(`${root}/parent/index.js`, [
            'const child = require("./child");',
            'module.exports = { fromModuleRequire: child.module.require("target"), fromChildRequire: child.loaded };',
        ].join('\n'));
        const parent = require(`${root}/parent`);
        assert.deepStrictEqual(parent.fromModuleRequire, { from: 'child' });
        assert.strictEqual(parent.fromModuleRequire, parent.fromChildRequire);

        fs.writeFileSync(`${root}/bom.js`, '\uFEFFmodule.exports = 42;');
        fs.writeFileSync(`${root}/bom.json`, '\uFEFF42');
        fs.writeFileSync(`${root}/bom-shebang-shebang.js`, '\uFEFF#!shebang\n#!shebang\nmodule.exports = 1;');
        fs.writeFileSync(`${root}/shebang-bom.js`, '#!shebang\n\uFEFFmodule.exports = 42;');
        assert.strictEqual(require(`${root}/bom.js`), 42);
        assert.strictEqual(require(`${root}/bom.json`), 42);
        assert.throws(() => require(`${root}/bom-shebang-shebang.js`), { name: 'SyntaxError' });
        assert.strictEqual(require(`${root}/shebang-bom.js`), 42);

        require.extensions['.reg'] = require.extensions['.js'];
        fs.mkdirSync(`${root}/dir-index-reg`, { recursive: true });
        fs.writeFileSync(`${root}/dir-index-reg/index.reg`, 'exports.value = "index.reg";');
        assert.strictEqual(require(`${root}/dir-index-reg`).value, 'index.reg');

        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const testCjsNestedDependencyCacheShape = async () => {
    try {
        const { createRequire } = await import('node:module');
        const root = '/cjs-nested-dependency-cache-app';

        fs.mkdirSync(`${root}/b/package`, { recursive: true });
        fs.writeFileSync(`${root}/b/package/index.js`, [
            'exports.hello = "world";',
        ].join('\n'));
        fs.writeFileSync(`${root}/b/d.js`, [
            'let value = "D";',
            'exports.D = function() { return value; };',
        ].join('\n'));
        fs.writeFileSync(`${root}/b/c.js`, [
            'const d = require("./d");',
            'const package = require("./package");',
            'if (package.hello !== "world") throw new Error("bad package");',
            'let value = "C";',
            'exports.SomeClass = function() {};',
            'exports.C = function() { return value; };',
            'exports.D = function() { return d.D(); };',
        ].join('\n'));
        fs.writeFileSync(`${root}/a.js`, [
            'const c = require("./b/c");',
            'let value = "A";',
            'exports.SomeClass = c.SomeClass;',
            'exports.A = function() { return value; };',
            'exports.C = function() { return c.C(); };',
            'exports.D = function() { return c.D(); };',
            'exports.number = 42;',
        ].join('\n'));

        const require = createRequire(`${root}/entry.cjs`);
        const withExtension = require(`${root}/a.js`);
        const withoutExtension = require(`${root}/a`);
        const c = require(`${root}/b/c`);
        const d = require(`${root}/b/d`);

        assert.strictEqual(withExtension, withoutExtension);
        assert.strictEqual(withExtension.number, 42);
        assert.strictEqual(withExtension.A(), 'A');
        assert.strictEqual(withExtension.C(), 'C');
        assert.strictEqual(withExtension.D(), 'D');
        assert.ok(new withExtension.SomeClass() instanceof c.SomeClass);
        assert.strictEqual(d.D(), 'D');

        const aCacheKeys = Object.keys(require.cache).filter((key) => key === `${root}/a.js`);
        assert.deepStrictEqual(aCacheKeys, [`${root}/a.js`]);

        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const testCjsModuleChildrenGraph = async () => {
    try {
        const { createRequire } = await import('node:module');
        const root = '/cjs-module-children-app';

        fs.mkdirSync(`${root}/nested`, { recursive: true });
        fs.writeFileSync(`${root}/nested/grandchild.js`, 'exports.name = "grandchild";');
        fs.writeFileSync(`${root}/nested/child.js`, [
            'exports.grandchild = require("./grandchild");',
            'exports.module = module;',
        ].join('\n'));
        fs.writeFileSync(`${root}/data.json`, JSON.stringify({ name: 'json' }));
        fs.writeFileSync(`${root}/custom.test`, 'module.exports.name = "custom";');
        fs.writeFileSync(`${root}/module-require-target.js`, 'exports.name = "module-require-target";');
        fs.writeFileSync(`${root}/entry.js`, [
            'require.extensions[".test"] = function(mod, filename) {',
            '  mod._compile(require("fs").readFileSync(filename, "utf8"), filename);',
            '};',
            'exports.child = require("./nested/child");',
            'exports.childAgain = require("./nested/child");',
            'exports.json = require("./data.json");',
            'exports.custom = require("./custom.test");',
            'exports.moduleRequireTarget = module.require("./module-require-target");',
            'exports.module = module;',
        ].join('\n'));

        const require = createRequire(`${root}/main.cjs`);
        const entry = require(`${root}/entry.js`);
        assert.strictEqual(entry.child, entry.childAgain);
        assert.strictEqual(entry.child.grandchild.name, 'grandchild');
        assert.strictEqual(entry.json.name, 'json');
        assert.strictEqual(entry.custom.name, 'custom');
        assert.strictEqual(entry.moduleRequireTarget.name, 'module-require-target');

        const childIds = entry.module.children.map((child) => child.filename);
        assert.deepStrictEqual(childIds, [
            `${root}/nested/child.js`,
            `${root}/data.json`,
            `${root}/custom.test`,
            `${root}/module-require-target.js`,
        ]);
        assert.strictEqual(childIds.filter((filename) => filename === `${root}/nested/child.js`).length, 1);

        const nestedChildIds = entry.child.module.children.map((child) => child.filename);
        assert.deepStrictEqual(nestedChildIds, [`${root}/nested/grandchild.js`]);

        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
};
