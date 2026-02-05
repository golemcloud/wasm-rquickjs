const NOT_SUPPORTED_ERROR = new Error('createRequire is not available in WebAssembly environment');

export function createRequire(filename) {
    throw NOT_SUPPORTED_ERROR;
}

export default {
    createRequire,
};
