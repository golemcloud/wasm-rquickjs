import fs from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { runJavaScript, startJavaScript } from 'wasm-rquickjs:execution';

const ROOT = '/typescript-transform-latency';

function stringify(value) {
    return JSON.stringify(value);
}

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

function sourceFor(kind, sourceBytes) {
    const prefix = typedPrefix(Number(sourceBytes));
    if (kind === 'inline') return `${prefix}return 42 as number;`;
    if (kind === 'transform-only') {
        return `${prefix}enum Direction { Up, Down } return 41 + Direction.Down;`;
    }
    if (kind === 'entry' || kind === 'esm') {
        return `${prefix}export default function run(): number { return 42; }`;
    }
    if (kind === 'cjs') {
        return `${prefix}exports.run = function run(): number { return 42; };`;
    }
    throw new Error(`unknown transform case: ${kind}`);
}

function pathFor(kind, sourceBytes, sample) {
    const extension = kind === 'cjs' ? 'cts' : kind === 'prepared-esm' ? 'mjs' : 'mts';
    return `${ROOT}/${kind}-${sourceBytes}-${sample}.${extension}`;
}

export async function measureCase(kind, sourceBytes, sample) {
    fs.mkdirSync(ROOT, { recursive: true });
    const source = sourceFor(kind === 'api' || kind === 'prepared-esm' ? 'esm' : kind, sourceBytes);
    let preparedPath;
    if (kind === 'prepared-esm') {
        preparedPath = pathFor(kind, sourceBytes, sample);
        fs.writeFileSync(
            preparedPath,
            stripTypeScriptTypes(source, { mode: process.features.typescript }),
        );
    }
    const started = performance.now();
    let result;
    if (kind === 'api') {
        const code = stripTypeScriptTypes(source, { mode: process.features.typescript });
        result = { value: code.length, overflowed: false };
    } else if (kind === 'prepared-esm') {
        result = await runJavaScript({ source: `
            const loaded = await import(${JSON.stringify(preparedPath)});
            return loaded.default();
        ` });
    } else if (kind === 'inline' || kind === 'transform-only') {
        result = await runJavaScript({ language: 'typescript', source });
    } else {
        const path = pathFor(kind, sourceBytes, sample);
        fs.writeFileSync(path, source);
        if (kind === 'entry') {
            result = await runJavaScript({ cwd: ROOT, entry: path });
        } else if (kind === 'esm') {
            result = await runJavaScript({ source: `
                const loaded = await import(${JSON.stringify(path)});
                return loaded.default();
            ` });
        } else {
            result = await runJavaScript({ source: `
                const { createRequire } = await import('node:module');
                const require = createRequire('/typescript-transform-latency/runner.cjs');
                return require(${JSON.stringify(path)}).run();
            ` });
        }
    }
    return stringify({
        kind,
        requestedSourceBytes: Number(sourceBytes),
        actualSourceBytes: source.length,
        elapsedMs: performance.now() - started,
        value: kind === 'api' ? undefined : result.value,
        outputBytes: kind === 'api' ? result.value : undefined,
        overflowed: result.overflowed,
    });
}

export async function probeControls(sourceBytes) {
    const prefix = typedPrefix(Number(sourceBytes));

    const timeoutStarted = performance.now();
    let timeout;
    try {
        await runJavaScript({
            language: 'typescript',
            timeoutMs: 1,
            source: `${prefix}await new Promise(() => {});`,
        });
        timeout = { timedOut: false };
    } catch (error) {
        timeout = {
            timedOut: error.message === 'execution job timed out',
            message: error.message,
            completedMs: performance.now() - timeoutStarted,
        };
    }

    const cancellationStarted = performance.now();
    const job = startJavaScript({
        language: 'typescript',
        source: `${prefix}await new Promise(() => {});`,
    });
    const requestedMs = 1;
    let issuedMs;
    const cancelTimer = setTimeout(() => {
        issuedMs = performance.now() - cancellationStarted;
        job.cancel();
    }, requestedMs);
    let cancellation;
    try {
        await job.result;
        cancellation = { cancelled: false };
    } catch (error) {
        cancellation = {
            cancelled: error.message === 'execution job cancelled',
            message: error.message,
            requestedMs,
            issuedMs,
            completedMs: performance.now() - cancellationStarted,
        };
    } finally {
        clearTimeout(cancelTimer);
    }

    return stringify({ timeout, cancellation });
}

export async function probeConcurrency(sourceBytes) {
    const source = sourceFor('esm', sourceBytes);
    const requestedMs = 1;
    const baselineStarted = performance.now();
    await new Promise(resolve => setTimeout(resolve, requestedMs));
    const baselineTimerMs = performance.now() - baselineStarted;

    const started = performance.now();
    let siblingIssuedMs;
    const sibling = new Promise(resolve => setTimeout(() => {
        siblingIssuedMs = performance.now() - started;
        resolve();
    }, requestedMs));
    const transformStarted = performance.now();
    const output = stripTypeScriptTypes(source, { mode: process.features.typescript });
    const transformMs = performance.now() - transformStarted;
    await sibling;
    return stringify({
        requestedMs,
        baselineTimerMs,
        transformMs,
        siblingIssuedMs,
        incrementalSiblingDelayMs: siblingIssuedMs - baselineTimerMs,
        elapsedMs: performance.now() - started,
        outputBytes: output.length,
    });
}
