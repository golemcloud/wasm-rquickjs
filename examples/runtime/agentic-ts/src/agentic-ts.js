import { runJavaScript, startJavaScript } from 'wasm-rquickjs:execution';

const TSC = '/workspace/node_modules/typescript/lib/tsc.js';
const TYPESCRIPT = '/workspace/node_modules/typescript/lib/typescript.js';
const TYPESCRIPT_PROFILER = '/workspace/profile-typescript.mjs';

function stringify(value) {
    return JSON.stringify(value);
}

export async function runTsc(args, timeoutMs) {
    try {
        return stringify(await runJavaScript({
            cwd: '/workspace',
            argv: ['node', TSC, ...args],
            env: { HOME: '/workspace/.home', PATH: '/workspace/node_modules/.bin' },
            maxBytes: 8 * 1024 * 1024,
            timeoutMs: Number(timeoutMs),
            source: `
                const started = performance.now();
                const memoryBeforeToolLoad = process.memoryUsage();
                const originalExit = process.exit;
                process.exit = code => { process.exitCode = Number(code || 0); };
                try {
                    await import(${JSON.stringify(TSC)});
                    return {
                        exitCode: process.exitCode || 0,
                        toolAndCompilerMs: performance.now() - started,
                        quickJsMemory: {
                            beforeToolLoad: memoryBeforeToolLoad,
                            afterCompiler: process.memoryUsage(),
                        },
                    };
                } finally {
                    process.exit = originalExit;
                }
            `,
        }));
    } catch (error) {
        return stringify({ runnerError: { name: error.name, message: error.message } });
    }
}

export async function profileTsc(timeoutMs) {
    try {
        return stringify(await runJavaScript({
            cwd: '/workspace',
            timeoutMs: Number(timeoutMs),
            source: `
                const { profileTypeScript } = await import(${JSON.stringify(TYPESCRIPT_PROFILER)});
                return profileTypeScript({
                    typescriptPath: ${JSON.stringify(TYPESCRIPT)},
                    projectPath: '/workspace/projects/core/tsconfig.json',
                });
            `,
        }));
    } catch (error) {
        return stringify({ runnerError: { name: error.name, message: error.message } });
    }
}

export async function runEntry(path) {
    return stringify(await runJavaScript({ cwd: '/workspace', entry: path }));
}

export async function runGenerated(path) {
    return stringify(await runJavaScript({ cwd: '/workspace', entry: path }));
}

export async function runCpu() {
    return stringify(await runJavaScript({ source: `
        let value = 0;
        for (let index = 0; index < 2_000_000; index++) value = (value + index) % 1_000_003;
        return value;
    ` }));
}

export async function runIo() {
    return stringify(await runJavaScript({ cwd: '/workspace', source: `
        const fs = await import('node:fs/promises');
        const files = await fs.readdir('/workspace/projects');
        const text = await fs.readFile('/workspace/projects/app/src/index.ts', 'utf8');
        return { files, bytes: text.length };
    ` }));
}

export async function runConcurrent() {
    const started = performance.now();
    async function timed(work) {
        const siblingStarted = performance.now();
        const result = await work();
        const completed = performance.now();
        return {
            startedMs: siblingStarted - started,
            completedMs: completed - started,
            wallMs: completed - siblingStarted,
            result,
        };
    }
    const [compiler, cpu, io] = await Promise.all([
        timed(() => runJavaScript({
            cwd: '/workspace',
            argv: ['node', TSC, '--noEmit', '--incremental', '-p', 'projects/core/tsconfig.json'],
            timeoutMs: 300_000,
            source: `
                const originalExit = process.exit;
                process.exit = code => { process.exitCode = Number(code || 0); };
                try {
                    await import(${JSON.stringify(TSC)});
                    return { exitCode: process.exitCode || 0 };
                } finally { process.exit = originalExit; }
            `,
        })),
        timed(() => runJavaScript({ source: `
            let value = 0;
            for (let index = 0; index < 2_000_000; index++) value = (value + index) % 1_000_003;
            return value;
        ` })),
        timed(() => runJavaScript({ cwd: '/workspace', source: `
            const fs = await import('node:fs/promises');
            const files = await fs.readdir('/workspace/projects');
            const text = await fs.readFile('/workspace/projects/app/src/index.ts', 'utf8');
            return { files, bytes: text.length };
        ` })),
    ]);
    return stringify({ elapsedMs: performance.now() - started, compiler, cpu, io });
}

export async function probeTimeout() {
    try {
        await runJavaScript({ timeoutMs: 20, source: `while (true) {}` });
        return stringify({ timedOut: false });
    } catch (error) {
        return stringify({
            timedOut: error.name === 'Error' && error.message === 'execution job timed out',
            name: error.name,
            message: error.message,
        });
    }
}

export async function probeCancellation() {
    const job = startJavaScript({ source: `await new Promise(() => {});` });
    await new Promise(resolve => setTimeout(resolve, 10));
    const started = performance.now();
    job.cancel();
    try {
        await job.result;
        return stringify({ cancelled: false });
    } catch (error) {
        return stringify({
            cancelled: error.name === 'Error' && error.message === 'execution job cancelled',
            latencyMs: performance.now() - started,
            name: error.name,
            message: error.message,
        });
    }
}
