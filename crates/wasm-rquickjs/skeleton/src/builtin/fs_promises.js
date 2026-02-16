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
    if (typeof flags === 'number') return flags;
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

function createSystemError(errObj) {
    if (!errObj) return null;
    const err = new Error(errObj.message);
    err.code = errObj.code;
    err.errno = errObj.errno;
    err.syscall = errObj.syscall;
    if (errObj.path !== undefined) err.path = errObj.path;
    if (errObj.dest !== undefined) err.dest = errObj.dest;
    return err;
}

function validateFlush(flush) {
    if (flush !== undefined && flush !== null && typeof flush !== 'boolean') {
        const err = new TypeError('The "flush" argument must be of type boolean. Received ' + describeType(flush));
        err.code = 'ERR_INVALID_ARG_TYPE';
        throw err;
    }
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
        if (this._closed) throw new Error('file closed');
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
        if (this._closed) throw new Error('file closed');
        const error = native.fs_fchmod(this._fd, mode);
        if (error) throw createSystemError(error);
    }

    async chown(uid, gid) {
        if (this._closed) throw new Error('file closed');
        const error = native.fs_fchown(this._fd, uid, gid);
        if (error) throw createSystemError(error);
    }

    async close() {
        if (this._closed) return;
        this._closed = true;
        const error = native.fs_close(this._fd);
        if (error) throw createSystemError(error);
        if (this.emit) this.emit('close');
    }

    createReadStream(options) {
        // Lazy import to avoid circular dependency
        const fs = require('node:fs');
        return fs.createReadStream(this._path, { ...options, fd: this._fd, autoClose: false });
    }

    createWriteStream(options) {
        const fs = require('node:fs');
        return fs.createWriteStream(this._path, { ...options, fd: this._fd, autoClose: false });
    }

    async datasync() {
        if (this._closed) throw new Error('file closed');
        const error = native.fs_fdatasync(this._fd);
        if (error) throw createSystemError(error);
    }

    async read(bufferOrOptions, offset, length, position) {
        if (this._closed) throw new Error('file closed');
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
            offset = offset || 0;
            length = length !== undefined && length !== null ? length : buffer.byteLength - offset;
            position = position !== undefined ? position : null;
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
        if (this._closed) throw new Error('file closed');
        const encoding = typeof options === 'string' ? options : (options && options.encoding);
        const signal = typeof options === 'object' && options ? options.signal : undefined;
        if (signal && signal.aborted) {
            const e = new DOMException('The operation was aborted', 'AbortError');
            e.name = 'AbortError';
            throw e;
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
            await new Promise(r => r());
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
        if (this._closed) throw new Error('file closed');
        const result = native.fs_fstat(this._fd);
        if (result.error) throw createSystemError(result.error);
        return wrapStat(result.stat, options);
    }

    async sync() {
        if (this._closed) throw new Error('file closed');
        const error = native.fs_fsync(this._fd);
        if (error) throw createSystemError(error);
    }

    async truncate(len) {
        if (this._closed) throw new Error('file closed');
        len = len !== undefined ? len : 0;
        const error = native.fs_ftruncate(this._fd, len);
        if (error) throw createSystemError(error);
    }

    async utimes(atime, mtime) {
        if (this._closed) throw new Error('file closed');
        const atimeSecs = (atime instanceof Date) ? atime.getTime() / 1000 : Number(atime);
        const mtimeSecs = (mtime instanceof Date) ? mtime.getTime() / 1000 : Number(mtime);
        const error = native.fs_futimes(this._fd, atimeSecs, mtimeSecs);
        if (error) throw createSystemError(error);
    }

    async write(bufferOrString, offsetOrPosition, lengthOrEncoding, position) {
        if (this._closed) throw new Error('file closed');
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
            const offset = offsetOrPosition || 0;
            const length = lengthOrEncoding !== undefined ? lengthOrEncoding : bufferOrString.byteLength - offset;
            const pos = position !== undefined ? position : null;
            const dataArray = new Uint8Array(bufferOrString.buffer || bufferOrString, bufferOrString.byteOffset || 0, bufferOrString.byteLength || bufferOrString.length);
            const result = native.fs_write_buffer(this._fd, dataArray, offset, length, pos);
            if (result.error) throw createSystemError(result.error);
            return { bytesWritten: result.bytesWritten, buffer: bufferOrString };
        }
    }

    async readv(buffers, position) {
        if (this._closed) throw new Error('file closed');
        const fs = globalThis.require ? globalThis.require('node:fs') : null;
        let totalRead = 0;
        let pos = position !== undefined && position !== null ? position : null;
        for (const buf of buffers) {
            const bytesRead = fs ? fs.readSync(this._fd, buf, 0, buf.byteLength, pos) : 0;
            totalRead += bytesRead;
            if (pos !== null) pos += bytesRead;
            if (bytesRead < buf.byteLength) break;
        }
        return { bytesRead: totalRead, buffers };
    }

    async writev(buffers, position) {
        if (this._closed) throw new Error('file closed');
        const fs = globalThis.require ? globalThis.require('node:fs') : null;
        let totalWritten = 0;
        let pos = position !== undefined && position !== null ? position : null;
        for (const buf of buffers) {
            const written = fs ? fs.writeSync(this._fd, buf, 0, buf.byteLength, pos) : 0;
            totalWritten += written;
            if (pos !== null) pos += written;
        }
        return { bytesWritten: totalWritten, buffers };
    }

    async writeFile(data, options) {
        if (this._closed) throw new Error('file closed');
        const encoding = typeof options === 'string' ? options : (options && options.encoding) || 'utf8';
        const signal = typeof options === 'object' && options ? options.signal : undefined;
        const flush = typeof options === 'object' && options ? options.flush : undefined;
        if (flush !== undefined && flush !== null) validateFlush(flush);
        if (signal && signal.aborted) {
            const e = new DOMException('The operation was aborted', 'AbortError');
            e.name = 'AbortError';
            throw e;
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
        } else if (data != null && (typeof data[Symbol.asyncIterator] === 'function' || typeof data[Symbol.iterator] === 'function')) {
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
    mode = mode !== undefined ? mode : 0o666;
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

    // Handle streams, iterables, and async iterables
    if (typeof data !== 'string' && !ArrayBuffer.isView(data) && !(data instanceof ArrayBuffer) &&
        data != null && (typeof data[Symbol.asyncIterator] === 'function' || typeof data[Symbol.iterator] === 'function')) {
        const fileHandle = await open(path, 'w');
        try {
            await fileHandle.writeFile(data, options);
        } finally {
            await fileHandle.close();
        }
        return;
    }

    // Validate data type
    if (data != null && typeof data !== 'string' && !ArrayBuffer.isView(data) && !(data instanceof ArrayBuffer)) {
        const err = new TypeError('The "data" argument must be of type string or an instance of Buffer, TypedArray, DataView, or an iterable/async iterable object. Received ' + describeType(data));
        err.code = 'ERR_INVALID_ARG_TYPE';
        throw err;
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
    if (error !== undefined) throw new Error(error);
}

export async function rename(oldPath, newPath) {
    const error = native.rename(oldPath, newPath);
    if (error !== undefined) throw new Error(error);
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
    const error = native.fs_chown(path, uid, gid);
    if (error) throw createSystemError(error);
}

export async function lchown(path, uid, gid) {
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
