import { stripTypeScriptTypes } from 'node:module';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import diagnosticsChannel from 'node:diagnostics_channel';
import { runJavaScript, startJavaScript } from 'wasm-rquickjs:execution';

export async function run() {
    const processFeatureStrip = process.features.typescript;
    process.execArgv.push('--experimental-transform-types');
    const processFeatureAfterMutation = process.features.typescript;
    process.execArgv.pop();
    const stripped = stripTypeScriptTypes('const value: number = 1;');
    const transformed = stripTypeScriptTypes(
        '\n  namespace MathUtil {\n    export const add = (a: number, b: number) => a + b;\n  }',
        { mode: 'transform', sourceMap: true, sourceUrl: 'input.ts' },
    );
    let unsupported;
    let unsupportedCode;
    try {
        stripTypeScriptTypes('enum Direction { Up, Down }');
    } catch (error) {
        unsupported = error.message;
        unsupportedCode = error.code;
    }
    const sourceMapUrl = transformed.match(/sourceMappingURL=data:application\/json;base64,([^\n]+)/)?.[1];
    const sourceMap = sourceMapUrl === undefined
        ? undefined
        : JSON.parse(Buffer.from(sourceMapUrl, 'base64').toString('utf8'));
    const validationCodes = [];
    for (const invoke of [
        () => stripTypeScriptTypes({}),
        () => stripTypeScriptTypes('const value: number = 1;', []),
        () => stripTypeScriptTypes('const value: number = 1;', { mode: 'invalid' }),
        () => stripTypeScriptTypes('const value: number = 1;', { mode: 'strip', sourceMap: true }),
    ]) {
        try {
            invoke();
        } catch (error) {
            validationCodes.push(error.code);
        }
    }
    fs.mkdirSync('/typescript-runtime/module-package', { recursive: true });
    fs.writeFileSync('/typescript-runtime/module-package/package.json', '{"type":"module"}');
    fs.writeFileSync(
        '/typescript-runtime/module-package/value.ts',
        'const value: number = 41; export default value + 1;',
    );
    fs.writeFileSync(
        '/typescript-runtime/value.mts',
        'const value: number = 42; export default value;',
    );
    fs.writeFileSync(
        '/typescript-runtime/value.cts',
        'const value: number = 42; module.exports = value;',
    );
    fs.writeFileSync(
        '/typescript-runtime/cjs-value.ts',
        'const value: number = 42; module.exports = value;',
    );
    const require = createRequire('/typescript-runtime/entry.cjs');
    const moduleTs = (await import('/typescript-runtime/module-package/value.ts')).default;
    const moduleMts = (await import('/typescript-runtime/value.mts')).default;
    const commonJsCts = require('/typescript-runtime/value.cts');

    const getTransformCount = globalThis.__wasm_rquickjs_get_typescript_module_transform_count;
    const resetTransformCount = globalThis.__wasm_rquickjs_reset_typescript_module_transform_count;
    resetTransformCount();
    fs.writeFileSync(
        '/typescript-runtime/transform-count-direct.cts',
        'const value: number = 42; module.exports = value;',
    );
    const directTransformValue = require('/typescript-runtime/transform-count-direct.cts');
    const directFirstLoadTransformCount = getTransformCount();
    const directCachedTransformValue = require('/typescript-runtime/transform-count-direct.cts');
    const directCachedTransformCount = getTransformCount();

    resetTransformCount();
    fs.writeFileSync(
        '/typescript-runtime/transform-count-import.ts',
        'const value: number = 42; module.exports = value;',
    );
    const moduleRequireTrace = diagnosticsChannel.tracingChannel('module.require');
    const preparedImportTraceEvents = [];
    moduleRequireTrace.subscribe({
        start: (event) => {
            if (event.id === '/typescript-runtime/transform-count-import.ts') {
                preparedImportTraceEvents.push('start');
            }
        },
        end: (event) => {
            if (event.id === '/typescript-runtime/transform-count-import.ts') {
                preparedImportTraceEvents.push('end');
            }
        },
    });
    const importedTransformValue = (await import('/typescript-runtime/transform-count-import.ts')).default;
    const importedFirstLoadTransformCount = getTransformCount();
    const preparedImportFirstLoadTrace = preparedImportTraceEvents.join(',');
    const importedCachedTransformValue = (await import('/typescript-runtime/transform-count-import.ts')).default;
    const importedCachedTransformCount = getTransformCount();
    const importedThenRequiredTransformValue = require('/typescript-runtime/transform-count-import.ts');
    const importedThenRequiredTransformCount = getTransformCount();

    resetTransformCount();
    fs.writeFileSync(
        '/typescript-runtime/transform-count-require-import.cts',
        'type Hidden = typeof exports.phantom; exports.answer = 42;',
    );
    const requiredBeforeImportTransformValue = require('/typescript-runtime/transform-count-require-import.cts');
    const requiredBeforeImportTransformCount = getTransformCount();
    const requiredThenImportedNamespace = await import('/typescript-runtime/transform-count-require-import.cts');
    const requiredThenImportedTransformValue = requiredThenImportedNamespace.answer;
    const requiredThenImportedHasPhantom = 'phantom' in requiredThenImportedNamespace;
    const requiredThenImportedTransformCount = getTransformCount();

    resetTransformCount();
    fs.writeFileSync(
        '/typescript-runtime/transform-count-reexport-child.cts',
        'type Hidden = typeof exports.phantom; exports.answer = 42;',
    );
    fs.writeFileSync(
        '/typescript-runtime/transform-count-reexport.cts',
        `const child: { answer: number } = require('./transform-count-reexport-child.cts');
         Object.keys(child).forEach(function (key) {
             if (key === 'default' || key === '__esModule') return;
             Object.defineProperty(exports, key, {
                 enumerable: true,
                 get: function () { return child[key]; },
             });
         });`,
    );
    const requiredReexportValue = require('/typescript-runtime/transform-count-reexport.cts');
    const requiredReexportTransformCount = getTransformCount();
    const reexportNamespace = await import('/typescript-runtime/transform-count-reexport.cts');
    const reexportTransformValue = reexportNamespace.answer;
    const reexportHasPhantom = 'phantom' in reexportNamespace;
    const reexportFirstLoadTransformCount = getTransformCount();
    const reexportCachedNamespace = await import('/typescript-runtime/transform-count-reexport.cts');
    const reexportCachedTransformValue = reexportCachedNamespace.answer;
    const reexportCachedTransformCount = getTransformCount();
    const reexportChildNamespace = await import('/typescript-runtime/transform-count-reexport-child.cts');
    const reexportChildTransformValue = reexportChildNamespace.answer;
    const reexportChildHasPhantom = 'phantom' in reexportChildNamespace;
    const reexportChildImportTransformCount = getTransformCount();

    resetTransformCount();
    fs.writeFileSync(
        '/typescript-runtime/cached-reexport-child.cts',
        'type Hidden = typeof exports.phantom; exports.answer = 42;',
    );
    require('/typescript-runtime/cached-reexport-child.cts');
    fs.writeFileSync(
        '/typescript-runtime/cached-reexport-parent.cts',
        `const child = require('./cached-reexport-child.cts');
         Object.keys(child).forEach(function (key) {
             if (key === 'default' || key === '__esModule') return;
             Object.defineProperty(exports, key, {
                 enumerable: true,
                 get: function () { return child[key]; },
             });
         });`,
    );
    const cachedChildReexportValue = (await import('/typescript-runtime/cached-reexport-parent.cts')).answer;
    const cachedChildReexportTransformCount = getTransformCount();

    fs.writeFileSync(
        '/typescript-runtime/esm-reexport-child.mts',
        'export const answer: number = 42;',
    );
    resetTransformCount();
    fs.writeFileSync(
        '/typescript-runtime/esm-reexport-parent.cts',
        `if (false) {
             const child = require('./esm-reexport-child.mts');
             Object.keys(child).forEach(function (key) {
                 if (key === 'default' || key === '__esModule') return;
                 Object.defineProperty(exports, key, {
                     enumerable: true,
                     get: function () { return child[key]; },
                 });
             });
         }
         module.exports = 42;`,
    );
    const esmChildReexportValue = (await import('/typescript-runtime/esm-reexport-parent.cts')).default;
    const esmChildReexportTransformCount = getTransformCount();

    fs.writeFileSync(
        '/typescript-runtime/import-type-commonjs.ts',
        `import type { Missing } from "./missing.mts";
         export interface Options { value: Missing }
         export declare const phantom: Missing;
         const value: Missing = 42;
         module.exports = value;`,
    );
    resetTransformCount();
    const importTypeCommonJsValue = (await import('/typescript-runtime/import-type-commonjs.ts')).default;
    const importTypeCommonJsTransformCount = getTransformCount();

    fs.mkdirSync('/typescript-runtime/type-commonjs', { recursive: true });
    fs.writeFileSync('/typescript-runtime/type-commonjs/package.json', '{"type":"commonjs"}');
    fs.writeFileSync(
        '/typescript-runtime/type-commonjs/value.ts',
        `export interface Options { value: number }
         export declare const phantom: number;
         module.exports = 42;`,
    );
    resetTransformCount();
    const typeCommonJsValue = (await import('/typescript-runtime/type-commonjs/value.ts')).default;
    const typeCommonJsTransformCount = getTransformCount();

    fs.writeFileSync(
        '/typescript-runtime/type-only-reexport-child.ts',
        `export interface Options { value: number }
         export declare const phantom: number;
         exports.answer = 42;`,
    );
    fs.writeFileSync(
        '/typescript-runtime/type-only-reexport-parent.cts',
        `const child = require('./type-only-reexport-child.ts');
         Object.keys(child).forEach(function (key) {
             if (key === 'default' || key === '__esModule') return;
             Object.defineProperty(exports, key, {
                 enumerable: true,
                 get: function () { return child[key]; },
             });
         });`,
    );
    resetTransformCount();
    const typeOnlyReexportValue = (await import('/typescript-runtime/type-only-reexport-parent.cts')).answer;
    const typeOnlyReexportTransformCount = getTransformCount();

    fs.mkdirSync('/typescript-runtime/type-module-cts', { recursive: true });
    fs.writeFileSync('/typescript-runtime/type-module-cts/package.json', '{"type":"module"}');
    fs.writeFileSync(
        '/typescript-runtime/type-module-cts/child.cts',
        'type Answer = number; exports.answer = 42 as Answer;',
    );
    fs.writeFileSync(
        '/typescript-runtime/type-module-cts/parent.cts',
        `const child = require('./child.cts');
         Object.keys(child).forEach(function (key) {
             if (key === 'default' || key === '__esModule') return;
             Object.defineProperty(exports, key, {
                 enumerable: true,
                 get: function () { return child[key]; },
             });
         });`,
    );
    resetTransformCount();
    const typeModuleCtsReexportValue = (await import('/typescript-runtime/type-module-cts/parent.cts')).answer;
    const typeModuleCtsReexportTransformCount = getTransformCount();

    fs.writeFileSync(
        '/typescript-runtime/lexical-esm-reexport-child.ts',
        'const { value: module } = { value: 1 };',
    );
    const writeAnalysisOnlyReexport = (parent, child) => fs.writeFileSync(
        parent,
        `throw new Error('ANALYSIS_ONLY');
         const child = require('${child}');
         Object.keys(child).forEach(function (key) {
             if (key === 'default' || key === '__esModule') return;
             Object.defineProperty(exports, key, {
                 enumerable: true,
                 get: function () { return child[key]; },
             });
         });`,
    );
    const observeAnalysisOnlyReexport = async (parent) => {
        resetTransformCount();
        try {
            await import(parent);
        } catch (error) {
            return { error: error.message, transformCount: getTransformCount() };
        }
        throw new Error(`expected analysis-only parent ${parent} to throw`);
    };
    writeAnalysisOnlyReexport(
        '/typescript-runtime/lexical-esm-reexport-parent.cts',
        './lexical-esm-reexport-child.ts',
    );
    const lexicalEsmChildReexport = await observeAnalysisOnlyReexport(
        '/typescript-runtime/lexical-esm-reexport-parent.cts',
    );
    const lexicalEsmChildReexportValue = lexicalEsmChildReexport.error;
    const lexicalEsmChildReexportTransformCount = lexicalEsmChildReexport.transformCount;
    fs.writeFileSync(
        '/typescript-runtime/top-level-for-await-child.ts',
        'const marker: number = 1; for await (const item of []) { void item; }',
    );
    writeAnalysisOnlyReexport(
        '/typescript-runtime/top-level-for-await-parent.cts',
        './top-level-for-await-child.ts',
    );
    const topLevelForAwaitReexport = await observeAnalysisOnlyReexport(
        '/typescript-runtime/top-level-for-await-parent.cts',
    );
    const topLevelForAwaitReexportValue = topLevelForAwaitReexport.error;
    const topLevelForAwaitReexportTransformCount = topLevelForAwaitReexport.transformCount;

    fs.writeFileSync(
        '/typescript-runtime/nested-for-await-child.ts',
        'const marker: number = 1; async function run() { for await (const item of []) { void item; } } module.exports = marker + 41;',
    );
    writeAnalysisOnlyReexport(
        '/typescript-runtime/nested-for-await-parent.cts',
        './nested-for-await-child.ts',
    );
    const nestedForAwaitReexport = await observeAnalysisOnlyReexport(
        '/typescript-runtime/nested-for-await-parent.cts',
    );
    const nestedForAwaitReexportValue = nestedForAwaitReexport.error;
    const nestedForAwaitReexportTransformCount = nestedForAwaitReexport.transformCount;

    fs.writeFileSync(
        '/typescript-runtime/top-level-await-using-child.ts',
        'const marker: number = 1; await using resource = acquire();',
    );
    writeAnalysisOnlyReexport(
        '/typescript-runtime/top-level-await-using-parent.cts',
        './top-level-await-using-child.ts',
    );
    const topLevelAwaitUsingReexport = await observeAnalysisOnlyReexport(
        '/typescript-runtime/top-level-await-using-parent.cts',
    );
    const topLevelAwaitUsingReexportValue = topLevelAwaitUsingReexport.error;
    const topLevelAwaitUsingReexportTransformCount = topLevelAwaitUsingReexport.transformCount;

    fs.writeFileSync(
        '/typescript-runtime/nested-await-using-child.ts',
        'const marker: number = 1; async function run() { await using resource = acquire(); } module.exports = marker + 41;',
    );
    writeAnalysisOnlyReexport(
        '/typescript-runtime/nested-await-using-parent.cts',
        './nested-await-using-child.ts',
    );
    const nestedAwaitUsingReexport = await observeAnalysisOnlyReexport(
        '/typescript-runtime/nested-await-using-parent.cts',
    );
    const nestedAwaitUsingReexportValue = nestedAwaitUsingReexport.error;
    const nestedAwaitUsingReexportTransformCount = nestedAwaitUsingReexport.transformCount;

    fs.writeFileSync(
        '/typescript-runtime/declare-wrapper-child.ts',
        'declare const require: unknown; declare class module {} module.exports = 42;',
    );
    writeAnalysisOnlyReexport(
        '/typescript-runtime/declare-wrapper-parent.cts',
        './declare-wrapper-child.ts',
    );
    const declareWrapperReexport = await observeAnalysisOnlyReexport(
        '/typescript-runtime/declare-wrapper-parent.cts',
    );
    const declareWrapperReexportValue = declareWrapperReexport.error;
    const declareWrapperReexportTransformCount = declareWrapperReexport.transformCount;

    const recoverableFilename = '/typescript-runtime/recoverable-prepare.cts';
    fs.writeFileSync(
        '/typescript-runtime/recoverable-parent.cjs',
        `module.exports = function (filename) {
             const before = module.children.filter((child) => child.filename === filename).length;
             try {
                 const value = require(filename);
                 return {
                     value,
                     before,
                     after: module.children.filter((child) => child.filename === filename).length,
                     cached: filename in require.cache,
                 };
             } catch (error) {
                 return {
                     error: error.code,
                     before,
                     after: module.children.filter((child) => child.filename === filename).length,
                     cached: filename in require.cache,
                 };
             }
         };`,
    );
    const recoverableLoad = require('/typescript-runtime/recoverable-parent.cjs');
    fs.writeFileSync(recoverableFilename, 'enum Direction { Up, Down }');
    const recoverableResolved = require.resolve(recoverableFilename);
    const recoverableFailure = recoverableLoad(recoverableResolved);
    fs.writeFileSync(recoverableFilename, 'const value: number = 42; module.exports = value;');
    const recoverableSuccess = recoverableLoad(recoverableResolved);

    resetTransformCount();
    fs.writeFileSync(
        '/typescript-runtime/transform-count-esm.mts',
        'export let live: number = 1; export default 42;',
    );
    const requiredMtsNamespace = require('/typescript-runtime/transform-count-esm.mts');
    const importedMtsNamespace = await import('/typescript-runtime/transform-count-esm.mts');
    const mtsRequireImportTransformCount = getTransformCount();

    resetTransformCount();
    fs.mkdirSync('/typescript-runtime/transform-count-module-package', { recursive: true });
    fs.writeFileSync(
        '/typescript-runtime/transform-count-module-package/package.json',
        JSON.stringify({ type: 'module' }),
    );
    fs.writeFileSync(
        '/typescript-runtime/transform-count-module-package/value.ts',
        'export let live: number = 1; export default 42;',
    );
    const modulePackageFilename = '/typescript-runtime/transform-count-module-package/value.ts';
    const requiredModuleTsNamespace = require(modulePackageFilename);
    const importedModuleTsNamespace = await import(modulePackageFilename);
    const moduleTsRequireImportTransformCount = getTransformCount();
    let extensionlessCommonJsTsError;
    try {
        require('/typescript-runtime/cjs-value');
    } catch (error) {
        extensionlessCommonJsTsError = error.code;
    }

    fs.writeFileSync('/typescript-runtime/esm-extensionless-target.ts', 'export default 42;');
    let extensionlessEsmError;
    try {
        await import('/typescript-runtime/esm-extensionless-target');
    } catch (error) {
        extensionlessEsmError = error.code;
    }
    fs.writeFileSync('/typescript-runtime/unsupported.mts', 'enum Direction { Up, Down }');
    let loaderUnsupportedCode;
    let loaderUnsupportedName;
    try {
        await import('/typescript-runtime/unsupported.mts');
    } catch (error) {
        loaderUnsupportedCode = error.code;
        loaderUnsupportedName = error.name;
    }
    fs.writeFileSync('/typescript-runtime/unsupported.cts', 'enum Direction { Up, Down }');
    let commonJsUnsupportedCode;
    let commonJsUnsupportedName;
    try {
        require('/typescript-runtime/unsupported.cts');
    } catch (error) {
        commonJsUnsupportedCode = error.code;
        commonJsUnsupportedName = error.name;
    }
    fs.writeFileSync('/typescript-runtime/cross.cts', 'module.exports = { value: 42 };');
    fs.writeFileSync(
        '/typescript-runtime/cross-consumer.mts',
        'import value from "./cross.cts"; export default value.value;',
    );
    const esmImportsCts = (await import('/typescript-runtime/cross-consumer.mts')).default;
    fs.writeFileSync(
        '/typescript-runtime/type-only.mts',
        'import type { Missing } from "./missing.mts"; const value: Missing = 42; export default value;',
    );
    const typeOnlyImport = (await import('/typescript-runtime/type-only.mts')).default;
    fs.writeFileSync('/typescript-runtime/invalid.mts', 'const value: = 42;');
    let invalidSyntaxCode;
    let invalidSyntaxName;
    try {
        await import('/typescript-runtime/invalid.mts');
    } catch (error) {
        invalidSyntaxCode = error.code;
        invalidSyntaxName = error.name;
    }

    fs.mkdirSync('/typescript-runtime/node_modules/package', { recursive: true });
    fs.writeFileSync(
        '/typescript-runtime/node_modules/package/index.ts',
        'export default 42;',
    );
    let nodeModulesError;
    let nodeModulesErrorName;
    try {
        await import('/typescript-runtime/node_modules/package/index.ts');
    } catch (error) {
        nodeModulesError = error.code;
        nodeModulesErrorName = error.name;
    }
    fs.writeFileSync(
        '/typescript-runtime/node_modules/package/index.cts',
        'module.exports = 42;',
    );
    let commonJsNodeModulesError;
    let commonJsNodeModulesErrorName;
    try {
        require('/typescript-runtime/node_modules/package/index.cts');
    } catch (error) {
        commonJsNodeModulesError = error.code;
        commonJsNodeModulesErrorName = error.name;
    }

    let inlineRunnerUnsupported;
    try {
        await runJavaScript({
            language: 'typescript',
            source: 'enum Direction { Up, Down } return Direction.Down;',
        });
    } catch (error) {
        inlineRunnerUnsupported = error.message;
    }
    const inlineRunnerStripped = await runJavaScript({
        language: 'typescript',
        source: 'const value: number = 42; return value;',
    });
    fs.writeFileSync(
        '/typescript-runtime/runner-entry.mts',
        'export function run(): number { return 42; }',
    );
    const entryRunner = await runJavaScript({
        cwd: '/typescript-runtime',
        entry: './runner-entry.mts',
    });
    fs.writeFileSync(
        '/typescript-runtime/runner-entry.cts',
        'exports.run = function run(): number { return 42; };',
    );
    const commonJsEntryRunner = await runJavaScript({
        cwd: '/typescript-runtime',
        entry: './runner-entry.cts',
    });
    const largeSourcePrefix = 'return 42;/*';
    const largeSourceSuffix = '*/';
    const largeSource = largeSourcePrefix +
        'x'.repeat(256 * 1024 + 1) +
        largeSourceSuffix;
    const largeInlineRunner = await runJavaScript({
        language: 'typescript',
        source: largeSource,
    });

    return JSON.stringify({
        stripped,
        transformed,
        sourceMap,
        unsupported,
        unsupportedCode,
        validationCodes,
        moduleTs,
        moduleMts,
        commonJsCts,
        directTransformValue,
        directCachedTransformValue,
        directFirstLoadTransformCount,
        directCachedTransformCount,
        importedTransformValue,
        importedCachedTransformValue,
        importedFirstLoadTransformCount,
        preparedImportFirstLoadTrace,
        importedCachedTransformCount,
        importedThenRequiredTransformValue,
        importedThenRequiredTransformCount,
        requiredBeforeImportTransformValue,
        requiredBeforeImportTransformCount,
        requiredThenImportedTransformValue,
        requiredThenImportedHasPhantom,
        requiredThenImportedTransformCount,
        reexportTransformValue,
        requiredReexportValue,
        requiredReexportTransformCount,
        reexportHasPhantom,
        reexportFirstLoadTransformCount,
        reexportCachedTransformValue,
        reexportCachedTransformCount,
        reexportChildTransformValue,
        reexportChildHasPhantom,
        reexportChildImportTransformCount,
        cachedChildReexportValue,
        cachedChildReexportTransformCount,
        esmChildReexportValue,
        esmChildReexportTransformCount,
        importTypeCommonJsValue,
        importTypeCommonJsTransformCount,
        typeCommonJsValue,
        typeCommonJsTransformCount,
        typeOnlyReexportValue,
        typeOnlyReexportTransformCount,
        typeModuleCtsReexportValue,
        typeModuleCtsReexportTransformCount,
        lexicalEsmChildReexportValue,
        lexicalEsmChildReexportTransformCount,
        topLevelForAwaitReexportValue,
        topLevelForAwaitReexportTransformCount,
        nestedForAwaitReexportValue,
        nestedForAwaitReexportTransformCount,
        topLevelAwaitUsingReexportValue,
        topLevelAwaitUsingReexportTransformCount,
        nestedAwaitUsingReexportValue,
        nestedAwaitUsingReexportTransformCount,
        declareWrapperReexportValue,
        declareWrapperReexportTransformCount,
        recoverablePrepareError: recoverableFailure.error,
        recoverableCachedAfterFailure: recoverableFailure.cached,
        recoverableChildrenBefore: recoverableFailure.before,
        recoverableChildrenAfterFailure: recoverableFailure.after,
        recoverablePrepareValue: recoverableSuccess.value,
        recoverableCachedAfterSuccess: recoverableSuccess.cached,
        recoverableChildrenAfterSuccess: recoverableSuccess.after,
        requiredMtsDefault: requiredMtsNamespace.default,
        importedMtsDefault: importedMtsNamespace.default,
        importedMtsLive: importedMtsNamespace.live,
        mtsRequireImportSameNamespace: requiredMtsNamespace === importedMtsNamespace,
        mtsRequireImportTransformCount,
        requiredModuleTsDefault: requiredModuleTsNamespace.default,
        importedModuleTsDefault: importedModuleTsNamespace.default,
        importedModuleTsLive: importedModuleTsNamespace.live,
        moduleTsRequireImportSameNamespace: requiredModuleTsNamespace === importedModuleTsNamespace,
        moduleTsRequireImportTransformCount,
        extensionlessCommonJsTsError,
        extensionlessEsmError,
        loaderUnsupportedCode,
        loaderUnsupportedName,
        commonJsUnsupportedCode,
        commonJsUnsupportedName,
        processFeatureStrip,
        processFeatureAfterMutation,
        esmImportsCts,
        typeOnlyImport,
        invalidSyntaxCode,
        invalidSyntaxName,
        nodeModulesError,
        nodeModulesErrorName,
        commonJsNodeModulesError,
        commonJsNodeModulesErrorName,
        inlineRunnerUnsupported,
        inlineRunnerStripped: inlineRunnerStripped.value,
        entryRunner: entryRunner.value,
        commonJsEntryRunner: commonJsEntryRunner.value,
        largeInlineRunner: largeInlineRunner.value,
    });
}
