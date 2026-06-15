import assert from 'node:assert';
import fs from 'node:fs';

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
        return false;
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
        return false;
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
