// node:zlib stub implementation
// Zlib is not yet implemented but could be in the future

const NOT_SUPPORTED_ERROR = 'zlib is not supported in WebAssembly environment';

// Stream factory functions
export function createGzip() {
    throw new Error(NOT_SUPPORTED_ERROR);
}

export function createGunzip() {
    throw new Error(NOT_SUPPORTED_ERROR);
}

export function createDeflate() {
    throw new Error(NOT_SUPPORTED_ERROR);
}

export function createInflate() {
    throw new Error(NOT_SUPPORTED_ERROR);
}

export function createDeflateRaw() {
    throw new Error(NOT_SUPPORTED_ERROR);
}

export function createInflateRaw() {
    throw new Error(NOT_SUPPORTED_ERROR);
}

export function createUnzip() {
    throw new Error(NOT_SUPPORTED_ERROR);
}

export function createBrotliCompress() {
    throw new Error(NOT_SUPPORTED_ERROR);
}

export function createBrotliDecompress() {
    throw new Error(NOT_SUPPORTED_ERROR);
}

// Convenience async functions
export function gzip() {
    throw new Error(NOT_SUPPORTED_ERROR);
}

export function gunzip() {
    throw new Error(NOT_SUPPORTED_ERROR);
}

export function deflate() {
    throw new Error(NOT_SUPPORTED_ERROR);
}

export function inflate() {
    throw new Error(NOT_SUPPORTED_ERROR);
}

export function deflateRaw() {
    throw new Error(NOT_SUPPORTED_ERROR);
}

export function inflateRaw() {
    throw new Error(NOT_SUPPORTED_ERROR);
}

export function unzip() {
    throw new Error(NOT_SUPPORTED_ERROR);
}

export function brotliCompress() {
    throw new Error(NOT_SUPPORTED_ERROR);
}

export function brotliDecompress() {
    throw new Error(NOT_SUPPORTED_ERROR);
}

// Convenience sync functions
export function gzipSync() {
    throw new Error(NOT_SUPPORTED_ERROR);
}

export function gunzipSync() {
    throw new Error(NOT_SUPPORTED_ERROR);
}

export function deflateSync() {
    throw new Error(NOT_SUPPORTED_ERROR);
}

export function inflateSync() {
    throw new Error(NOT_SUPPORTED_ERROR);
}

export function deflateRawSync() {
    throw new Error(NOT_SUPPORTED_ERROR);
}

export function inflateRawSync() {
    throw new Error(NOT_SUPPORTED_ERROR);
}

export function unzipSync() {
    throw new Error(NOT_SUPPORTED_ERROR);
}

export function brotliCompressSync() {
    throw new Error(NOT_SUPPORTED_ERROR);
}

export function brotliDecompressSync() {
    throw new Error(NOT_SUPPORTED_ERROR);
}

// Classes
export class Gzip {
    constructor() {
        throw new Error(NOT_SUPPORTED_ERROR);
    }
}

export class Gunzip {
    constructor() {
        throw new Error(NOT_SUPPORTED_ERROR);
    }
}

export class Deflate {
    constructor() {
        throw new Error(NOT_SUPPORTED_ERROR);
    }
}

export class Inflate {
    constructor() {
        throw new Error(NOT_SUPPORTED_ERROR);
    }
}

export class DeflateRaw {
    constructor() {
        throw new Error(NOT_SUPPORTED_ERROR);
    }
}

export class InflateRaw {
    constructor() {
        throw new Error(NOT_SUPPORTED_ERROR);
    }
}

export class Unzip {
    constructor() {
        throw new Error(NOT_SUPPORTED_ERROR);
    }
}

export class BrotliCompress {
    constructor() {
        throw new Error(NOT_SUPPORTED_ERROR);
    }
}

export class BrotliDecompress {
    constructor() {
        throw new Error(NOT_SUPPORTED_ERROR);
    }
}

// Constants
export const constants = {};

export default {
    createGzip,
    createGunzip,
    createDeflate,
    createInflate,
    createDeflateRaw,
    createInflateRaw,
    createUnzip,
    createBrotliCompress,
    createBrotliDecompress,
    gzip,
    gunzip,
    deflate,
    inflate,
    deflateRaw,
    inflateRaw,
    unzip,
    brotliCompress,
    brotliDecompress,
    gzipSync,
    gunzipSync,
    deflateSync,
    inflateSync,
    deflateRawSync,
    inflateRawSync,
    unzipSync,
    brotliCompressSync,
    brotliDecompressSync,
    Gzip,
    Gunzip,
    Deflate,
    Inflate,
    DeflateRaw,
    InflateRaw,
    Unzip,
    BrotliCompress,
    BrotliDecompress,
    constants,
};
