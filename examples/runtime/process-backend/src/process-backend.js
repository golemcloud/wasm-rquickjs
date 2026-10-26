import assert from 'node:assert/strict';
import { spawn, spawnSync, exec, execFile, execFileSync, execSync } from 'node:child_process';
import { once } from 'node:events';
import { existsSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { setProcessBackend } from 'wasm-rquickjs:child-process';
import { runJavaScript } from 'wasm-rquickjs:execution';
import { callCount } from 'wasm-rquickjs-runtime-init';
import { promisify } from 'node:util';

async function checkLocalChildLifetime(api) {
    const parent = {
        argv: [...process.argv],
        cwd: process.cwd(),
        marker: process.env.CHILD_LIFETIME_MARKER,
        exitCode: process.exitCode,
    };
    const scripts = [
        ["Promise.resolve().then(() => finish());", 'promise'],
        ["setTimeout(finish, 20);", 'timer'],
    ];
    for (const [schedule, label] of scripts) {
        const source = `
            process.stdout.write('immediate\\n');
            function finish() {
                process.stdout.write('${label}:' + process.env.CHILD_LIFETIME_MARKER + '\\n');
                process.stderr.write('${label}-stderr\\n');
                process.exitCode = 7;
            }
            ${schedule}
        `;
        const options = {
            encoding: 'utf8',
            env: { ...process.env, CHILD_LIFETIME_MARKER: label },
        };
        const result = api === 'spawnSync'
            ? spawnSync(process.execPath, ['-e', source], options)
            : await new Promise(resolve => {
                execFile(process.execPath, ['-e', source], options, (error, stdout, stderr) => {
                    resolve({ status: error ? error.code : 0, stdout, stderr });
                });
            });
        assert.equal(result.stdout, `immediate\n${label}:${label}\n`, `${api} returned before child ${label} output`);
        assert.equal(result.stderr, `${label}-stderr\n`);
        assert.equal(result.status, 7, `${api} lost the child's asynchronous exit code`);
        assert.deepEqual(process.argv, parent.argv);
        assert.equal(process.cwd(), parent.cwd);
        assert.equal(process.env.CHILD_LIFETIME_MARKER, parent.marker);
        assert.equal(process.exitCode, parent.exitCode);
    }
    return true;
}

export async function run() {
    if (existsSync('/isolated-child-probe.json')) {
        function runChild(source) {
            const result = spawnSync(process.execPath, ['-e', source], { encoding: 'utf8' });
            if (result.error) throw result.error;
            return JSON.stringify({ status: result.status, stdout: result.stdout, stderr: result.stderr });
        }
        const config = JSON.parse(readFileSync('/isolated-child-probe.json', 'utf8'));
        if (config.mode === 'unsupported') {
            const original = { argv: [...process.argv], cwd: process.cwd(), exitCode: process.exitCode };
            const inline = spawnSync(process.execPath, ['-e', `process.stdout.write(process.env.P2_CHILD); process.exitCode = 7;`], {
                encoding: 'utf8', env: { ...process.env, P2_CHILD: 'inline' },
            });
            assert.equal(inline.status, 7);
            assert.equal(inline.stdout, 'inline');
            assert.deepEqual(process.argv, original.argv);
            assert.equal(process.cwd(), original.cwd);
            assert.equal(process.exitCode, original.exitCode);
            return true;
        }
        const basic = `
            process.stdout.write('immediate\\n');
            Promise.resolve().then(() => process.stdout.write('promise\\n'));
            setTimeout(() => {
                process.stdout.write('timer\\n');
                process.stderr.write('diagnostic\\n');
                process.exitCode = 7;
            }, 20);
        `;
        async function check(source, expected) {
            const events = [];
            const parent = { argv: [...process.argv], cwd: process.cwd(), env: { ...process.env }, exitCode: process.exitCode };
            queueMicrotask(() => events.push('parent-promise'));
            setTimeout(() => events.push('parent-timer'), 0);
            const result = JSON.parse(runChild(source));
            assert.deepEqual(events, [], 'synchronous child advanced the parent');
            assert.deepEqual(result, expected);
            assert.deepEqual(process.argv, parent.argv);
            assert.equal(process.cwd(), parent.cwd);
            assert.deepEqual({ ...process.env }, parent.env);
            assert.equal(process.exitCode, parent.exitCode);
            await new Promise(resolve => setTimeout(resolve, 0));
            assert.deepEqual(events, ['parent-promise', 'parent-timer']);
        }
        const expected = { status: 7, stdout: 'immediate\npromise\ntimer\n', stderr: 'diagnostic\n' };
        if (config.mode === 'callback') {
            await new Promise((resolve, reject) => {
                setTimeout(() => check(basic, expected).then(resolve, reject), 0);
            });
        } else if (config.mode === 'nested') {
            await check(`
                Promise.resolve().then(() => {
                    let parentRan = false;
                    queueMicrotask(() => { parentRan = true; });
                    setTimeout(() => { parentRan = true; }, 0);
                    const nested = require('node:child_process').spawnSync(process.execPath,
                        ['-e', ${JSON.stringify(basic)}], { encoding: 'utf8' });
                    if (parentRan) throw new Error('nested child advanced its parent');
                    process.stdout.write(nested.status + ':' + nested.stdout);
                    process.stderr.write(nested.stderr);
                    setTimeout(() => { process.stdout.write('outer\\n'); process.exitCode = 9; }, 10);
                });
            `, { status: 9, stdout: '7:' + expected.stdout + 'outer\n', stderr: expected.stderr });
        } else if (config.mode === 'http') {
            await check(`
                fetch(${JSON.stringify(config.url)}).then(response => response.text()).then(body => {
                    process.stdout.write(body + '\\n');
                    process.exitCode = 7;
                });
            `, { status: 7, stdout: '[]\n', stderr: '' });
        } else if (config.mode === 'unref') {
            await check(`
                setInterval(() => process.stdout.write('unexpected\\n'), 60_000).unref();
                process.stdout.write('done\\n');
            `, { status: 0, stdout: 'done\n', stderr: '' });
        } else if (config.mode === 'unref-http' || config.mode === 'unref-http-after-ref') {
            await check(`
                fetch(${JSON.stringify(config.url + '/held')}).then(response => response.text()).then(body => {
                    process.stdout.write(body + '\\n');
                    process.exitCode = 7;
                });
                const release = () => setTimeout(() => {
                    process.stdout.write('timer\\n');
                    fetch(${JSON.stringify(config.url + '/release')}).then(response => response.text());
                }, 20).unref();
                if (${JSON.stringify(config.mode)} === 'unref-http-after-ref') setTimeout(release, 5);
                else release();
            `, { status: 7, stdout: 'timer\ndone\n', stderr: '' });
        } else if (config.mode === 'timer-edges') {
            for (const source of [
                `const old = setTimeout(() => {}, 1000);
                 clearTimeout(old); old.unref();
                 setTimeout(() => { process.stdout.write('done'); process.exitCode = 7; }, 5);`,
                `const old = setTimeout(() => {
                    setTimeout(() => {
                        old.unref();
                        setTimeout(() => { process.stdout.write('done'); process.exitCode = 7; }, 5);
                    }, 1);
                 }, 1);`,
                `const cancelled = setTimeout(() => process.stdout.write('unexpected'), 0);
                 clearTimeout(cancelled);
                 setTimeout(() => { process.stdout.write('done'); process.exitCode = 7; }, 5);`,
                `let count = 0;
                 const interval = setInterval(() => {
                    if (++count === 3) { clearInterval(interval); process.stdout.write('done'); process.exitCode = 7; }
                 }, 1);`,
                `const interval = setInterval(() => {
                    interval.unref(); process.stdout.write('done'); process.exitCode = 7;
                 }, 1);`,
                `const timer = setTimeout(() => { process.stdout.write('done'); process.exitCode = 7; }, 5);
                 timer.unref(); timer.ref();`,
                `setTimeout(() => {
                    setTimeout(() => { process.stdout.write('done'); process.exitCode = 7; }, 5);
                 }, 1);`,
            ]) await check(source, { status: 7, stdout: 'done', stderr: '' });
            await check(`setTimeout(() => process.stdout.write('unexpected'), 0).unref();`,
                { status: 0, stdout: '', stderr: '' });
        } else if (config.mode === 'checkpoint') {
            await check(`
                process.on('unhandledRejection', () => {
                    setTimeout(() => { process.stdout.write('late\\n'); process.exitCode = 7; }, 20);
                });
                Promise.reject(new Error('probe'));
            `, { status: 7, stdout: 'late\n', stderr: '' });
        } else if (config.mode === 'cleanup') {
            const failed = JSON.parse(runChild(`
                setTimeout(() => process.stdout.write('unexpected\\n'), 20);
                throw new Error('child failure');
            `));
            assert.equal(failed.status, 1);
            assert.equal(failed.stdout, '');
            assert.match(failed.stderr, /child failure/);
            const original = process.env.ISOLATED_CHILD_MUTATION;
            await check(`
                process.env.ISOLATED_CHILD_MUTATION = 'child-only';
                process.argv.push('child-only');
                process.chdir('/test');
                setTimeout(() => { process.stdout.write('child\\n'); process.exitCode = 7; }, 20);
            `, { status: 7, stdout: 'child\n', stderr: '' });
            await check(`
                process.stdout.write(String(process.env.ISOLATED_CHILD_MUTATION) + '\\n');
            `, { status: 0, stdout: String(original) + '\n', stderr: '' });
        } else if (config.mode === 'module-stdio') {
            let childOrdinal = 0;
            const spawnModuleChild = (...args) => {
                const phase = 'child ' + (++childOrdinal);
                writeFileSync('/module-stdio-phase', phase + ': starting');
                const result = spawnSync(...args);
                writeFileSync('/module-stdio-phase', phase + ': returned');
                return result;
            };
            mkdirSync('/child-app', { recursive: true });
            writeFileSync('/child-app/preload.cjs', `globalThis.preloaded = 42;`);
            writeFileSync('/child-app/main.cjs', `
                const fs = require('node:fs');
                assert = require('node:assert/strict');
                assert.equal(globalThis.preloaded, 42);
                assert.equal(process.cwd(), '/child-app');
                assert.equal(process.argv[2], 'argument');
                assert.equal(process.env.CHILD_APP, 'only-child');
                process.stdout.write(fs.readFileSync(0));
            `);
            const input = Buffer.from([0, 255, 128, 65]);
            const commonjs = spawnModuleChild(process.execPath, ['-r', './preload.cjs', './main.cjs', 'argument'], {
                cwd: '/child-app', env: { ...process.env, CHILD_APP: 'only-child' }, input,
            });
            assert.equal(commonjs.status, 0, commonjs.stderr?.toString());
            assert.deepEqual([...commonjs.stdout], [...input]);
            const backing = new Uint8Array([9, 0, 255, 128, 65, 9]);
            for (const view of [new DataView(backing.buffer, 1, 4), new Uint16Array(backing.buffer, 2, 2)]) {
                const echoed = spawnModuleChild(process.execPath, ['-e', `process.stdout.write(require('node:fs').readFileSync(0));`], { input: view });
                assert.equal(echoed.status, 0, echoed.stderr?.toString());
                assert.deepEqual([...echoed.stdout], [...new Uint8Array(view.buffer, view.byteOffset, view.byteLength)]);
            }
            const streamedInput = spawnModuleChild(process.execPath, ['-e', `
                const chunks = [];
                process.stdin.on('data', chunk => chunks.push(chunk));
                process.stdin.on('end', () => process.stdout.write(Buffer.concat(chunks)));
            `], { input });
            assert.equal(streamedInput.status, 0, streamedInput.stderr?.toString());
            assert.deepEqual([...streamedInput.stdout], [...input]);
            assert.throws(() => spawnSync(process.execPath, ['-e', ''], { stdio: ['ipc', 'inherit', 'inherit'] }), { code: 'ENOSYS' });
            assert.throws(() => spawnSync(process.execPath, ['-e', ''], { stdio: ['pipe', 'pipe', 'pipe', 'pipe'] }), { code: 'ENOSYS' });
            writeFileSync('/child-app/dep.mjs', `export const value = 42;`);
            writeFileSync('/child-app/main.mjs', `
                import { value } from './dep.mjs';
                await new Promise(resolve => setTimeout(resolve, 5));
                process.stdout.write('esm:' + value);
            `);
            const esm = spawnModuleChild(process.execPath, ['./main.mjs'], { cwd: '/child-app', encoding: 'utf8' });
            assert.equal(esm.status, 0, esm.stderr);
            assert.equal(esm.stdout, 'esm:42');
            const dynamic = spawnModuleChild(process.execPath, ['-e', `
                Promise.all([import('node:path'), import('./dep.mjs')]).then(([path, dep]) => {
                    process.stdout.write(path.sep + dep.value);
                });
            `], { cwd: '/child-app', encoding: 'utf8' });
            assert.equal(dynamic.status, 0, dynamic.stderr);
            assert.equal(dynamic.stdout, '/42');
            const requireTla = spawnModuleChild(process.execPath, ['-e', `require('./main.mjs');`], { cwd: '/child-app', encoding: 'utf8' });
            assert.equal(requireTla.status, 1);
            assert.match(requireTla.stderr, /ERR_REQUIRE_ASYNC_MODULE/);
            assert.equal(requireTla.stdout, '', 'require(TLA) must not evaluate the module');
            writeFileSync('/child-app/pending.mjs', `await new Promise(() => {});`);
            const pending = spawnModuleChild(process.execPath, ['./pending.mjs'], { cwd: '/child-app', encoding: 'utf8' });
            assert.equal(pending.status, 13);
            const output = [];
            const old = process.stdout.write;
            process.stdout.write = chunk => { output.push(Buffer.from(chunk)); return true; };
            try {
                const inherited = spawnModuleChild(process.execPath, ['-e', `console.log('inherited');`], { stdio: 'inherit' });
                assert.equal(inherited.status, 0);
                assert.equal(inherited.stdout, null);
                assert.equal(inherited.stderr, null);
            } finally { process.stdout.write = old; }
            assert.equal(Buffer.concat(output).toString(), 'inherited\n');
            const discarded = spawnModuleChild(process.execPath, ['-e', `process.stdout.write('discard');process.stderr.write('discard');`], { stdio: 'ignore', maxBuffer: 0 });
            assert.equal(discarded.status, 0);
            assert.equal(discarded.stdout, null);
            assert.equal(discarded.stderr, null);
            const fresh = source => spawnModuleChild(process.execPath, ['-e', source], { encoding: 'utf8' });
            assert.equal(fresh(`globalThis.childOnly = true; process.stdout.write('first');`).stdout, 'first');
            assert.equal(fresh(`process.stdout.write(String(globalThis.childOnly));`).stdout, 'undefined');
            assert.equal(fresh(`globalThis.Number = () => 99; process.exitCode = 7;`).status, 7);
            assert.equal(fresh(`JSON.stringify = () => '{}'; process.exitCode = 7;`).status, 7);
        } else if (config.mode === 'tla-cleanup') {
            mkdirSync('/child-tla-cleanup', { recursive: true });
            writeFileSync('/child-tla-cleanup/entry.mjs', config.kind === 'require'
                ? `await Promise.resolve(); process.stdout.write('must not execute');`
                : `await new Promise(() => {});`);
            for (let iteration = 0; iteration < 3; iteration++) {
                const args = config.kind === 'require'
                    ? ['-e', `require('./entry.mjs');`] : ['./entry.mjs'];
                const result = spawnSync(process.execPath, args, {
                    cwd: '/child-tla-cleanup', encoding: 'utf8',
                });
                assert.equal(result.status, config.kind === 'require' ? 1 : 13, result.stderr);
                assert.equal(result.stdout, '');
                if (config.kind === 'require') assert.match(result.stderr, /ERR_REQUIRE_ASYNC_MODULE/);
                else assert.equal(result.stderr, '');
                const next = spawnSync(process.execPath, ['-e', `process.stdout.write('healthy');`], { encoding: 'utf8' });
                assert.equal(next.status, 0, next.stderr);
                assert.equal(next.stdout, 'healthy');
                assert.equal(next.stderr, '');
            }
        } else if (config.mode === 'entry-resolution') {
            mkdirSync('/entries/package', { recursive: true });
            mkdirSync('/entries/index', { recursive: true });
            mkdirSync('/entries/other', { recursive: true });
            writeFileSync('/entries/plain.js', `process.stdout.write(process.argv[1]);`);
            writeFileSync('/entries/package/package.json', JSON.stringify({ main: 'start.js', type: 'module' }));
            writeFileSync('/entries/package/start.js', `process.stdout.write('package');`);
            writeFileSync('/entries/index/index.js', `process.stdout.write('index');`);
            writeFileSync('/entries/fs', `process.stdout.write('local-file');`);
            writeFileSync('/entries/other/dep.mjs', `export const value = 'wrong';`);
            writeFileSync('/entries/dep.mjs', `export const value = 'original';`);
            const run = args => spawnSync(process.execPath, args, { cwd: '/entries', encoding: 'utf8' });
            for (const [entry, expected] of [
                ['plain', '/entries/plain'], ['package', 'package'], ['index', 'index'], ['fs', 'local-file'],
            ]) {
                const result = run([entry]);
                assert.equal(result.status, 0, result.stderr);
                assert.equal(result.stdout, expected);
            }
            for (const missing of ['missing', 'missing.mjs']) {
                const result = run([missing]);
                assert.equal(result.status, 1);
                assert.match(result.stderr, /MODULE_NOT_FOUND/);
                assert.match(result.stderr, /Cannot find module/);
            }
            writeFileSync('/entries/real.mjs', `
                globalThis.entryEvaluations = (globalThis.entryEvaluations || 0) + 1;
                export const evaluation = globalThis.entryEvaluations;
                if (evaluation === 1) {
                    import(new URL(process.argv[1], 'file://').href).then(self => {
                        process.stdout.write(import.meta.url + ':' + self.evaluation);
                    });
                }
            `);
            symlinkSync('./real.mjs', '/entries/link.mjs');
            for (const [flags, expected, evaluations] of [
                [[], 'real.mjs', 1], [['--preserve-symlinks'], 'real.mjs', 2],
                [['--preserve-symlinks-main'], 'link.mjs', 2],
                [['--preserve-symlinks', '--preserve-symlinks-main'], 'link.mjs', 1],
            ]) {
                const result = run([...flags, './link.mjs']);
                assert.equal(result.status, 0, result.stderr);
                assert.equal(result.stdout, 'file:///entries/' + expected + ':' + evaluations);
            }
            mkdirSync('/entries/main-real', { recursive: true });
            mkdirSync('/entries/main-link', { recursive: true });
            writeFileSync('/entries/main-real/main.mjs', `
                import { value } from './dep.mjs';
                import { identity } from './linked-dep.mjs';
                process.stdout.write(value + ':' + identity);
            `);
            writeFileSync('/entries/main-real/dep.mjs', `export const value = 'real';`);
            writeFileSync('/entries/main-link/dep.mjs', `export const value = 'link';`);
            writeFileSync('/entries/dependency.mjs', `export const identity = import.meta.url;`);
            symlinkSync('../main-real/main.mjs', '/entries/main-link/main.mjs');
            symlinkSync('../dependency.mjs', '/entries/main-real/linked-dep.mjs');
            symlinkSync('../dependency.mjs', '/entries/main-link/linked-dep.mjs');
            for (const [flags, value, identity] of [
                [[], 'real', 'dependency.mjs'],
                [['--preserve-symlinks'], 'real', 'main-real/linked-dep.mjs'],
                [['--preserve-symlinks-main'], 'link', 'dependency.mjs'],
                [['--preserve-symlinks', '--preserve-symlinks-main'], 'link', 'main-link/linked-dep.mjs'],
            ]) {
                const result = run([...flags, './main-link/main.mjs']);
                assert.equal(result.status, 0, result.stderr);
                assert.equal(result.stdout, value + ':file:///entries/' + identity);
            }
            const evaluated = run(['-e', `
                const assert = require('node:assert/strict');
                const frames = require('node:util').getCallSites();
                assert.equal(frames[0].scriptName, '[eval]');
                process.chdir('/entries/other');
                import('./dep.mjs').then(dep => process.stdout.write(dep.value));
            `]);
            assert.equal(evaluated.status, 0, evaluated.stderr);
            assert.equal(evaluated.stdout, 'original');
        } else if (config.mode === 'microtask-errors') {
            const run = source => spawnSync(process.execPath, ['-e', source], { encoding: 'utf8' });
            const exited = run(`queueMicrotask(() => process.exit(7));`);
            assert.equal(exited.status, 7, exited.stderr);
            assert.equal(exited.stderr, '');
            const thrown = run(`queueMicrotask(() => { throw new Error('queued failure'); });`);
            assert.equal(thrown.status, 1);
            assert.match(thrown.stderr, /queued failure/);
            const handled = run(`
                process.on('uncaughtException', error => process.stdout.write(error.message));
                queueMicrotask(() => { throw new Error('handled failure'); });
            `);
            assert.equal(handled.status, 0, handled.stderr);
            assert.equal(handled.stdout, 'handled failure');
            const handlerFailed = run(`
                process.on('uncaughtException', () => { throw new Error('handler failure'); });
                queueMicrotask(() => { throw new Error('original failure'); });
            `);
            assert.equal(handlerFailed.status, 7);
            assert.match(handlerFailed.stderr, /handler failure/);
            const once = run(`
                let calls = 0;
                process.on('uncaughtException', () => {});
                const childFs = require('node:fs');
                childFs.realpath('/', () => { calls++; throw new Error('callback failure'); });
                childFs.realpath.native('/', () => { calls++; throw new Error('native callback failure'); });
                childFs.realpath('/missing-realpath', () => { calls++; process.exit(9); });
                process.on('exit', () => process.stdout.write(String(calls)));
            `);
            assert.equal(once.status, 9, once.stderr);
            assert.equal(once.stdout, '3');
            const recovered = run(`process.stdout.write('healthy');`);
            assert.equal(recovered.status, 0, recovered.stderr);
            assert.equal(recovered.stdout, 'healthy');
            const immutable = run(`Object.defineProperty(globalThis, 'queueMicrotask', {
                value() {}, writable: false, configurable: false,
            });`);
            assert.equal(immutable.status, 0, immutable.stderr);
        } else if (config.mode === 'async-control') {
            let negativeError;
            const negative = execFile(process.execPath, error => { negativeError = error; });
            negative.kill();
            negative.emit('close', -1, null);
            assert.equal(negativeError.code, 'EPERM');
            assert.equal(negativeError.killed, true);
            const first = spawn(process.execPath, ['-e', `setTimeout(() => process.stdout.write('one'), 25);`]);
            const second = spawn(process.execPath, ['-e', `setTimeout(() => process.stdout.write('two'), 10);`]);
            const outputs = [[], []];
            first.stdout.on('data', bytes => outputs[0].push(bytes));
            second.stdout.on('data', bytes => outputs[1].push(bytes));
            await Promise.all([once(first, 'close'), once(second, 'close')]);
            assert.equal(Buffer.concat(outputs[0]).toString(), 'one');
            assert.equal(Buffer.concat(outputs[1]).toString(), 'two');
            const controller = new AbortController();
            const aborted = spawn(process.execPath, ['-e', `setInterval(() => {}, 100);`], { signal: controller.signal });
            let error;
            aborted.on('error', failure => { error = failure; });
            const closed = new Promise(resolve => aborted.on('close', (...values) => resolve(values)));
            setTimeout(() => controller.abort(), 20);
            assert.deepEqual(await closed, [null, 'SIGTERM']);
            assert.equal(error.code, 'ABORT_ERR');
            const overflowing = execFile(process.execPath, ['-e', `process.stderr.write('overflow');setInterval(()=>{},100);`], { maxBuffer: 4 }, (error, stdout, stderr) => {
                assert.equal(error.code, 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER');
                assert.equal(stderr, 'over');
            });
            overflowing.on('error', () => {});
            await new Promise(resolve => overflowing.on('close', resolve));
            for (const [encoding, limit, expected] of [
                ['utf8', 3, '中文测'], ['utf8', 10, '中文测试\n'],
                [null, 10, '中文测试\n'],
            ]) {
                let observed;
                const unicode = execFile(process.execPath, ['-e', `console.log('中文测试');`], { encoding, maxBuffer: limit }, (failure, stdout) => {
                    assert.equal(failure.code, 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER');
                    observed = stdout;
                });
                unicode.stdout.setEncoding('utf8');
                unicode.on('error', () => {});
                await new Promise(resolve => unicode.on('close', resolve));
                assert.equal(observed, expected);
            }
            const split = execFile(process.execPath, ['-e', `
                process.stdout.write(Buffer.from([226]));
                setTimeout(() => process.stdout.write(Buffer.from([130, 172])), 5);
            `], { encoding: 'utf8' });
            let decoded = '';
            split.stdout.on('data', text => { decoded += text; });
            await once(split, 'close');
            assert.equal(decoded, '€');
            const timed = execFile(process.execPath, ['-e', `setInterval(()=>{},100);`], { timeout: 500 }, error => {
                assert.equal(error.signal, 'SIGTERM');
                assert.equal(error.killed, true);
            });
            await once(timed, 'close');
            const early = new AbortController();
            early.abort();
            const already = spawn(process.execPath, ['-e', `require('node:fs').writeFileSync('/must-not-run', 'bad');`], { signal: early.signal });
            already.on('error', failure => assert.equal(failure.code, 'ABORT_ERR'));
            await new Promise(resolve => already.on('close', resolve));
            assert.equal(existsSync('/must-not-run'), false);
            const failures = [];
            const onUncaught = error => failures.push(error.message);
            process.on('uncaughtException', onUncaught);
            try {
                const healthy = spawn(process.execPath, ['-e', `
                    process.stdout.write('first');
                    setTimeout(() => { require('node:fs').writeFileSync('/healthy-child', 'done'); process.stdout.write('last'); }, 10);
                `], { maxBuffer: -1 }); // spawn ignores execFile's maxBuffer option.
                let firstChunk = true;
                healthy.stdout.on('data', () => { if (firstChunk) { firstChunk = false; throw new Error('parent listener'); } });
                assert.deepEqual(await once(healthy, 'close'), [0, null]);
                assert.equal(readFileSync('/healthy-child', 'utf8'), 'done');
                assert.deepEqual(failures, ['parent listener']);
            } finally { process.removeListener('uncaughtException', onUncaught); }
        } else if (config.mode === 'public-contract') {
            const run = (source, options = {}) => spawnSync(process.execPath, ['-e', source], { encoding: 'utf8', ...options });
            for (const source of [
                `throw new Error('startup failure');`,
                `setTimeout(() => { throw new Error('timer failure'); }, 5);`,
                `Promise.reject(new Error('rejection failure'));`,
            ]) {
                const result = run(source);
                assert.equal(result.status, 1, source);
                assert.match(result.stderr, /failure/);
            }
            const handled = run(`
                process.on('uncaughtException', () => { process.stdout.write('handled'); });
                setTimeout(() => { throw new Error('caught'); }, 1);
            `);
            assert.equal(handled.status, 0);
            assert.equal(handled.stdout, 'handled');
            const natural = run(`
                let turns = 0;
                process.on('beforeExit', () => {
                    process.stdout.write('before' + turns + ';');
                    if (turns++ === 0) setTimeout(() => { process.stdout.write('timer;'); process.exitCode = 7; }, 5);
                });
                process.on('exit', code => process.stdout.write('exit' + code));
            `);
            assert.equal(natural.stdout, 'before0;timer;before1;exit7');
            assert.equal(natural.status, 7);
            const bytes = spawnSync(process.execPath, ['-e', `process.stdout.write(Buffer.from([0, 255, 128, 65]));`]);
            assert.deepEqual([...bytes.stdout], [0, 255, 128, 65]);
            const overflow = spawnSync(process.execPath, ['-e', `process.stdout.write('aa€'); setInterval(() => {}, 100);`], { maxBuffer: 4 });
            assert.equal(overflow.error.code, 'ENOBUFS');
            assert.deepEqual([...overflow.stdout], [97, 97, 226, 130, 172]);
            assert.equal(run(`process.stdout.write('hello');`, { maxBuffer: 0 }).stdout, 'hello');
            assert.equal(run(`process.stdout.write('hello');`, { maxBuffer: 3.14 }).error.code, 'ENOBUFS');
            for (const source of [`while (true) {}`, `setInterval(() => {}, 100);`]) {
                const timed = run(source, { timeout: 500 });
                assert.equal(timed.error.code, 'ETIMEDOUT');
                assert.equal(timed.status, null);
            }
            assert.equal(run(`process.stdout.write('after');`).stdout, 'after');
            const nestedTimeout = run(`require('node:child_process').spawnSync(process.execPath, ['-e', 'while (true) {}']);`, { timeout: 1000 });
            assert.equal(nestedTimeout.error.code, 'ETIMEDOUT');
            let parentRan = false;
            const child = execFile(process.execPath, ['-e', `setTimeout(() => process.stdout.write('async'), 50);`]);
            const output = [];
            child.stdout.on('data', chunk => output.push(Buffer.from(chunk)));
            setTimeout(() => { parentRan = true; }, 0);
            await once(child, 'close');
            assert.equal(parentRan, true, 'async child blocked its parent');
            assert.equal(Buffer.concat(output).toString(), 'async');
            const cancelled = spawn(process.execPath, ['-e', `setInterval(() => {}, 100);`]);
            const closed = once(cancelled, 'close');
            setTimeout(() => assert.equal(cancelled.kill(), true), 20);
            const [status, signal] = await closed;
            assert.equal(status, null);
            assert.equal(signal, 'SIGTERM');
            assert.equal(run(`process.stdout.write('after cancel');`).stdout, 'after cancel');
        } else {
            await check(basic, expected);
        }
        return true;
    }
    if (existsSync('/local-child-lifetime.json')) {
        return checkLocalChildLifetime(JSON.parse(readFileSync('/local-child-lifetime.json', 'utf8')));
    }
    assert.equal(callCount(), 0, 'registration executed a command');
    const local = spawnSync(process.execPath, ['-p', '40 + 2'], { encoding: 'utf8' });
    assert.equal(local.status, 0);
    assert.equal(local.stdout.trim(), '42');
    mkdirSync('/local-bin', { recursive: true });
    writeFileSync('/local-bin/entry.cjs', '#!/usr/bin/env node\nconsole.log("local:" + process.argv[2]);\n');
    symlinkSync('entry.cjs', '/local-bin/local-script');
    const localEnv = { ...process.env, PATH: '/local-bin' };
    assert.equal(spawnSync('/local-bin/local-script', ['absolute'], { encoding: 'utf8' }).stdout, 'local:absolute\n');
    assert.equal(spawnSync('./local-script', ['relative'], { cwd: '/local-bin', encoding: 'utf8' }).stdout, 'local:relative\n');
    assert.equal(spawnSync('local-script', ['path'], { env: localEnv, encoding: 'utf8' }).stdout, 'local:path\n');
    const localAsync = spawn('local-script', ['async'], { env: localEnv });
    let localOutput = '';
    localAsync.stdout.on('data', chunk => { localOutput += chunk.toString(); });
    assert.deepEqual(await once(localAsync, 'close'), [0, null]);
    assert.equal(localOutput, 'local:async\n');
    assert.equal(callCount(), 0, 'local Node scripts reached the configured backend');
    assert.equal(spawnSync('missing-command').error.code, 'ENOSYS');
    assert.throws(() => setProcessBackend({ spawnSync: 7 }), TypeError);
    assert.throws(() => setProcessBackend(7), TypeError);
    assert.throws(() => spawnSync('virtual-promise'), TypeError);
    assert.equal(execSync('virtual shell program', { encoding: 'utf8' }), 'shell output');
    assert.throws(() => execFileSync('virtual-unavailable'), error => error.code === 'EACCES');
    const optionalArgv = Object.freeze({
        cwd: '/virtual', env: Object.freeze({ MARKER: 'options' }), stdio: 'ignore',
    });
    assert.equal(spawnSync('virtual-options', optionalArgv).status, 0);
    const optionalChild = spawn('virtual-options', optionalArgv);
    assert.deepEqual(await once(optionalChild, 'close'), [7, null]);
    for (const method of [spawn, spawnSync]) {
        assert.throws(() => method('virtual-options', 'not-argv'), TypeError);
        assert.throws(() => method('virtual-options', [], null), TypeError);
        assert.throws(() => method('virtual-options', [], []), TypeError);
    }
    for (const encoding of ['buffer', 'utf8']) {
        const ignored = spawnSync('virtual-ignored', [], { encoding, stdio: 'ignore' });
        assert.equal(ignored.stdout, null);
        assert.equal(ignored.stderr, null);
        assert.deepEqual(ignored.output, [null, null, null]);
        assert.equal(execFileSync('virtual-ignored', [], { encoding, stdio: 'ignore' }), null);
    }
    const args = ['0', 'argument with spaces'];
    const options = { cwd: '/virtual', encoding: 'hex' };
    const result = spawnSync('virtual-command', args, options);
    assert.equal(result.status, 0);
    assert.equal(result.pid, 17);
    assert.equal(result.stdout, '00ff0180');
    assert.equal(result.stderr, '4142');
    assert.deepEqual(result.output, [null, result.stdout, result.stderr]);
    assert.deepEqual(args, ['0', 'argument with spaces']);
    assert.deepEqual(options, { cwd: '/virtual', encoding: 'hex' });
    assert.throws(() => execFileSync('virtual-command', ['7', 'argument with spaces'], { cwd: '/virtual' }), error => {
        assert.equal(error.status, 7);
        assert.deepEqual([...error.stdout], [0, 255, 1, 128]);
        assert.deepEqual([...error.stderr], [65, 66]);
        return true;
    });
    const child = spawn('virtual-async', [], { cwd: '/virtual' });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk.toString(); });
    child.stderr.on('data', chunk => { stderr += chunk.toString(); });
    assert.deepEqual(await once(child, 'close'), [7, null]);
    assert.equal(stdout, 'async output');
    assert.equal(stderr, 'async diagnostic');
    let returned = false;
    await new Promise((resolve, reject) => {
        const running = execFile('virtual-async', [], (error, out, err) => {
            try {
                assert.equal(returned, true, 'execFile blocked before returning its child');
                assert.equal(error.code, 7);
                assert.equal(out, 'async output');
                assert.equal(err, 'async diagnostic');
                resolve();
            } catch (failure) { reject(failure); }
        });
        assert.ok(running.stdout && running.stderr && running.stdin);
        returned = true;
    });
    await new Promise((resolve, reject) => {
        exec('virtual shell program', (error, out, err) => {
            try {
                assert.equal(error, null);
                assert.equal(out, 'async shell output');
                assert.equal(err, 'async diagnostic');
                resolve();
            } catch (failure) { reject(failure); }
        });
    });
    await new Promise((resolve, reject) => {
        execFile('virtual-async', { encoding: 'buffer', maxBuffer: 5 }, (error, out, err) => {
            try {
                assert.equal(error.code, 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER');
                assert.equal(error.killed, true);
                assert.equal(Buffer.isBuffer(out), true);
                assert.equal(out.toString(), 'async');
                assert.equal(err.toString(), 'async');
                resolve();
            } catch (failure) { reject(failure); }
        });
    });
    const beforeInlineExec = callCount();
    await new Promise((resolve, reject) => {
        execFile('local-script', ['exec-file'], { env: localEnv }, (error, out) => {
            try {
                assert.equal(error, null);
                assert.equal(out, 'local:exec-file\n');
                resolve();
            } catch (failure) { reject(failure); }
        });
    });
    assert.equal(callCount(), beforeInlineExec, 'execFile intercepted the local Node script');
    let errorCallbacks = 0;
    await new Promise((resolve, reject) => {
        execFile('virtual-unavailable', (error, out, err) => {
            try {
                errorCallbacks++;
                assert.equal(error.code, 'EACCES');
                assert.equal(out, '');
                assert.equal(err, '');
                resolve();
            } catch (failure) { reject(failure); }
        });
    });
    assert.equal(errorCallbacks, 1);
    await new Promise((resolve, reject) => {
        execFile('virtual-async', { maxBuffer: 4, encoding: 'buffer' }, (error, out, err) => {
            try {
                assert.equal(error.code, 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER');
                assert.equal(error.killed, true);
                assert.deepEqual([...out], [97, 115, 121, 110]);
                assert.deepEqual([...err], [97, 115, 121, 110]);
                resolve();
            } catch (failure) { reject(failure); }
        });
    });
    await new Promise((resolve, reject) => {
        execFile('virtual-pending', { timeout: 1 }, (error, out, err) => {
            try {
                assert.equal(error.signal, 'SIGTERM');
                assert.equal(error.killed, true);
                assert.equal(out, '');
                assert.equal(err, '');
                resolve();
            } catch (failure) { reject(failure); }
        });
    });
    const promised = promisify(exec)('virtual shell program');
    assert.ok(promised.child.stdout);
    assert.deepEqual(await promised, { stdout: 'async shell output', stderr: 'async diagnostic' });
    await assert.rejects(promisify(execFile)('virtual-async'), error => {
        assert.equal(error.code, 7);
        assert.equal(error.stdout, 'async output');
        assert.equal(error.stderr, 'async diagnostic');
        return true;
    });
    const beforeInvalidOptions = callCount();
    assert.throws(() => execFile('virtual-async', { maxBuffer: -1 }), RangeError);
    assert.throws(() => exec('virtual shell program', { timeout: -1 }), RangeError);
    assert.equal(callCount(), beforeInvalidOptions, 'invalid options started work');
    const parentCalls = callCount();
    setProcessBackend(null);
    assert.equal(spawnSync('virtual-command').error.code, 'ENOSYS');
    assert.throws(() => execSync('virtual shell program'), error => error.code === 'ENOSYS');
    await assert.rejects(promisify(execFile)('missing-command'), error => {
        assert.equal(error.code, 'ENOSYS');
        assert.equal(error.stdout, '');
        assert.equal(error.stderr, '');
        return true;
    });
    let getterReads = 0;
    setProcessBackend({
        marker: 29,
        get spawnSync() {
            assert.equal(++getterReads, 1);
            return function () { return { status: this.marker }; };
        },
    });
    assert.equal(spawnSync('getter-command').status, 29);
    assert.equal(spawnSync('getter-command').status, 29);
    assert.equal(getterReads, 1);
    setProcessBackend(undefined);
    assert.equal(spawnSync('getter-command').error.code, 'ENOSYS');
    globalThis.parentProcessBackend = true;
    const job = await runJavaScript({
        source: `
            const assert = (await import('node:assert/strict')).default;
            const { spawnSync, execFile } = await import('node:child_process');
            const { callCount } = await import('wasm-rquickjs-runtime-init');
            assert.equal('parentProcessBackend' in globalThis, false);
            assert.equal(callCount(), 0);
            const local = spawnSync('local-script', ['job'], {
                env: { ...process.env, PATH: '/local-bin' }, encoding: 'utf8',
            });
            assert.equal(local.stdout, 'local:job\\n');
            assert.equal(callCount(), 0);
            const result = spawnSync('virtual-command', ['0', 'argument with spaces'], { cwd: '/virtual' });
            assert.equal(result.status, 0);
            assert.deepEqual([...result.stdout], [0, 255, 1, 128]);
            assert.equal(callCount(), 1);
            await new Promise((resolve, reject) => {
                execFile('virtual-async', (error, out) => {
                    try {
                        assert.equal(error.code, 7);
                        assert.equal(out, 'async output');
                        resolve();
                    } catch (failure) { reject(failure); }
                });
            });
            assert.equal(callCount(), 2);
            return true;
        `,
        cwd: '/', timeoutMs: 3000, maxBytes: 1024,
    });
    assert.equal(job.value, true);
    assert.equal(job.stdout, '');
    assert.equal(job.stderr, '');
    assert.equal(job.overflowed, false);
    assert.equal(callCount(), parentCalls);
    assert.equal(spawnSync('virtual-command').error.code, 'ENOSYS');
    return true;
}
