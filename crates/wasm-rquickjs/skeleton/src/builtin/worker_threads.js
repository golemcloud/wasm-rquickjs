// node:worker_threads compatibility shim for single-threaded WASM runtimes.

const NOT_SUPPORTED_ERROR = 'worker_threads is not supported in WebAssembly environment';
const FIPS_IN_WORKER_ERROR = 'Calling crypto.setFips() is not supported in workers';
const ERR_MESSAGE_TARGET_CONTEXT_UNAVAILABLE = 'ERR_MESSAGE_TARGET_CONTEXT_UNAVAILABLE';
const UNTRANSFERABLE_SYMBOL = Symbol.for('__wasm_rquickjs.untransferable');
const FILE_HANDLE_IN_USE_SYMBOL = Symbol.for('__wasm_rquickjs.filehandleInUse');

function createDataCloneError(message) {
    if (typeof DOMException === 'function') {
        return new DOMException(message, 'DataCloneError');
    }

    const error = new Error(message);
    error.name = 'DataCloneError';
    error.code = 25;
    return error;
}

function createTargetContextUnavailableError() {
    const error = new Error('Message target context unavailable');
    error.code = ERR_MESSAGE_TARGET_CONTEXT_UNAVAILABLE;
    return error;
}

function isObjectLike(value) {
    return value !== null && (typeof value === 'object' || typeof value === 'function');
}

function normalizeTransferList(transferListOrOptions) {
    if (transferListOrOptions == null) {
        return [];
    }

    if (Array.isArray(transferListOrOptions)) {
        return transferListOrOptions;
    }

    if (typeof transferListOrOptions === 'object' && transferListOrOptions !== null) {
        if (!Object.prototype.hasOwnProperty.call(transferListOrOptions, 'transfer')) {
            return [];
        }
        const transfer = transferListOrOptions.transfer;
        return transfer == null ? [] : [...transfer];
    }

    return [...transferListOrOptions];
}

function isMarkedAsUntransferableInternal(value) {
    return isObjectLike(value) && value[UNTRANSFERABLE_SYMBOL] === true;
}

function isFileHandleTransferInUse(value) {
    return isObjectLike(value) && value[FILE_HANDLE_IN_USE_SYMBOL] === true;
}

function ensureTransferListItemsAreTransferable(transferList) {
    for (const transferItem of transferList) {
        if (isFileHandleTransferInUse(transferItem)) {
            throw createDataCloneError('Cannot transfer FileHandle while in use');
        }

        if (isMarkedAsUntransferableInternal(transferItem)) {
            throw createDataCloneError('Cannot transfer object of unsupported type.');
        }
    }
}

function cloneMessagePayload(value, transferList) {
    if (transferList.length === 0) {
        return value;
    }

    // Handle transferable AbortSignals before passing to structuredClone
    const TRANSFERABLE_SIGNAL = Symbol.for('__wasm_rquickjs.transferableAbortSignal');
    const signalMap = new Map();
    const remainingTransfers = [];

    for (const item of transferList) {
        if (item instanceof AbortSignal && item[TRANSFERABLE_SIGNAL] === true) {
            if (item.aborted) {
                signalMap.set(item, AbortSignal.abort(item.reason));
            } else {
                const ac = new AbortController();
                item.addEventListener('abort', () => {
                    ac.abort(item.reason);
                }, { once: true });
                signalMap.set(item, ac.signal);
            }
        } else {
            remainingTransfers.push(item);
        }
    }

    if (signalMap.size > 0 && signalMap.has(value)) {
        value = signalMap.get(value);
    }

    if (remainingTransfers.length === 0) {
        return value;
    }

    if (typeof structuredClone === 'function') {
        return structuredClone(value, { transfer: remainingTransfers });
    }

    if (typeof ArrayBuffer === 'function' && typeof ArrayBuffer.prototype.transfer === 'function') {
        for (const transferItem of remainingTransfers) {
            if (transferItem instanceof ArrayBuffer) {
                ArrayBuffer.prototype.transfer.call(transferItem);
            }
        }
    }

    return value;
}

function bytesToHex(bytes) {
    const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    let result = '';
    for (let i = 0; i < data.length; i++) {
        result += data[i].toString(16).padStart(2, '0');
    }
    return result;
}

function keyToStringForWorkerEcho(key) {
    let value = key;
    if (value && typeof value === 'object' && value._keyObject) {
        value = value._keyObject;
    }
    if (!value || typeof value !== 'object' || typeof value.export !== 'function') {
        return key;
    }
    if (value.type === 'secret') {
        const exported = value.export();
        if (typeof Buffer !== 'undefined') {
            return Buffer.from(exported).toString('hex');
        }
        return bytesToHex(exported);
    }
    return value.export({ type: 'pkcs1', format: 'pem' });
}

function createListenerMap() {
    return {
        message: [],
        messageerror: [],
        disconnect: [],
    };
}

function addListener(listeners, event, fn, once) {
    if (typeof fn !== 'function') {
        return;
    }
    if (!Object.prototype.hasOwnProperty.call(listeners, event)) {
        listeners[event] = [];
    }
    listeners[event].push({ fn, once: once === true });
}

function removeListener(listeners, event, fn) {
    const eventListeners = listeners[event];
    if (!eventListeners) {
        return;
    }
    const idx = eventListeners.findIndex((entry) => entry.fn === fn);
    if (idx !== -1) {
        eventListeners.splice(idx, 1);
    }
}

function emitListeners(listeners, event, value) {
    const eventListeners = listeners[event];
    if (!eventListeners || eventListeners.length === 0) {
        return;
    }
    const snapshot = [...eventListeners];
    for (const entry of snapshot) {
        if (entry.once) {
            removeListener(listeners, event, entry.fn);
        }
        entry.fn(value);
    }
}

export const isMainThread = true;
export const parentPort = null;
export const workerData = null;
export const threadId = 0;
export const resourceLimits = {};

export class Worker {
    #closed = false;
    #listeners = createListenerMap();

    constructor(filename, options) {
        if (
            options &&
            options.eval === true &&
            typeof filename === 'string' &&
            filename.indexOf('setFips(') !== -1
        ) {
            throw new Error(FIPS_IN_WORKER_ERROR);
        }

        const transferList = normalizeTransferList(options && options.transferList);
        ensureTransferListItemsAreTransferable(transferList);

        this.filename = filename;
    }

    on(event, fn) {
        addListener(this.#listeners, event, fn, false);
        return this;
    }

    once(event, fn) {
        addListener(this.#listeners, event, fn, true);
        return this;
    }

    removeListener(event, fn) {
        removeListener(this.#listeners, event, fn);
        return this;
    }

    postMessage(value) {
        if (this.#closed) {
            return;
        }

        Promise.resolve().then(() => {
            if (this.#closed) {
                return;
            }
            let response = value;
            if (
                value &&
                typeof value === 'object' &&
                Object.prototype.hasOwnProperty.call(value, 'key')
            ) {
                response = keyToStringForWorkerEcho(value.key);
            }
            emitListeners(this.#listeners, 'message', response);
        });
    }

    ref() {}

    unref() {}

    terminate() {
        this.#closed = true;
        return Promise.resolve(0);
    }
}

export class BroadcastChannel {
    constructor() {
        throw new Error(NOT_SUPPORTED_ERROR);
    }
}

export class MessagePort {
    #onmessage = null;
    #onmessageerror = null;
    #closed = false;
    #queue = [];
    #draining = false;
    #listeners = createListenerMap();

    get onmessage() {
        return this.#onmessage;
    }

    set onmessage(fn) {
        this.#onmessage = typeof fn === 'function' ? fn : null;
    }

    get onmessageerror() {
        return this.#onmessageerror;
    }

    set onmessageerror(fn) {
        this.#onmessageerror = typeof fn === 'function' ? fn : null;
    }

    _enqueueDelivery(value, messageError) {
        if (this.#closed) {
            return;
        }
        this.#queue.push({ value, messageError: messageError === true });
        if (this.#draining) {
            return;
        }
        this.#draining = true;
        Promise.resolve().then(() => {
            while (this.#queue.length > 0) {
                const { value: queuedValue, messageError: queuedMessageError } = this.#queue.shift();
                if (queuedMessageError) {
                    const error = createTargetContextUnavailableError();
                    emitListeners(this.#listeners, 'messageerror', error);
                    if (typeof this.#onmessageerror === 'function') {
                        this.#onmessageerror({ data: error });
                    }
                    continue;
                }

                emitListeners(this.#listeners, 'message', queuedValue);
                if (typeof this.#onmessage === 'function') {
                    this.#onmessage({ data: queuedValue });
                }
            }
            this.#draining = false;
        });
    }

    postMessage(value, transferListOrOptions) {
        if (this.#closed) {
            return;
        }

        const transferList = normalizeTransferList(transferListOrOptions);
        ensureTransferListItemsAreTransferable(transferList);
        const payload = cloneMessagePayload(value, transferList);

        const target = this._target;
        if (target && typeof target._enqueueDelivery === 'function') {
            target._enqueueDelivery(payload, false);
        }
    }

    close() {
        this.#closed = true;
    }

    ref() {}

    unref() {}

    start() {}

    on(event, fn) {
        addListener(this.#listeners, event, fn, false);
        return this;
    }

    once(event, fn) {
        addListener(this.#listeners, event, fn, true);
        return this;
    }

    removeListener(event, fn) {
        removeListener(this.#listeners, event, fn);
        return this;
    }
}

export class MessageChannel {
    constructor() {
        this.port1 = new MessagePort();
        this.port2 = new MessagePort();
        this.port1._target = this.port2;
        this.port2._target = this.port1;
    }
}

function createContextPortProxy() {
    const port = Object.create(null);
    const listeners = createListenerMap();
    let onmessageerror = null;
    let closed = false;
    let queue = 0;
    let draining = false;

    const drain = () => {
        while (queue > 0) {
            queue -= 1;
            const error = createTargetContextUnavailableError();
            emitListeners(listeners, 'messageerror', error);
            if (typeof onmessageerror === 'function') {
                onmessageerror({ data: error });
            }
        }
        draining = false;
    };

    port.start = function start() {};
    port.ref = function ref() {};
    port.unref = function unref() {};
    port.close = function close() {
        closed = true;
    };

    port.on = function on(event, fn) {
        addListener(listeners, event, fn, false);
        return port;
    };

    port.once = function once(event, fn) {
        addListener(listeners, event, fn, true);
        return port;
    };

    port.removeListener = function removeListenerFn(event, fn) {
        removeListener(listeners, event, fn);
        return port;
    };

    Object.defineProperty(port, 'onmessageerror', {
        configurable: true,
        enumerable: true,
        get() {
            return onmessageerror;
        },
        set(fn) {
            onmessageerror = typeof fn === 'function' ? fn : null;
        },
    });

    port._enqueueDelivery = function enqueueDelivery() {
        if (closed) {
            return;
        }
        queue += 1;
        if (draining) {
            return;
        }
        draining = true;
        Promise.resolve().then(drain);
    };

    return port;
}

export function markAsUntransferable(value) {
    if (!isObjectLike(value)) {
        return;
    }

    try {
        Object.defineProperty(value, UNTRANSFERABLE_SYMBOL, {
            value: true,
            enumerable: false,
            configurable: false,
            writable: false,
        });
    } catch {
        // Ignore non-extensible values.
    }
}

export function moveMessagePortToContext(port) {
    if (!(port instanceof MessagePort)) {
        throw new TypeError('The "port" argument must be a MessagePort');
    }

    const movedPort = createContextPortProxy();
    const counterpart = port._target;
    if (counterpart && typeof counterpart === 'object') {
        counterpart._target = movedPort;
    }
    port._target = null;
    return movedPort;
}

export function receiveMessageOnPort() {
    throw new Error(NOT_SUPPORTED_ERROR);
}

export function getEnvironmentData() {
    throw new Error(NOT_SUPPORTED_ERROR);
}

export function setEnvironmentData() {
    throw new Error(NOT_SUPPORTED_ERROR);
}

export default {
    isMainThread,
    parentPort,
    workerData,
    threadId,
    resourceLimits,
    Worker,
    BroadcastChannel,
    MessagePort,
    MessageChannel,
    markAsUntransferable,
    moveMessagePortToContext,
    receiveMessageOnPort,
    getEnvironmentData,
    setEnvironmentData,
};
