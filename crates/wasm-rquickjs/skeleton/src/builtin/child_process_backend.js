// One module instance per QuickJS runtime. Hosts install adapters; this module
// knows nothing about a tool registry, permissions, shells, or OS executables.
let backend;

export function setProcessBackend(value) {
    if (value === undefined || value === null) {
        backend = undefined;
        return;
    }
    if (typeof value !== 'object') throw new TypeError('Process backend must be an object');
    const installed = {};
    for (const name of ['spawn', 'spawnSync']) {
        if (value[name] !== undefined) {
            if (typeof value[name] !== 'function') {
                throw new TypeError(`Process backend ${name} must be a function`);
            }
            installed[name] = value[name].bind(value);
        }
    }
    backend = Object.freeze(installed);
}

export function getProcessBackend() {
    return backend;
}
