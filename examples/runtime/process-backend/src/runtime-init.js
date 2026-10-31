import { setProcessBackend } from 'wasm-rquickjs:child-process';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';

let calls = 0;
export function callCount() { return calls; }

// Pure test adapter: registration neither executes a command nor starts work.
setProcessBackend({
    spawnSync(command, args, options) {
        if (command === 'virtual-async') throw new Error('Async command reached spawnSync');
        if (command === process.execPath) throw new Error('Backend intercepted inline Node');
        if (['local-script', './local-script', '/local-bin/local-script'].includes(command)) {
            throw new Error('Backend intercepted a local Node shebang');
        }
        if (command === 'virtual-promise') return Promise.resolve({ status: 0 });
        if (command === 'virtual-options') {
            if (args.length !== 0 || options.cwd !== '/virtual' ||
                options.env.MARKER !== 'options' || options.stdio !== 'ignore') {
                throw new Error('Optional argv lost the options object');
            }
            return { pid: 20, status: 0, signal: null, stdout: null, stderr: null };
        }
        if (command === 'virtual-ignored') return { pid: 20, status: 0, signal: null,
            stdout: null, stderr: null };
        if (command === 'virtual-unavailable') return { pid: 0, status: null, signal: null,
            error: Object.assign(new Error('command denied'), { code: 'EACCES' }) };
        if (command === 'virtual shell program') {
            if (options.shell !== true) throw new Error('Shell command was not identified');
            return { pid: 19, status: 0, signal: null,
                stdout: new TextEncoder().encode('shell output'), stderr: new Uint8Array() };
        }
        if (command !== 'virtual-command') return undefined;
        calls++;
        if (args[1] !== 'argument with spaces' || options.cwd !== '/virtual') {
            throw new Error('Arguments/options changed before delegation');
        }
        return { pid: 17, status: Number(args[0]), signal: null,
            stdout: new Uint8Array([0, 255, 1, 128]), stderr: new Uint8Array([65, 66]) };
    },
    spawn(command, args, options) {
        if (command === process.execPath) throw new Error('Backend intercepted inline Node');
        if (['local-script', './local-script', '/local-bin/local-script'].includes(command)) {
            throw new Error('Backend intercepted a local Node shebang');
        }
        if (command === 'virtual-options') {
            if (args.length !== 0 || options.cwd !== '/virtual' ||
                options.env.MARKER !== 'options') {
                throw new Error('Optional async argv lost the options object');
            }
        }
        if (!['virtual-async', 'virtual-pending', 'virtual shell program', 'virtual-options'].includes(command)) return undefined;
        const shell = command === 'virtual shell program';
        if (shell && options.shell !== true) throw new Error('Missing async shell marker');
        calls++;
        const child = new EventEmitter();
        child.pid = 18;
        child.stdout = new PassThrough();
        child.stderr = new PassThrough();
        child.stdin = new PassThrough();
        child.exitCode = null;
        child.signalCode = null;
        let completed = false;
        let timer;
        const finish = (code, signal) => {
            if (completed) return;
            completed = true;
            child.stdout.end();
            child.stderr.end();
            child.exitCode = code;
            child.signalCode = signal;
            child.emit('exit', code, signal);
            child.emit('close', code, signal);
        };
        child.kill = signal => {
            child.killed = true;
            if (command === 'virtual-pending') {
                clearTimeout(timer);
                queueMicrotask(() => finish(null, signal));
            }
            return true;
        };
        queueMicrotask(() => {
            child.emit('spawn');
            if (command === 'virtual-pending') {
                timer = setTimeout(() => finish(0, null), 1000);
                return;
            }
            child.stdout.end(shell ? 'async shell output' : 'async output');
            child.stderr.end('async diagnostic');
            finish(shell ? 0 : 7, null);
        });
        return child;
    },
});
