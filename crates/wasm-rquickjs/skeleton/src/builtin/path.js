// node:path implementation (POSIX only)
// Provides utilities for working with file and directory paths

import {
    basename,
    dirname,
    extname,
    is_absolute as isAbsolute,
    join as joinNative,
    normalize,
    relative,
    resolve as resolveNative,
    parse as parseNative,
    format as formatNative,
    ParsedPath,
} from "__wasm_rquickjs_builtin/path_native";

// Match a path against a glob pattern
function matchesGlob(path, pattern) {
    if (typeof path !== 'string' || typeof pattern !== 'string') {
        throw new TypeError('Both path and pattern must be strings');
    }

    // Simple glob matching: only supports * and ? wildcards
    const regexStr = pattern
        .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape regex special chars
        .replace(/\*/g, '.*') // * matches any sequence
        .replace(/\?/g, '.'); // ? matches single char

    const regex = new RegExp(`^${regexStr}$`);
    return regex.test(path);
}

// Convert to namespaced path (no-op on POSIX)
function toNamespacedPath(path) {
    if (typeof path !== 'string') {
        return path;
    }
    return path;
}

function join(...paths) {
    return joinNative(paths);
}

function resolve(...paths) {
    return resolveNative(paths);
}

function parse(path) {
    return parseNative(path);
}

function format(pathObject) {
    if (pathObject === null || typeof pathObject !== 'object') {
        throw new TypeError('The "pathObject" argument must be of type Object. Received ' + pathObject);
    }
    
    // Check if it is a ParsedPath using duck typing as we don't have the class constructor easily accessible
    // If we passed a ParsedPath instance from parseNative, we can probably pass it back.
    // However, to be safe and support plain objects, we create a new ParsedPath instance.
    
    const root = pathObject.root !== undefined ? String(pathObject.root) : "";
    const dir = pathObject.dir !== undefined ? String(pathObject.dir) : "";
    const base = pathObject.base !== undefined ? String(pathObject.base) : "";
    const ext = pathObject.ext !== undefined ? String(pathObject.ext) : "";
    const name = pathObject.name !== undefined ? String(pathObject.name) : "";

    const pp = new ParsedPath(root, dir, base, ext, name);
    
    return formatNative(pp);
}

const sep = '/';
const delimiter = ':';

// POSIX path object with all methods
const posix = {
    sep,
    delimiter,
    basename,
    dirname,
    extname,
    isAbsolute,
    join,
    normalize,
    relative,
    resolve,
    parse,
    format,
    matchesGlob,
    toNamespacedPath,
};

// Export all path functions
export {
    sep,
    delimiter,
    basename,
    dirname,
    extname,
    isAbsolute,
    join,
    normalize,
    relative,
    resolve,
    parse,
    format,
    matchesGlob,
    toNamespacedPath,
    posix,
};
