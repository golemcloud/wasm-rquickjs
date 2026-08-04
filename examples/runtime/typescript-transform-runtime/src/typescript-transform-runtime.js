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
    return JSON.stringify({
        processFeature: process.features.typescript,
        transformedModule,
        executionEntry: executionEntry.value,
        executionInline: executionInline.value,
    });
}
