import fs from 'node:fs';

export async function run() {
    fs.mkdirSync('/typescript-transform-runtime', { recursive: true });
    fs.writeFileSync(
        '/typescript-transform-runtime/transformed.mts',
        'enum Direction { Up, Down } export default Direction.Down;',
    );
    const transformedModule =
        (await import('/typescript-transform-runtime/transformed.mts')).default;
    return JSON.stringify({
        processFeature: process.features.typescript,
        transformedModule,
    });
}
