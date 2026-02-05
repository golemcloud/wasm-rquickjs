// node:child_process stub implementation
// All functions throw errors as child processes cannot be spawned in WASM environment

const NOT_SUPPORTED_ERROR = new Error('child_process is not supported in WebAssembly environment');

// ChildProcess class stub
export class ChildProcess {
    constructor() {
        throw NOT_SUPPORTED_ERROR;
    }
}

// Asynchronous process creation functions
export function exec(command, options, callback) {
    throw NOT_SUPPORTED_ERROR;
}

export function execFile(file, args, options, callback) {
    throw NOT_SUPPORTED_ERROR;
}

export function fork(modulePath, args, options) {
    throw NOT_SUPPORTED_ERROR;
}

export function spawn(command, args, options) {
    throw NOT_SUPPORTED_ERROR;
}

// Synchronous process creation functions
export function execFileSync(file, args, options) {
    throw NOT_SUPPORTED_ERROR;
}

export function execSync(command, options) {
    throw NOT_SUPPORTED_ERROR;
}

export function spawnSync(command, args, options) {
    throw NOT_SUPPORTED_ERROR;
}

export default {
    ChildProcess,
    exec,
    execFile,
    execFileSync,
    execSync,
    fork,
    spawn,
    spawnSync,
};
