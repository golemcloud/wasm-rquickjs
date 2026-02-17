// node:readline stub implementation
// Readline is implementable but stubbed for now

const NOT_SUPPORTED_ERROR = new Error('readline is not yet supported in WebAssembly environment');

export function createInterface(options) {
    throw NOT_SUPPORTED_ERROR;
}

export class Interface {
    constructor() {
        throw NOT_SUPPORTED_ERROR;
    }
}

export function clearLine(stream, dir, callback) {
    if (typeof callback === 'function') callback();
}

export function clearScreenDown(stream, callback) {
    if (typeof callback === 'function') callback();
}

export function cursorTo(stream, x, y, callback) {
    if (typeof callback === 'function') callback();
}

export function moveCursor(stream, dx, dy, callback) {
    if (typeof callback === 'function') callback();
}

export function emitKeypressEvents(stream, interface_) {
    // no-op
}

export default {
    createInterface,
    Interface,
    clearLine,
    clearScreenDown,
    cursorTo,
    moveCursor,
    emitKeypressEvents,
};
