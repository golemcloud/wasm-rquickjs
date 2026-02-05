import * as native from '__wasm_rquickjs_builtin/fs_native';
import {Buffer} from 'node:buffer';

export function readFile(path, optionsOrCallback, callback) {
    if (typeof optionsOrCallback === 'function') {
        callback = optionsOrCallback;
        optionsOrCallback = {};
    }
    if (typeof optionsOrCallback === 'string') {
        optionsOrCallback = {encoding: optionsOrCallback};
    }
    if (optionsOrCallback.encoding && optionsOrCallback.encoding !== '') {
        const [contents, error] = native.read_file_with_encoding(path, optionsOrCallback.encoding);
        if (error === undefined) {
            callback(contents);
        } else {
            callback(undefined, error);
        }
    } else {
        const [contents, error] = native.read_file(path);
        if (error === undefined) {
            const buffer = Buffer.from(contents);
            callback(buffer);
        } else {
            callback(undefined, error);
        }
    }
}

export function readFileSync(path, options) {
    if (typeof options === 'string') {
        options = {encoding: options};
    }
    if (options && options.encoding && options.encoding !== '') {
        const [contents, error] = native.read_file_with_encoding(path, options.encoding);
        if (error === undefined) {
            return contents;
        } else {
            throw new Error(error);
        }
    } else {
        const [contents, error] = native.read_file(path);
        if (error === undefined) {
            return Buffer.from(contents);
        } else {
            throw new Error(error);
        }
    }
}

export function writeFile(path, data, optionsOrCallback, callback) {
    if (typeof optionsOrCallback === 'function') {
        callback = optionsOrCallback;
        optionsOrCallback = {};
    }
    if (typeof optionsOrCallback === 'string') {
        optionsOrCallback = {encoding: optionsOrCallback};
    }
    if (optionsOrCallback && optionsOrCallback.encoding && optionsOrCallback.encoding !== '') {
        const error = native.write_file_with_encoding(path, optionsOrCallback.encoding, data);
        callback(error);
    } else {
        if (typeof data === 'string') {
            const error = native.write_file_with_encoding(path, "utf8", data);
            callback(error);
        } else {
            const dataArray = new Uint8Array(data.buffer || data, data.byteOffset || 0, data.byteLength || data.length);
            const error = native.write_file(path, dataArray);
            callback(error);
        }
    }
}


export function writeFileSync(path, data, options) {
    if (typeof options === 'string') {
        options = {encoding: options};
    }
    if (options && options.encoding && options.encoding !== '') {
        const error = native.write_file_with_encoding(path, options.encoding, data);
        if (error !== undefined) {
            throw new Error(error);
        }
    } else {
        if (typeof data === 'string') {
            const error = native.write_file_with_encoding(path, "utf8", data);
            if (error !== undefined) {
                throw new Error(error);
            }
        } else {
            const dataArray = new Uint8Array(data.buffer || data, data.byteOffset || 0, data.byteLength || data.length);
            const error = native.write_file(path, dataArray);
            if (error !== undefined) {
                throw new Error(error);
            }
        }
    }
}

export function unlinkSync(path) {
    // TODO: support Buffer and URL as path

    const error = native.unlink(path);
    if (error !== undefined) {
        throw new Error(error);
    }
}

export function unlink(path, callback) {
    // TODO: support Buffer and URL as path

    // NOTE: no async unlink on WASI p2
    const error = native.unlink(path);
    if (error !== undefined) {
        callback(error);
    } else {
        callback();
    }
}


export function renameSync(oldPath, newPath) {
    // TODO: support Buffer and URL as path

    const error = native.rename(oldPath, newPath);
    if (error !== undefined) {
        throw new Error(error);
    }
}

export function rename(oldPath, newPath, callback) {
    // TODO: support Buffer and URL as path

    // NOTE: no async rename on WASI p2
    const error = native.rename(oldPath, newPath);
    if (error !== undefined) {
        callback(error);
    } else {
        callback();
    }
}

export function mkdirSync(path, options) {
    // TODO: support Buffer and URL as path

    let recursive = false;
    if (options && options.recursive) {
        recursive = true;
    }

    const error = native.mkdir(path, recursive);
    if (error !== undefined) {
        throw new Error(error);
    }
}

export function mkdir(path, optionsOrCallback, callback) {
    // TODO: support Buffer and URL as path

    let recursive = false;
    if (typeof optionsOrCallback === 'function') {
        callback = optionsOrCallback;
    } else if (optionsOrCallback && optionsOrCallback.recursive) {
        recursive = true;
    }

    // NOTE: no async mkdir on WASI p2
    const error = native.mkdir(path, recursive);
    if (error !== undefined) {
        callback(error);
    } else {
        callback();
    }
}

export default {
    readFile,
    readFileSync,
    writeFile,
    writeFileSync,
    unlink,
    unlinkSync,
    rename,
    renameSync,
    mkdir,
    mkdirSync
};
