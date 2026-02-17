import * as timeoutNative from '__wasm_rquickjs_builtin/timeout_native'

class Timeout {
    constructor(id, callback, delay, args, isInterval) {
        this._id = id;
        this._destroyed = false;
        this._refed = true;
        this._callback = callback;
        this._delay = delay;
        this._args = args;
        this._isInterval = isInterval;
    }

    ref() {
        this._refed = true;
        return this;
    }

    unref() {
        this._refed = false;
        return this;
    }

    hasRef() {
        return this._refed && !this._destroyed;
    }

    refresh() {
        if (!this._destroyed) {
            timeoutNative.clear_schedule(this._id);
            var bound = this._bound || this._callback.bind(this);
            this._bound = bound;
            this._id = timeoutNative.schedule(bound, this._delay, this._isInterval, this._args);
        }
        return this;
    }

    close() {
        if (!this._destroyed) {
            this._destroyed = true;
            timeoutNative.clear_schedule(this._id);
        }
        return this;
    }

    [Symbol.toPrimitive]() {
        return this._id;
    }

    [Symbol.dispose]() {
        this.close();
    }
}

function validateCallback(callback) {
    if (typeof callback !== 'function') {
        const err = new TypeError('The "callback" argument must be of type function. Received ' + (callback === null ? 'null' : typeof callback));
        err.code = 'ERR_INVALID_ARG_TYPE';
        throw err;
    }
}

function scheduleTimeout(callback, time, args, isInterval) {
    const timeout = new Timeout(0, callback, time, args, isInterval);
    const bound = callback.bind(timeout);
    const id = timeoutNative.schedule(bound, time, isInterval, args);
    timeout._id = id;
    timeout._bound = bound;
    return timeout;
}

export function setTimeout(callback, time, ...args) {
    validateCallback(callback);
    return scheduleTimeout(callback, time, args, false);
}

export function setInterval(callback, time, ...args) {
    validateCallback(callback);
    return scheduleTimeout(callback, time, args, true);
}

export function setImmediate(callback, ...args) {
    validateCallback(callback);
    return scheduleTimeout(callback, 0, args, false);
}

export function clearTimeout(id) {
    if (id == null) return;
    if (id instanceof Timeout) {
        id.close();
        return;
    }
    if (typeof id === 'number' || typeof id === 'string') {
        timeoutNative.clear_schedule(+id);
    }
}

export var clearInterval = clearTimeout;
export var clearImmediate = clearTimeout;
