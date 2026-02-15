import * as native from '__wasm_rquickjs_builtin/fs_native';

let _Buffer = null;
function getBuffer() {
    if (!_Buffer) {
        const bufModule = globalThis.require ? globalThis.require('node:buffer') : null;
        _Buffer = bufModule ? (bufModule.Buffer || bufModule.default?.Buffer) : null;
        if (!_Buffer) {
            // Fallback: try dynamic import is not available, use basic approach
            _Buffer = { from: (x) => x, alloc: (n) => new Uint8Array(n) };
        }
    }
    return _Buffer;
}

let _promises = null;
function getPromises() {
    if (!_promises) {
        _promises = require('node:fs/promises');
    }
    return _promises;
}

let _Readable = null;
let _Writable = null;
let _EventEmitter = null;
function getStreamClasses() {
    if (!_Readable) {
        const stream = require('node:stream');
        _Readable = stream.Readable;
        _Writable = stream.Writable;
    }
}
function getEventEmitter() {
    if (!_EventEmitter) {
        const events = require('node:events');
        _EventEmitter = events.EventEmitter || events.default;
    }
    return _EventEmitter;
}

// --- Constants ---
const F_OK = 0;
const R_OK = 4;
const W_OK = 2;
const X_OK = 1;

const O_RDONLY = 0;
const O_WRONLY = 1;
const O_RDWR = 2;
const O_CREAT = 64;
const O_EXCL = 128;
const O_NOCTTY = 256;
const O_TRUNC = 512;
const O_APPEND = 1024;
const O_DIRECTORY = 65536;
const O_NOATIME = 262144;
const O_NOFOLLOW = 131072;
const O_SYNC = 1052672;
const O_DSYNC = 4096;
const O_NONBLOCK = 2048;

const S_IFMT = 0o170000;
const S_IFREG = 0o100000;
const S_IFDIR = 0o040000;
const S_IFCHR = 0o020000;
const S_IFBLK = 0o060000;
const S_IFIFO = 0o010000;
const S_IFLNK = 0o120000;
const S_IFSOCK = 0o140000;

const S_IRWXU = 0o700;
const S_IRUSR = 0o400;
const S_IWUSR = 0o200;
const S_IXUSR = 0o100;
const S_IRWXG = 0o070;
const S_IRGRP = 0o040;
const S_IWGRP = 0o020;
const S_IXGRP = 0o010;
const S_IRWXO = 0o007;
const S_IROTH = 0o004;
const S_IWOTH = 0o002;
const S_IXOTH = 0o001;

const COPYFILE_EXCL = 1;
const COPYFILE_FICLONE = 2;
const COPYFILE_FICLONE_FORCE = 4;

export const constants = {
    F_OK, R_OK, W_OK, X_OK,
    O_RDONLY, O_WRONLY, O_RDWR, O_CREAT, O_EXCL, O_NOCTTY,
    O_TRUNC, O_APPEND, O_DIRECTORY, O_NOATIME, O_NOFOLLOW,
    O_SYNC, O_DSYNC, O_NONBLOCK,
    S_IFMT, S_IFREG, S_IFDIR, S_IFCHR, S_IFBLK, S_IFIFO, S_IFLNK, S_IFSOCK,
    S_IRWXU, S_IRUSR, S_IWUSR, S_IXUSR,
    S_IRWXG, S_IRGRP, S_IWGRP, S_IXGRP,
    S_IRWXO, S_IROTH, S_IWOTH, S_IXOTH,
    COPYFILE_EXCL, COPYFILE_FICLONE, COPYFILE_FICLONE_FORCE,
    UV_FS_SYMLINK_DIR: 1,
    UV_FS_SYMLINK_JUNCTION: 2,
};

// --- Helpers ---

function flagsToNumber(flags) {
    if (typeof flags === 'number') return flags;
    if (typeof flags !== 'string') return O_RDONLY;
    switch (flags) {
        case 'r': return O_RDONLY;
        case 'rs': case 'sr': return O_RDONLY | O_SYNC;
        case 'r+': return O_RDWR;
        case 'rs+': case 'sr+': return O_RDWR | O_SYNC;
        case 'w': return O_WRONLY | O_CREAT | O_TRUNC;
        case 'wx': case 'xw': return O_WRONLY | O_CREAT | O_TRUNC | O_EXCL;
        case 'w+': return O_RDWR | O_CREAT | O_TRUNC;
        case 'wx+': case 'xw+': return O_RDWR | O_CREAT | O_TRUNC | O_EXCL;
        case 'a': return O_WRONLY | O_APPEND | O_CREAT;
        case 'ax': case 'xa': return O_WRONLY | O_APPEND | O_CREAT | O_EXCL;
        case 'a+': return O_RDWR | O_APPEND | O_CREAT;
        case 'ax+': case 'xa+': return O_RDWR | O_APPEND | O_CREAT | O_EXCL;
        case 'as': case 'sa': return O_WRONLY | O_APPEND | O_CREAT | O_SYNC;
        case 'as+': case 'sa+': return O_RDWR | O_APPEND | O_CREAT | O_SYNC;
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

function getOptions(options, defaultOptions) {
    if (options === null || options === undefined) return defaultOptions;
    if (typeof options === 'string') return { ...defaultOptions, encoding: options };
    if (typeof options === 'object') return { ...defaultOptions, ...options };
    return defaultOptions;
}

function describeType(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'function' && value.name) return 'function ' + value.name;
    if (typeof value === 'object') {
        if (value.constructor && value.constructor.name) {
            return 'an instance of ' + value.constructor.name;
        }
        return value + '';
    }
    if (typeof value === 'string') return 'type string (' + JSON.stringify(value) + ')';
    return 'type ' + typeof value + ' (' + String(value) + ')';
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
    if (min !== undefined && value < min) {
        const err = new RangeError(`The value of "${name}" is out of range. It must be >= ${min}. Received ${value}`);
        err.code = 'ERR_OUT_OF_RANGE';
        throw err;
    }
    if (max !== undefined && value > max) {
        const err = new RangeError(`The value of "${name}" is out of range. It must be <= ${max}. Received ${value}`);
        err.code = 'ERR_OUT_OF_RANGE';
        throw err;
    }
}

function validateFd(fd) {
    if (typeof fd !== 'number') {
        const err = new TypeError(`The "fd" argument must be of type number. Received ${describeType(fd)}`);
        err.code = 'ERR_INVALID_ARG_TYPE';
        throw err;
    }
    validateInteger(fd, 'fd', 0, 2147483647);
}

function validateBuffer(buffer, name) {
    if (!ArrayBuffer.isView(buffer)) {
        const err = new TypeError(`The "${name || 'buffer'}" argument must be an instance of Buffer, TypedArray, or DataView. Received ${describeType(buffer)}`);
        err.code = 'ERR_INVALID_ARG_TYPE';
        throw err;
    }
}

function validateCallback(cb) {
    if (typeof cb !== 'function') {
        const err = new TypeError(`The "callback" argument must be of type function. Received ${describeType(cb)}`);
        err.code = 'ERR_INVALID_ARG_TYPE';
        throw err;
    }
}

function validateFlush(flush) {
    if (flush !== undefined && flush !== null && typeof flush !== 'boolean') {
        const err = new TypeError('The "flush" argument must be of type boolean. Received ' + describeType(flush));
        err.code = 'ERR_INVALID_ARG_TYPE';
        throw err;
    }
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

function validateUid(id, name) {
    if (typeof id !== 'number') {
        const err = new TypeError(`The "${name}" argument must be of type number. Received ${describeType(id)}`);
        err.code = 'ERR_INVALID_ARG_TYPE';
        throw err;
    }
    validateInteger(id, name, -1, 4294967295);
}

function validatePath(path, propName) {
    if (typeof path === 'string') {
        if (path.indexOf('\u0000') !== -1) {
            const err = new TypeError(`The argument '${propName || 'path'}' must be a string, Uint8Array, or URL without null bytes. Received ${JSON.stringify(path)}`);
            err.code = 'ERR_INVALID_ARG_VALUE';
            throw err;
        }
        return;
    }
    if (getBuffer() && path instanceof getBuffer()) return;
    if (path instanceof URL) {
        if (path.protocol !== 'file:') {
            const err = new TypeError(`The URL must be of scheme file`);
            err.code = 'ERR_INVALID_ARG_VALUE';
            throw err;
        }
        const urlStr = path.toString();
        if (urlStr.indexOf('\u0000') !== -1 || urlStr.indexOf('%00') !== -1) {
            const err = new TypeError(`The argument '${propName || 'path'}' must be a string, Uint8Array, or URL without null bytes. Received ${path.toString()}`);
            err.code = 'ERR_INVALID_ARG_VALUE';
            throw err;
        }
        return;
    }
    const err = new TypeError(`The "${propName || 'path'}" argument must be of type string or an instance of Buffer or URL. Received ${describeType(path)}`);
    err.code = 'ERR_INVALID_ARG_TYPE';
    throw err;
}

// --- Stats class ---

export function Stats(devOrObj, mode, nlink, uid, gid, rdev, blksize, ino, size, blocks, atimeMs, mtimeMs, ctimeMs, birthtimeMs) {
    if (!(this instanceof Stats)) {
        return new Stats(devOrObj, mode, nlink, uid, gid, rdev, blksize, ino, size, blocks, atimeMs, mtimeMs, ctimeMs, birthtimeMs);
    }
    let statObj;
    if (typeof devOrObj === 'object' && devOrObj !== null) {
        statObj = devOrObj;
    } else {
        statObj = {
            dev: devOrObj || 0, mode: mode || 0, nlink: nlink || 0,
            uid: uid || 0, gid: gid || 0, rdev: rdev || 0,
            blksize: blksize || 0, ino: ino || 0, size: size || 0,
            blocks: blocks || 0,
            atimeMs: atimeMs || 0, mtimeMs: mtimeMs || 0,
            ctimeMs: ctimeMs || 0, birthtimeMs: birthtimeMs || 0,
            isFile: false, isDirectory: false, isSymlink: false
        };
    }
    this.dev = statObj.dev;
    this.ino = statObj.ino;
    this.mode = statObj.mode;
    this.nlink = statObj.nlink;
    this.uid = statObj.uid;
    this.gid = statObj.gid;
    this.rdev = statObj.rdev;
    this.size = statObj.size;
    this.blksize = statObj.blksize;
    this.blocks = statObj.blocks;
    this.atimeMs = statObj.atimeMs;
    this.mtimeMs = statObj.mtimeMs;
    this.ctimeMs = statObj.ctimeMs;
    this.birthtimeMs = statObj.birthtimeMs;
    this.atime = new Date(statObj.atimeMs);
    this.mtime = new Date(statObj.mtimeMs);
    this.ctime = new Date(statObj.ctimeMs);
    this.birthtime = new Date(statObj.birthtimeMs);
    this._isFile = statObj.isFile;
    this._isDirectory = statObj.isDirectory;
    this._isSymlink = statObj.isSymlink;
}

Stats.prototype.isFile = function() { return this._isFile; };
Stats.prototype.isDirectory = function() { return this._isDirectory; };
Stats.prototype.isSymbolicLink = function() { return this._isSymlink; };
Stats.prototype.isBlockDevice = function() { return false; };
Stats.prototype.isCharacterDevice = function() { return false; };
Stats.prototype.isFIFO = function() { return false; };
Stats.prototype.isSocket = function() { return false; };

// --- Dirent class ---

export class Dirent {
    constructor(name, fileType, parentPath) {
        this.name = name;
        this.parentPath = parentPath;
        this.path = parentPath;
        this._fileType = fileType;
    }

    isFile() { return this._fileType === 'file'; }
    isDirectory() { return this._fileType === 'directory'; }
    isSymbolicLink() { return this._fileType === 'symlink'; }
    isBlockDevice() { return false; }
    isCharacterDevice() { return false; }
    isFIFO() { return false; }
    isSocket() { return false; }
}

// --- Dir class ---

export class Dir {
    constructor(path, entries) {
        if (path === undefined) {
            const err = new TypeError('The "path" argument must be of type string. Received undefined');
            err.code = 'ERR_MISSING_ARGS';
            throw err;
        }
        this.path = path;
        this._entries = entries;
        this._index = 0;
        this._closed = false;
    }

    readSync() {
        if (this._closed) throw new Error('Directory handle was closed');
        if (this._index >= this._entries.length) return null;
        return this._entries[this._index++];
    }

    read(cb) {
        if (typeof cb === 'function') {
            try {
                const result = this.readSync();
                queueMicrotask(() => cb(null, result));
            } catch (err) {
                queueMicrotask(() => cb(err));
            }
            return;
        }
        return new Promise((resolve, reject) => {
            try {
                resolve(this.readSync());
            } catch (err) {
                reject(err);
            }
        });
    }

    closeSync() {
        this._closed = true;
    }

    close(cb) {
        this._closed = true;
        if (typeof cb === 'function') {
            queueMicrotask(() => cb(null));
            return;
        }
        return Promise.resolve();
    }

    [Symbol.asyncIterator]() {
        const self = this;
        return {
            next() {
                if (self._closed) return Promise.resolve({ done: true, value: undefined });
                const entry = self.readSync();
                if (entry === null) return Promise.resolve({ done: true, value: undefined });
                return Promise.resolve({ done: false, value: entry });
            },
            return() {
                self._closed = true;
                return Promise.resolve({ done: true, value: undefined });
            }
        };
    }
}

function normalizeEncoding(enc) {
    if (!enc) return enc;
    const lower = enc.toLowerCase().replace('-', '');
    if (lower === 'utf8') return 'utf8';
    if (lower === 'ascii') return 'ascii';
    if (lower === 'hex') return 'hex';
    if (lower === 'base64') return 'base64';
    if (lower === 'latin1' || lower === 'binary') return 'latin1';
    if (lower === 'ucs2' || lower === 'utf16le') return 'utf16le';
    return enc;
}

// --- Sync functions ---

export function readFileSync(path, options) {
    if (typeof path !== 'number') validatePath(path);
    if (typeof options === 'string') {
        options = {encoding: options};
    }
    const encoding = options && options.encoding && options.encoding !== '' ? normalizeEncoding(options.encoding) : null;

    if (typeof path === 'number') {
        const chunks = [];
        let totalLength = 0;
        const buf = new Uint8Array(8192);
        while (true) {
            const bytesRead = readSync(path, buf, 0, buf.length, null);
            if (bytesRead === 0) break;
            chunks.push(buf.slice(0, bytesRead));
            totalLength += bytesRead;
        }
        const result = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
            result.set(chunk, offset);
            offset += chunk.length;
        }
        if (encoding) {
            return new TextDecoder(encoding).decode(result);
        }
        return getBuffer().from(result);
    }

    if (encoding) {
        const [contents, error] = native.read_file_with_encoding(path, encoding);
        if (error === undefined) {
            return contents;
        } else {
            throw new Error(error);
        }
    } else {
        const [contents, error] = native.read_file(path);
        if (error === undefined) {
            return getBuffer().from(contents);
        } else {
            throw new Error(error);
        }
    }
}

export function writeFileSync(path, data, options) {
    if (typeof path !== 'number') validatePath(path);
    if (typeof options === 'string') {
        options = {encoding: options};
    }
    const flush = options ? options.flush : undefined;
    validateFlush(flush);
    const encoding = options && options.encoding && options.encoding !== '' ? normalizeEncoding(options.encoding) : null;
    if (encoding) {
        const error = native.write_file_with_encoding(path, encoding, data);
        if (error !== undefined) {
            throw new Error(error);
        }
    } else {
        if (typeof data === 'string') {
            const error = native.write_file_with_encoding(path, "utf8", data);
            if (error !== undefined) {
                throw new Error(error);
            }
        } else {
            const dataArray = new Uint8Array(data.buffer || data, data.byteOffset || 0, data.byteLength || data.length);
            const error = native.write_file(path, dataArray);
            if (error !== undefined) {
                throw new Error(error);
            }
        }
    }
    if (flush === true) {
        const fd = openSync(path, 'r');
        try {
            _default.fsyncSync(fd);
        } finally {
            closeSync(fd);
        }
    }
}

export function appendFileSync(path, data, options) {
    if (typeof path !== 'number') validatePath(path);
    if (typeof options === 'string') {
        options = { encoding: options };
    }
    const flush = options ? options.flush : undefined;
    validateFlush(flush);
    let error;
    if (typeof data === 'string') {
        error = native.fs_append_file_string(path, data);
    } else {
        const dataArray = new Uint8Array(data.buffer || data, data.byteOffset || 0, data.byteLength || data.length);
        error = native.fs_append_file(path, dataArray);
    }
    if (error) {
        throw createSystemError(error);
    }
    if (flush === true) {
        const fd = openSync(path, 'r');
        try {
            _default.fsyncSync(fd);
        } finally {
            closeSync(fd);
        }
    }
}

export function openSync(path, flags, mode) {
    validatePath(path);
    flags = flagsToNumber(flags !== undefined ? flags : 'r');
    mode = validateMode(mode, 'mode', 0o666);
    const result = native.fs_open(path, flags, mode);
    if (result.error) {
        throw createSystemError(result.error);
    }
    return result.fd;
}

export function closeSync(fd) {
    validateFd(fd);
    const error = native.fs_close(fd);
    if (error) {
        throw createSystemError(error);
    }
}

export function readSync(fd, buffer, offsetOrOptions, length, position) {
    // When second arg is an options object (not a buffer), extract buffer from it
    if (buffer != null && typeof buffer === 'object' && !ArrayBuffer.isView(buffer) && !Array.isArray(buffer) && offsetOrOptions === undefined) {
        const opts = buffer;
        if (opts.buffer == null) {
            validateBuffer(opts, 'buffer');
        }
        buffer = opts.buffer;
        offsetOrOptions = opts;
    }
    let offset = 0;
    if (offsetOrOptions !== undefined && offsetOrOptions !== null && typeof offsetOrOptions === 'object' && !ArrayBuffer.isView(offsetOrOptions) && !Array.isArray(offsetOrOptions)) {
        offset = offsetOrOptions.offset || 0;
        length = offsetOrOptions.length !== undefined ? offsetOrOptions.length : buffer.byteLength - offset;
        position = offsetOrOptions.position !== undefined ? offsetOrOptions.position : null;
    } else if (offsetOrOptions !== undefined && offsetOrOptions !== null && typeof offsetOrOptions !== 'number') {
        const err = new TypeError(`The "options" argument must be of type object. Received ${describeType(offsetOrOptions)}`);
        err.code = 'ERR_INVALID_ARG_TYPE';
        throw err;
    } else {
        offset = offsetOrOptions || 0;
        length = length !== undefined ? length : buffer.byteLength - offset;
        position = position !== undefined ? position : null;
    }

    const result = native.fs_read(fd, length, position);
    if (result.error) {
        throw createSystemError(result.error);
    }

    const src = result.buffer;
    const bytesRead = result.bytesRead;
    for (let i = 0; i < bytesRead; i++) {
        buffer[offset + i] = src[i];
    }
    return bytesRead;
}

export function writeSync(fd, bufferOrString, offsetOrPosition, lengthOrEncoding, position) {
    if (typeof bufferOrString === 'string') {
        const pos = offsetOrPosition !== undefined ? offsetOrPosition : null;
        const result = native.fs_write_string(fd, bufferOrString, pos);
        if (result.error) {
            throw createSystemError(result.error);
        }
        return result.bytesWritten;
    } else {
        if (!ArrayBuffer.isView(bufferOrString)) {
            const err = new TypeError('The "buffer" argument must be of type string or an instance of Buffer or Uint8Array. Received ' + describeType(bufferOrString));
            err.code = 'ERR_INVALID_ARG_TYPE';
            throw err;
        }
        const offset = offsetOrPosition || 0;
        const length = lengthOrEncoding !== undefined ? lengthOrEncoding : bufferOrString.byteLength - offset;
        const pos = position !== undefined ? position : null;
        const dataArray = new Uint8Array(bufferOrString.buffer || bufferOrString, bufferOrString.byteOffset || 0, bufferOrString.byteLength || bufferOrString.length);
        const result = native.fs_write_buffer(fd, dataArray, offset, length, pos);
        if (result.error) {
            throw createSystemError(result.error);
        }
        return result.bytesWritten;
    }
}

export function ftruncateSync(fd, len) {
    len = len !== undefined ? len : 0;
    const error = native.fs_ftruncate(fd, len);
    if (error) {
        throw createSystemError(error);
    }
}

export function fsyncSync(fd) {
    const error = native.fs_fsync(fd);
    if (error) {
        throw createSystemError(error);
    }
}

export function fdatasyncSync(fd) {
    const error = native.fs_fdatasync(fd);
    if (error) {
        throw createSystemError(error);
    }
}

export function statSync(path, options) {
    validatePath(path);
    const result = native.fs_stat(path);
    if (result.error) {
        if (options && options.throwIfNoEntry === false && result.error.code === 'ENOENT') {
            return undefined;
        }
        throw createSystemError(result.error);
    }
    return new Stats(result.stat);
}

export function lstatSync(path, options) {
    validatePath(path);
    const result = native.fs_lstat(path);
    if (result.error) {
        if (options && options.throwIfNoEntry === false && result.error.code === 'ENOENT') {
            return undefined;
        }
        throw createSystemError(result.error);
    }
    return new Stats(result.stat);
}

export function fstatSync(fd, options) {
    validateFd(fd);
    const result = native.fs_fstat(fd);
    if (result.error) {
        throw createSystemError(result.error);
    }
    return new Stats(result.stat);
}

export function readdirSync(path, options) {
    validatePath(path);
    const opts = getOptions(options, {});
    const withFileTypes = opts.withFileTypes || false;
    const recursive = opts.recursive || false;
    const result = native.fs_readdir(path, withFileTypes);
    if (result.error) {
        throw createSystemError(result.error);
    }
    if (withFileTypes) {
        const dirents = result.entries.map(e => new Dirent(e.name, e.fileType, path));
        if (recursive) {
            const all = [];
            for (const dirent of dirents) {
                all.push(dirent);
                if (dirent.isDirectory()) {
                    const subPath = path + '/' + dirent.name;
                    try {
                        const subEntries = readdirSync(subPath, { withFileTypes: true, recursive: true });
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
                    const subEntries = readdirSync(subPath, { recursive: true });
                    all.push(...subEntries.map(e => entry + '/' + e));
                }
            } catch {}
        }
        return all;
    }
    if (opts.encoding === 'buffer') {
        return entries.map(e => getBuffer().from(e));
    }
    return entries;
}

export function accessSync(path, mode) {
    validatePath(path);
    mode = mode !== undefined ? mode : F_OK;
    const error = native.fs_access(path, mode);
    if (error) {
        throw createSystemError(error);
    }
}

export function existsSync(path) {
    try {
        if (typeof path !== 'string') return false;
        return native.fs_exists(path);
    } catch {
        return false;
    }
}

export function realpathSync(path, options) {
    validatePath(path);
    const result = native.fs_realpath(path);
    if (result.error) {
        throw createSystemError(result.error);
    }
    const encoding = getOptions(options, {}).encoding;
    if (encoding === 'buffer') {
        return getBuffer().from(result.result);
    }
    return result.result;
}
realpathSync.native = realpathSync;

export function truncateSync(path, len) {
    validatePath(path);
    len = len !== undefined ? len : 0;
    const error = native.fs_truncate(path, len);
    if (error) {
        throw createSystemError(error);
    }
}

export function copyFileSync(src, dest, mode) {
    validatePath(src, 'src');
    validatePath(dest, 'dest');
    const error = native.fs_copy_file(src, dest);
    if (error) {
        throw createSystemError(error);
    }
}

export function linkSync(existingPath, newPath) {
    validatePath(existingPath, 'existingPath');
    validatePath(newPath, 'newPath');
    const error = native.fs_link(existingPath, newPath);
    if (error) {
        throw createSystemError(error);
    }
}

export function symlinkSync(target, path, type) {
    validatePath(target, 'target');
    validatePath(path, 'path');
    const error = native.fs_symlink(target, path);
    if (error) {
        throw createSystemError(error);
    }
}

export function readlinkSync(path, options) {
    validatePath(path);
    const result = native.fs_readlink(path);
    if (result.error) {
        throw createSystemError(result.error);
    }
    const encoding = getOptions(options, {}).encoding;
    if (encoding === 'buffer') {
        return getBuffer().from(result.result);
    }
    return result.result;
}

export function chmodSync(path, mode) {
    validatePath(path);
    mode = validateMode(mode, 'mode', undefined);
    const error = native.fs_chmod(path, mode);
    if (error) {
        throw createSystemError(error);
    }
}

export function fchmodSync(fd, mode) {
    validateFd(fd);
    mode = validateMode(mode, 'mode', undefined);
    const error = native.fs_fchmod(fd, mode);
    if (error) {
        throw createSystemError(error);
    }
}

export function lchmodSync(path, mode) {
    chmodSync(path, mode);
}

export function chownSync(path, uid, gid) {
    validatePath(path);
    validateUid(uid, 'uid');
    validateUid(gid, 'gid');
    const error = native.fs_chown(path, uid, gid);
    if (error) {
        throw createSystemError(error);
    }
}

export function fchownSync(fd, uid, gid) {
    validateFd(fd);
    validateUid(uid, 'uid');
    validateUid(gid, 'gid');
    const error = native.fs_fchown(fd, uid, gid);
    if (error) {
        throw createSystemError(error);
    }
}

export function lchownSync(path, uid, gid) {
    validatePath(path);
    validateUid(uid, 'uid');
    validateUid(gid, 'gid');
    const error = native.fs_lchown(path, uid, gid);
    if (error) {
        throw createSystemError(error);
    }
}

export function utimesSync(path, atime, mtime) {
    validatePath(path);
    const atimeSecs = (atime instanceof Date) ? atime.getTime() / 1000 : Number(atime);
    const mtimeSecs = (mtime instanceof Date) ? mtime.getTime() / 1000 : Number(mtime);
    const error = native.fs_utimes(path, atimeSecs, mtimeSecs);
    if (error) {
        throw createSystemError(error);
    }
}

export function futimesSync(fd, atime, mtime) {
    const atimeSecs = (atime instanceof Date) ? atime.getTime() / 1000 : Number(atime);
    const mtimeSecs = (mtime instanceof Date) ? mtime.getTime() / 1000 : Number(mtime);
    const error = native.fs_futimes(fd, atimeSecs, mtimeSecs);
    if (error) {
        throw createSystemError(error);
    }
}

export function lutimesSync(path, atime, mtime) {
    utimesSync(path, atime, mtime);
}

export function unlinkSync(path) {
    validatePath(path);
    const error = native.unlink(path);
    if (error !== undefined) {
        throw new Error(error);
    }
}

export function renameSync(oldPath, newPath) {
    validatePath(oldPath, 'oldPath');
    validatePath(newPath, 'newPath');
    const error = native.rename(oldPath, newPath);
    if (error !== undefined) {
        throw new Error(error);
    }
}

export function mkdirSync(path, options) {
    validatePath(path);
    let recursive = false;
    if (typeof options === 'number') {
        // mode only
    } else if (options && options.recursive) {
        recursive = true;
    }

    const error = native.fs_mkdir(path, recursive);
    if (error) {
        throw createSystemError(error);
    }
    if (recursive) return path;
    return undefined;
}

export function rmdirSync(path, options) {
    validatePath(path);
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

export function rmSync(path, options) {
    validatePath(path);
    const recursive = options && options.recursive || false;
    const force = options && options.force || false;
    const error = native.fs_rm(path, recursive, force);
    if (error) {
        throw createSystemError(error);
    }
}

export function mkdtempSync(prefix, options) {
    validatePath(prefix, 'prefix');
    const result = native.fs_mkdtemp(prefix);
    if (result.error) {
        throw createSystemError(result.error);
    }
    const encoding = getOptions(options, {}).encoding;
    if (encoding === 'buffer') {
        return getBuffer().from(result.result);
    }
    return result.result;
}

export function opendirSync(path, options) {
    const result = native.fs_readdir(path, true);
    if (result.error) {
        throw createSystemError(result.error);
    }
    const entries = result.entries.map(e => new Dirent(e.name, e.fileType, path));
    return new Dir(path, entries);
}

// --- Callback (async) functions ---

export function readFile(path, optionsOrCallback, callback) {
    if (typeof path !== 'number') validatePath(path);
    if (typeof optionsOrCallback === 'function') {
        callback = optionsOrCallback;
        optionsOrCallback = {};
    }
    if (typeof optionsOrCallback === 'string') {
        optionsOrCallback = {encoding: optionsOrCallback};
    }
    const opts = optionsOrCallback || {};
    const cb = callback;
    queueMicrotask(() => {
        try {
            const result = readFileSync(path, opts);
            cb(null, result);
        } catch (err) {
            cb(err);
        }
    });
}

export function writeFile(path, data, optionsOrCallback, callback) {
    if (typeof path !== 'number') validatePath(path);
    if (typeof optionsOrCallback === 'function') {
        callback = optionsOrCallback;
        optionsOrCallback = {};
    }
    if (typeof optionsOrCallback === 'string') {
        optionsOrCallback = {encoding: optionsOrCallback};
    }
    const opts = optionsOrCallback || {};
    const flush = opts.flush;
    validateFlush(flush);
    const cb = callback;
    queueMicrotask(() => {
        try {
            const writeOpts = flush !== undefined ? Object.assign({}, opts, { flush: undefined }) : opts;
            writeFileSync(path, data, writeOpts);
            if (flush === true) {
                const fd = openSync(path, 'r');
                _default.fsync(fd, (err) => {
                    closeSync(fd);
                    cb(err || null);
                });
                return;
            }
            cb(null);
        } catch (err) {
            cb(err);
        }
    });
}

export function appendFile(path, data, optionsOrCallback, callback) {
    if (typeof path !== 'number') validatePath(path);
    if (typeof optionsOrCallback === 'function') {
        callback = optionsOrCallback;
        optionsOrCallback = {};
    }
    const opts = optionsOrCallback || {};
    const flush = opts.flush;
    validateFlush(flush);
    const cb = callback;
    queueMicrotask(() => {
        try {
            const appendOpts = flush !== undefined ? Object.assign({}, opts, { flush: undefined }) : opts;
            appendFileSync(path, data, appendOpts);
            if (flush === true) {
                const fd = openSync(path, 'r');
                _default.fsync(fd, (err) => {
                    closeSync(fd);
                    cb(err || null);
                });
                return;
            }
            cb(null);
        } catch (err) {
            cb(err);
        }
    });
}

export function open(path, flagsOrCallback, modeOrCallback, callback) {
    validatePath(path);
    let flags = 'r';
    let mode = 0o666;
    let cb;

    if (typeof flagsOrCallback === 'function') {
        cb = flagsOrCallback;
    } else if (typeof modeOrCallback === 'function') {
        flags = flagsOrCallback;
        cb = modeOrCallback;
    } else {
        flags = flagsOrCallback;
        mode = modeOrCallback;
        cb = callback;
    }

    validateCallback(cb);
    queueMicrotask(() => {
        try {
            const fd = openSync(path, flags, mode);
            cb(null, fd);
        } catch (err) {
            cb(err);
        }
    });
}

export function close(fd, callback) {
    validateFd(fd);
    if (callback !== undefined && typeof callback !== 'function') {
        const err = new TypeError(`The "callback" argument must be of type function. Received ${describeType(callback)}`);
        err.code = 'ERR_INVALID_ARG_TYPE';
        throw err;
    }
    if (typeof callback !== 'function') {
        callback = function() {};
    }
    const cb = callback;
    queueMicrotask(() => {
        try {
            closeSync(fd);
            cb(null);
        } catch (err) {
            cb(err);
        }
    });
}

export function read(fd, bufferOrOptions, offsetOrCallback, length, position, callback) {
    if (typeof fd !== 'number' || fd !== fd) {
        const err = new TypeError(`The "fd" argument must be of type number. Received ${describeType(fd)}`);
        err.code = 'ERR_INVALID_ARG_TYPE';
        throw err;
    }
    let buffer, offset, cb;

    if (typeof bufferOrOptions === 'function') {
        cb = bufferOrOptions;
        buffer = getBuffer().alloc(16384);
        offset = 0;
        length = buffer.byteLength;
        position = null;
    } else if (typeof offsetOrCallback === 'function') {
        cb = offsetOrCallback;
        if (ArrayBuffer.isView(bufferOrOptions)) {
            buffer = bufferOrOptions;
            offset = 0;
            length = buffer.byteLength;
            position = null;
        } else if (bufferOrOptions != null && typeof bufferOrOptions === 'object' && !ArrayBuffer.isView(bufferOrOptions)) {
            if ('buffer' in bufferOrOptions && bufferOrOptions.buffer != null) {
                buffer = bufferOrOptions.buffer;
            } else if ('buffer' in bufferOrOptions && bufferOrOptions.buffer == null) {
                validateBuffer(bufferOrOptions, 'buffer');
            } else {
                buffer = getBuffer().alloc(16384);
            }
            offset = bufferOrOptions.offset || 0;
            length = bufferOrOptions.length !== undefined ? bufferOrOptions.length : buffer.byteLength - offset;
            position = bufferOrOptions.position !== undefined ? bufferOrOptions.position : null;
        } else {
            buffer = getBuffer().alloc(16384);
            offset = 0;
            length = buffer.byteLength;
            position = null;
        }
    } else if (ArrayBuffer.isView(bufferOrOptions) && offsetOrCallback != null && typeof offsetOrCallback === 'object' && !ArrayBuffer.isView(offsetOrCallback) && !Array.isArray(offsetOrCallback)) {
        buffer = bufferOrOptions;
        offset = offsetOrCallback.offset || 0;
        const optLen = offsetOrCallback.length;
        position = offsetOrCallback.position !== undefined ? offsetOrCallback.position : null;
        // The next positional param after options is the callback
        if (typeof length === 'function') {
            cb = length;
        } else if (typeof position === 'function') {
            cb = position;
            position = null;
        } else {
            cb = callback;
        }
        length = optLen !== undefined ? optLen : buffer.byteLength - offset;
    } else {
        buffer = bufferOrOptions;
        offset = offsetOrCallback || 0;
        if (typeof length === 'function') {
            cb = length;
            length = buffer.byteLength - offset;
            position = null;
        } else if (typeof position === 'function') {
            cb = position;
            position = null;
        } else {
            cb = callback;
        }
    }

    validateBuffer(buffer, 'buffer');
    if (offset !== undefined && offset !== null) validateInteger(offset, 'offset', 0);
    if (length !== undefined && length !== null && length < 0) {
        const rangeErr = new RangeError(`The value of "length" is out of range. It must be >= 0. Received ${length}`);
        rangeErr.code = 'ERR_OUT_OF_RANGE';
        throw rangeErr;
    }
    validateCallback(cb);
    queueMicrotask(() => {
        try {
            const bytesRead = readSync(fd, buffer, offset, length, position);
            cb(null, bytesRead, buffer);
        } catch (err) {
            cb(err, 0, buffer);
        }
    });
}

export function write(fd, bufferOrString, offsetOrPosition, lengthOrEncoding, positionOrCallback, callback) {
    let cb;
    if (typeof bufferOrString === 'string') {
        if (typeof offsetOrPosition === 'function') {
            cb = offsetOrPosition;
            offsetOrPosition = undefined;
        } else if (typeof lengthOrEncoding === 'function') {
            cb = lengthOrEncoding;
            lengthOrEncoding = undefined;
        } else {
            cb = positionOrCallback || callback;
        }
        validateCallback(cb);
        queueMicrotask(() => {
            try {
                const written = writeSync(fd, bufferOrString, offsetOrPosition, lengthOrEncoding);
                cb(null, written, bufferOrString);
            } catch (err) {
                cb(err, 0, bufferOrString);
            }
        });
    } else {
        if (typeof offsetOrPosition === 'function') {
            cb = offsetOrPosition;
            offsetOrPosition = 0;
            lengthOrEncoding = bufferOrString.byteLength;
            positionOrCallback = null;
        } else if (typeof lengthOrEncoding === 'function') {
            cb = lengthOrEncoding;
            lengthOrEncoding = bufferOrString.byteLength - (offsetOrPosition || 0);
            positionOrCallback = null;
        } else if (typeof positionOrCallback === 'function') {
            cb = positionOrCallback;
            positionOrCallback = null;
        } else {
            cb = callback;
        }
        if (typeof offsetOrPosition === 'number' && isNaN(offsetOrPosition)) {
            const rangeErr = new RangeError('The value of "offset" is out of range. It must be an integer. Received NaN');
            rangeErr.code = 'ERR_OUT_OF_RANGE';
            throw rangeErr;
        }
        validateCallback(cb);
        queueMicrotask(() => {
            try {
                const written = writeSync(fd, bufferOrString, offsetOrPosition, lengthOrEncoding, positionOrCallback);
                cb(null, written, bufferOrString);
            } catch (err) {
                cb(err, 0, bufferOrString);
            }
        });
    }
}

export function stat(path, optionsOrCallback, callback) {
    validatePath(path);
    if (typeof optionsOrCallback === 'function') {
        callback = optionsOrCallback;
        optionsOrCallback = {};
    }
    const cb = callback;
    queueMicrotask(() => {
        try {
            const result = statSync(path, optionsOrCallback);
            cb(null, result);
        } catch (err) {
            cb(err);
        }
    });
}

export function lstat(path, optionsOrCallback, callback) {
    validatePath(path);
    if (typeof optionsOrCallback === 'function') {
        callback = optionsOrCallback;
        optionsOrCallback = {};
    }
    const cb = callback;
    queueMicrotask(() => {
        try {
            const result = lstatSync(path, optionsOrCallback);
            cb(null, result);
        } catch (err) {
            cb(err);
        }
    });
}

export function fstat(fd, optionsOrCallback, callback) {
    validateFd(fd);
    if (typeof optionsOrCallback === 'function') {
        callback = optionsOrCallback;
        optionsOrCallback = {};
    }
    const cb = callback;
    queueMicrotask(() => {
        try {
            const result = fstatSync(fd, optionsOrCallback);
            cb(null, result);
        } catch (err) {
            cb(err);
        }
    });
}

export function ftruncate(fd, lenOrCallback, callback) {
    let len = 0;
    let cb;
    if (typeof lenOrCallback === 'function') {
        cb = lenOrCallback;
    } else {
        len = lenOrCallback;
        cb = callback;
    }
    validateCallback(cb);
    queueMicrotask(() => {
        try {
            ftruncateSync(fd, len);
            cb(null);
        } catch (err) {
            cb(err);
        }
    });
}

export function fsync(fd, callback) {
    validateCallback(callback);
    queueMicrotask(() => {
        try {
            fsyncSync(fd);
            callback(null);
        } catch (err) {
            callback(err);
        }
    });
}

export function fdatasync(fd, callback) {
    validateCallback(callback);
    queueMicrotask(() => {
        try {
            fdatasyncSync(fd);
            callback(null);
        } catch (err) {
            callback(err);
        }
    });
}

export function readdir(path, optionsOrCallback, callback) {
    validatePath(path);
    if (typeof optionsOrCallback === 'function') {
        callback = optionsOrCallback;
        optionsOrCallback = {};
    }
    const cb = callback;
    queueMicrotask(() => {
        try {
            const result = readdirSync(path, optionsOrCallback);
            cb(null, result);
        } catch (err) {
            cb(err);
        }
    });
}

export function access(path, modeOrCallback, callback) {
    validatePath(path);
    let mode = F_OK;
    let cb;
    if (typeof modeOrCallback === 'function') {
        cb = modeOrCallback;
    } else {
        mode = modeOrCallback;
        cb = callback;
    }
    validateCallback(cb);
    queueMicrotask(() => {
        try {
            accessSync(path, mode);
            cb(null);
        } catch (err) {
            cb(err);
        }
    });
}

export function exists(path, callback) {
    if (typeof callback !== 'function') {
        throw Object.assign(
            new TypeError(`Callback must be a function. Received ${typeof callback}`),
            { code: 'ERR_INVALID_ARG_TYPE' }
        );
    }
    queueMicrotask(() => {
        callback(existsSync(path));
    });
}

export function realpath(path, optionsOrCallback, callback) {
    validatePath(path);
    if (typeof optionsOrCallback === 'function') {
        callback = optionsOrCallback;
        optionsOrCallback = {};
    }
    const cb = callback;
    queueMicrotask(() => {
        try {
            const result = realpathSync(path, optionsOrCallback);
            cb(null, result);
        } catch (err) {
            cb(err);
        }
    });
}
realpath.native = realpath;

export function truncate(path, lenOrCallback, callback) {
    validatePath(path);
    let len = 0;
    let cb;
    if (typeof lenOrCallback === 'function') {
        cb = lenOrCallback;
    } else {
        len = lenOrCallback;
        cb = callback;
    }
    validateCallback(cb);
    queueMicrotask(() => {
        try {
            truncateSync(path, len);
            cb(null);
        } catch (err) {
            cb(err);
        }
    });
}

export function copyFile(src, dest, modeOrCallback, callback) {
    validatePath(src, 'src');
    validatePath(dest, 'dest');
    let cb;
    if (typeof modeOrCallback === 'function') {
        cb = modeOrCallback;
    } else {
        cb = callback;
    }
    validateCallback(cb);
    queueMicrotask(() => {
        try {
            copyFileSync(src, dest);
            cb(null);
        } catch (err) {
            cb(err);
        }
    });
}

export function link(existingPath, newPath, callback) {
    validatePath(existingPath, 'existingPath');
    validatePath(newPath, 'newPath');
    validateCallback(callback);
    queueMicrotask(() => {
        try {
            linkSync(existingPath, newPath);
            callback(null);
        } catch (err) {
            callback(err);
        }
    });
}

export function symlink(target, path, typeOrCallback, callback) {
    validatePath(target, 'target');
    validatePath(path, 'path');
    let cb;
    if (typeof typeOrCallback === 'function') {
        cb = typeOrCallback;
    } else {
        cb = callback;
    }
    validateCallback(cb);
    queueMicrotask(() => {
        try {
            symlinkSync(target, path);
            cb(null);
        } catch (err) {
            cb(err);
        }
    });
}

export function readlink(path, optionsOrCallback, callback) {
    validatePath(path);
    if (typeof optionsOrCallback === 'function') {
        callback = optionsOrCallback;
        optionsOrCallback = {};
    }
    const cb = callback;
    queueMicrotask(() => {
        try {
            const result = readlinkSync(path, optionsOrCallback);
            cb(null, result);
        } catch (err) {
            cb(err);
        }
    });
}

export function chmod(path, mode, callback) {
    validatePath(path);
    validateCallback(callback);
    queueMicrotask(() => {
        try {
            chmodSync(path, mode);
            callback(null);
        } catch (err) {
            callback(err);
        }
    });
}

export function fchmod(fd, mode, callback) {
    validateFd(fd);
    mode = validateMode(mode, 'mode', undefined);
    validateCallback(callback);
    queueMicrotask(() => {
        try {
            fchmodSync(fd, mode);
            callback(null);
        } catch (err) {
            callback(err);
        }
    });
}

export function lchmod(path, mode, callback) {
    validateCallback(callback);
    queueMicrotask(() => {
        try {
            lchmodSync(path, mode);
            callback(null);
        } catch (err) {
            callback(err);
        }
    });
}

export function chown(path, uid, gid, callback) {
    validatePath(path);
    validateUid(uid, 'uid');
    validateUid(gid, 'gid');
    validateCallback(callback);
    queueMicrotask(() => {
        try {
            chownSync(path, uid, gid);
            callback(null);
        } catch (err) {
            callback(err);
        }
    });
}

export function fchown(fd, uid, gid, callback) {
    validateFd(fd);
    validateUid(uid, 'uid');
    validateUid(gid, 'gid');
    validateCallback(callback);
    queueMicrotask(() => {
        try {
            fchownSync(fd, uid, gid);
            callback(null);
        } catch (err) {
            callback(err);
        }
    });
}

export function lchown(path, uid, gid, callback) {
    validatePath(path);
    validateUid(uid, 'uid');
    validateUid(gid, 'gid');
    validateCallback(callback);
    queueMicrotask(() => {
        try {
            lchownSync(path, uid, gid);
            callback(null);
        } catch (err) {
            callback(err);
        }
    });
}

export function utimes(path, atime, mtime, callback) {
    validatePath(path);
    validateCallback(callback);
    queueMicrotask(() => {
        try {
            utimesSync(path, atime, mtime);
            callback(null);
        } catch (err) {
            callback(err);
        }
    });
}

export function futimes(fd, atime, mtime, callback) {
    validateCallback(callback);
    queueMicrotask(() => {
        try {
            futimesSync(fd, atime, mtime);
            callback(null);
        } catch (err) {
            callback(err);
        }
    });
}

export function lutimes(path, atime, mtime, callback) {
    validateCallback(callback);
    queueMicrotask(() => {
        try {
            lutimesSync(path, atime, mtime);
            callback(null);
        } catch (err) {
            callback(err);
        }
    });
}

export function unlink(path, callback) {
    validatePath(path);
    validateCallback(callback);
    const error = native.unlink(path);
    if (error !== undefined) {
        queueMicrotask(() => callback(new Error(error)));
    } else {
        queueMicrotask(() => callback(null));
    }
}

export function rename(oldPath, newPath, callback) {
    validatePath(oldPath, 'oldPath');
    validatePath(newPath, 'newPath');
    validateCallback(callback);
    const error = native.rename(oldPath, newPath);
    if (error !== undefined) {
        queueMicrotask(() => callback(new Error(error)));
    } else {
        queueMicrotask(() => callback(null));
    }
}

export function mkdir(path, optionsOrCallback, callback) {
    validatePath(path);
    let recursive = false;
    let mode = 0o777;
    let cb;

    if (typeof optionsOrCallback === 'function') {
        cb = optionsOrCallback;
    } else if (typeof optionsOrCallback === 'number') {
        mode = optionsOrCallback;
        cb = callback;
    } else if (optionsOrCallback) {
        if (optionsOrCallback.recursive) recursive = true;
        if (optionsOrCallback.mode !== undefined) mode = optionsOrCallback.mode;
        cb = callback;
    } else {
        cb = callback;
    }

    validateCallback(cb);
    queueMicrotask(() => {
        try {
            const result = mkdirSync(path, { recursive, mode });
            cb(null, result);
        } catch (err) {
            cb(err);
        }
    });
}

export function rmdir(path, optionsOrCallback, callback) {
    validatePath(path);
    if (typeof optionsOrCallback === 'function') {
        callback = optionsOrCallback;
        optionsOrCallback = {};
    }
    const cb = callback;
    queueMicrotask(() => {
        try {
            rmdirSync(path, optionsOrCallback);
            cb(null);
        } catch (err) {
            cb(err);
        }
    });
}

export function rm(path, optionsOrCallback, callback) {
    validatePath(path);
    if (typeof optionsOrCallback === 'function') {
        callback = optionsOrCallback;
        optionsOrCallback = {};
    }
    const cb = callback;
    queueMicrotask(() => {
        try {
            rmSync(path, optionsOrCallback);
            cb(null);
        } catch (err) {
            cb(err);
        }
    });
}

export function mkdtemp(prefix, optionsOrCallback, callback) {
    validatePath(prefix, 'prefix');
    if (typeof optionsOrCallback === 'function') {
        callback = optionsOrCallback;
        optionsOrCallback = {};
    }
    const cb = callback;
    queueMicrotask(() => {
        try {
            const result = mkdtempSync(prefix, optionsOrCallback);
            cb(null, result);
        } catch (err) {
            cb(err);
        }
    });
}

export function opendir(path, optionsOrCallback, callback) {
    if (typeof optionsOrCallback === 'function') {
        callback = optionsOrCallback;
        optionsOrCallback = {};
    }
    const cb = callback;
    queueMicrotask(() => {
        try {
            const result = opendirSync(path, optionsOrCallback);
            cb(null, result);
        } catch (err) {
            cb(err);
        }
    });
}

// --- Stubs for unsupported operations ---

export class FSWatcher {
    constructor() {
        this._listeners = {};
    }
    on(event, listener) {
        if (!this._listeners[event]) this._listeners[event] = [];
        this._listeners[event].push(listener);
        return this;
    }
    emit(event, ...args) {
        const listeners = this._listeners[event] || [];
        for (const l of listeners) l(...args);
    }
    close() {
        this.emit('close');
    }
    ref() { return this; }
    unref() { return this; }
}

export class StatWatcher {
    constructor() {}
    ref() { return this; }
    unref() { return this; }
    stop() {}
}

export function watch(filename, optionsOrListener, listener) {
    validatePath(filename, 'filename');
    const watcher = new FSWatcher();
    return watcher;
}

export function watchFile(filename, optionsOrListener, listener) {
    validatePath(filename, 'filename');
    const watcher = new StatWatcher();
    return watcher;
}

export function unwatchFile(filename, listener) {
    validatePath(filename, 'filename');
    // no-op
}

// --- Stream stubs ---

export class ReadStream {
    constructor(path, options) {
        getStreamClasses();
        // Mixin Readable prototype methods
        Object.getOwnPropertyNames(_Readable.prototype).forEach(key => {
            if (key !== 'constructor' && !(key in this)) {
                this[key] = _Readable.prototype[key];
            }
        });
        _Readable.call(this, options);
        this.path = path;
        this.fd = null;
        this.flags = (options && options.flags) || 'r';
        this.mode = (options && options.mode) || 0o666;
        this.start = options && options.start;
        this.end = options && options.end;
        this.autoClose = options && options.autoClose !== false;
        this.pos = this.start || 0;
        this.bytesRead = 0;
        this._opening = false;

        queueMicrotask(() => this._openAndRead());
    }

    _openAndRead() {
        try {
            this.fd = openSync(this.path, this.flags, this.mode);
            this.emit('open', this.fd);
            this.emit('ready');
            this._doRead();
        } catch (err) {
            this.destroy(err);
        }
    }

    _doRead() {
        try {
            const chunkSize = 16384;
            const buf = getBuffer().alloc(chunkSize);
            const bytesRead = readSync(this.fd, buf, 0, chunkSize, this.pos);
            if (bytesRead === 0) {
                this.push(null);
                if (this.autoClose) {
                    try { closeSync(this.fd); } catch {}
                    this.emit('close');
                }
            } else {
                this.bytesRead += bytesRead;
                this.pos += bytesRead;
                const chunk = buf.slice(0, bytesRead);
                if (this.end !== undefined && this.pos > this.end) {
                    const trim = this.pos - this.end - 1;
                    this.push(chunk.slice(0, bytesRead - trim));
                    this.push(null);
                    if (this.autoClose) {
                        try { closeSync(this.fd); } catch {}
                        this.emit('close');
                    }
                } else {
                    this.push(chunk);
                    queueMicrotask(() => this._doRead());
                }
            }
        } catch (err) {
            this.destroy(err);
        }
    }

    _read() {
        // Managed by _doRead
    }
}

export class WriteStream {
    constructor(path, options) {
        getStreamClasses();
        Object.getOwnPropertyNames(_Writable.prototype).forEach(key => {
            if (key !== 'constructor' && !(key in this)) {
                this[key] = _Writable.prototype[key];
            }
        });
        _Writable.call(this, options);
        this.path = path;
        this.fd = null;
        this.flags = (options && options.flags) || 'w';
        this.mode = (options && options.mode) || 0o666;
        this.autoClose = options && options.autoClose !== false;
        this.pos = options && options.start;
        this.bytesWritten = 0;
        this._pending = true;

        queueMicrotask(() => {
            try {
                this.fd = openSync(this.path, this.flags, this.mode);
                this._pending = false;
                this.emit('open', this.fd);
                this.emit('ready');
            } catch (err) {
                this.destroy(err);
            }
        });
    }

    _write(chunk, encoding, callback) {
        if (this._pending) {
            this.once('ready', () => this._write(chunk, encoding, callback));
            return;
        }
        try {
            const buf = typeof chunk === 'string' ? getBuffer().from(chunk, encoding) : chunk;
            const written = writeSync(this.fd, buf, 0, buf.length, this.pos);
            this.bytesWritten += written;
            if (this.pos !== undefined) this.pos += written;
            callback();
        } catch (err) {
            callback(err);
        }
    }

    _final(callback) {
        if (this.autoClose && this.fd !== null) {
            try { closeSync(this.fd); } catch {}
            this.emit('close');
        }
        callback();
    }
}

export function createReadStream(path, options) {
    return new ReadStream(path, options);
}

export function createWriteStream(path, options) {
    return new WriteStream(path, options);
}

// --- readv/writev stubs ---

export function readv(fd, buffers, positionOrCallback, callback) {
    validateFd(fd);
    let position = null;
    let cb;
    if (typeof positionOrCallback === 'function') {
        cb = positionOrCallback;
    } else {
        position = positionOrCallback;
        cb = callback;
    }
    if (!Array.isArray(buffers)) {
        const err = new TypeError('The "buffers" argument must be an instance of Array. Received ' + describeType(buffers));
        err.code = 'ERR_INVALID_ARG_TYPE';
        throw err;
    }
    for (const buf of buffers) {
        if (!ArrayBuffer.isView(buf)) {
            const err = new TypeError('The "buffers[n]" argument must be an instance of Buffer, TypedArray, or DataView. Received ' + describeType(buf));
            err.code = 'ERR_INVALID_ARG_TYPE';
            throw err;
        }
    }
    validateCallback(cb);
    queueMicrotask(() => {
        try {
            let totalRead = 0;
            for (const buf of buffers) {
                const bytesRead = readSync(fd, buf, 0, buf.byteLength, position);
                totalRead += bytesRead;
                if (position !== null) position += bytesRead;
                if (bytesRead < buf.byteLength) break;
            }
            cb(null, totalRead, buffers);
        } catch (err) {
            cb(err, 0, buffers);
        }
    });
}

export function writev(fd, buffers, positionOrCallback, callback) {
    validateFd(fd);
    let position = null;
    let cb;
    if (typeof positionOrCallback === 'function') {
        cb = positionOrCallback;
    } else {
        position = positionOrCallback;
        cb = callback;
    }
    if (!Array.isArray(buffers)) {
        const err = new TypeError('The "buffers" argument must be an instance of Array. Received ' + describeType(buffers));
        err.code = 'ERR_INVALID_ARG_TYPE';
        throw err;
    }
    for (const buf of buffers) {
        if (!ArrayBuffer.isView(buf)) {
            const err = new TypeError('The "buffers[n]" argument must be an instance of Buffer, TypedArray, or DataView. Received ' + describeType(buf));
            err.code = 'ERR_INVALID_ARG_TYPE';
            throw err;
        }
    }
    validateCallback(cb);
    queueMicrotask(() => {
        try {
            let totalWritten = 0;
            for (const buf of buffers) {
                const written = writeSync(fd, buf, 0, buf.byteLength, position);
                totalWritten += written;
                if (position !== null) position += written;
            }
            cb(null, totalWritten, buffers);
        } catch (err) {
            cb(err, 0, buffers);
        }
    });
}

export function readvSync(fd, buffers, position) {
    validateFd(fd);
    if (!Array.isArray(buffers)) {
        const err = new TypeError('The "buffers" argument must be an instance of Array. Received ' + describeType(buffers));
        err.code = 'ERR_INVALID_ARG_TYPE';
        throw err;
    }
    for (const buf of buffers) {
        if (!ArrayBuffer.isView(buf)) {
            const err = new TypeError('The "buffers[n]" argument must be an instance of Buffer, TypedArray, or DataView. Received ' + describeType(buf));
            err.code = 'ERR_INVALID_ARG_TYPE';
            throw err;
        }
    }
    let totalRead = 0;
    let pos = position !== undefined ? position : null;
    for (const buf of buffers) {
        const bytesRead = readSync(fd, buf, 0, buf.byteLength, pos);
        totalRead += bytesRead;
        if (pos !== null) pos += bytesRead;
        if (bytesRead < buf.byteLength) break;
    }
    return totalRead;
}

export function writevSync(fd, buffers, position) {
    validateFd(fd);
    if (!Array.isArray(buffers)) {
        const err = new TypeError('The "buffers" argument must be an instance of Array. Received ' + describeType(buffers));
        err.code = 'ERR_INVALID_ARG_TYPE';
        throw err;
    }
    for (const buf of buffers) {
        if (!ArrayBuffer.isView(buf)) {
            const err = new TypeError('The "buffers[n]" argument must be an instance of Buffer, TypedArray, or DataView. Received ' + describeType(buf));
            err.code = 'ERR_INVALID_ARG_TYPE';
            throw err;
        }
    }
    let totalWritten = 0;
    let pos = position !== undefined ? position : null;
    for (const buf of buffers) {
        const written = writeSync(fd, buf, 0, buf.byteLength, pos);
        totalWritten += written;
        if (pos !== null) pos += written;
    }
    return totalWritten;
}

// --- cp stub ---

export function cpSync(src, dest, options) {
    const recursive = options && options.recursive;
    const srcStat = statSync(src);
    if (srcStat.isDirectory()) {
        mkdirSync(dest, { recursive: true });
        if (recursive) {
            const entries = readdirSync(src, { withFileTypes: true });
            for (const entry of entries) {
                const srcPath = src + '/' + entry.name;
                const destPath = dest + '/' + entry.name;
                if (entry.isDirectory()) {
                    cpSync(srcPath, destPath, options);
                } else {
                    copyFileSync(srcPath, destPath);
                }
            }
        }
    } else {
        copyFileSync(src, dest);
    }
}

export function cp(src, dest, optionsOrCallback, callback) {
    if (typeof optionsOrCallback === 'function') {
        callback = optionsOrCallback;
        optionsOrCallback = {};
    }
    const cb = callback;
    queueMicrotask(() => {
        try {
            cpSync(src, dest, optionsOrCallback);
            cb(null);
        } catch (err) {
            cb(err);
        }
    });
}

// --- util.promisify support ---

const kCustomPromisifyArgsSymbol = Symbol.for('nodejs.util.promisify.customArgs');
const kCustomPromisifiedSymbol = Symbol.for('nodejs.util.promisify.custom');

Object.defineProperty(read, kCustomPromisifyArgsSymbol, {
    value: ['bytesRead', 'buffer'], enumerable: false
});
Object.defineProperty(write, kCustomPromisifyArgsSymbol, {
    value: ['bytesWritten', 'buffer'], enumerable: false
});
Object.defineProperty(readv, kCustomPromisifyArgsSymbol, {
    value: ['bytesRead', 'buffers'], enumerable: false
});
Object.defineProperty(writev, kCustomPromisifyArgsSymbol, {
    value: ['bytesWritten', 'buffer'], enumerable: false
});
Object.defineProperty(exists, kCustomPromisifiedSymbol, {
    value: function existsPromisified(path) {
        return new Promise((resolve) => exists(path, resolve));
    }
});

// --- Default export ---

const _default = {
    constants,
    Stats,
    Dirent,
    Dir,
    FSWatcher,
    StatWatcher,
    ReadStream,
    WriteStream,
    get promises() { return getPromises(); },
    // Sync functions
    readFileSync,
    writeFileSync,
    appendFileSync,
    openSync,
    closeSync,
    readSync,
    writeSync,
    ftruncateSync,
    fsyncSync,
    fdatasyncSync,
    statSync,
    lstatSync,
    fstatSync,
    readdirSync,
    accessSync,
    existsSync,
    realpathSync,
    truncateSync,
    copyFileSync,
    linkSync,
    symlinkSync,
    readlinkSync,
    chmodSync,
    fchmodSync,
    lchmodSync,
    chownSync,
    fchownSync,
    lchownSync,
    utimesSync,
    futimesSync,
    lutimesSync,
    unlinkSync,
    renameSync,
    mkdirSync,
    rmdirSync,
    rmSync,
    mkdtempSync,
    opendirSync,
    readvSync,
    writevSync,
    cpSync,
    // Async functions
    readFile,
    writeFile,
    appendFile,
    open,
    close,
    read,
    write,
    stat,
    lstat,
    fstat,
    ftruncate,
    fsync,
    fdatasync,
    readdir,
    access,
    exists,
    realpath,
    truncate,
    copyFile,
    link,
    symlink,
    readlink,
    chmod,
    fchmod,
    lchmod,
    chown,
    fchown,
    lchown,
    utimes,
    futimes,
    lutimes,
    unlink,
    rename,
    mkdir,
    rmdir,
    rm,
    mkdtemp,
    opendir,
    watch,
    watchFile,
    unwatchFile,
    createReadStream,
    createWriteStream,
    readv,
    writev,
    cp,
};

export default _default;
