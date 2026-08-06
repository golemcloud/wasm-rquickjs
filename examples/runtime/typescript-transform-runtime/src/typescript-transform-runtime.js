import fs from 'node:fs';
import { createRequire } from 'node:module';
import { runJavaScript } from 'wasm-rquickjs:execution';

export async function run() {
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
    return JSON.stringify({
        processFeature: process.features.typescript,
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
    });
}
