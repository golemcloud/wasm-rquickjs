// node:tty stub implementation
// Some parts are real implementations (isatty returns false in WASM)

import net from 'node:net';

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

WriteStream.prototype.getColorDepth = function getColorDepth() {
    return 1;
};

WriteStream.prototype.hasColors = function hasColors(count) {
    return false;
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
