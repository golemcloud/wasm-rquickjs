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
        executionInline: executionInline.value,
        executionBoundary: executionBoundary.value,
        boundaryTransformMs,
    });
}
