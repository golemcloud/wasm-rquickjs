// node:dgram stub implementation
// All functions throw errors as UDP sockets are not supported in WASM environment

const NOT_SUPPORTED_ERROR = new Error('dgram is not supported in WebAssembly environment');

export class Socket {
    constructor() {
        throw NOT_SUPPORTED_ERROR;
    }
    bind() { throw NOT_SUPPORTED_ERROR; }
    send() { throw NOT_SUPPORTED_ERROR; }
    close() { throw NOT_SUPPORTED_ERROR; }
    address() { throw NOT_SUPPORTED_ERROR; }
    setBroadcast() { throw NOT_SUPPORTED_ERROR; }
    setTTL() { throw NOT_SUPPORTED_ERROR; }
    setMulticastTTL() { throw NOT_SUPPORTED_ERROR; }
    addMembership() { throw NOT_SUPPORTED_ERROR; }
    dropMembership() { throw NOT_SUPPORTED_ERROR; }
    setMulticastLoopback() { throw NOT_SUPPORTED_ERROR; }
    setMulticastInterface() { throw NOT_SUPPORTED_ERROR; }
    ref() { throw NOT_SUPPORTED_ERROR; }
    unref() { throw NOT_SUPPORTED_ERROR; }
    addSourceSpecificMembership() { throw NOT_SUPPORTED_ERROR; }
    dropSourceSpecificMembership() { throw NOT_SUPPORTED_ERROR; }
    getRecvBufferSize() { throw NOT_SUPPORTED_ERROR; }
    getSendBufferSize() { throw NOT_SUPPORTED_ERROR; }
    setRecvBufferSize() { throw NOT_SUPPORTED_ERROR; }
    setSendBufferSize() { throw NOT_SUPPORTED_ERROR; }
    remoteAddress() { throw NOT_SUPPORTED_ERROR; }
    connect() { throw NOT_SUPPORTED_ERROR; }
    disconnect() { throw NOT_SUPPORTED_ERROR; }
}

export function createSocket(type, callback) {
    throw NOT_SUPPORTED_ERROR;
}

export default {
    Socket,
    createSocket,
};