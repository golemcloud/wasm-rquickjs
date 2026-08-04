import { stripTypeScriptTypes } from 'node:module';
import { createRequire } from 'node:module';
import fs from 'node:fs';
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
    fs.writeFileSync(
        '/typescript-runtime/runner-entry.mts',
        'export function run(): number { return 42; }',
    );
    const entryRunner = await runJavaScript({
        cwd: '/typescript-runtime',
        entry: './runner-entry.mts',
    });
    const boundaryPrefix = 'return 42;/*';
    const boundarySuffix = '*/';
    const boundarySource = boundaryPrefix +
        'x'.repeat(256 * 1024 - boundaryPrefix.length - boundarySuffix.length) +
        boundarySuffix;
    const boundaryStartedAt = Date.now();
    const boundaryRunner = await runJavaScript({
        language: 'typescript',
        source: boundarySource,
        timeoutMs: 2000,
    });
    const boundaryTransformMs = Date.now() - boundaryStartedAt;
    const sourceLimitCodes = [];
    for (const source of ['x'.repeat(256 * 1024 + 1), 'é'.repeat(128 * 1024 + 1)]) {
        try {
            startJavaScript({ language: 'typescript', source });
        } catch (error) {
            sourceLimitCodes.push(error.code);
        }
    }

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
        entryRunner: entryRunner.value,
        boundaryRunner: boundaryRunner.value,
        boundaryTransformMs,
        sourceLimitCodes,
    });
}
