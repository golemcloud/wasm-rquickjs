import * as native from '__wasm_rquickjs_builtin/fs_native';

let _Buffer = null;
function getBuffer() {
    if (!_Buffer) {
        try {
            const bufModule = globalThis.require ? globalThis.require('node:buffer') : null;
            _Buffer = bufModule ? (bufModule.Buffer || bufModule.default?.Buffer) : null;
        } catch {}
        if (!_Buffer) {
            _Buffer = { from: (x) => x, alloc: (n) => new Uint8Array(n) };
        }
    }
    return _Buffer;
}

let _Stats = null;
function getStats() {
    if (!_Stats) {
        const fs = globalThis.require ? globalThis.require('node:fs') : null;
        _Stats = fs ? fs.Stats : null;
    }
    return _Stats;
}

let _EventEmitter = null;
function getEventEmitter() {
    if (!_EventEmitter) {
        const events = globalThis.require ? globalThis.require('node:events') : null;
        _EventEmitter = events ? (events.EventEmitter || events.default) : null;
    }
    return _EventEmitter;
}

function wrapStat(statObj, options) {
    const S = getStats();
    const s = S ? new S(statObj) : statObj;
    if (options && options.bigint && s._toBigInt) return s._toBigInt();
    return s;
}

// --- Constants (re-export from fs) ---
const F_OK = 0;
const R_OK = 4;
const W_OK = 2;
const X_OK = 1;

// Placeholder; the actual constants object is set by the default export getter below
export let constants = { F_OK, R_OK, W_OK, X_OK };

// --- Helpers ---

function describeType(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'object') {
        if (value.constructor && value.constructor.name) {
            return 'an instance of ' + value.constructor.name;
        }
        return 'type object';
    }
    if (typeof value === 'function') return 'function ' + (value.name || '');
    return 'type ' + typeof value + ' (' + String(value) + ')';
}

function flagsToNumber(flags) {
    if (typeof flags === 'number') {
        validateInteger(flags, 'flags', -2147483648, 2147483647);
        return flags;
    }
    if (typeof flags !== 'string') return 0;
    switch (flags) {
        case 'r': return 0;
        case 'r+': return 2;
        case 'rs+': case 'sr+': return 2 | 1052672;
        case 'w': return 1 | 64 | 512;
        case 'wx': case 'xw': return 1 | 64 | 512 | 128;
        case 'w+': return 2 | 64 | 512;
        case 'wx+': case 'xw+': return 2 | 64 | 512 | 128;
        case 'a': return 1 | 1024 | 64;
        case 'ax': case 'xa': return 1 | 1024 | 64 | 128;
        case 'a+': return 2 | 1024 | 64;
        case 'ax+': case 'xa+': return 2 | 1024 | 64 | 128;
        case 'as': case 'sa': return 1 | 1024 | 64 | 1052672;
        case 'as+': case 'sa+': return 2 | 1024 | 64 | 1052672;
        default: throw new Error(`Unknown file open flag: ${flags}`);
    }
}

function makeEBADF(syscall) {
    const err = new Error('EBADF: bad file descriptor, ' + syscall);
    err.code = 'EBADF';
    err.errno = -9;
    err.syscall = syscall;
    return err;
}

function getSystemErrorDescription(message) {
    if (typeof message !== 'string' || message.length === 0) {
        return 'unknown error';
    }
    const parsedMessage = /^\s*[A-Z0-9_]+:\s*([^,]+),/.exec(message);
    if (parsedMessage && parsedMessage[1]) {
        return parsedMessage[1];
    }
    return message;
}

function createSystemError(errObj) {
    if (!errObj) return null;
    let msg = typeof errObj.message === 'string' ? errObj.message : 'unknown error';
    if (errObj.code && errObj.syscall) {
        msg = errObj.code + ': ' + getSystemErrorDescription(errObj.message) + ', ' + errObj.syscall;
        if (errObj.path !== undefined) msg += " '" + errObj.path + "'";
        if (errObj.dest !== undefined) msg += " -> '" + errObj.dest + "'";
    }
    const err = new Error(msg);
    err.code = errObj.code;
    err.errno = errObj.errno;
    err.syscall = errObj.syscall;
    if (errObj.path !== undefined) err.path = errObj.path;
    if (errObj.dest !== undefined) err.dest = errObj.dest;
    return err;
}

function validateInteger(value, name, min, max) {
    if (typeof value !== 'number' || !Number.isInteger(value)) {
        const err = new RangeError(`The value of "${name}" is out of range. It must be an integer. Received ${String(value)}`);
        err.code = 'ERR_OUT_OF_RANGE';
        throw err;
    }
    if (min !== undefined && max !== undefined && (value < min || value > max)) {
        const err = new RangeError(`The value of "${name}" is out of range. It must be >= ${min} && <= ${max}. Received ${value}`);
        err.code = 'ERR_OUT_OF_RANGE';
        throw err;
    }
}

function validateUid(id, name) {
    if (typeof id !== 'number') {
        const err = new TypeError(`The "${name}" argument must be of type number. Received ${describeType(id)}`);
        err.code = 'ERR_INVALID_ARG_TYPE';
        throw err;
    }
    validateInteger(id, name, -1, 4294967295);
}

function validateMode(mode, name, def) {
    if (mode === undefined) return def;
    if (typeof mode === 'string') {
        if (!/^[0-7]+$/.test(mode)) {
            const err = new TypeError(`The argument '${name}' must be a 32-bit unsigned integer or an octal string. Received '${mode}'`);
            err.code = 'ERR_INVALID_ARG_VALUE';
            throw err;
        }
        return parseInt(mode, 8);
    }
    if (typeof mode !== 'number') {
        const err = new TypeError(`The "${name}" argument must be of type number. Received ${describeType(mode)}`);
        err.code = 'ERR_INVALID_ARG_TYPE';
        throw err;
    }
    validateInteger(mode, name, 0, 4294967295);
    return mode;
}

function validateFlush(flush) {
    if (flush !== undefined && flush !== null && typeof flush !== 'boolean') {
        const err = new TypeError('The "flush" argument must be of type boolean. Received ' + describeType(flush));
        err.code = 'ERR_INVALID_ARG_TYPE';
        throw err;
    }
}

function validateAppendFileData(data) {
    if (typeof data === 'string' || ArrayBuffer.isView(data)) {
        return;
    }

    const err = new TypeError('The "data" argument must be of type string or an instance of Buffer, TypedArray, or DataView. Received ' + describeType(data));
    err.code = 'ERR_INVALID_ARG_TYPE';
    throw err;
}

// --- FileHandle class ---

let _protoSetup = false;
function ensureFileHandleProto() {
    if (!_protoSetup) {
        const EE = getEventEmitter();
        if (EE) {
            Object.setPrototypeOf(FileHandle.prototype, EE.prototype);
            _protoSetup = true;
        }
    }
}

export class FileHandle {
    constructor(fd, path) {
        // Ensure prototype chain is set up before constructing
        ensureFileHandleProto();
        // Manually apply EventEmitter constructor
        const EE = getEventEmitter();
        if (EE) EE.call(this);
        this._fd = fd;
        this._path = path;
        this._closed = false;
    }

    get fd() { return this._fd; }

    async appendFile(data, options) {
        if (this._closed) throw makeEBADF('write');
        validateAppendFileData(data);
        if (typeof data === 'string') {
            const pos = null;
            const result = native.fs_write_string(this._fd, data, pos);
            if (result.error) throw createSystemError(result.error);
        } else {
            const dataArray = new Uint8Array(data.buffer || data, data.byteOffset || 0, data.byteLength || data.length);
            const result = native.fs_write_buffer(this._fd, dataArray, 0, dataArray.length, null);
            if (result.error) throw createSystemError(result.error);
        }
    }

    async chmod(mode) {
        if (this._closed) throw makeEBADF('fchmod');
        const error = native.fs_fchmod(this._fd, mode);
        if (error) throw createSystemError(error);
    }

    async chown(uid, gid) {
        if (this._closed) throw makeEBADF('fchown');
        validateUid(uid, 'uid');
        validateUid(gid, 'gid');
        const error = native.fs_fchown(this._fd, uid, gid);
        if (error) throw createSystemError(error);
    }

    async close() {
        if (this._closed) return;
        this._closed = true;
        const error = native.fs_close(this._fd);
        this._fd = -1;
        if (error) throw createSystemError(error);
        if (this.emit) this.emit('close');
    }

    createReadStream(options) {
        // Lazy import to avoid circular dependency
        const fs = require('node:fs');
        if (options && options.signal !== undefined) {
            if (options.signal === null || typeof options.signal !== 'object' || !('aborted' in options.signal)) {
                const err = new TypeError(`The "options.signal" property must be an instance of AbortSignal. Received ${options.signal === null ? 'null' : typeof options.signal === 'object' ? 'an instance of ' + (options.signal.constructor?.name || 'Object') : typeof options.signal}`);
                err.code = 'ERR_INVALID_ARG_TYPE';
                throw err;
            }
        }
        return fs.createReadStream(this._path, { ...options, fd: this, autoClose: false });
    }

    createWriteStream(options) {
        const fs = require('node:fs');
        return fs.createWriteStream(this._path, { ...options, fd: this, autoClose: false });
    }

    async datasync() {
        if (this._closed) throw makeEBADF('fdatasync');
        const error = native.fs_fdatasync(this._fd);
        if (error) throw createSystemError(error);
    }

    async read(bufferOrOptions, offset, length, position) {
        if (this._closed) throw makeEBADF('read');
        let buffer;
        if (bufferOrOptions === null) {
            // null means use fallback buffer, but respect positional args
            buffer = getBuffer().alloc(16384);
            offset = offset || 0;
            length = length !== undefined && length !== null ? length : buffer.byteLength - offset;
            position = position !== undefined ? position : null;
        } else if (bufferOrOptions === undefined || (typeof bufferOrOptions === 'object' && !ArrayBuffer.isView(bufferOrOptions))) {
            const opts = bufferOrOptions || {};
            buffer = opts.buffer || getBuffer().alloc(16384);
            offset = opts.offset || 0;
            length = opts.length !== undefined && opts.length !== null ? opts.length : buffer.byteLength - offset;
            position = opts.position !== undefined ? opts.position : null;
        } else {
            if (typeof bufferOrOptions !== 'object' && typeof bufferOrOptions !== 'undefined') {
                const err = new TypeError('The "buffer" argument must be an instance of Buffer, TypedArray, or DataView. Received ' + describeType(bufferOrOptions));
                err.code = 'ERR_INVALID_ARG_TYPE';
                throw err;
            }
            buffer = bufferOrOptions;
            if (offset !== undefined && offset !== null && typeof offset === 'object') {
                // fh.read(buffer, options) form
                const opts = offset;
                offset = opts.offset || 0;
                length = opts.length !== undefined && opts.length !== null ? opts.length : buffer.byteLength - offset;
                position = opts.position !== undefined && opts.position !== null ? opts.position : null;
            } else {
                offset = offset || 0;
                length = length !== undefined && length !== null ? length : buffer.byteLength - offset;
                position = position !== undefined ? position : null;
            }
        }

        const result = native.fs_read(this._fd, length, position);
        if (result.error) throw createSystemError(result.error);

        const src = result.buffer;
        const bytesRead = result.bytesRead;
        for (let i = 0; i < bytesRead; i++) {
            buffer[offset + i] = src[i];
        }
        return { bytesRead, buffer };
    }

    async readFile(options) {
        if (this._closed) throw makeEBADF('read');
        const encoding = typeof options === 'string' ? options : (options && options.encoding);
        const signal = typeof options === 'object' && options ? options.signal : undefined;
        if (signal && signal.aborted) {
            const e = new DOMException('The operation was aborted', 'AbortError');
            e.name = 'AbortError';
            throw e;
        }
        // Yield before starting to allow abort signals from nextTick to fire
        if (signal) {
            await new Promise(r => setTimeout(r, 0));
            if (signal.aborted) {
                const e = new DOMException('The operation was aborted', 'AbortError');
                e.name = 'AbortError';
                throw e;
            }
        }
        // Read all data from file using current fd position (pass null to use OS offset)
        const chunks = [];
        let totalSize = 0;
        while (true) {
            if (signal && signal.aborted) {
                const e = new DOMException('The operation was aborted', 'AbortError');
                e.name = 'AbortError';
                throw e;
            }
            const result = native.fs_read(this._fd, 16384, null);
            if (result.error) throw createSystemError(result.error);
            if (result.bytesRead === 0) break;
            const chunk = new Uint8Array(result.buffer.buffer || result.buffer, 0, result.bytesRead);
            chunks.push(chunk);
            totalSize += result.bytesRead;
            // Yield to allow abort signals to fire
            if (signal) {
                await new Promise(r => setTimeout(r, 0));
            } else {
                await new Promise(r => r());
            }
        }
        const combined = new Uint8Array(totalSize);
        let cOffset = 0;
        for (const chunk of chunks) {
            combined.set(chunk, cOffset);
            cOffset += chunk.length;
        }

        if (encoding) {
            return getBuffer().from(combined).toString(encoding);
        }
        return getBuffer().from(combined);
    }

    async stat(options) {
        if (!(this instanceof FileHandle)) {
            const err = new Error('handle must be an instance of FileHandle');
            err.code = 'ERR_INTERNAL_ASSERTION';
            throw err;
        }
        if (this._closed) throw makeEBADF('fstat');
        const result = native.fs_fstat(this._fd);
        if (result.error) throw createSystemError(result.error);
        return wrapStat(result.stat, options);
    }

    async sync() {
        if (this._closed) throw makeEBADF('fsync');
        const error = native.fs_fsync(this._fd);
        if (error) throw createSystemError(error);
    }

    async truncate(len) {
        if (this._closed) throw makeEBADF('ftruncate');
        len = len !== undefined ? len : 0;
        const error = native.fs_ftruncate(this._fd, len);
        if (error) throw createSystemError(error);
    }

    async utimes(atime, mtime) {
        if (this._closed) throw makeEBADF('futimes');
        const atimeSecs = (atime instanceof Date) ? atime.getTime() / 1000 : Number(atime);
        const mtimeSecs = (mtime instanceof Date) ? mtime.getTime() / 1000 : Number(mtime);
        const error = native.fs_futimes(this._fd, atimeSecs, mtimeSecs);
        if (error) throw createSystemError(error);
    }

    async write(bufferOrString, offsetOrPosition, lengthOrEncoding, position) {
        if (this._closed) throw makeEBADF('write');
        if (typeof bufferOrString === 'string') {
            const pos = offsetOrPosition !== undefined ? offsetOrPosition : null;
            const enc = lengthOrEncoding || 'utf8';
            if (enc !== 'utf8' && enc !== 'utf-8') {
                // Encode with specified encoding
                if (enc === 'hex' && bufferOrString.length % 2 !== 0) {
                    const err = new Error(`The argument 'encoding' is invalid for data of length ${bufferOrString.length}. Received '${enc}'`);
                    err.code = 'ERR_INVALID_ARG_VALUE';
                    throw err;
                }
                const buf = getBuffer().from(bufferOrString, enc);
                const dataArray = new Uint8Array(buf.buffer || buf, buf.byteOffset || 0, buf.byteLength || buf.length);
                const result = native.fs_write_buffer(this._fd, dataArray, 0, dataArray.length, pos);
                if (result.error) throw createSystemError(result.error);
                return { bytesWritten: result.bytesWritten, buffer: bufferOrString };
            }
            const result = native.fs_write_string(this._fd, bufferOrString, pos);
            if (result.error) throw createSystemError(result.error);
            return { bytesWritten: result.bytesWritten, buffer: bufferOrString };
        } else {
            if (!ArrayBuffer.isView(bufferOrString)) {
                const err = new TypeError('The "buffer" argument must be an instance of Buffer or Uint8Array. Received ' + describeType(bufferOrString));
                err.code = 'ERR_INVALID_ARG_TYPE';
                throw err;
            }
            let offset, length, pos;
            if (offsetOrPosition !== undefined && offsetOrPosition !== null && typeof offsetOrPosition === 'object') {
                // Options object form: fh.write(buffer, { offset, length, position })
                const opts = offsetOrPosition;
                offset = opts.offset !== undefined && opts.offset !== null ? opts.offset : 0;
                length = opts.length !== undefined && opts.length !== null ? opts.length : bufferOrString.byteLength - offset;
                pos = opts.position !== undefined && opts.position !== null ? opts.position : null;
            } else {
                offset = offsetOrPosition || 0;
                length = lengthOrEncoding !== undefined ? lengthOrEncoding : bufferOrString.byteLength - offset;
                pos = position !== undefined ? position : null;
            }
            // Validate offset
            if (typeof offset !== 'number' || !Number.isInteger(offset)) {
                const err = new TypeError('The "offset" argument must be of type number. Received ' + describeType(offset));
                err.code = 'ERR_INVALID_ARG_TYPE';
                throw err;
            }
            if (offset < 0 || offset > bufferOrString.byteLength) {
                const err = new RangeError(`The value of "offset" is out of range. It must be >= 0 && <= ${bufferOrString.byteLength}. Received ${offset}`);
                err.code = 'ERR_OUT_OF_RANGE';
                throw err;
            }
            // Validate length
            if (typeof length !== 'number' || !Number.isInteger(length)) {
                const err = new TypeError('The "length" argument must be of type number. Received ' + describeType(length));
                err.code = 'ERR_INVALID_ARG_TYPE';
                throw err;
            }
            if (length < 0 || length > bufferOrString.byteLength - offset) {
                const err = new RangeError(`The value of "length" is out of range. It must be >= 0 && <= ${bufferOrString.byteLength - offset}. Received ${length}`);
                err.code = 'ERR_OUT_OF_RANGE';
                throw err;
            }
            const dataArray = new Uint8Array(bufferOrString.buffer || bufferOrString, bufferOrString.byteOffset || 0, bufferOrString.byteLength || bufferOrString.length);
            const result = native.fs_write_buffer(this._fd, dataArray, offset, length, pos);
            if (result.error) throw createSystemError(result.error);
            return { bytesWritten: result.bytesWritten, buffer: bufferOrString };
        }
    }

    async readv(buffers, position) {
        if (this._closed) throw makeEBADF('read');
        let totalRead = 0;
        let pos = position !== undefined && position !== null ? position : null;
        for (const buf of buffers) {
            if (buf.byteLength === 0) continue;
            const result = native.fs_read(this._fd, buf.byteLength, pos);
            if (result.error) throw createSystemError(result.error);
            const bytesRead = result.bytesRead;
            const src = result.buffer;
            for (let i = 0; i < bytesRead; i++) {
                buf[i] = src[i];
            }
            totalRead += bytesRead;
            if (pos !== null) pos += bytesRead;
            if (bytesRead < buf.byteLength) break;
        }
        return { bytesRead: totalRead, buffers };
    }

    async writev(buffers, position) {
        if (this._closed) throw makeEBADF('write');
        let totalWritten = 0;
        let pos = position !== undefined && position !== null ? position : null;
        for (const buf of buffers) {
            if (buf.byteLength === 0) continue;
            const dataArray = new Uint8Array(buf.buffer || buf, buf.byteOffset || 0, buf.byteLength || buf.length);
            const result = native.fs_write_buffer(this._fd, dataArray, 0, dataArray.length, pos);
            if (result.error) throw createSystemError(result.error);
            totalWritten += result.bytesWritten;
            if (pos !== null) pos += result.bytesWritten;
        }
        return { bytesWritten: totalWritten, buffers };
    }

    async writeFile(data, options) {
        if (this._closed) throw makeEBADF('write');
        const encoding = typeof options === 'string' ? options : (options && options.encoding) || 'utf8';
        const signal = typeof options === 'object' && options ? options.signal : undefined;
        const flush = typeof options === 'object' && options ? options.flush : undefined;
        if (flush !== undefined && flush !== null) validateFlush(flush);
        if (signal && signal.aborted) {
            const e = new DOMException('The operation was aborted', 'AbortError');
            e.name = 'AbortError';
            throw e;
        }

        // Yield to allow pending abort signals (e.g. from process.nextTick) to fire
        if (signal) {
            await new Promise(resolve => setTimeout(resolve, 0));
            if (signal.aborted) {
                const e = new DOMException('The operation was aborted', 'AbortError');
                e.name = 'AbortError';
                throw e;
            }
        }

        // FileHandle.writeFile writes at the current position (no truncate, no seek to 0)
        if (typeof data === 'string') {
            const buf = getBuffer().from(data, encoding);
            const dataArray = new Uint8Array(buf.buffer || buf, buf.byteOffset || 0, buf.byteLength || buf.length);
            const result = native.fs_write_buffer(this._fd, dataArray, 0, dataArray.length, null);
            if (result.error) throw createSystemError(result.error);
        } else if (ArrayBuffer.isView(data) || data instanceof ArrayBuffer) {
            const dataArray = new Uint8Array(data.buffer || data, data.byteOffset || 0, data.byteLength || data.length);
            const result = native.fs_write_buffer(this._fd, dataArray, 0, dataArray.length, null);
            if (result.error) throw createSystemError(result.error);
        } else if (data != null && typeof data !== 'symbol' && (typeof data[Symbol.asyncIterator] === 'function' || typeof data[Symbol.iterator] === 'function')) {
            for await (const chunk of data) {
                if (signal && signal.aborted) {
                    const e = new DOMException('The operation was aborted', 'AbortError');
                    e.name = 'AbortError';
                    throw e;
                }
                let buf;
                if (typeof chunk === 'string') {
                    buf = getBuffer().from(chunk, encoding);
                } else if (ArrayBuffer.isView(chunk)) {
                    buf = chunk;
                } else {
                    const err = new TypeError('The "chunk" argument must be of type string or an instance of Buffer or Uint8Array. Received ' + describeType(chunk));
                    err.code = 'ERR_INVALID_ARG_TYPE';
                    throw err;
                }
                const dataArray = new Uint8Array(buf.buffer || buf, buf.byteOffset || 0, buf.byteLength || buf.length);
                const result = native.fs_write_buffer(this._fd, dataArray, 0, dataArray.length, null);
                if (result.error) throw createSystemError(result.error);
            }
        } else {
            const err = new TypeError('The "data" argument must be of type string or an instance of Buffer, TypedArray, DataView, or an iterable/async iterable object. Received ' + describeType(data));
            err.code = 'ERR_INVALID_ARG_TYPE';
            throw err;
        }

        if (flush) {
            const syncErr = native.fs_fsync(this._fd);
            if (syncErr) throw createSystemError(syncErr);
        }
    }

    [Symbol.asyncDispose]() {
        return this.close();
    }
}

// --- Promise-based fs functions ---

export async function open(path, flags, mode) {
    flags = flagsToNumber(flags !== undefined ? flags : 'r');
    mode = validateMode(mode, 'mode', 0o666);
    const result = native.fs_open(path, flags, mode);
    if (result.error) throw createSystemError(result.error);
    return new FileHandle(result.fd, path);
}

export async function readFile(path, options) {
    const encoding = typeof options === 'string' ? options : (options && options.encoding);

    if (path instanceof FileHandle) {
        return path.readFile(options);
    }

    if (encoding && encoding !== '') {
        const [contents, error] = native.read_file_with_encoding(path, encoding);
        if (error !== undefined) throw new Error(error);
        return contents;
    } else {
        const [contents, error] = native.read_file(path);
        if (error !== undefined) throw new Error(error);
        return getBuffer().from(contents);
    }
}

export async function writeFile(path, data, options) {
    if (path instanceof FileHandle) {
        return path.writeFile(data, options);
    }

    const flush = options && typeof options === 'object' ? options.flush : undefined;
    validateFlush(flush);
    const signal = typeof options === 'object' && options ? options.signal : undefined;
    if (signal && signal.aborted) {
        const e = new DOMException('The operation was aborted', 'AbortError');
        e.name = 'AbortError';
        throw e;
    }

    let encoding;
    if (typeof options === 'string') {
        encoding = options;
    } else if (options && options.encoding) {
        encoding = options.encoding;
    }

    // Validate data type early - reject null, undefined, numbers, booleans, symbols, etc.
    if (data == null || typeof data === 'number' || typeof data === 'boolean' || typeof data === 'bigint' || typeof data === 'symbol' ||
        (typeof data !== 'string' && !ArrayBuffer.isView(data) && !(data instanceof ArrayBuffer) &&
        typeof data[Symbol.asyncIterator] !== 'function' && typeof data[Symbol.iterator] !== 'function')) {
        const err = new TypeError('The "data" argument must be of type string or an instance of Buffer, TypedArray, DataView, or an iterable/async iterable object. Received ' + describeType(data));
        err.code = 'ERR_INVALID_ARG_TYPE';
        throw err;
    }

    // Handle streams, iterables, and async iterables
    if (typeof data !== 'string' && !ArrayBuffer.isView(data) && !(data instanceof ArrayBuffer) &&
        (typeof data[Symbol.asyncIterator] === 'function' || typeof data[Symbol.iterator] === 'function')) {
        const fileHandle = await open(path, 'w');
        try {
            await fileHandle.writeFile(data, options);
        } finally {
            await fileHandle.close();
        }
        return;
    }

    // Yield to allow pending abort signals (e.g. from process.nextTick) to fire
    if (signal) {
        await new Promise(resolve => setTimeout(resolve, 0));
        if (signal.aborted) {
            const e = new DOMException('The operation was aborted', 'AbortError');
            e.name = 'AbortError';
            throw e;
        }
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

    if (error !== undefined) throw new Error(error);

    if (flush === true) {
        const fs = globalThis.require ? globalThis.require('node:fs') : null;
        if (fs) {
            const fd = fs.openSync(path, 'r');
            try {
                fs.fsyncSync(fd);
            } finally {
                fs.closeSync(fd);
            }
        }
    }
}

export async function appendFile(path, data, options) {
    if (path instanceof FileHandle) {
        return path.appendFile(data, options);
    }

    const flush = options && typeof options === 'object' ? options.flush : undefined;
    validateFlush(flush);
    validateAppendFileData(data);

    let error;
    if (typeof data === 'string') {
        error = native.fs_append_file_string(path, data);
    } else {
        const dataArray = new Uint8Array(data.buffer || data, data.byteOffset || 0, data.byteLength || data.length);
        error = native.fs_append_file(path, dataArray);
    }
    if (error) throw createSystemError(error);

    if (flush === true) {
        const fs = globalThis.require ? globalThis.require('node:fs') : null;
        if (fs) {
            const fd = fs.openSync(path, 'r');
            try {
                fs.fsyncSync(fd);
            } finally {
                fs.closeSync(fd);
            }
        }
    }
}

export async function unlink(path) {
    const error = native.unlink(path);
    if (error) throw createSystemError(error);
}

export async function rename(oldPath, newPath) {
    const error = native.rename(oldPath, newPath);
    if (error) throw createSystemError(error);
}

export async function mkdir(path, options) {
    let recursive = false;
    if (options && options.recursive) {
        recursive = true;
    }
    const error = native.fs_mkdir(path, recursive);
    if (error) throw createSystemError(error);
    if (recursive) return path;
    return undefined;
}

export async function rmdir(path, options) {
    if (options && options.recursive) {
        const st = native.fs_stat(path);
        if (!st.error && !st.stat.isDirectory) {
            const err = new Error(`ENOTDIR: not a directory, rmdir '${path}'`);
            err.code = 'ENOTDIR';
            err.errno = -20;
            err.syscall = 'rmdir';
            err.path = path;
            throw err;
        }
        const error = native.fs_rm(path, true, false);
        if (error) throw createSystemError(error);
    } else {
        const error = native.fs_rmdir(path);
        if (error) throw createSystemError(error);
    }
}

export async function rm(path, options) {
    const recursive = options && options.recursive || false;
    const force = options && options.force || false;
    const error = native.fs_rm(path, recursive, force);
    if (error) throw createSystemError(error);
}

export async function stat(path, options) {
    const result = native.fs_stat(path);
    if (result.error) throw createSystemError(result.error);
    return wrapStat(result.stat, options);
}

export async function lstat(path, options) {
    const result = native.fs_lstat(path);
    if (result.error) throw createSystemError(result.error);
    return wrapStat(result.stat, options);
}

export async function readdir(path, options) {
    const withFileTypes = options && options.withFileTypes || false;
    const recursive = options && options.recursive || false;
    const result = native.fs_readdir(path, withFileTypes);
    if (result.error) throw createSystemError(result.error);
    if (withFileTypes) {
        const fs = globalThis.require ? globalThis.require('node:fs') : null;
        const DirentClass = fs ? fs.Dirent : null;
        const makeDirent = DirentClass
            ? (e, p) => new DirentClass(e.name, e.fileType, p)
            : (e, p) => ({ name: e.name, _fileType: e.fileType, parentPath: p, path: p,
                isFile() { return this._fileType === 'file'; },
                isDirectory() { return this._fileType === 'directory'; },
                isSymbolicLink() { return this._fileType === 'symlink'; },
                isBlockDevice() { return false; }, isCharacterDevice() { return false; },
                isFIFO() { return false; }, isSocket() { return false; } });
        const dirents = result.entries.map(e => makeDirent(e, path));
        if (recursive) {
            const all = [];
            for (const dirent of dirents) {
                all.push(dirent);
                if (dirent.isDirectory()) {
                    const subPath = path + '/' + dirent.name;
                    try {
                        const subEntries = await readdir(subPath, { withFileTypes: true, recursive: true });
                        all.push(...subEntries);
                    } catch {}
                }
            }
            return all;
        }
        return dirents;
    }
    const entries = result.entries;
    if (recursive) {
        const all = [];
        for (const entry of entries) {
            all.push(entry);
            const subPath = path + '/' + entry;
            try {
                const st = native.fs_stat(subPath);
                if (!st.error && st.stat.isDirectory) {
                    const subEntries = await readdir(subPath, { recursive: true });
                    all.push(...subEntries.map(e => entry + '/' + e));
                }
            } catch {}
        }
        return all;
    }
    return entries;
}

export async function access(path, mode) {
    mode = mode !== undefined ? mode : F_OK;
    if (typeof mode !== 'number') {
        const err = new TypeError('The "mode" argument must be of type number. Received ' + describeType(mode));
        err.code = 'ERR_INVALID_ARG_TYPE';
        throw err;
    }
    if (mode < 0 || mode > 7) {
        const err = new RangeError(`The value of "mode" is out of range. It must be >= 0 && <= 7. Received ${mode}`);
        err.code = 'ERR_OUT_OF_RANGE';
        throw err;
    }
    const error = native.fs_access(path, mode);
    if (error) throw createSystemError(error);
}

export async function realpath(path, options) {
    const result = native.fs_realpath(path);
    if (result.error) throw createSystemError(result.error);
    return result.result;
}

export async function truncate(path, len) {
    len = len !== undefined ? len : 0;
    const error = native.fs_truncate(path, len);
    if (error) throw createSystemError(error);
}

export async function copyFile(src, dest, mode) {
    if (mode !== undefined && typeof mode !== 'number') {
        const err = new TypeError('The "mode" argument must be of type number. Received ' + describeType(mode));
        err.code = 'ERR_INVALID_ARG_TYPE';
        throw err;
    }
    const error = native.fs_copy_file(src, dest);
    if (error) throw createSystemError(error);
}

export async function link(existingPath, newPath) {
    const error = native.fs_link(existingPath, newPath);
    if (error) throw createSystemError(error);
}

export async function symlink(target, path, type) {
    const error = native.fs_symlink(target, path);
    if (error) throw createSystemError(error);
}

export async function readlink(path, options) {
    const result = native.fs_readlink(path);
    if (result.error) throw createSystemError(result.error);
    return result.result;
}

export async function chmod(path, mode) {
    const error = native.fs_chmod(path, mode);
    if (error) throw createSystemError(error);
}

export async function lchmod(path, mode) {
    return chmod(path, mode);
}

export async function chown(path, uid, gid) {
    validateUid(uid, 'uid');
    validateUid(gid, 'gid');
    const error = native.fs_chown(path, uid, gid);
    if (error) throw createSystemError(error);
}

export async function lchown(path, uid, gid) {
    validateUid(uid, 'uid');
    validateUid(gid, 'gid');
    const error = native.fs_lchown(path, uid, gid);
    if (error) throw createSystemError(error);
}

export async function utimes(path, atime, mtime) {
    const atimeSecs = (atime instanceof Date) ? atime.getTime() / 1000 : Number(atime);
    const mtimeSecs = (mtime instanceof Date) ? mtime.getTime() / 1000 : Number(mtime);
    const error = native.fs_utimes(path, atimeSecs, mtimeSecs);
    if (error) throw createSystemError(error);
}

export async function lutimes(path, atime, mtime) {
    return utimes(path, atime, mtime);
}

export async function mkdtemp(prefix, options) {
    const result = native.fs_mkdtemp(prefix);
    if (result.error) throw createSystemError(result.error);
    return result.result;
}

export async function cp(src, dest, options) {
    // Simple copy implementation
    const srcResult = native.fs_stat(src);
    if (srcResult.error) throw createSystemError(srcResult.error);

    if (srcResult.stat.isDirectory) {
        const error = native.mkdir(dest, true);
        if (error) throw new Error(error);
        if (options && options.recursive) {
            const dirResult = native.fs_readdir(src, false);
            if (dirResult.error) throw createSystemError(dirResult.error);
            for (const name of dirResult.entries) {
                await cp(src + '/' + name, dest + '/' + name, options);
            }
        }
    } else {
        const error = native.fs_copy_file(src, dest);
        if (error) throw createSystemError(error);
    }
}

export async function watch(filename, options) {
    throw new Error('watch is not supported in WASI');
}

export async function statfs(path, options) {
    const result = native.fs_stat(path);
    if (result.error) throw createSystemError(result.error);
    const bigint = options && options.bigint;
    // Return a statfs-like object with sensible defaults
    if (bigint) {
        return {
            type: BigInt(0),
            bsize: BigInt(4096),
            blocks: BigInt(0),
            bfree: BigInt(0),
            bavail: BigInt(0),
            files: BigInt(0),
            ffree: BigInt(0),
        };
    }
    return {
        type: 0,
        bsize: 4096,
        blocks: 0,
        bfree: 0,
        bavail: 0,
        files: 0,
        ffree: 0,
    };
}

const _defaultExport = {
    FileHandle,
    open,
    readFile,
    writeFile,
    appendFile,
    unlink,
    rename,
    mkdir,
    rmdir,
    rm,
    stat,
    lstat,
    readdir,
    access,
    realpath,
    truncate,
    copyFile,
    link,
    symlink,
    readlink,
    chmod,
    lchmod,
    chown,
    lchown,
    utimes,
    lutimes,
    mkdtemp,
    cp,
    watch,
    statfs,
};

// Use a getter for constants so it lazily resolves to fs.constants (same object reference)
Object.defineProperty(_defaultExport, 'constants', {
    get() {
        try {
            const fs = globalThis.require ? globalThis.require('node:fs') : null;
            if (fs && fs.constants) return fs.constants;
        } catch {}
        return constants;
    },
    enumerable: true,
    configurable: true,
});

export default _defaultExport;
