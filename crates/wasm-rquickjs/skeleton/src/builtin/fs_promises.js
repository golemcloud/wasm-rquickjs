import * as native from '__wasm_rquickjs_builtin/fs_native';

// writeFile
// rename
// mkdir

export async function unlink(path) {
    // TODO: support Buffer and URL as path

    // NOTE: no async unlink on WASI p2
    const error = native.unlink(path);
    if (error !== undefined) {
        Promise.reject(error);
    } else {
        Promise.resolve(undefined)
    }
}

export default {
    unlink
};
