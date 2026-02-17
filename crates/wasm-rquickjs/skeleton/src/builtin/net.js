// node:net stub implementation
// isIP, isIPv4, isIPv6 are fully implemented; everything else throws

const NOT_SUPPORTED_ERROR = new Error('net is not supported in WebAssembly environment');

// --- Real implementations ---

export function isIPv4(input) {
    if (typeof input !== 'string') return false;
    const parts = input.split('.');
    if (parts.length !== 4) return false;
    for (const part of parts) {
        if (!/^\d+$/.test(part)) return false;
        const num = parseInt(part, 10);
        if (num < 0 || num > 255) return false;
        if (part.length > 1 && part[0] === '0') return false;
    }
    return true;
}

export function isIPv6(input) {
    if (typeof input !== 'string') return false;
    const parts = input.split(':');
    if (parts.length < 2 || parts.length > 8) return false;
    let hasEmptyGroup = false;
    for (let i = 0; i < parts.length; i++) {
        if (parts[i] === '') {
            if (i === 0 || i === parts.length - 1) continue;
            if (hasEmptyGroup) return false;
            hasEmptyGroup = true;
            continue;
        }
        if (!/^[0-9a-fA-F]{1,4}$/.test(parts[i])) return false;
    }
    return true;
}

export function isIP(input) {
    if (isIPv4(input)) return 4;
    if (isIPv6(input)) return 6;
    return 0;
}

// --- Stub classes ---

export class Socket {
    constructor(options) {
        this.remoteAddress = undefined;
        this.remotePort = undefined;
        this.localAddress = undefined;
        this.localPort = undefined;
        this.bytesRead = 0;
        this.bytesWritten = 0;
        this.connecting = false;
        this.destroyed = false;
        this.readyState = 'closed';
    }
    connect() { throw NOT_SUPPORTED_ERROR; }
    write() { throw NOT_SUPPORTED_ERROR; }
    end() { throw NOT_SUPPORTED_ERROR; }
    destroy() { throw NOT_SUPPORTED_ERROR; }
    setTimeout() { throw NOT_SUPPORTED_ERROR; }
    setNoDelay() { throw NOT_SUPPORTED_ERROR; }
    setKeepAlive() { throw NOT_SUPPORTED_ERROR; }
    address() { throw NOT_SUPPORTED_ERROR; }
    ref() { throw NOT_SUPPORTED_ERROR; }
    unref() { throw NOT_SUPPORTED_ERROR; }
    pause() { throw NOT_SUPPORTED_ERROR; }
    resume() { throw NOT_SUPPORTED_ERROR; }
}

export class Server {
    constructor() {
        this.maxConnections = undefined;
    }
    listen() { throw NOT_SUPPORTED_ERROR; }
    close() { throw NOT_SUPPORTED_ERROR; }
    address() { throw NOT_SUPPORTED_ERROR; }
    getConnections() { throw NOT_SUPPORTED_ERROR; }
    ref() { throw NOT_SUPPORTED_ERROR; }
    unref() { throw NOT_SUPPORTED_ERROR; }
}

export class BlockList {
    constructor() {
        throw NOT_SUPPORTED_ERROR;
    }
}

export class SocketAddress {
    constructor() {
        throw NOT_SUPPORTED_ERROR;
    }
}

export function createServer(options, connectionListener) {
    throw NOT_SUPPORTED_ERROR;
}

export function connect(options, connectListener) {
    throw NOT_SUPPORTED_ERROR;
}

export function createConnection(options, connectListener) {
    throw NOT_SUPPORTED_ERROR;
}

export default {
    isIP,
    isIPv4,
    isIPv6,
    Socket,
    Server,
    BlockList,
    SocketAddress,
    createServer,
    connect,
    createConnection,
};