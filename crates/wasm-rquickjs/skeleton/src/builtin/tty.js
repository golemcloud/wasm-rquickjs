// node:tty stub implementation
// Some parts are real implementations (isatty returns false in WASM)

import net from 'node:net';

function parseForceColor(value) {
    var normalized = String(value).toLowerCase();
    if (normalized === '' || normalized === 'true' || normalized === '1') {
        return 4;
    }
    if (normalized === '2') {
        return 8;
    }
    if (normalized === '3') {
        return 24;
    }
    return 1;
}

function getEnvColorDepth(stream, env) {
    var currentEnv = env || (typeof process !== 'undefined' ? process.env : undefined) || {};

    if (currentEnv.FORCE_COLOR !== undefined) {
        return parseForceColor(currentEnv.FORCE_COLOR);
    }

    if (currentEnv.NODE_DISABLE_COLORS !== undefined ||
        currentEnv.NO_COLOR !== undefined ||
        currentEnv.TERM === 'dumb') {
        return 1;
    }

    return stream && stream.isTTY ? 4 : 1;
}

export function isatty(fd) {
    return false;
}

export function ReadStream(fd, options) {
    this.isTTY = false;
    this.fd = fd;
    this.isRaw = false;
}

Object.setPrototypeOf(ReadStream.prototype, net.Socket.prototype);
Object.setPrototypeOf(ReadStream, net.Socket);

ReadStream.prototype.setRawMode = function setRawMode(mode) {
    return this;
};

export function WriteStream(fd) {
    this.isTTY = false;
    this.fd = fd;
    this.columns = 80;
    this.rows = 24;
}

Object.setPrototypeOf(WriteStream.prototype, net.Socket.prototype);
Object.setPrototypeOf(WriteStream, net.Socket);

WriteStream.prototype.getColorDepth = function getColorDepth(env) {
    return getEnvColorDepth(this, env);
};

WriteStream.prototype.hasColors = function hasColors(count, env) {
    return this.getColorDepth(env) > 2;
};

WriteStream.prototype.getWindowSize = function getWindowSize() {
    return [80, 24];
};

WriteStream.prototype.clearLine = function clearLine(dir, callback) {
    if (typeof callback === 'function') callback();
};

WriteStream.prototype.cursorTo = function cursorTo(x, y, callback) {
    if (typeof callback === 'function') callback();
};

WriteStream.prototype.moveCursor = function moveCursor(dx, dy, callback) {
    if (typeof callback === 'function') callback();
};

export default {
    isatty,
    ReadStream,
    WriteStream,
};
