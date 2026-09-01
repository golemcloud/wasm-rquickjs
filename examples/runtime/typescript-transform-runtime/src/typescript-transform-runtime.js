import fs from 'node:fs';
import module, { createRequire } from 'node:module';
import { runJavaScript } from 'wasm-rquickjs:execution';

export async function run() {
    const errorConstructorBefore = Error;
    const typeErrorConstructorBefore = TypeError;
    fs.mkdirSync('/typescript-transform-runtime', { recursive: true });
    fs.writeFileSync(
        '/typescript-transform-runtime/transformed.mts',
        'enum Direction { Up, Down } export default Direction.Down;',
    );
    const transformedModule =
        (await import('/typescript-transform-runtime/transformed.mts')).default;
    fs.writeFileSync(
        '/typescript-transform-runtime/direction.mts',
        'export enum Direction { Up, Down }',
    );
    fs.writeFileSync(
        '/typescript-transform-runtime/entry.mts',
        'import { Direction } from "./direction.mts"; export function run() { return Direction.Down; }',
    );
    const executionEntry = await runJavaScript({
        cwd: '/typescript-transform-runtime',
        entry: './entry.mts',
    });
    fs.writeFileSync(
        '/typescript-transform-runtime/entry.cts',
        `enum Offset { Answer = 2 }
         exports.run = function run(): number { return 40 + Offset.Answer; };`,
    );
    const commonJsExecutionEntry = await runJavaScript({
        cwd: '/typescript-transform-runtime',
        entry: './entry.cts',
    });
    fs.mkdirSync('/typescript-transform-runtime/project/node_modules/prepared-dependency', {
        recursive: true,
    });
    fs.writeFileSync(
        '/typescript-transform-runtime/project/package.json',
        JSON.stringify({ type: 'module' }),
    );
    fs.writeFileSync(
        '/typescript-transform-runtime/project/node_modules/prepared-dependency/package.json',
        JSON.stringify({ name: 'prepared-dependency', type: 'module', exports: './index.js' }),
    );
    fs.writeFileSync(
        '/typescript-transform-runtime/project/node_modules/prepared-dependency/index.js',
        'export const base = 40;',
    );
    fs.writeFileSync(
        '/typescript-transform-runtime/project/entry.ts',
        `import { base } from 'prepared-dependency';
         enum Offset { Answer = 2 }
         export default function run(): { answer: number; runtime: string } {
             return { answer: base + Offset.Answer, runtime: 'typescript' };
         }`,
    );
    const filesystemProject = await runJavaScript({
        cwd: '/typescript-transform-runtime/project',
        entry: './entry.ts',
    });
    fs.writeFileSync(
        '/typescript-transform-runtime/project/node_modules/prepared-dependency/index.ts',
        'export default 42;',
    );
    let nodeModulesTypeScriptError;
    let nodeModulesTypeScriptErrorName;
    try {
        await import('/typescript-transform-runtime/project/node_modules/prepared-dependency/index.ts');
    } catch (error) {
        nodeModulesTypeScriptError = error.code;
        nodeModulesTypeScriptErrorName = error.name;
    }
    fs.writeFileSync(
        '/typescript-transform-runtime/project/node_modules/prepared-dependency/index.cts',
        'module.exports = 42;',
    );
    const require = createRequire('/typescript-transform-runtime/project/entry.cjs');
    let commonJsNodeModulesTypeScriptError;
    let commonJsNodeModulesTypeScriptErrorName;
    try {
        require('/typescript-transform-runtime/project/node_modules/prepared-dependency/index.cts');
    } catch (error) {
        commonJsNodeModulesTypeScriptError = error.code;
        commonJsNodeModulesTypeScriptErrorName = error.name;
    }
    const executionInline = await runJavaScript({
        language: 'typescript',
        source: 'enum Direction { Up, Down } return Direction.Down;',
    });
    const largeSourcePrefix = 'enum Direction { Up, Down } return Direction.Down;/*';
    const largeSourceSuffix = '*/';
    const largeSource = largeSourcePrefix +
        'x'.repeat(256 * 1024 + 1) +
        largeSourceSuffix;
    const largeInlineExecution = await runJavaScript({
        language: 'typescript',
        source: largeSource,
    });
    const measuredSource = `enum Direction { Up, Down }
        export default Direction.Down;
        /*${'x'.repeat(64 * 1024)}*/`;
    function measureTransform(sourceMap) {
        const samples = [];
        for (let i = 0; i < 6; i++) {
            const started = performance.now();
            module.stripTypeScriptTypes(measuredSource, {
                mode: 'transform',
                sourceMap,
                sourceUrl: 'measured.ts',
            });
            if (i > 0) samples.push(performance.now() - started);
        }
        samples.sort((left, right) => left - right);
        return samples[2];
    }
    const transformLatencyMs = {
        withoutSourceMap: measureTransform(false),
        withSourceMap: measureTransform(true),
    };
    fs.writeFileSync(
        '/typescript-transform-runtime/stack-esm.mts',
        `enum StackShift { Value }
         export function failEsm(): never {
             throw new Error('esm-typescript-stack');
         }`,
    );
    let esmRuntimeStack;
    try {
        (await import('/typescript-transform-runtime/stack-esm.mts')).failEsm();
    } catch (error) {
        esmRuntimeStack = error.stack;
    }
    fs.writeFileSync(
        '/typescript-transform-runtime/stack-errors.mts',
        `enum StackShift { Value }
         export class CustomStackError extends Error {}
         export function failTypeError(): never {
             throw new TypeError('type-error-typescript-stack');
         }
         export function failCustomError(): never {
             throw new CustomStackError('custom-error-typescript-stack');
         }
         export function captureGeneratedSite() {
             const previous = Error.prepareStackTrace;
             try {
                 Error.prepareStackTrace = (_error, sites) => sites[0];
                 return new Error('prepared-typescript-stack').stack;
             } finally {
                 Error.prepareStackTrace = previous;
             }
         }
         export function failSyntaxError(): never {
             throw new SyntaxError('syntax-error-typescript-stack');
         }`,
    );
    const stackErrorsModule = await import('/typescript-transform-runtime/stack-errors.mts');
    let typeErrorRuntimeStack;
    try {
        stackErrorsModule.failTypeError();
    } catch (error) {
        typeErrorRuntimeStack = error.stack;
    }
    let customErrorRuntimeStack;
    try {
        stackErrorsModule.failCustomError();
    } catch (error) {
        customErrorRuntimeStack = error.stack;
    }
    let syntaxErrorRuntimeStack;
    try {
        stackErrorsModule.failSyntaxError();
    } catch (error) {
        syntaxErrorRuntimeStack = error.stack;
    }
    const generatedSite = stackErrorsModule.captureGeneratedSite();
    const generatedSiteFile = generatedSite.getFileName();
    const generatedSiteLine = generatedSite.getLineNumber();
    const generatedSiteColumn = generatedSite.getColumnNumber();
    const preparedSourceMap = module.findSourceMap(generatedSiteFile);
    const preparedOrigin = preparedSourceMap &&
        preparedSourceMap.findOrigin(generatedSiteLine, generatedSiteColumn);
    const errorConstructorMetadata = [
        Error,
        TypeError,
        RangeError,
        ReferenceError,
        SyntaxError,
        EvalError,
        URIError,
        AggregateError,
    ].map((Constructor) => ({ name: Constructor.name, length: Constructor.length }));
    class NarrowTypeError extends TypeError {}
    const errorConstructorRelationships = Error.isPrototypeOf(TypeError) &&
        !(new TypeError('base') instanceof NarrowTypeError) &&
        new NarrowTypeError('narrow') instanceof NarrowTypeError;

    const originalPrepareDescriptor = Object.getOwnPropertyDescriptor(Error, 'prepareStackTrace');
    const originalPrepareValue = Error.prepareStackTrace;
    Object.defineProperty(Error, 'prepareStackTrace', {
        value: () => 'non-writable-prepare',
        writable: false,
        configurable: true,
    });
    const nonWritablePrepareStack = new TypeError('non-writable').stack;
    Object.defineProperty(Error, 'prepareStackTrace', originalPrepareDescriptor);
    Error.prepareStackTrace = originalPrepareValue;

    let prepareSetterCalls = 0;
    Object.defineProperty(Error, 'prepareStackTrace', {
        get() { return undefined; },
        set() { prepareSetterCalls++; },
        configurable: true,
    });
    new TypeError('accessor-backed');
    Object.defineProperty(Error, 'prepareStackTrace', originalPrepareDescriptor);
    Error.prepareStackTrace = originalPrepareValue;

    let nestedPrepareCalls = 0;
    Error.prepareStackTrace = () => {
        nestedPrepareCalls++;
        new TypeError('nested');
        return 'nested-prepare';
    };
    const nestedPrepareStack = new Error('outer').stack;
    Object.defineProperty(Error, 'prepareStackTrace', originalPrepareDescriptor);
    Error.prepareStackTrace = originalPrepareValue;
    const errorConstructorsStable = Error === errorConstructorBefore &&
        TypeError === typeErrorConstructorBefore &&
        new Error().constructor === Error &&
        new TypeError().constructor === TypeError;
    fs.writeFileSync(
        '/typescript-transform-runtime/stack-sites.mts',
        `import { getCallSites } from 'node:util';
         enum StackShift { Value }
         export function captureSites() {
             return {
                 mapped: getCallSites(1)[0],
                 generated: getCallSites(1, { sourceMap: false })[0],
             };
         }`,
    );
    const callSites = (await import('/typescript-transform-runtime/stack-sites.mts')).captureSites();
    fs.writeFileSync(
        '/typescript-transform-runtime/stack-cjs.cts',
        `enum StackShift { Value }
         exports.failCjs = function failCjs(): never {
             throw new Error('cjs-typescript-stack');
         };`,
    );
    let cjsRuntimeStack;
    const cjsStackModule = require('/typescript-transform-runtime/stack-cjs.cts');
    try {
        cjsStackModule.failCjs();
    } catch (error) {
        cjsRuntimeStack = error.stack;
    }
    let importedCjsRuntimeStack;
    try {
        (await import('/typescript-transform-runtime/stack-cjs.cts')).default.failCjs();
    } catch (error) {
        importedCjsRuntimeStack = error.stack;
    }
    fs.writeFileSync(
        '/typescript-transform-runtime/stack-reexport-child.cts',
        `enum StackShift { Value }
         exports.failPrepared = function failPrepared(): never {
             throw new Error('prepared-reexport-typescript-stack');
         };`,
    );
    fs.writeFileSync(
        '/typescript-transform-runtime/stack-reexport-parent.cts',
        `const child = require('./stack-reexport-child.cts');
         Object.keys(child).forEach(function (key) {
             Object.defineProperty(exports, key, {
                 enumerable: true,
                 get: function () { return child[key]; },
             });
         });`,
    );
    const reexportStackModule = await import('/typescript-transform-runtime/stack-reexport-parent.cts');
    let reexportPreparedRuntimeStack;
    try {
        reexportStackModule.default.failPrepared();
    } catch (error) {
        reexportPreparedRuntimeStack = error.stack;
    }
    delete require.cache[require.resolve('/typescript-transform-runtime/stack-cjs.cts')];
    fs.writeFileSync(
        '/typescript-transform-runtime/stack-cjs.cts',
        `enum StackShift { Value }
         const marker: number = StackShift.Value;
         exports.failCjs = function failCjs(): never {
             throw new Error('rewritten-cjs-typescript-stack-' + marker);
         };`,
    );
    fs.writeFileSync(
        '/typescript-transform-runtime/stack-caller.cjs',
        `const target = require('./stack-cjs.cts');
         module.exports = function callTypeScript() { target.failCjs(); };`,
    );
    let rewrittenCjsRuntimeStack;
    try {
        require('/typescript-transform-runtime/stack-caller.cjs')();
    } catch (error) {
        rewrittenCjsRuntimeStack = error.stack;
    }
    process.execArgv.push('--no-enable-source-maps');
    fs.writeFileSync(
        '/typescript-transform-runtime/stack-disabled-sites.mts',
        `import { getCallSites } from 'node:util';
         enum StackShift { Value }
         export function captureDisabledSite() {
             return getCallSites(1)[0];
         }`,
    );
    fs.writeFileSync(
        '/typescript-transform-runtime/stack-disabled.mts',
        `enum StackShift { Value }
         export function failDisabled(): never {
             throw new Error('disabled-typescript-stack');
         }`,
    );
    let disabledRuntimeStack;
    let disabledCallSite;
    try {
        (await import('/typescript-transform-runtime/stack-disabled.mts')).failDisabled();
    } catch (error) {
        disabledRuntimeStack = error.stack;
    }
    try {
        disabledCallSite = (await import(
            '/typescript-transform-runtime/stack-disabled-sites.mts'
        )).captureDisabledSite();
    } finally {
        process.execArgv.pop();
    }
    fs.writeFileSync(
        '/typescript-transform-runtime/stack-entry.mts',
        `enum StackShift { Value }
         export async function run(): Promise<never> {
             await Promise.resolve();
             throw new Error('entry-typescript-stack');
         }`,
    );
    let executionEntryStack;
    try {
        await runJavaScript({
            cwd: '/typescript-transform-runtime',
            entry: './stack-entry.mts',
        });
    } catch (error) {
        executionEntryStack = error.message;
    }
    let executionInlineStack;
    try {
        await runJavaScript({
            language: 'typescript',
            source: `enum StackShift { Value }
                     await Promise.resolve();
                     throw new Error('inline-typescript-stack');`,
        });
    } catch (error) {
        executionInlineStack = error.message;
    }
    return JSON.stringify({
        processFeature: process.features.typescript,
        transformObservability: typeof globalThis.__wasm_rquickjs_get_typescript_module_transform_count,
        transformedModule,
        executionEntry: executionEntry.value,
        commonJsExecutionEntry: commonJsExecutionEntry.value,
        filesystemProject: filesystemProject.value,
        nodeModulesTypeScriptError,
        nodeModulesTypeScriptErrorName,
        commonJsNodeModulesTypeScriptError,
        commonJsNodeModulesTypeScriptErrorName,
        executionInline: executionInline.value,
        largeInlineExecution: largeInlineExecution.value,
        transformLatencyMs,
        esmRuntimeStack,
        cjsRuntimeStack,
        importedCjsRuntimeStack,
        rewrittenCjsRuntimeStack,
        disabledRuntimeStack,
        executionEntryStack,
        executionInlineStack,
        typeErrorRuntimeStack,
        customErrorRuntimeStack,
        syntaxErrorRuntimeStack,
        errorConstructorsStable,
        errorConstructorMetadata,
        errorConstructorRelationships,
        nonWritablePrepareStack,
        prepareSetterCalls,
        nestedPrepareCalls,
        nestedPrepareStack,
        generatedSite: {
            fileName: generatedSiteFile,
            lineNumber: generatedSiteLine,
            columnNumber: generatedSiteColumn,
        },
        preparedOrigin,
        callSites,
        disabledCallSite,
        reexportPreparedRuntimeStack,
    });
}
