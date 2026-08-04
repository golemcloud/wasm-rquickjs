import { runJavaScript, startJavaScript } from 'wasm-rquickjs:execution';

export async function run() {
    await runJavaScript({ source: `
        const fs = await import('node:fs');
        fs.mkdirSync('/tmp/execution-app/node_modules/execution-pkg', { recursive: true });
        fs.mkdirSync('/tmp/execution-other', { recursive: true });
        fs.mkdirSync('/tmp/execution-isolation-left', { recursive: true });
        fs.mkdirSync('/tmp/execution-isolation-right', { recursive: true });
        fs.mkdirSync('/tmp/execution-cache/node_modules/cache-pkg', { recursive: true });
        fs.writeFileSync('/tmp/execution-shared-mode.txt', 'shared');
        for (const path of ['/tmp/execution-ready-left', '/tmp/execution-ready-right']) {
            try { fs.rmSync(path, { force: true, recursive: true }); } catch {}
        }
        fs.writeFileSync('/tmp/execution-app/local.mjs', 'export default "local";');
        fs.writeFileSync('/tmp/execution-app/local.cjs', 'module.exports = "cjs";');
        fs.writeFileSync('/tmp/execution-app/value.json', JSON.stringify({ value: 'json' }));
        fs.writeFileSync('/tmp/execution-app/node_modules/execution-pkg/package.json', JSON.stringify({
            name: 'execution-pkg', type: 'module', exports: './index.mjs',
        }));
        fs.writeFileSync('/tmp/execution-app/node_modules/execution-pkg/index.mjs',
            'export default "package";');
        fs.writeFileSync('/tmp/execution-app/entry.mjs',
            'export function run() { return { kind: "entry", argv: process.argv }; }');
        fs.writeFileSync('/tmp/execution-cache/node_modules/cache-pkg/package.json', JSON.stringify({
            name: 'cache-pkg', type: 'module', exports: './first.mjs',
        }));
        fs.writeFileSync('/tmp/execution-cache/node_modules/cache-pkg/first.mjs',
            'export default "first";');
        fs.writeFileSync('/tmp/execution-cache/node_modules/cache-pkg/second.mjs',
            'export default "second";');
    ` });

    let firstChunkResolve;
    const firstChunk = new Promise(resolve => { firstChunkResolve = resolve; });
    let resultSettled = false;
    let liveStdout = '';
    let liveStderr = '';
    const ordering = [];
    const live = startJavaScript({ source: `
        console.log('live:first');
        await new Promise(resolve => setTimeout(resolve, 20));
        console.warn('live:warn');
        console.error('live:error');
        console.log('live:last');
        return { label: process.env.LABEL, argv: process.argv };
    `, env: { LABEL: 'live' }, argv: ['execution', 'live'] });
    live.result.finally(() => { resultSettled = true; });
    live.stdout.setEncoding('utf8');
    live.stderr.setEncoding('utf8');
    live.stdout.on('data', chunk => {
        liveStdout += chunk;
        ordering.push('data');
        firstChunkResolve();
    });
    live.stderr.on('data', chunk => { liveStderr += chunk; });
    await firstChunk;
    const streamedBeforeResult = !resultSettled;
    let parentProgress = false;
    await new Promise(resolve => setTimeout(() => { parentProgress = true; resolve(); }, 1));
    const liveResult = await live.result;
    ordering.push('result');

    const [left, right] = await Promise.all([
        runJavaScript({ source: `console.log(process.env.LABEL); return process.env.LABEL;`, env: { LABEL: 'left' } }),
        runJavaScript({ source: `console.log(process.env.LABEL); return process.env.LABEL;`, env: { LABEL: 'right' } }),
    ]);

    const packageCacheFirst = await runJavaScript({
        cwd: '/tmp/execution-cache', source: `return (await import('cache-pkg')).default;`,
    });
    await runJavaScript({ source: `
        const fs = await import('node:fs');
        fs.writeFileSync('/tmp/execution-cache/node_modules/cache-pkg/package.json', JSON.stringify({
            name: 'cache-pkg', type: 'module', exports: './second.mjs',
        }));
    ` });
    const packageCacheSecond = await runJavaScript({
        cwd: '/tmp/execution-cache', source: `return (await import('cache-pkg')).default;`,
    });

    const timeoutSuccess = await runJavaScript({ source: `return 'quick';`, timeoutMs: 1000 });
    let timeoutError;
    try {
        await runJavaScript({ source: `await new Promise(resolve => setTimeout(resolve, 50));`, timeoutMs: 10 });
    } catch (error) {
        timeoutError = error.message;
    }
    let tightLoopTimeoutError;
    try {
        await runJavaScript({ source: `while (true) {}`, timeoutMs: 5 });
    } catch (error) {
        tightLoopTimeoutError = error.message;
    }
    const cpuBeforeSuspend = startJavaScript({ source: `
        console.log('burn:start:' + Date.now());
        const burnStarted = Date.now();
        while (Date.now() - burnStarted < 300) {}
        await new Promise(() => {});
    `, timeoutMs: 400 });
    cpuBeforeSuspend.stdout.setEncoding('utf8');
    const cpuBeforeSuspendStarted = await new Promise((resolve, reject) => {
        cpuBeforeSuspend.stdout.once('data', chunk => {
            const match = /^burn:start:(\d+)\n$/.exec(chunk);
            if (match === null) {
                reject(new Error(`unexpected burn sentinel: ${chunk}`));
                return;
            }
            resolve(Number(match[1]));
        });
    });
    let cpuBeforeSuspendTimeoutError;
    try {
        await cpuBeforeSuspend.result;
    } catch (error) {
        cpuBeforeSuspendTimeoutError = error.message;
    }
    const cpuBeforeSuspendElapsedMs = Date.now() - cpuBeforeSuspendStarted;
    let zeroTimeoutCode;
    try { startJavaScript({ source: `return 1;`, timeoutMs: 0 }); }
    catch (error) { zeroTimeoutCode = error.code; }
    let hugeTimeoutCode;
    try { startJavaScript({ source: `return 1;`, timeoutMs: Number.MAX_SAFE_INTEGER }); }
    catch (error) { hugeTimeoutCode = error.code; }
    const invalidProgramOptions = {};
    for (const [name, options] of Object.entries({
        invalidEntry: { entry: 42 },
        invalidSource: { source: 42 },
        invalidEntryWithSource: { entry: 42, source: `return 1;` },
        invalidSourceWithEntry: { entry: './entry.mjs', source: 42 },
        both: { entry: './entry.mjs', source: `return 1;` },
    })) {
        try { startJavaScript(options); }
        catch (error) { invalidProgramOptions[name] = error.code ?? error.message; }
    }

    let overflowError;
    try {
        await runJavaScript({
            source: `console.log('123456'); await new Promise(() => {});`, maxBytes: 4,
        });
    } catch (error) {
        overflowError = error.message;
    }
    const truncated = await runJavaScript({
        source: `process.stderr.write('ééé'); return 'ok';`, maxBytes: 5, overflow: 'truncate',
    });

    const entry = await runJavaScript({ entry: './entry.mjs', cwd: '/tmp/execution-app' });
    const defaultArgv = await runJavaScript({ source: `return process.argv;` });
    const imports = await runJavaScript({ cwd: '/tmp/execution-app', source: `
        const local = await import('./local.mjs');
        const pkg = await import('execution-pkg');
        const { createRequire } = await import('node:module');
        const require = createRequire(process.cwd() + '/__wasm_rquickjs_execution_inline.mjs');
        const json = require('./value.json');
        const cjs = require('./local.cjs');
        process.chdir('/tmp/execution-other');
        const afterChdir = await import('./local.mjs');
        return { local: local.default, package: pkg.default, json: json.value,
            cjs, afterChdir: afterChdir.default, cwd: process.cwd() };
    ` });
    const privateImport = await runJavaScript({ cwd: '/tmp/execution-app', source: `
        try { await import('__wasm_rquickjs_builtin/execution_native'); }
        catch (error) { return error.code; }
        return 'unexpected-success';
    ` });
    const removedAliases = await runJavaScript({ source: `
        let legacySpecifier;
        try { await import('golem:code-runner'); }
        catch (error) { legacySpecifier = error.code; }
        const execution = await import('wasm-rquickjs:execution');
        return { legacySpecifier, spawnJavaScript: typeof execution.spawnJavaScript };
    ` });

    const clone = await runJavaScript({ source: `
        const cycle = { label: 'cycle' };
        cycle.self = cycle;
        return {
            missing: undefined, nan: NaN, infinity: Infinity, negativeInfinity: -Infinity,
            negativeZero: -0, bigint: 12345678901234567890n, cycle,
            map: new Map([['key', 7]]), set: new Set(['value']),
            bytes: new Uint8Array([1, 2, 3]),
        };
    ` });
    const cloneChecks = {
        hasUndefined: Object.hasOwn(clone.value, 'missing') && clone.value.missing === undefined,
        nan: Number.isNaN(clone.value.nan),
        infinity: clone.value.infinity === Infinity,
        negativeInfinity: clone.value.negativeInfinity === -Infinity,
        negativeZero: Object.is(clone.value.negativeZero, -0),
        bigint: clone.value.bigint === 12345678901234567890n,
        cycle: clone.value.cycle.self === clone.value.cycle,
        map: clone.value.map instanceof Map && clone.value.map.get('key') === 7,
        set: clone.value.set instanceof Set && clone.value.set.has('value'),
        bytes: clone.value.bytes instanceof Uint8Array && clone.value.bytes.join(',') === '1,2,3',
    };
    let resourceError;
    try {
        await runJavaScript({ source: `
            return { [Symbol.for('__wasm_rquickjs.structuredClone')]() { return 1; } };
        ` });
    } catch (error) {
        resourceError = error.message;
    }

    const pathAliases = await runJavaScript({ source: `
        const fs = await import('node:fs');
        fs.mkdirSync('/tmp/alias/sub', { recursive: true });
        fs.writeFileSync('/tmp/alias/file.txt', 'before');
        fs.chmodSync('/tmp/alias/sub/../file.txt', 0o611);
        const mode = fs.statSync('/tmp/alias/file.txt').mode & 0o7777;
        fs.symlinkSync('./sub/../file.txt', '/tmp/alias/link.txt');
        const link = fs.readlinkSync('/tmp/alias/sub/../link.txt');
        const real = fs.realpathSync('/tmp/alias/sub/../link.txt');
        fs.renameSync('/tmp/alias/sub/../file.txt', '/tmp/alias/sub/../renamed.txt');
        const renamed = fs.readFileSync('/tmp/alias/renamed.txt', 'utf8');
        return { mode, link, real, renamed };
    ` });

    const isolationSource = `
        const fs = await import('node:fs');
        const label = process.env.LABEL;
        const other = label === 'left' ? 'right' : 'left';
        const expectedMode = label === 'left' ? 0o600 : 0o640;
        fs.writeFileSync('./data.txt', label);
        const fd = fs.openSync('./data.txt', 'r');
        const secondFd = label === 'left' ? fs.openSync('./data.txt', 'r') : null;
        let foreignFdError = null;
        if (label === 'right') {
            try { fs.fstatSync(fd + 1); } catch (error) { foreignFdError = error.code; }
        }
        fs.chmodSync('/tmp/execution-shared-mode.txt', expectedMode);
        fs.writeFileSync('./target.txt', label + ':target');
        fs.symlinkSync('./target.txt', './link.txt');
        fs.mkdirSync('./node_modules/isolation-pkg', { recursive: true });
        fs.writeFileSync('./node_modules/isolation-pkg/package.json', JSON.stringify({
            name: 'isolation-pkg', type: 'module', exports: './index.mjs',
        }));
        fs.writeFileSync('./node_modules/isolation-pkg/index.mjs',
            'export default process.env.LABEL + ":package";');
        fs.writeFileSync('/tmp/execution-ready-' + label, 'ready');
        while (!fs.existsSync('/tmp/execution-ready-' + other)) {
            await new Promise(resolve => setTimeout(resolve, 1));
        }
        const mode = fs.statSync('/tmp/execution-shared-mode.txt').mode & 0o7777;
        const linkTarget = fs.readlinkSync('./link.txt');
        const linkValue = fs.readFileSync('./link.txt', 'utf8');
        const packageModule = await import('isolation-pkg');
        console.log(label + ':stdout');
        process.stderr.write(label + ':stderr\\n');
        fs.closeSync(fd);
        if (secondFd !== null) fs.closeSync(secondFd);
        return { label, cwd: process.cwd(), fd, secondFd, foreignFdError,
            mode, linkTarget, linkValue, packageValue: packageModule.default };
    `;
    const [isolationLeft, isolationRight] = await Promise.all([
        runJavaScript({ cwd: '/tmp/execution-isolation-left', source: isolationSource,
            env: { LABEL: 'left' }, timeoutMs: 2000 }),
        runJavaScript({ cwd: '/tmp/execution-isolation-right', source: isolationSource,
            env: { LABEL: 'right' }, timeoutMs: 2000 }),
    ]);

    const cancelledJob = startJavaScript({ source: `await new Promise(() => {});` });
    setTimeout(() => cancelledJob.cancel(), 1);
    let cancellationError;
    try { await cancelledJob.result; }
    catch (error) { cancellationError = error.message; }
    const nested = await runJavaScript({ source: `
        const { startJavaScript } = await import('wasm-rquickjs:execution');
        try { startJavaScript({ source: "return 'nested';" }); }
        catch (error) { return error.message; }
    ` });
    const heldJobs = Array.from({ length: 8 }, () => startJavaScript({
        source: `await new Promise(() => {});`,
    }));
    let capacityError;
    try { startJavaScript({ source: `return 'ninth';` }); }
    catch (error) { capacityError = error.message; }
    for (const job of heldJobs) job.cancel();
    await Promise.allSettled(heldJobs.map(job => job.result));
    const reclaimed = await runJavaScript({ source: `return 'reclaimed';` });

    return JSON.stringify({
        liveStdout, liveStderr, liveResult, ordering, streamedBeforeResult, parentProgress,
        left, right, packageCacheFirst, packageCacheSecond,
        timeoutSuccess, timeoutError, tightLoopTimeoutError,
        cpuBeforeSuspendTimeoutError, cpuBeforeSuspendElapsedMs,
        zeroTimeoutCode, hugeTimeoutCode, invalidProgramOptions,
        overflowError, truncated, entry, defaultArgv, imports,
        privateImport, removedAliases, cloneChecks, resourceError, pathAliases,
        cancellationError, nested, capacityError, reclaimed,
        isolation: { left: isolationLeft, right: isolationRight },
    });
}
