import assert from 'node:assert/strict';
import { spawn, spawnSync, exec, execFile, execFileSync, execSync } from 'node:child_process';
import { once } from 'node:events';
import { mkdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { setProcessBackend } from 'wasm-rquickjs:child-process';
import { runJavaScript } from 'wasm-rquickjs:execution';
import { callCount } from 'wasm-rquickjs-runtime-init';
import { promisify } from 'node:util';

export async function run() {
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
