import { setProcessBackend } from 'wasm-rquickjs:child-process';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';

let calls = 0;
export function callCount() { return calls; }

// Pure test adapter: registration neither executes a command nor starts work.
setProcessBackend({
    spawnSync(command, args, options) {
        if (command === process.execPath) throw new Error('Backend intercepted inline Node');
        if (['local-script', './local-script', '/local-bin/local-script'].includes(command)) {
            throw new Error('Backend intercepted a local Node shebang');
        }
        if (command === 'virtual-promise') return Promise.resolve({ status: 0 });
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
        if (command !== 'virtual-async') return undefined;
        calls++;
        const child = new EventEmitter();
        child.pid = 18;
        child.stdout = new PassThrough();
        child.stderr = new PassThrough();
        child.stdin = new PassThrough();
        child.exitCode = null;
        child.signalCode = null;
        queueMicrotask(() => {
            child.emit('spawn');
            child.stdout.end('async output');
            child.stderr.end('async diagnostic');
            child.exitCode = 7;
            child.emit('exit', 7, null);
            child.emit('close', 7, null);
        });
        return child;
    },
});
