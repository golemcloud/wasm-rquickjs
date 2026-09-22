import fs from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { runJavaScript } from 'wasm-rquickjs:execution';

const ROOT = '/esm-module-load-phases';

function typedPrefix(sourceBytes) {
    const lines = [];
    let length = 0;
    for (let index = 0; length < sourceBytes; index++) {
        const line = `type Padding${index} = { value: number; next?: Padding${index} };\n`;
        lines.push(line);
        length += line.length;
    }
    return lines.join('');
}

export async function measureCase(sourceBytes, sample) {
    fs.mkdirSync(ROOT, { recursive: true });
    const path = `${ROOT}/prepared-${sourceBytes}-${sample}.mjs`;
    const typedSource = `${typedPrefix(Number(sourceBytes))}
globalThis.__esmPhaseMarks.evaluationStart = performance.now();
export default function run(): number { return 42; }
globalThis.__esmPhaseMarks.evaluationEnd = performance.now();`;
    const preparedSource = stripTypeScriptTypes(typedSource, { mode: 'strip' });
    fs.writeFileSync(path, preparedSource);

    const started = performance.now();
    const execution = await runJavaScript({ source: `
        globalThis.__esmPhaseMarks = {};
        globalThis.__esmPhaseMarks.importStart = performance.now();
        const loaded = await import(${JSON.stringify(path)});
        globalThis.__esmPhaseMarks.importResolved = performance.now();
        return {
            value: loaded.default(),
            marks: globalThis.__esmPhaseMarks,
        };
    ` });
    return JSON.stringify({
        requestedSourceBytes: Number(sourceBytes),
        actualSourceBytes: typedSource.length,
        preparedSourceBytes: preparedSource.length,
        elapsedMs: performance.now() - started,
        value: execution.value.value,
        marks: execution.value.marks,
        overflowed: execution.overflowed,
        profile: execution.profile,
    });
}
