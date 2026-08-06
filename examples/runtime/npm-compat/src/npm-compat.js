import { runJavaScript } from 'wasm-rquickjs:execution';

const npmCli = '/tool/npm/lib/cli.js';

async function executeNpm(args, timeoutMs) {
    try {
        const result = await runJavaScript({
            cwd: '/workspace',
            argv: ['node', '/tool/npm/bin/npm-cli.js', ...args],
            env: {
                HOME: '/home/npm',
                NODE: process.execPath,
                NPM: '/tool/npm/bin/npm-cli.js',
                NPM_CONFIG_AUDIT: 'false',
                NPM_CONFIG_CACHE: '/cache/npm',
                NPM_CONFIG_FUND: 'false',
                NPM_CONFIG_FETCH_RETRIES: '0',
                NPM_CONFIG_PREFIX: '/prefix',
                NPM_CONFIG_UPDATE_NOTIFIER: 'false',
            },
            maxBytes: 4 * 1024 * 1024,
            timeoutMs,
            source: `
            const cli = (await import(${JSON.stringify(npmCli)})).default;
            const originalExit = process.exit;
            process.exit = code => {
                if (code !== undefined) process.exitCode = Number(code);
                if (!process._exiting) {
                    process._exiting = true;
                    process.emit('exit', process.exitCode || 0);
                }
            };
            try {
                await cli(process);
                await new Promise(resolve => setTimeout(resolve, 0));
                return { exitCode: process.exitCode || 0 };
            } finally {
                process.exit = originalExit;
            }
            `,
        });
        return JSON.stringify(result);
    } catch (error) {
        return JSON.stringify({
            runnerError: {
                name: error && error.name,
                message: error && error.message,
                stack: error && error.stack,
            },
        });
    }
}

export async function run(args) {
    return executeNpm(args, 30_000);
}

export async function runWithTimeout(args, timeoutMs) {
    return executeNpm(args, timeoutMs);
}

export async function runNpx(args) {
    const result = await runJavaScript({
        cwd: '/workspace',
        argv: ['node', '/tool/npm/bin/npx-cli.js', ...args],
        env: {
            HOME: '/home/npm',
            NODE: process.execPath,
            NPM: '/tool/npm/bin/npm-cli.js',
            NPM_CONFIG_AUDIT: 'false',
            NPM_CONFIG_CACHE: '/cache/npm',
            NPM_CONFIG_FUND: 'false',
            NPM_CONFIG_PREFIX: '/prefix',
            NPM_CONFIG_UPDATE_NOTIFIER: 'false',
        },
        maxBytes: 4 * 1024 * 1024,
        timeoutMs: 30_000,
        source: `
            const originalExit = process.exit;
            process.exit = code => {
                if (code !== undefined) process.exitCode = Number(code);
                if (!process._exiting) {
                    process._exiting = true;
                    process.emit('exit', process.exitCode || 0);
                }
            };
            try {
                await import('/tool/npm/bin/npx-cli.js');
                for (let attempt = 0; attempt < 3_000 && !process._exiting; attempt++) {
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
                return { exitCode: process.exitCode || 0 };
            } finally {
                process.exit = originalExit;
            }
        `,
    });
    return JSON.stringify(result);
}

export async function runInstalled() {
    const result = await runJavaScript({
        cwd: '/workspace',
        source: `
            const dependency = (await import('fixture-dependency')).default;
            return dependency();
        `,
    });
    return JSON.stringify(result);
}

export async function runRegistryInstalled() {
    const result = await runJavaScript({
        cwd: '/workspace',
        source: `
            const dependency = (await import('fixture-registry-dependency')).default;
            return dependency();
        `,
    });
    return JSON.stringify(result);
}

export async function runPackageFormats() {
    const result = await runJavaScript({
        cwd: '/workspace',
        source: `
            const { createRequire } = await import('node:module');
            const require = createRequire('/workspace/format-probe.cjs');
            const commonjs = require('fixture-commonjs-dependency');
            const dualEsm = (await import('fixture-dual-dependency')).default;
            const dualCommonjs = require('fixture-dual-dependency');
            return { commonjs, dualEsm, dualCommonjs };
        `,
    });
    return JSON.stringify(result);
}

export async function runBinDirect() {
    const result = await runJavaScript({
        cwd: '/workspace',
        source: `
            const { spawn } = await import('node:child_process');
            const fs = await import('node:fs');
            const binPath = '/workspace/node_modules/.bin/fixture-bin';
            const probe = {};
            for (const [name, operation] of Object.entries({
                source: () => fs.readFileSync(binPath, 'utf8').split('\\n', 1)[0],
                link: () => fs.readlinkSync(binPath),
                realpath: () => fs.realpathSync(binPath),
            })) {
                try {
                    probe[name] = operation();
                } catch (error) {
                    probe[name] = error.code + ':' + error.message;
                }
            }
            const child = spawn('sh', ['-c', 'fixture-bin direct'], {
                cwd: '/workspace',
                env: { PATH: '/workspace/node_modules/.bin' },
            });
            let stdout = '';
            let stderr = '';
            let error = null;
            const events = [];
            child.stdout.on('data', chunk => { stdout += chunk.toString(); });
            child.stderr.on('data', chunk => { stderr += chunk.toString(); });
            child.on('error', value => {
                events.push('error');
                error = value.code + ':' + value.message;
            });
            child.on('exit', () => { events.push('exit'); });
            const state = await new Promise(resolve => {
                child.on('close', (code, signal) => {
                    events.push('close');
                    resolve({ code, signal });
                });
            });
            return { ...state, stdout, stderr, error, events, probe };
        `,
    });
    return JSON.stringify(result);
}

export function probeRuntime() {
    return JSON.stringify({
        cwd: process.cwd(),
        fileUrl: new URL('file:packages/fixture-dependency', 'file:///workspace/').pathname,
    });
}

export async function probePrimitives() {
    const result = await runJavaScript({
        cwd: '/workspace',
        source: `
            const { createRequire } = await import('node:module');
            const require = createRequire('/workspace/probe.cjs');
            const constants = require('node:constants');
            const v8 = require('node:v8');
            const zlib = require('node:zlib');
            const original = Buffer.from([1, 2, 3]);
            const view = original.subarray(1, 3);
            view[0] = 9;
            const compressed = zlib.gzipSync('npm');
            return {
                constantsCjs: typeof constants.COPYFILE_EXCL === 'number',
                heapSizeLimit: v8.getHeapStatistics().heap_size_limit,
                bufferView: Buffer.isBuffer(view) && original[1] === 9,
                zlibRoundTrip: zlib.gunzipSync(compressed).toString() === 'npm',
            };
        `,
    });
    return JSON.stringify(result);
}
