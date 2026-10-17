import assert from 'node:assert/strict';
import { spawn, spawnSync, execFileSync, execSync } from 'node:child_process';
import { once } from 'node:events';
import { mkdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { setProcessBackend } from 'wasm-rquickjs:child-process';
import { runJavaScript } from 'wasm-rquickjs:execution';
import { callCount } from 'wasm-rquickjs-runtime-init';

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
    const parentCalls = callCount();
    setProcessBackend(null);
    assert.equal(spawnSync('virtual-command').error.code, 'ENOSYS');
    assert.throws(() => execSync('virtual shell program'), error => error.code === 'ENOSYS');
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
            const { spawnSync } = await import('node:child_process');
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
