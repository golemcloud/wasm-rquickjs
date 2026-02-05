import {
    arch,
    available_parallelism,
    endianness,
    freemem,
    homedir,
    hostname,
    machine,
    platform,
    release,
    tmpdir,
    totalmem,
    type_,
    uptime,
    version
} from '__wasm_rquickjs_builtin/os_native';

// End-of-line marker constant
export const EOL = '\n';

// Export all functions and constants
export {
    arch,
    endianness,
    freemem,
    homedir,
    hostname,
    platform,
    release,
    tmpdir,
    totalmem,
    type_ as type,
    uptime,
    version,
};

export function availableParallelism() {
    return available_parallelism();
}

export const constants = {
    // none available
};

export function cpus() {
    return []; // not available
}

export const devNull = "/dev/null";

export function getPriority(pid) {
    return 0; // not available
}

export function loadavg() {
    return [0, 0, 0]; // not available
}

export function networkInterfaces() {
    return {}; // not available
}

export function setPriority(pid, priority) {
    // not available
}

export function userinfo(options) {
    // Should return an object with: { uid: number, gid: number, username: string, homedir: string, shell: string }
    if (options && options.encoding === "buffer") {
        return {
            uid: -1,
            gid: -1,
            username: Buffer.from("unknown"),
            homedir: Buffer.from("/"),
            shell: null,
        };
    } else {
        return {
            uid: -1,
            gid: -1,
            username: "unknown",
            homedir: "/",
            shell: null,
        };
    }
}

export default {
    EOL,
    arch,
    availableParallelism,
    cpus,
    devNull,
    endianness,
    freemem,
    getPriority,
    homedir,
    hostname,
    loadavg,
    machine,
    networkInterfaces,
    platform,
    release,
    setPriority,
    tmpdir,
    totalmem,
    type: type_,
    uptime,
    userinfo,
    version,
};
