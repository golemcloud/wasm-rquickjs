// node:async_hooks - partial implementation with sync-only AsyncLocalStorage

let _nextAsyncId = 1;

class AsyncLocalStorage {
    constructor() {
        this._stack = [];
    }

    getStore() {
        if (this._stack.length === 0) return undefined;
        return this._stack[this._stack.length - 1];
    }

    run(store, callback, ...args) {
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
        this._stack.push(store);
    }

    disable() {
        this._stack.length = 0;
    }

    snapshot() {
        const currentStore = this.getStore();
        const self = this;
        return function(fn, ...args) {
            return self.run(currentStore, fn, ...args);
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

export {
    AsyncLocalStorage,
    AsyncResource,
    createHook,
    executionAsyncId,
    triggerAsyncId,
    executionAsyncResource,
};

export default {
    AsyncLocalStorage,
    AsyncResource,
    createHook,
    executionAsyncId,
    triggerAsyncId,
    executionAsyncResource,
};
