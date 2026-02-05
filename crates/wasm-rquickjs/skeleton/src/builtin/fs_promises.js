import * as native from '__wasm_rquickjs_builtin/fs_native';

export async function unlink(path) {
    // TODO: support Buffer and URL as path

    // NOTE: no async unlink on WASI p2
    const error = native.unlink(path);
    if (error !== undefined) {
        return Promise.reject(new Error(error));
    } else {
        return Promise.resolve(undefined);
    }
}

export async function writeFile(path, data, options) {
    // TODO: support Buffer and URL as path
    // TODO: support FileHandle

    let encoding = undefined;
    if (typeof options === 'string') {
        encoding = options;
    } else if (options && options.encoding) {
        encoding = options.encoding;
    }

    let error;
    if (encoding && encoding !== '') {
        error = native.write_file_with_encoding(path, encoding, data);
    } else if (typeof data === 'string') {
        error = native.write_file_with_encoding(path, 'utf8', data);
    } else {
        const dataArray = new Uint8Array(data.buffer || data, data.byteOffset || 0, data.byteLength || data.length);
        error = native.write_file(path, dataArray);
    }

    if (error !== undefined) {
        return Promise.reject(new Error(error));
    } else {
        return Promise.resolve(undefined);
    }
}

export async function rename(oldPath, newPath) {
    // TODO: support Buffer and URL as path

    // NOTE: no async rename on WASI p2
    const error = native.rename(oldPath, newPath);
    if (error !== undefined) {
        return Promise.reject(new Error(error));
    } else {
        return Promise.resolve(undefined);
    }
}

export async function mkdir(path, options) {
    // TODO: support Buffer and URL as path

    let recursive = false;
    if (options && options.recursive) {
        recursive = true;
    }

    // NOTE: no async mkdir on WASI p2
    const error = native.mkdir(path, recursive);
    if (error !== undefined) {
        return Promise.reject(new Error(error));
    } else {
        return Promise.resolve(undefined);
    }
}

export default {
    unlink,
    writeFile,
    rename,
    mkdir
};
