// node:http2 stub implementation
// HTTP/2 is not yet supported in WebAssembly environment

const NOT_SUPPORTED_ERROR = new Error('http2 is not supported in WebAssembly environment');

export function connect(authority, options, listener) {
    throw NOT_SUPPORTED_ERROR;
}

export function createServer(options, onRequestHandler) {
    throw NOT_SUPPORTED_ERROR;
}

export function createSecureServer(options, onRequestHandler) {
    throw NOT_SUPPORTED_ERROR;
}

export function getDefaultSettings() {
    throw NOT_SUPPORTED_ERROR;
}

export function getPackedSettings(settings) {
    throw NOT_SUPPORTED_ERROR;
}

export function getUnpackedSettings(buf) {
    throw NOT_SUPPORTED_ERROR;
}

export const sensitiveHeaders = Symbol('nodejs.http2.sensitiveHeaders');

export const constants = {};

export class Http2ServerRequest {
    constructor() {
        throw NOT_SUPPORTED_ERROR;
    }
}

export class Http2ServerResponse {
    constructor() {
        throw NOT_SUPPORTED_ERROR;
    }
}

export default {
    connect,
    createServer,
    createSecureServer,
    getDefaultSettings,
    getPackedSettings,
    getUnpackedSettings,
    sensitiveHeaders,
    constants,
    Http2ServerRequest,
    Http2ServerResponse,
};
