// node:tls stub implementation
// All functions throw errors as TLS is not supported in WASM environment

const NOT_SUPPORTED_ERROR = new Error('tls is not supported in WebAssembly environment');

export class SecureContext {
    constructor() {
        throw NOT_SUPPORTED_ERROR;
    }
}

export class TLSSocket {
    constructor() {
        throw NOT_SUPPORTED_ERROR;
    }
}

export class Server {
    constructor() {
        throw NOT_SUPPORTED_ERROR;
    }
}

export function connect(options, callback) {
    throw NOT_SUPPORTED_ERROR;
}

export function createServer(options, secureConnectionListener) {
    throw NOT_SUPPORTED_ERROR;
}

export function createSecureContext(options) {
    throw NOT_SUPPORTED_ERROR;
}

export function checkServerIdentity(hostname, cert) {
    throw NOT_SUPPORTED_ERROR;
}

export function getCiphers() {
    return [];
}

export const rootCertificates = [];

export const DEFAULT_MIN_VERSION = 'TLSv1.2';
export const DEFAULT_MAX_VERSION = 'TLSv1.3';
export const DEFAULT_ECDH_CURVE = 'auto';

export default {
    SecureContext,
    TLSSocket,
    Server,
    connect,
    createServer,
    createSecureContext,
    checkServerIdentity,
    getCiphers,
    rootCertificates,
    DEFAULT_MIN_VERSION,
    DEFAULT_MAX_VERSION,
    DEFAULT_ECDH_CURVE,
};