import fs from 'node:fs';
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
    const executionInline = await runJavaScript({
        language: 'typescript',
        source: 'enum Direction { Up, Down } return Direction.Down;',
    });
    const boundaryPrefix = 'enum Direction { Up, Down } return Direction.Down;/*';
    const boundarySuffix = '*/';
    const boundarySource = boundaryPrefix +
        'x'.repeat(256 * 1024 - boundaryPrefix.length - boundarySuffix.length) +
        boundarySuffix;
    const boundaryStartedAt = Date.now();
    const executionBoundary = await runJavaScript({
        language: 'typescript',
        source: boundarySource,
        timeoutMs: 2000,
    });
    const boundaryTransformMs = Date.now() - boundaryStartedAt;
    return JSON.stringify({
        processFeature: process.features.typescript,
        transformedModule,
        executionEntry: executionEntry.value,
        filesystemProject: filesystemProject.value,
        executionInline: executionInline.value,
        executionBoundary: executionBoundary.value,
        boundaryTransformMs,
    });
}
