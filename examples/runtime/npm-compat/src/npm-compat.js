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

export async function runInstalledTypescript() {
    const project = await runJavaScript({
        cwd: '/workspace',
        entry: './typescript-app.ts',
    });
    const rawTypeScriptDependency = await runJavaScript({
        cwd: '/workspace',
        source: `
            try {
                await import('fixture-dependency/raw-typescript');
                return { loaded: true };
            } catch (error) {
                return { code: error.code, name: error.name, message: error.message };
            }
        `,
    });
    return JSON.stringify({
        project,
        rawTypeScriptDependencyError: rawTypeScriptDependency.value,
    });
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
                mode: () => fs.statSync(binPath).mode & 0o777,
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
            const fs = require('node:fs');
            const v8 = require('node:v8');
            const zlib = require('node:zlib');
            const { exec, execFile, spawn, spawnSync } = require('node:child_process');
            const original = Buffer.from([1, 2, 3]);
            const species = Buffer[Symbol.species];
            const hostile = Buffer.from([4, 5, 6]);
            Object.defineProperty(hostile, 'constructor', {
                value: { [Symbol.species]: class HostileSpecies extends Uint8Array {} },
            });
            let dep0005Emitted = false;
            const originalEmitWarning = process.emitWarning;
            process.emitWarning = (warning, typeOrOptions, code) => {
                const warningCode = typeOrOptions && typeof typeOrOptions === 'object'
                    ? typeOrOptions.code
                    : code;
                if (warningCode === 'DEP0005') dep0005Emitted = true;
            };
            let view;
            let mapped;
            let filtered;
            let hostileView;
            let rejectsBigIntOffset = false;
            try {
                view = original.subarray(1, 3);
                view[0] = 9;
                mapped = original.map(value => value + 1);
                filtered = original.filter(value => value > 1);
                hostileView = hostile.subarray(1);
                try {
                    original.subarray(1n);
                } catch (error) {
                    rejectsBigIntOffset = error instanceof TypeError;
                }
            } finally {
                process.emitWarning = originalEmitWarning;
            }

            const shebangDir = '/workspace/shebang-bin';
            const missDir = '/workspace/shebang-missing';
            // WASI filesystem metadata does not expose host permission bits.
            // npm establishes executable .bin modes with chmod, which our fs
            // compatibility layer records and reports through stat/fstat.
            fs.chmodSync(shebangDir + '/env-node.cjs', 0o755);
            fs.chmodSync(shebangDir + '/not-node.cjs', 0o755);
            const runShebang = (command, pathValue = shebangDir) => spawnSync(
                'sh',
                ['-c', command],
                { cwd: '/workspace', env: { PATH: pathValue } },
            );
            const envNode = runShebang('env-node.cjs', missDir + ':' + shebangDir);
            const notNode = runShebang('not-node.cjs');
            const shellSync = spawnSync(process.execPath, ['-e', 'process.stdout.write("bad")'], {
                shell: true,
            });
            const shellAsync = await new Promise(resolve => {
                const child = spawn(process.execPath, ['-e', 'process.stdout.write("bad")'], {
                    shell: true,
                });
                let error = null;
                const events = [];
                child.on('error', value => {
                    error = value;
                    events.push('error');
                });
                child.on('exit', () => events.push('exit'));
                child.on('close', code => {
                    events.push('close');
                    resolve({ code, error, events });
                });
            });
            const probeExecFailure = launch => new Promise(resolve => {
                const events = [];
                let callbackError = null;
                let emittedError = null;
                let stdout = null;
                let stderr = null;
                const child = launch((error, output, errorOutput) => {
                    callbackError = error;
                    stdout = output;
                    stderr = errorOutput;
                    events.push('callback');
                });
                child.on('error', error => {
                    emittedError = error;
                    events.push('error');
                });
                child.on('exit', () => events.push('exit'));
                child.on('close', code => {
                    events.push('close');
                    resolve({ callbackError, emittedError, code, exitCode: child.exitCode, stdout, stderr, events });
                });
            });
            const execFailure = await probeExecFailure(callback =>
                exec('wasm-rquickjs-missing-command', callback));
            const execFileFailure = await probeExecFailure(callback =>
                execFile('wasm-rquickjs-missing-command', callback));
            const genericEnvCommand = process.execPath + ' -p "process.argv[1]" "' + '$' + '{EXEC_VALUE}"';
            const genericEnvExpansion = await probeExecFailure(callback =>
                exec(genericEnvCommand, { env: { EXEC_VALUE: 'generic-env' } }, callback));
            const isEmptyOutput = value => value === '' ||
                (Buffer.isBuffer(value) && value.length === 0);
            const rejectedShellCommands = await Promise.all([
                process.execPath + ' -e "process.stdout.write(\\"partial\\")" && ' + process.execPath + ' -e "0"',
                process.execPath + ' -e "0" $UNSUPPORTED',
                process.execPath + ' -e "0" \${UNSUPPORTED}',
                process.execPath + ' -e "0" $(echo unsupported)',
                process.execPath + ' -e "0" > /workspace/partial-output',
                process.execPath + ' -e "0" ' + '\\\\' + '\\n' + 'continued',
                'echo ok | ' + process.execPath + ' -e "process.stdout.write(\\"partial\\")" && unsupported',
                'echo ok | ' + process.execPath + ' -e "0" $UNSUPPORTED',
                'echo ok | ' + process.execPath + ' -e "0" $(echo unsupported)',
                process.execPath + ' -e "process.stdout.write(\\"partial\\")" < /workspace/missing-input',
            ].map(command => probeExecFailure(callback => exec(command, callback))));
            const compressed = zlib.gzipSync('npm');
            return {
                constantsCjs: typeof constants.COPYFILE_EXCL === 'number',
                heapSizeLimit: v8.getHeapStatistics().heap_size_limit,
                bufferView: Buffer.isBuffer(view) && original[1] === 9,
                bufferSpecies: species !== Buffer && species.prototype === Buffer.prototype &&
                    Object.getPrototypeOf(species) === Uint8Array && Buffer.prototype.constructor === Buffer,
                bufferTypedArrayMethods: Buffer.isBuffer(mapped) && Buffer.isBuffer(filtered),
                bufferOperationsAvoidDep0005: !dep0005Emitted,
                bufferSubarrayEdges: original.subarray(-Infinity).length === original.length &&
                    original.subarray(Infinity).length === 0 &&
                    original.subarray(NaN, 2).length === 2 && rejectsBigIntOffset,
                bufferSubarrayIgnoresSpecies: Buffer.isBuffer(hostileView) && hostileView[0] === 5,
                shellNodeShebangs: envNode.status === 0 &&
                    envNode.stdout.toString().trim() === 'env-node:ok',
                shellSkipsPathMisses: envNode.status === 0,
                shellRejectsMisleadingShebang: notNode.status === null && notNode.error &&
                    notNode.error.code === 'ENOSYS',
                shellOptionFailsExplicitly: shellSync.status === null &&
                    shellSync.error && shellSync.error.code === 'ENOSYS' &&
                    shellAsync.code === -38 && shellAsync.error &&
                    shellAsync.error.code === 'ENOSYS' &&
                    shellAsync.events.join(',') === 'error,close',
                execFailuresOmitExit: [execFailure, execFileFailure].every(failure =>
                    failure.callbackError && failure.callbackError.code === 'ENOSYS' &&
                    failure.emittedError && failure.emittedError.code === 'ENOSYS' &&
                    failure.code === -38 && failure.exitCode === -38 &&
                    failure.events.join(',') === 'callback,error,close'),
                execExpandsPresentBracedEnv: !genericEnvExpansion.callbackError &&
                    genericEnvExpansion.stdout === 'generic-env\\n' &&
                    genericEnvExpansion.stderr === '' &&
                    genericEnvExpansion.events.join(',') === 'callback,exit,close',
                execRejectsShellSyntax: rejectedShellCommands.every(failure =>
                    failure.callbackError && failure.callbackError.code === 'ENOSYS' &&
                    failure.emittedError && failure.emittedError.code === 'ENOSYS' &&
                    failure.code === -38 && failure.exitCode === -38 &&
                    isEmptyOutput(failure.stdout) &&
                    failure.events.join(',') === 'callback,error,close'),
                shellProbe: Object.fromEntries(Object.entries({ envNode, notNode }).map(
                    ([name, result]) => [name, {
                        status: result.status,
                        error: result.error && result.error.code,
                        stdout: result.stdout.toString(),
                        stderr: result.stderr.toString(),
                    }],
                )),
                zlibRoundTrip: zlib.gunzipSync(compressed).toString() === 'npm',
            };
        `,
    });
    const runDirectShebang = async (command, expectedOutput, executable) => runJavaScript({
        cwd: '/workspace',
        source: `
            const { createRequire } = await import('node:module');
            const require = createRequire('/workspace/direct-shebang-probe.cjs');
            const { spawnSync } = require('node:child_process');
            if (${JSON.stringify(executable)}) {
                require('node:fs').chmodSync(${JSON.stringify(command)}, 0o755);
            }
            const child = spawnSync('sh', ['-c', ${JSON.stringify(command)}], {
                cwd: '/workspace',
                env: { PATH: '/workspace/shebang-bin' },
            });
            return {
                ok: child.status === 0 && child.stdout.toString().trim() === ${JSON.stringify(expectedOutput)},
                status: child.status,
                error: child.error && child.error.code,
                stdout: child.stdout.toString(),
                stderr: child.stderr.toString(),
            };
        `,
    });
    const relativeEnvShebang = await runDirectShebang(
        './shebang-bin/env-node.cjs',
        'env-node:ok',
        true,
    );
    const absoluteNodeShebang = await runDirectShebang(
        '/workspace/shebang-bin/direct-node.cjs',
        'direct-node:ok',
        true,
    );
    const directMisleadingShebang = await runDirectShebang(
        './shebang-bin/not-node.cjs',
        'not-node:bad',
        true,
    );
    const nonExecutableShebang = await runDirectShebang(
        './shebang-bin/not-executable.cjs',
        'not-executable:bad',
        false,
    );
    const nonRegularCandidate = await runDirectShebang(
        './shebang-bin',
        'directory:bad',
        false,
    );
    result.value.shellDirectNodeShebang = relativeEnvShebang.value.ok &&
        absoluteNodeShebang.value.ok;
    result.value.shellRejectsDirectMisleadingShebang =
        directMisleadingShebang.value.status === null &&
        directMisleadingShebang.value.error === 'ENOSYS';
    result.value.shellRejectsNonExecutableShebang =
        nonExecutableShebang.value.status === null &&
        nonExecutableShebang.value.error === 'ENOSYS';
    result.value.shellRejectsNonRegularCandidate =
        nonRegularCandidate.value.status === null &&
        nonRegularCandidate.value.error === 'ENOSYS';
    result.value.directShellProbe = {
        relativeEnvShebang: relativeEnvShebang.value,
        absoluteNodeShebang: absoluteNodeShebang.value,
        directMisleadingShebang: directMisleadingShebang.value,
        nonExecutableShebang: nonExecutableShebang.value,
        nonRegularCandidate: nonRegularCandidate.value,
    };
    return JSON.stringify(result);
}
