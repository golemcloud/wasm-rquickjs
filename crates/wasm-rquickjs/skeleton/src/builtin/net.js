import Duplex from '__wasm_rquickjs_builtin/internal/streams/duplex';
import { EventEmitter } from 'node:events';
import { Buffer } from 'node:buffer';
import dns from 'node:dns';
import fs from 'node:fs';
import pathModule from 'node:path';
import { create_tcp_socket, create_tcp_listener } from '__wasm_rquickjs_builtin/net_native';
import {
    ERR_INVALID_ARG_TYPE,
    ERR_INVALID_ARG_VALUE,
    ERR_MISSING_ARGS,
    ERR_OUT_OF_RANGE,
    ERR_SOCKET_BAD_PORT,
} from '__wasm_rquickjs_builtin/internal/errors';

// --- IP address utilities ---

const v4Seg = '(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])';
const v4Str = `(?:${v4Seg}\\.){3}${v4Seg}`;
const IPv4Reg = new RegExp(`^${v4Str}$`);

const v6Seg = '(?:[0-9a-fA-F]{1,4})';
const IPv6Reg = new RegExp('^(?:' +
  `(?:${v6Seg}:){7}(?:${v6Seg}|:)|` +
  `(?:${v6Seg}:){6}(?:${v4Str}|:${v6Seg}|:)|` +
  `(?:${v6Seg}:){5}(?::${v4Str}|(?::${v6Seg}){1,2}|:)|` +
  `(?:${v6Seg}:){4}(?:(?::${v6Seg}){0,1}:${v4Str}|(?::${v6Seg}){1,3}|:)|` +
  `(?:${v6Seg}:){3}(?:(?::${v6Seg}){0,2}:${v4Str}|(?::${v6Seg}){1,4}|:)|` +
  `(?:${v6Seg}:){2}(?:(?::${v6Seg}){0,3}:${v4Str}|(?::${v6Seg}){1,5}|:)|` +
  `(?:${v6Seg}:){1}(?:(?::${v6Seg}){0,4}:${v4Str}|(?::${v6Seg}){1,6}|:)|` +
  `(?::(?:(?::${v6Seg}){0,5}:${v4Str}|(?::${v6Seg}){1,7}|:))` +
')(?:%[0-9a-zA-Z-.:]{1,})?$');

export function isIPv4(input) {
    return IPv4Reg.test(input);
}

export function isIPv6(input) {
    return IPv6Reg.test(input);
}

export function isIP(input) {
    if (isIPv4(input)) return 4;
    if (isIPv6(input)) return 6;
    return 0;
}

// --- Helpers ---

const errnoMap = {
    ENOSYS: -38,
    EBADF: -9,
    EINVAL: -22,
    EADDRINUSE: -48,
    EADDRNOTAVAIL: -49,
    EACCES: -13,
    EHOSTUNREACH: -65,
    ECONNREFUSED: -61,
    ECONNRESET: -54,
    ECONNABORTED: -53,
    ETIMEDOUT: -60,
    EPIPE: -32,
    ENOTCONN: -57,
    EMFILE: -24,
    EIO: -5,
};

function makeError(code, message) {
    const err = new Error(message);
    err.code = code;
    return err;
}

function parseNativeError(e) {
    try {
        const parsed = JSON.parse(e.message);
        const err = new Error(parsed.message || `${parsed.syscall} ${parsed.code}`);
        err.code = parsed.code;
        if (parsed.syscall) err.syscall = parsed.syscall;
        if (parsed.code) err.errno = errnoMap[parsed.code] || 0;
        return err;
    } catch (_) {
        return e;
    }
}

function nextTick(fn, ...args) {
    Promise.resolve().then(() => fn(...args));
}

// IPC path → TCP loopback mapping for in-process Unix socket emulation
const _ipcListeners = {};

function isIPAddress(addr) {
    if (!addr || typeof addr !== 'string') return false;
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(addr)) return true;
    if (addr.indexOf(':') !== -1) return true;
    return false;
}

function ipv4ToNum(ip) {
    const parts = ip.split('.').map(Number);
    return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

// --- Socket (extends Duplex) ---

function Socket(options) {
    if (!(this instanceof Socket)) return new Socket(options);

    if (typeof options === 'number') {
        options = { fd: options };
    }
    options = options || {};

    const streamOptions = {
        ...options,
        allowHalfOpen: options.allowHalfOpen !== undefined ? options.allowHalfOpen : false,
        autoDestroy: false,
    };

    Duplex.call(this, streamOptions);

    this._handle = null;
    this._reading = false;
    this._readToken = 0;
    this.connecting = false;
    this._timeout = null;
    this._timeoutValue = 0;
    this.bytesRead = 0;
    this._bytesDispatched = 0;
    this.remoteAddress = undefined;
    this.remotePort = undefined;
    this.remoteFamily = undefined;
    this.localAddress = undefined;
    this.localPort = undefined;
    this.localFamily = undefined;
    this._family = options.family ?? 4;
    this._httpStatusProbeBuffer = '';

    // Shut down the socket when we're finished with it.
    this.on('end', onReadableStreamEnd);
}

function onReadableStreamEnd() {
    if (!this.allowHalfOpen) {
        this.write = writeAfterFIN;
    }
}

function writeAfterFIN(chunk, encoding, cb) {
    if (typeof encoding === 'function') {
        cb = encoding;
        encoding = null;
    }
    const er = makeError('EPIPE', 'This socket has been ended by the other party');
    if (typeof cb === 'function') {
        nextTick(cb, er);
    }
    this.destroy(er);
    return false;
}

Object.setPrototypeOf(Socket.prototype, Duplex.prototype);
Object.setPrototypeOf(Socket, Duplex);

Object.defineProperty(Socket.prototype, 'bufferSize', {
    get() {
        return this.writableLength || 0;
    },
});

Object.defineProperty(Socket.prototype, 'pending', {
    get() {
        return !this._handle || this.connecting;
    },
    configurable: true,
});

Object.defineProperty(Socket.prototype, 'bytesWritten', {
    get() {
        let bytes = this._bytesDispatched;
        if (this._writableState) {
            bytes += this._writableState.length;
        }
        return bytes;
    },
    set(val) {
        this._bytesDispatched = val;
    },
    configurable: true,
});

Object.defineProperty(Socket.prototype, '_connecting', {
    get() {
        return this.connecting;
    },
    set(val) {
        this.connecting = val;
    },
    configurable: true,
});

Object.defineProperty(Socket.prototype, 'readyState', {
    get() {
        if (this.connecting) return 'opening';
        if (this.readable && this.writable) return 'open';
        if (this.readable && !this.writable) return 'readOnly';
        if (!this.readable && this.writable) return 'writeOnly';
        return 'closed';
    },
});

Socket.prototype.connect = function connect(...args) {
    let options, cb;

    if (args.length === 0) {
        throw new ERR_MISSING_ARGS(['options', 'port', 'path']);
    }

    // connect(options[, cb])
    if (typeof args[0] === 'object' && args[0] !== null) {
        options = args[0];
        cb = args[1];
    }
    // connect(path[, cb]) — IPC
    else if (typeof args[0] === 'string' && !isFinite(args[0])) {
        options = { path: args[0] };
        cb = args[1];
    }
    // connect(port[, host][, cb])
    else {
        options = { port: args[0] };
        if (typeof args[1] === 'string') {
            options.host = args[1];
            cb = args[2];
        } else {
            cb = args[1];
        }
    }

    if (options.port === undefined && !options.path && !options.host) {
        throw new ERR_MISSING_ARGS(['options', 'port', 'path']);
    }

    if (options.objectMode) {
        throw new ERR_INVALID_ARG_VALUE('options.objectMode', options.objectMode, 'is not supported');
    }
    if (options.readableObjectMode) {
        throw new ERR_INVALID_ARG_VALUE('options.readableObjectMode', options.readableObjectMode, 'is not supported');
    }
    if (options.writableObjectMode) {
        throw new ERR_INVALID_ARG_VALUE('options.writableObjectMode', options.writableObjectMode, 'is not supported');
    }

    if (options.host !== undefined && typeof options.host !== 'string') {
        throw new ERR_INVALID_ARG_TYPE('options.host', 'string', options.host);
    }

    if (options.lookup !== undefined && typeof options.lookup !== 'function') {
        throw new ERR_INVALID_ARG_TYPE('options.lookup', 'Function', options.lookup);
    }

    if (options.autoSelectFamily !== undefined && typeof options.autoSelectFamily !== 'boolean') {
        throw new ERR_INVALID_ARG_TYPE('options.autoSelectFamily', 'boolean', options.autoSelectFamily);
    }

    if (options.autoSelectFamilyAttemptTimeout !== undefined && options.autoSelectFamilyAttemptTimeout <= 0) {
        throw new ERR_OUT_OF_RANGE('options.autoSelectFamilyAttemptTimeout', '>= 1', options.autoSelectFamilyAttemptTimeout);
    }

    if (options.path) {
        const ipcEntry = _ipcListeners[options.path];
        if (!ipcEntry) {
            const ipcPath = options.path;
            this.connecting = true;
            nextTick(() => {
                this.connecting = false;
                const err = makeError('ENOENT', `connect ENOENT ${ipcPath}`);
                this.destroy(err);
            });
            return this;
        }
        options.port = ipcEntry.port;
        options.host = ipcEntry.host;
        delete options.path;
    }

    this.connecting = true;
    this.writable = true;

    if (cb) this.once('connect', cb);

    const port = options.port;
    const host = options.host || options.hostname || 'localhost';
    const autoSelectFamily = options.autoSelectFamily ?? _defaultAutoSelectFamily;
    const family = options.family ?? (autoSelectFamily ? 0 : this._family ?? 4);
    const lookup = options.lookup || dns.lookup;
    const autoSelectFamilyAttemptTimeout = Math.max(
        10,
        options.autoSelectFamilyAttemptTimeout ?? _defaultAutoSelectFamilyAttemptTimeout
    );

    if (port !== undefined) {
        const p = +port;
        if (p !== p || p < 0 || p > 65535 || p !== (p | 0)) {
            throw new ERR_SOCKET_BAD_PORT('Port', port, false);
        }
    }

    const completeConnection = (handle) => {
        this._handle = handle;
        this.connecting = false;

        try {
            const [ra, rp, rf] = this._handle.remote_address();
            this.remoteAddress = ra;
            this.remotePort = rp;
            this.remoteFamily = rf;
        } catch (_) {}
        try {
            const [la, lp, lf] = this._handle.local_address();
            this.localAddress = la;
            this.localPort = lp;
            this.localFamily = lf;
        } catch (_) {}

        this.emit('connect');
        this.emit('ready');

        this.read(0);
    };

    const createConnectError = (ip) => {
        const err = makeError('EADDRNOTAVAIL', `connect EADDRNOTAVAIL ${ip}:${port} - Local (:::0)`);
        err.address = ip;
        err.port = port;
        return err;
    };

    const connectAttempt = (ip, addressFamily, onResult) => {
        if (addressFamily === 6) {
            nextTick(onResult, createConnectError(ip));
            return;
        }

        const handle = create_tcp_socket(addressFamily);

        (async () => {
            try {
                await handle.connect(ip, port);
                onResult(null, handle);
            } catch (e) {
                const err = parseNativeError(e);
                err.address = ip;
                err.port = port;
                try {
                    handle.close();
                } catch (_) {}
                onResult(err);
            }
        })();
    };

    const doConnect = (ip, addressFamily) => {
        connectAttempt(ip, addressFamily, (err, handle) => {
            if (!this.connecting || this.destroyed) {
                if (handle) {
                    try {
                        handle.close();
                    } catch (_) {}
                }
                return;
            }

            if (err) {
                this.connecting = false;
                this.destroy(err);
                return;
            }

            completeConnection(handle);
        });
    };

    const normalizeLookupEntries = (address, resolvedFamily) => {
        const results = [];
        const pushAddress = (candidate, candidateFamily) => {
            if (typeof candidate !== 'string') return;

            const familyNumber =
                candidateFamily === 4 || candidateFamily === 6
                    ? candidateFamily
                    : isIP(candidate);
            if (familyNumber !== 4 && familyNumber !== 6) return;

            results.push({ address: candidate, family: familyNumber });
        };

        if (Array.isArray(address)) {
            for (const entry of address) {
                if (entry && typeof entry === 'object') {
                    pushAddress(entry.address, entry.family);
                }
            }
        } else {
            pushAddress(address, resolvedFamily);
        }

        return results;
    };

    const interleaveLookupAddresses = (entries) => {
        if (entries.length <= 1) return entries;

        const firstFamily = entries[0].family;
        const preferred = [];
        const alternate = [];

        for (const entry of entries) {
            if (entry.family === firstFamily) {
                preferred.push(entry);
            } else {
                alternate.push(entry);
            }
        }

        const ordered = [];
        const maxLen = Math.max(preferred.length, alternate.length);
        for (let i = 0; i < maxLen; i++) {
            if (i < preferred.length) ordered.push(preferred[i]);
            if (i < alternate.length) ordered.push(alternate[i]);
        }

        return ordered;
    };

    const doAutoSelectConnect = (addresses) => {
        if (addresses.length <= 1) {
            if (addresses.length === 0) {
                this.connecting = false;
                this.destroy(makeError('ENOTFOUND', `lookup ${host} returned no valid address`));
                return;
            }

            doConnect(addresses[0].address, addresses[0].family);
            return;
        }

        this.autoSelectFamilyAttemptedAddresses = [];

        const errors = [];
        let index = 0;
        let attemptTimer = null;
        let activeAttemptId = 0;

        const clearAttemptTimer = () => {
            if (attemptTimer !== null) {
                globalThis.clearTimeout(attemptTimer);
                attemptTimer = null;
            }
        };

        const failWithErrors = () => {
            this.connecting = false;
            if (errors.length === 1) {
                this.destroy(errors[0]);
            } else {
                this.destroy(new AggregateError(errors, 'All connection attempts failed'));
            }
        };

        const tryNext = () => {
            if (!this.connecting || this.destroyed) return;

            if (index >= addresses.length) {
                failWithErrors();
                return;
            }

            const current = addresses[index++];
            const attemptId = ++activeAttemptId;
            this.autoSelectFamilyAttemptedAddresses.push(`${current.address}:${port}`);

            if (index < addresses.length) {
                attemptTimer = globalThis.setTimeout(() => {
                    if (attemptId !== activeAttemptId || !this.connecting || this.destroyed) {
                        return;
                    }

                    attemptTimer = null;

                    const timeoutError = makeError(
                        'ETIMEDOUT',
                        `connect ETIMEDOUT ${current.address}:${port}`
                    );
                    timeoutError.address = current.address;
                    timeoutError.port = port;
                    errors.push(timeoutError);

                    tryNext();
                }, autoSelectFamilyAttemptTimeout);
            }

            connectAttempt(current.address, current.family, (err, handle) => {
                if (!this.connecting || this.destroyed) {
                    if (handle) {
                        try {
                            handle.close();
                        } catch (_) {}
                    }
                    return;
                }

                if (attemptId !== activeAttemptId) {
                    if (handle) {
                        try {
                            handle.close();
                        } catch (_) {}
                    }
                    return;
                }

                clearAttemptTimer();

                if (err) {
                    errors.push(err);
                    tryNext();
                    return;
                }

                completeConnection(handle);
            });
        };

        tryNext();
    };

    const shouldAutoSelectFamily =
        autoSelectFamily === true &&
        family !== 4 &&
        family !== 6 &&
        options.localAddress === undefined;

    const handleLookupResult = (err, address, resolvedFamily) => {
        if (err) {
            this.connecting = false;
            this.emit('lookup', err, address, resolvedFamily, host);
            this.destroy(err);
            return;
        }

        const normalized = normalizeLookupEntries(address, resolvedFamily);
        const first = normalized[0];
        this.emit('lookup', null, first?.address, first?.family, host);

        if (this.destroyed || !this.connecting) {
            return;
        }

        if (shouldAutoSelectFamily) {
            doAutoSelectConnect(interleaveLookupAddresses(normalized));
            return;
        }

        if (!first) {
            this.connecting = false;
            this.destroy(makeError('ENOTFOUND', `lookup ${host} returned no valid address`));
            return;
        }

        doConnect(first.address, first.family);
    };

    if (isIPAddress(host)) {
        const af = isIPv4(host) ? 4 : 6;
        this.emit('lookup', null, host, af, host);
        doConnect(host, af);
    } else {
        lookup(host, { family, all: shouldAutoSelectFamily }, handleLookupResult);
    }

    return this;
};

Socket.prototype._read = function _read(n) {
    if (this.connecting) {
        this.once('connect', () => this._read(n));
        return;
    }
    if (!this._handle || this.destroyed) return;
    if (!this._reading) {
        this._reading = true;
        this._startPollLoop();
    }
};

Socket.prototype._startPollLoop = function _startPollLoop() {
    const token = ++this._readToken;
    (async () => {
        while (this._reading && this._handle && token === this._readToken) {
            try {
                const chunk = await this._handle.read(16384);
                if (token !== this._readToken) break;
                if (chunk === null || chunk === undefined) {
                    if (!this.allowHalfOpen && !this.writableEnded) {
                        this.end();
                    }

                    if (!this.destroyed) {
                        const destroyAfterTurn = () => {
                            globalThis.setTimeout(() => {
                                if (!this.destroyed) this.destroy();
                            }, 0);
                        };

                        if (this.writableFinished || this.writable === false) {
                            destroyAfterTurn();
                        } else {
                            this.once('finish', destroyAfterTurn);
                        }
                    }

                    this.push(null);
                    this.read(0);
                    break;
                }
                this.bytesRead += chunk.length;
                this._resetTimeout();
                const keepGoing = this.push(Buffer.from(chunk));
                if (!keepGoing) {
                    this._reading = false;
                    break;
                }
            } catch (e) {
                if (token !== this._readToken) break;
                this.destroy(parseNativeError(e));
                break;
            }
        }
    })();
};

Socket.prototype._write = function _write(chunk, encoding, callback) {
    if (this.connecting) {
        this.once('connect', () => this._write(chunk, encoding, callback));
        return;
    }
    if (!this._handle) {
        callback(new Error('Socket is closed'));
        return;
    }

    const data = typeof chunk === 'string' ? Buffer.from(chunk, encoding) : chunk;
    const buf = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    const byteArray = Array.from(buf);

    (async () => {
        try {
            const written = await this._handle.write(byteArray);
            this._bytesDispatched += written;
            this._resetTimeout();
            callback(null);
        } catch (e) {
            callback(parseNativeError(e));
        }
    })();
};

Socket.prototype._final = function _final(callback) {
    if (this.connecting) {
        this.once('connect', () => this._final(callback));
        return;
    }
    if (!this._handle) {
        callback();
        return;
    }
    try {
        this._handle.shutdown(1); // SHUT_WR
        callback();
    } catch (e) {
        callback(parseNativeError(e));
    }
};

Socket.prototype._destroy = function _destroy(err, callback) {
    this._reading = false;
    this._readToken++;
    this._clearTimeout();
    if (this._handle) {
        this._handle.close();
        this._handle = null;
    }
    this.connecting = false;
    callback(err);
};

Socket.prototype.setTimeout = function setTimeout(timeout, callback) {
    if (typeof timeout !== 'number') {
        throw new ERR_INVALID_ARG_TYPE('msecs', 'number', timeout);
    }
    if (timeout < 0 || !Number.isFinite(timeout)) {
        throw new ERR_OUT_OF_RANGE('msecs', 'a non-negative finite number', timeout);
    }
    if (this.destroyed) return this;
    this._clearTimeout();
    this._timeoutValue = timeout;
    if (timeout === 0) {
        if (callback !== undefined) {
            if (typeof callback !== 'function') {
                throw new ERR_INVALID_ARG_TYPE('callback', 'Function', callback);
            }
            this.removeListener('timeout', callback);
        }
        return this;
    }
    if (callback !== undefined) {
        if (typeof callback !== 'function') {
            throw new ERR_INVALID_ARG_TYPE('callback', 'Function', callback);
        }
        this.once('timeout', callback);
    }
    this._resetTimeout();
    return this;
};

Socket.prototype._resetTimeout = function _resetTimeout() {
    if (this._timeoutValue > 0) {
        this._clearTimeout();
        this._timeout = globalThis.setTimeout(() => {
            this.emit('timeout');
        }, this._timeoutValue);
    }
};

Socket.prototype._clearTimeout = function _clearTimeout() {
    if (this._timeout) {
        globalThis.clearTimeout(this._timeout);
        this._timeout = null;
    }
};

Socket.prototype.setNoDelay = function setNoDelay(noDelay) {
    if (this._handle) this._handle.set_no_delay(noDelay !== false);
    return this;
};

Socket.prototype.setKeepAlive = function setKeepAlive(enable, initialDelay) {
    if (this._handle) {
        this._handle.set_keep_alive(!!enable, (initialDelay || 0));
    }
    return this;
};

Socket.prototype.address = function address() {
    if (!this._handle) return {};
    try {
        const [addr, port, family] = this._handle.local_address();
        return { address: addr, family, port };
    } catch (_) {
        return {};
    }
};

Socket.prototype.resetAndDestroy = function resetAndDestroy() {
    if (this._handle) {
        this._handle.close();
    }
    this.destroy();
    return this;
};

Socket.prototype.destroySoon = function destroySoon() {
    if (this.writable) this.end();
    if (this.writableFinished) this.destroy();
    else this.once('finish', this.destroy);
};

Socket.prototype.ref = function ref() { return this; };
Socket.prototype.unref = function unref() { return this; };

// --- Server (extends EventEmitter) ---

function Server(options, connectionListener) {
    if (!(this instanceof Server)) return new Server(options, connectionListener);
    EventEmitter.call(this);

    if (typeof options === 'function') {
        connectionListener = options;
        options = {};
    }
    options = options || {};

    this._handle = null;
    this._connections = 0;
    this._accepting = false;
    this._acceptToken = 0;
    this._acceptLoopActive = false;
    this._closeRequested = false;
    this._ipcPath = null;
    this.listening = false;
    this.maxConnections = 0;
    this._pauseOnConnect = options.pauseOnConnect || false;
    this._noDelay = options.noDelay || false;
    this._keepAlive = options.keepAlive || false;
    this._keepAliveInitialDelay = options.keepAliveInitialDelay || 0;
    this.allowHalfOpen = options.allowHalfOpen || false;

    if (connectionListener) this.on('connection', connectionListener);
}

Object.setPrototypeOf(Server.prototype, EventEmitter.prototype);
Object.setPrototypeOf(Server, EventEmitter);

Server.prototype.listen = function listen(...args) {
    let options, cb;

    if (args.length === 0) {
        options = {};
    } else if (typeof args[0] === 'function') {
        // listen(cb)
        options = {};
        cb = args[0];
    } else if (typeof args[0] === 'object' && args[0] !== null && !('port' in args[0] === false && typeof args[0] === 'number')) {
        // listen(options[, cb])
        options = args[0];
        cb = args[1];
    } else if (typeof args[0] === 'string' && !isFinite(args[0])) {
        // listen(path[, backlog][, cb]) — IPC
        options = { path: args[0] };
        if (typeof args[1] === 'function') {
            cb = args[1];
        } else {
            if (args[1] !== undefined) options.backlog = args[1];
            cb = args[2];
        }
    } else {
        // listen(port[, host][, backlog][, cb])
        options = { port: args[0] };
        let idx = 1;
        if (typeof args[idx] === 'string') {
            options.host = args[idx++];
        }
        if (typeof args[idx] === 'number') {
            options.backlog = args[idx++];
        }
        // Find callback among remaining args (handles undefined host/backlog)
        while (idx < args.length && typeof args[idx] !== 'function') {
            idx++;
        }
        cb = args[idx];
    }

    // Node gives `port` precedence over `path` when both are present.
    // WASM has no Unix-domain socket support, so emulate IPC via TCP loopback.
    if (options.path && options.port === undefined) {
        this._ipcPath = options.path;
        const ipcPath = options.path;
        const ipcBacklog = options.backlog || 511;

        // Check for EADDRINUSE (path already in use by another server)
        if (_ipcListeners[ipcPath]) {
            nextTick(() => {
                const err = makeError('EADDRINUSE', `listen EADDRINUSE: address already in use ${ipcPath}`);
                err.address = ipcPath;
                err.errno = errnoMap['EADDRINUSE'] || 0;
                err.syscall = 'listen';
                this.emit('error', err);
            });
            return this;
        }

        // Check that the parent directory exists
        try {
            const dir = pathModule.dirname(ipcPath);
            fs.accessSync(dir);
        } catch (_) {
            nextTick(() => {
                const err = makeError('ENOENT', `listen ENOENT: no such file or directory, listen '${ipcPath}'`);
                err.address = ipcPath;
                err.syscall = 'listen';
                this.emit('error', err);
            });
            return this;
        }

        if (cb) this.once('listening', cb);

        const doIpcListen = (ip, family) => {
            (async () => {
                try {
                    this._handle = create_tcp_listener(family);
                    await this._handle.bind(ip, 0);
                    this._handle.set_backlog(ipcBacklog);
                    await this._handle.listen();
                    this.listening = true;
                    this._accepting = true;
                    this._closeRequested = false;

                    const [, assignedPort] = this._handle.local_address();
                    _ipcListeners[ipcPath] = { host: ip, port: assignedPort };

                    // Create a placeholder file so fs.statSync works on the path
                    try {
                        let mode = 0o600;
                        if (options.readableAll) mode |= 0o044;
                        if (options.writableAll) mode |= 0o022;
                        fs.writeFileSync(ipcPath, '');
                        fs.chmodSync(ipcPath, mode);
                    } catch (_) {}

                    this.emit('listening');
                    this._acceptLoop();
                } catch (e) {
                    const err = parseNativeError(e);
                    err.address = ipcPath;
                    this.emit('error', err);
                }
            })();
        };
        doIpcListen('127.0.0.1', 4);
        return this;
    }

    if (this.listening) {
        throw makeError('ERR_SERVER_ALREADY_LISTEN', 'Server is already listening');
    }

    if (cb) this.once('listening', cb);

    const port = options.port !== undefined ? options.port : 0;
    if (port !== undefined) {
        const p = +port;
        if (p !== p || p < 0 || p > 65535 || p !== (p | 0)) {
            throw new ERR_SOCKET_BAD_PORT('Port', port, true);
        }
    }
    const host = options.host || '0.0.0.0';
    const backlog = options.backlog || 511;

    const doListen = (ip, family) => {
        (async () => {
            try {
                this._handle = create_tcp_listener(family);
                await this._handle.bind(ip, port);
                this._handle.set_backlog(backlog);
                await this._handle.listen();
                this.listening = true;
                this._accepting = true;
                this._closeRequested = false;
                this._connectionKey = (family === 6 ? '6' : '4') + ':' + ip + ':' + port;
                this.emit('listening');
                this._acceptLoop();
            } catch (e) {
                const err = parseNativeError(e);
                err.syscall = 'listen';
                err.address = ip;
                err.port = port;
                this.emit('error', err);
            }
        })();
    };

    if (isIPAddress(host)) {
        doListen(host, isIPv4(host) ? 4 : 6);
    } else if (host === '0.0.0.0' || host === '::') {
        doListen(host, host === '::' ? 6 : 4);
    } else {
        dns.lookup(host, (err, address, family) => {
            if (err) { this.emit('error', err); return; }
            doListen(address, family || 4);
        });
    }

    return this;
};

Server.prototype._closeHandle = function _closeHandle() {
    if (!this._handle) return;
    this._handle.close();
    this._handle = null;
};

Server.prototype._maybeEmitClose = function _maybeEmitClose() {
    if (!this.listening && !this._handle && this._connections === 0) {
        nextTick(() => this.emit('close'));
    }
};

Server.prototype._wakeAcceptLoop = function _wakeAcceptLoop() {
    if (!this._handle) return;

    let addr;
    let port;
    let family;
    try {
        [addr, port, family] = this._handle.local_address();
    } catch (_) {
        return;
    }

    const wakeFamily = family === 'IPv6' ? 6 : 4;
    const wakeAddress =
        addr === '0.0.0.0' ? '127.0.0.1' :
            (addr === '::' ? '::1' : addr);

    (async () => {
        const wakeSocket = create_tcp_socket(wakeFamily);
        try {
            await wakeSocket.connect(wakeAddress, port);
        } catch (_) {
            // Best effort only: this is just to wake a blocked accept call.
        } finally {
            try {
                wakeSocket.close();
            } catch (_) {}
        }
    })();
};

Server.prototype._acceptLoop = function _acceptLoop() {
    const token = ++this._acceptToken;
    this._acceptLoopActive = true;
    (async () => {
        try {
            while (this._accepting && this._handle && token === this._acceptToken) {
                try {
                    const [clientHandle, addr, port, family] = await this._handle.accept();
                    if (token !== this._acceptToken) { clientHandle.close(); break; }

                    if (this.maxConnections && this._connections >= this.maxConnections) {
                        clientHandle.close();
                        this.emit('drop', {
                            localAddress: this._localAddress,
                            localPort: this._localPort,
                            localFamily: this._localFamily,
                            remoteAddress: addr,
                            remotePort: port,
                            remoteFamily: family,
                        });
                        continue;
                    }

                    const socket = new Socket({ allowHalfOpen: this.allowHalfOpen });
                    socket._handle = clientHandle;
                    socket.server = this;
                    socket.connecting = false;
                    socket.readable = true;
                    socket.writable = true;
                    socket.remoteAddress = addr;
                    socket.remotePort = port;
                    socket.remoteFamily = family;
                    try {
                        const [la, lp, lf] = clientHandle.local_address();
                        socket.localAddress = la;
                        socket.localPort = lp;
                        socket.localFamily = lf;
                    } catch (_) {}

                    if (this._noDelay) socket.setNoDelay(true);
                    if (this._keepAlive) socket.setKeepAlive(true, this._keepAliveInitialDelay);
                    if (this._pauseOnConnect) socket.pause();

                    this._connections++;
                    socket.on('close', () => {
                        this._connections--;
                        this._maybeEmitClose();
                    });

                    this.emit('connection', socket);

                    if (!this._pauseOnConnect) {
                        socket.read(0);
                    }
                } catch (e) {
                    if (token !== this._acceptToken) break;
                    this.emit('error', parseNativeError(e));
                    break;
                }
            }
        } finally {
            this._acceptLoopActive = false;
            if (this._closeRequested) {
                this._closeHandle();
            }
            this._maybeEmitClose();
        }
    })();
};

Server.prototype.close = function close(cb) {
    if (typeof cb === 'function') {
        if (!this.listening) {
            this.once('close', () => cb(makeError('ERR_SERVER_NOT_RUNNING', 'Server is not running')));
        } else {
            this.once('close', cb);
        }
    }

    this._accepting = false;
    this._acceptToken++;
    this.listening = false;
    if (this._ipcPath) {
        delete _ipcListeners[this._ipcPath];
        try { fs.unlinkSync(this._ipcPath); } catch (_) {}
    }
    this._ipcPath = null;
    this._closeRequested = true;

    if (this._handle) {
        if (this._acceptLoopActive) {
            this._wakeAcceptLoop();
        } else {
            this._closeHandle();
        }
    }

    this._maybeEmitClose();

    return this;
};

Server.prototype.address = function address() {
    if (this._ipcPath && this.listening) return this._ipcPath;
    if (!this._handle || !this.listening) return null;
    try {
        const [addr, port, family] = this._handle.local_address();
        return { address: addr, family, port };
    } catch (_) {
        return null;
    }
};

Server.prototype.getConnections = function getConnections(cb) {
    nextTick(cb, null, this._connections);
    return this;
};

Server.prototype.ref = function ref() { return this; };
Server.prototype.unref = function unref() { return this; };

Server.prototype[Symbol.asyncDispose] = function () {
    if (!this._handle) {
        return Promise.resolve();
    }
    return new Promise((resolve) => {
        this.close(() => resolve());
    });
};

// --- BlockList ---

class BlockList {
    constructor() {
        this._rules = [];
    }

    addAddress(address, type) {
        if (address && typeof address === 'object' && address.address) {
            type = address.family;
            address = address.address;
        }
        type = type || (isIPv6(address) ? 'ipv6' : 'ipv4');
        this._rules.push({ type: 'address', address, family: type });
    }

    addRange(start, end, type) {
        if (start && typeof start === 'object' && start.address) {
            type = start.family;
            end = typeof end === 'object' ? end.address : end;
            start = start.address;
        }
        type = type || (isIPv6(start) ? 'ipv6' : 'ipv4');
        this._rules.push({ type: 'range', start, end, family: type });
    }

    addSubnet(net, prefix, type) {
        if (net && typeof net === 'object' && net.address) {
            type = net.family;
            net = net.address;
        }
        type = type || (isIPv6(net) ? 'ipv6' : 'ipv4');
        this._rules.push({ type: 'subnet', network: net, prefix, family: type });
    }

    check(address, type) {
        if (address && typeof address === 'object' && address.address) {
            type = address.family;
            address = address.address;
        }
        type = type || (isIPv6(address) ? 'ipv6' : 'ipv4');
        for (const rule of this._rules) {
            if (rule.family !== type) continue;
            if (rule.type === 'address' && rule.address === address) return true;
            if (rule.type === 'range') {
                if (type === 'ipv4') {
                    const ip = ipv4ToNum(address);
                    if (ip >= ipv4ToNum(rule.start) && ip <= ipv4ToNum(rule.end)) return true;
                }
            }
            if (rule.type === 'subnet') {
                if (type === 'ipv4') {
                    const ip = ipv4ToNum(address);
                    const net = ipv4ToNum(rule.network);
                    const mask = (~0 << (32 - rule.prefix)) >>> 0;
                    if ((ip & mask) === (net & mask)) return true;
                }
            }
        }
        return false;
    }

    get rules() {
        return this._rules.map(r => {
            if (r.type === 'address') return `Address: ${r.family} ${r.address}`;
            if (r.type === 'range') return `Range: ${r.family} ${r.start}-${r.end}`;
            if (r.type === 'subnet') return `Subnet: ${r.family} ${r.network}/${r.prefix}`;
            return '';
        });
    }

    static isBlockList(value) {
        return value instanceof BlockList;
    }
}

// --- SocketAddress ---

class SocketAddress {
    constructor(options = {}) {
        this.address = options.address || '127.0.0.1';
        this.family = options.family || 'ipv4';
        this.port = options.port || 0;
        this.flowlabel = options.flowlabel || 0;
    }

    static parse(input) {
        if (typeof input !== 'string') return undefined;
        const v6Match = input.match(/^\[([^\]]+)\]:(\d+)$/);
        if (v6Match) {
            return new SocketAddress({ address: v6Match[1], family: 'ipv6', port: parseInt(v6Match[2], 10) });
        }
        const v4Match = input.match(/^(.+):(\d+)$/);
        if (v4Match && isIPv4(v4Match[1])) {
            return new SocketAddress({ address: v4Match[1], family: 'ipv4', port: parseInt(v4Match[2], 10) });
        }
        return undefined;
    }
}

// --- Factory functions ---

export function createServer(options, connectionListener) {
    if (options !== undefined && options !== null && typeof options !== 'object' && typeof options !== 'function') {
        throw new ERR_INVALID_ARG_TYPE('options', 'Object', options);
    }
    return new Server(options, connectionListener);
}

export function createConnection(...args) {
    let options = {};
    if (args.length > 0 && typeof args[0] === 'object' && args[0] !== null) {
        options = args[0];
    }
    const socket = new Socket(options);
    return socket.connect(...args);
}

export const connect = createConnection;

// --- Auto-select family stubs ---

let _defaultAutoSelectFamily = false;
let _defaultAutoSelectFamilyAttemptTimeout = 250;

export function getDefaultAutoSelectFamily() { return _defaultAutoSelectFamily; }
export function setDefaultAutoSelectFamily(value) { _defaultAutoSelectFamily = !!value; }
export function getDefaultAutoSelectFamilyAttemptTimeout() { return _defaultAutoSelectFamilyAttemptTimeout; }
export function setDefaultAutoSelectFamilyAttemptTimeout(value) {
    if (value <= 0) {
        throw new ERR_OUT_OF_RANGE('value', '>= 1', value);
    }
    if (value < 10) value = 10;
    _defaultAutoSelectFamilyAttemptTimeout = value;
}

// --- Deprecated ---

let _warnSimultaneousAccepts = true;

export function _setSimultaneousAccepts() {
    if (_warnSimultaneousAccepts) {
        process.emitWarning(
            'net._setSimultaneousAccepts() is deprecated and will be removed.',
            'DeprecationWarning',
            'DEP0121'
        );
        _warnSimultaneousAccepts = false;
    }
}

export const Stream = Socket;

export { Socket, Server, BlockList, SocketAddress };

export default {
    Socket,
    Server,
    Stream: Socket,
    BlockList,
    SocketAddress,
    createServer,
    createConnection,
    connect,
    isIP,
    isIPv4,
    isIPv6,
    getDefaultAutoSelectFamily,
    setDefaultAutoSelectFamily,
    getDefaultAutoSelectFamilyAttemptTimeout,
    setDefaultAutoSelectFamilyAttemptTimeout,
    _setSimultaneousAccepts,
};
