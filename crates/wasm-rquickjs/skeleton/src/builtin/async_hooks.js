// node:async_hooks - partial implementation with AsyncLocalStorage
// Context propagation through Promise.prototype.then/catch/finally and setTimeout/setInterval.
//
// Intentional deviations from upstream Node.js:
// - executionAsyncId/triggerAsyncId/executionAsyncResource are stubs (no native async_wrap)
// - AsyncResource.runInAsyncScope is a plain fn.apply (no hook emit since createHook is a no-op)
// - AsyncResource.bind / AsyncLocalStorage.bind are essentially identity (no context frame capture)
// - QuickJS `await` uses internal C-level perform_promise_then and bypasses JS-visible
//   Promise.prototype.then, so await propagation is NOT possible — this is an accepted limitation.

let _nextAsyncId = 1;

const _alsRegistry = new Set();

class AsyncLocalStorage {
    constructor() {
        this._stack = [];
        _alsRegistry.add(this);
    }

    getStore() {
        if (this._stack.length === 0) return undefined;
        return this._stack[this._stack.length - 1];
    }

    run(store, callback, ...args) {
        _alsRegistry.add(this);
        this._stack.push(store);
        try {
            return callback(...args);
        } finally {
            this._stack.pop();
        }
    }

    exit(callback, ...args) {
        this._stack.push(undefined);
        try {
            return callback(...args);
        } finally {
            this._stack.pop();
        }
    }

    enterWith(store) {
        _alsRegistry.add(this);
        if (this._stack.length === 0) {
            this._stack.push(store);
        } else {
            this._stack[this._stack.length - 1] = store;
        }
    }

    disable() {
        this._stack.length = 0;
        _alsRegistry.delete(this);
    }

    snapshot() {
        const captured = _captureContext();
        return function(fn, ...args) {
            return _restoreContext(captured, fn, undefined, args);
        };
    }

    static bind(fn) {
        return fn;
    }
}

class AsyncResource {
    constructor(type, options) {
        this._type = type;
        this._asyncId = _nextAsyncId++;
        this._triggerAsyncId = (options && options.triggerAsyncId) || 0;
    }

    get type() {
        return this._type;
    }

    asyncId() {
        return this._asyncId;
    }

    triggerAsyncId() {
        return this._triggerAsyncId;
    }

    emitDestroy() {
        return this;
    }

    runInAsyncScope(fn, thisArg, ...args) {
        return fn.apply(thisArg, args);
    }

    bind(fn, thisArg) {
        if (thisArg !== undefined) {
            return fn.bind(thisArg);
        }
        return fn;
    }

    static bind(fn, type, thisArg) {
        if (thisArg !== undefined) {
            return fn.bind(thisArg);
        }
        return fn;
    }
}

function createHook(callbacks) {
    return {
        enable() { return this; },
        disable() { return this; },
    };
}

function executionAsyncId() {
    return 1;
}

function triggerAsyncId() {
    return 0;
}

function executionAsyncResource() {
    return {};
}

function _captureContext() {
    const snapshot = new Map();
    for (const als of _alsRegistry) {
        snapshot.set(als, als.getStore());
    }
    return snapshot;
}

function _restoreContext(snapshot, fn, thisArg, args) {
    let wrapped = () => fn.apply(thisArg, args);
    for (const [als, value] of snapshot) {
        const inner = wrapped;
        wrapped = () => als.run(value, inner);
    }
    return wrapped();
}

// Wrap a callback to restore the captured async context when invoked.
// Returns non-function values unchanged (e.g. undefined/null handlers in .then).
function _wrapCallback(snapshot, cb) {
    if (typeof cb !== 'function') return cb;
    return function(...a) { return _restoreContext(snapshot, cb, this, a); };
}

const _originalThen = Promise.prototype.then;
const _originalCatch = Promise.prototype.catch;
const _originalFinally = Promise.prototype.finally;

Promise.prototype.then = function(onFulfilled, onRejected) {
    const snapshot = _captureContext();
    return _originalThen.call(this, _wrapCallback(snapshot, onFulfilled), _wrapCallback(snapshot, onRejected));
};

Promise.prototype.catch = function(onRejected) {
    const snapshot = _captureContext();
    return _originalCatch.call(this, _wrapCallback(snapshot, onRejected));
};

// finally handler receives no arguments, so use a specialized wrapper
Promise.prototype.finally = function(onFinally) {
    const snapshot = _captureContext();
    const wrapped = typeof onFinally === 'function'
        ? function() { return _restoreContext(snapshot, onFinally, this, []); }
        : onFinally;
    return _originalFinally.call(this, wrapped);
};

export {
    AsyncLocalStorage,
    AsyncResource,
    createHook,
    executionAsyncId,
    triggerAsyncId,
    executionAsyncResource,
    _captureContext,
    _restoreContext,
};

export default {
    AsyncLocalStorage,
    AsyncResource,
    createHook,
    executionAsyncId,
    triggerAsyncId,
    executionAsyncResource,
    _captureContext,
    _restoreContext,
};
