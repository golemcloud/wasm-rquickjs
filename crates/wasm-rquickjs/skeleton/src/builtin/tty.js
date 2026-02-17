// node:tty stub implementation
// Some parts are real implementations (isatty returns false in WASM)

export function isatty(fd) {
    return false;
}

export class ReadStream {
    constructor(fd, options) {
        this.isTTY = false;
        this.fd = fd;
        this.isRaw = false;
    }

    setRawMode(mode) {
        return this;
    }
}

export class WriteStream {
    constructor(fd) {
        this.isTTY = false;
        this.fd = fd;
        this.columns = 80;
        this.rows = 24;
    }

    getColorDepth() {
        return 1;
    }

    hasColors(count) {
        return false;
    }

    getWindowSize() {
        return [80, 24];
    }

    clearLine(dir, callback) {
        if (typeof callback === 'function') callback();
    }

    cursorTo(x, y, callback) {
        if (typeof callback === 'function') callback();
    }

    moveCursor(dx, dy, callback) {
        if (typeof callback === 'function') callback();
    }
}

export default {
    isatty,
    ReadStream,
    WriteStream,
};
