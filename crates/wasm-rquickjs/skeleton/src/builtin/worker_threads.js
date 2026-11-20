// node:worker_threads supports runtime-local messaging and clone policy.
// Real worker execution/isolation is unavailable and fails explicitly.

import { _emitInit } from 'node:async_hooks';
import { cloneWithTransferList } from '__wasm_rquickjs_builtin/structured_clone';
import { markAsUncloneable, markAsUntransferable, isMarkedAsUntransferable, registerCloneAdapter } from '__wasm_rquickjs_builtin/internal/clone_policy';
import { DOMException } from '__wasm_rquickjs_builtin/abort_controller';
export { markAsUncloneable, markAsUntransferable, isMarkedAsUntransferable };

const NOT_SUPPORTED_ERROR = 'worker_threads is not supported in WebAssembly environment';
const apply = Reflect.apply;
const hasOwn = Object.hasOwn;
const shift = Function.prototype.call.bind(Array.prototype.shift);
const arrayIsArray = Array.isArray;
const push = Function.prototype.call.bind(Array.prototype.push);
const iteratorSymbol = Symbol.iterator;
const promiseThen = Function.prototype.call.bind(Promise.prototype.then);
const resolved = Promise.resolve();
const INVALID_ITERABLE = Symbol('invalid iterable');
const defineProperty = Object.defineProperty;
const portCloneAdapter = {__proto__: null, kind: 'MessagePort', reject() {
    throw new DOMException('Object that needs transfer was found in message but not listed in transferList', 'DataCloneError');
}};

function createTargetContextUnavailableError() {
    const error = new Error('Message target context unavailable');
    error.code = 'ERR_MESSAGE_TARGET_CONTEXT_UNAVAILABLE';
    return error;
}

function createClosedMessagePortError() {
    const error = new Error('Cannot send data on closed MessagePort');
    error.code = 'ERR_CLOSED_MESSAGE_PORT';
    return error;
}

function isObjectLike(value) {
    return value !== null && (typeof value === 'object' || typeof value === 'function');
}

function readTransferIterable(value) {
    if (!isObjectLike(value)) return INVALID_ITERABLE;
    const method = value[iteratorSymbol];
    if (typeof method !== 'function') return INVALID_ITERABLE;
    const iterator = apply(method, value, []);
    if (!isObjectLike(iterator)) return INVALID_ITERABLE;
    const next = iterator.next;
    if (typeof next !== 'function') return INVALID_ITERABLE;
    const result = [];
    while (true) {
        const item = apply(next, iterator, []);
        if (!isObjectLike(item)) return INVALID_ITERABLE;
        if (item.done) return result;
        push(result, item.value);
    }
}

function normalizeTransferList(value) {
    if (value == null) return [];
    // Node's native array path reads indexed entries, ignoring iterator overrides.
    if (arrayIsArray(value)) {
        const result = [];
        const length = value.length;
        for (let i = 0; i < length; i++) push(result, value[i]);
        return result;
    }
    const iterable = readTransferIterable(value);
    if (iterable !== INVALID_ITERABLE) return iterable;
    let argument = 'transferList';
    if (isObjectLike(value)) {
        const transfer = value.transfer;
        if (transfer === undefined) return [];
        argument = 'options.transfer';
        const converted = arrayIsArray(transfer) ? normalizeTransferList(transfer) : readTransferIterable(transfer);
        if (converted !== INVALID_ITERABLE) return converted;
    }
    const error = new TypeError(`Optional ${argument} argument must be an iterable`);
    error.code = 'ERR_INVALID_ARG_TYPE';
    throw error;
}

function cloneMessagePayload(value, transferList) {
    return cloneWithTransferList(value, transferList);
}

function createListenerMap() {
    return {
        __proto__: null,
        message: [],
        messageerror: [],
        close: [],
        disconnect: [],
    };
}

function addListener(listeners, event, fn, once) {
    if (typeof fn !== 'function') {
        return;
    }
    if (!hasOwn(listeners, event)) {
        listeners[event] = [];
    }
    push(listeners[event], { fn, once: once === true });
}

function removeListener(listeners, event, fn) {
    const eventListeners = listeners[event];
    if (!eventListeners) {
        return;
    }
    for (let i = 0; i < eventListeners.length; i++) {
        if (eventListeners[i].fn !== fn) continue;
        for (let j = i + 1; j < eventListeners.length; j++) eventListeners[j - 1] = eventListeners[j];
        eventListeners.length--;
        return true;
    }
    return false;
}

function emitListeners(listeners, event, value, afterRemoval) {
    const eventListeners = listeners[event];
    if (!eventListeners || eventListeners.length === 0) {
        return;
    }
    const snapshot = [];
    for (let i = 0; i < eventListeners.length; i++) push(snapshot, eventListeners[i]);
    for (let i = 0; i < snapshot.length; i++) {
        const entry = snapshot[i];
        if (entry.once) {
            removeListener(listeners, event, entry.fn);
            if (afterRemoval) afterRemoval();
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
    constructor() {
        const error = new Error(NOT_SUPPORTED_ERROR);
        error.code = 'ERR_UNSUPPORTED_OPERATION';
        throw error;
    }
}

export class BroadcastChannel {
    constructor() {
        throw new Error(NOT_SUPPORTED_ERROR);
    }
}

class RuntimeMessagePort {
    #onmessage = null;
    #onmessageerror = null;
    #closed = false;
    #pendingClose = false;
    #refed = false;
    #queue = [];
    #drainPhase = 0;
    #receiving = false;
    #peerClosing = false;
    #listeners = createListenerMap();

    constructor() {
        registerCloneAdapter(this, portCloneAdapter);
        _emitInit('MESSAGEPORT', this);
    }

    static receive(port) {
        if (!isObjectLike(port) || !(#queue in port)) {
            const error = new TypeError('The "port" argument must be a MessagePort instance');
            error.code = 'ERR_INVALID_ARG_TYPE';
            throw error;
        }
        if (port.#closed) return undefined;
        const item = port.#queue[0];
        if (!item || item.close) {
            port.#scheduleDrain();
            return undefined;
        }
        shift(port.#queue);
        port.#scheduleDrain();
        // A deserialization failure is not a received message.
        return item.messageError ? undefined : {message: item.value};
    }

    get onmessage() {
        return this.#onmessage;
    }

    set onmessage(fn) {
        const previous = this.#onmessage;
        this.#onmessage = typeof fn === 'function' ? fn : null;
        if (this.#onmessage) this.start();
        else if (previous) this.#pauseIfUnobserved();
    }

    get onmessageerror() {
        return this.#onmessageerror;
    }

    set onmessageerror(fn) {
        this.#onmessageerror = typeof fn === 'function' ? fn : null;
    }

    #pauseIfUnobserved() {
        if (!this.#onmessage && this.#listeners.message.length === 0) this.#receiving = false;
    }

    #finishClose() {
        if (this.#closed) return;
        this.#closed = true;
        this.#pendingClose = false;
        this.#receiving = false;
        this._target = null;
        this.#queue.length = 0;
        emitListeners(this.#listeners, 'close');
    }

    #scheduleDrain() {
        if (this.#closed || this.#pendingClose || this.#drainPhase || this.#queue.length === 0) return;
        if (!this.#receiving && !this.#queue[0].close) return;
        this.#drainPhase = 1;
        promiseThen(resolved, () => {
            this.#drainPhase = 2;
            try {
                if (this.#pendingClose) return;
                while (this.#queue.length > 0 && (this.#receiving || this.#queue[0].close)) {
                    const item = shift(this.#queue);
                    if (item.close) {
                        this.#finishClose();
                        break;
                    }
                    if (item.messageError) {
                        const error = createTargetContextUnavailableError();
                        emitListeners(this.#listeners, 'messageerror', error);
                        if (this.#onmessageerror) this.#onmessageerror({data: error});
                    } else {
                        emitListeners(this.#listeners, 'message', item.value, () => this.#pauseIfUnobserved());
                        if (this.#onmessage) this.#onmessage({data: item.value});
                    }
                }
            } finally {
                this.#drainPhase = 0;
                this.#scheduleDrain();
            }
        });
    }

    _enqueueDelivery(value, messageError) {
        if (this.#closed || this.#pendingClose || this.#peerClosing) return;
        push(this.#queue, {__proto__: null, value, messageError: messageError === true});
        this.#scheduleDrain();
    }

    _enqueuePeerClose() {
        if (this.#closed || this.#pendingClose || this.#peerClosing) return;
        this.#peerClosing = true;
        push(this.#queue, {__proto__: null, close: true});
        this.#scheduleDrain();
    }

    postMessage(value, transferListOrOptions) {
        if (arguments.length === 0) {
            const error = new TypeError('The "value" argument must be specified');
            error.code = 'ERR_MISSING_ARGS';
            throw error;
        }
        const transferList = normalizeTransferList(transferListOrOptions);
        const payload = cloneMessagePayload(value, transferList);
        // Node still serializes and commits transfers on a closed endpoint.
        if (this.#closed || this.#pendingClose || this.#peerClosing) return;
        const target = this._target;
        if (target && typeof target._enqueueDelivery === 'function') target._enqueueDelivery(payload, false);
    }

    close(callback) {
        if (typeof callback === 'function') this.once('close', callback);
        if (this.#closed || this.#pendingClose) return;
        this.#pendingClose = true;
        const target = this._target;
        this._target = null;
        // Pending local close suppresses a new dispatch batch. Synchronous
        // polling can still consume data until close finalization; an already
        // accepted dispatch batch finishes before that finalization.
        promiseThen(resolved, () => {
            try { this.#finishClose(); }
            finally {
                if (target && typeof target._enqueuePeerClose === 'function') target._enqueuePeerClose();
            }
        });
    }

    ref() {
        this.#refed = true;
        return this;
    }

    unref() {
        this.#refed = false;
        return this;
    }

    hasRef() {
        return !this.#closed && (this.#refed || this.#listeners.message.length > 0 || this.#listeners.close.length > 0);
    }

    start() {
        this.#receiving = true;
        this.#scheduleDrain();
    }

    on(event, fn) {
        addListener(this.#listeners, event, fn, false);
        if (event === 'message' && typeof fn === 'function') this.start();
        return this;
    }

    addListener(event, fn) { return this.on(event, fn); }

    once(event, fn) {
        addListener(this.#listeners, event, fn, true);
        if (event === 'message' && typeof fn === 'function') this.start();
        return this;
    }

    removeListener(event, fn) {
        const removed = removeListener(this.#listeners, event, fn);
        if (removed && event === 'message') this.#pauseIfUnobserved();
        return this;
    }

    off(event, fn) {
        return this.removeListener(event, fn);
    }

    _isClosed() {
        // Disentangled-but-not-yet-fully-closed counts as closed for transfer
        // operations like moveMessagePortToContext.
        return this.#closed || this.#pendingClose;
    }
}

export function MessagePort() {
    const error = new TypeError('Constructor cannot be called');
    error.code = 'ERR_CONSTRUCT_CALL_INVALID';
    throw error;
}
defineProperty(MessagePort, 'prototype', {__proto__: null, value: RuntimeMessagePort.prototype, writable: false});
defineProperty(RuntimeMessagePort.prototype, 'constructor', {__proto__: null, value: MessagePort, writable: true, configurable: true});

export function MessageChannel() {
    if (!new.target) {
        const error = new TypeError("Cannot call constructor without `new`");
        error.code = 'ERR_CONSTRUCT_CALL_REQUIRED';
        throw error;
    }
    this.port1 = new RuntimeMessagePort();
    this.port2 = new RuntimeMessagePort();
    this.port1._target = this.port2;
    this.port2._target = this.port1;
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
    port.close = function close(callback) {
        if (typeof callback === 'function') {
            port.once('close', callback);
        }
        if (closed) {
            return;
        }
        closed = true;
        Promise.resolve().then(() => emitListeners(listeners, 'close'));
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

    port.off = port.removeListener;

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


export function moveMessagePortToContext(port) {
    if (!(port instanceof MessagePort)) {
        throw new TypeError('The "port" argument must be a MessagePort');
    }

    if (port._isClosed()) {
        throw createClosedMessagePortError();
    }

    const movedPort = createContextPortProxy();
    const counterpart = port._target;
    if (counterpart && typeof counterpart === 'object') {
        counterpart._target = movedPort;
    }
    port._target = null;
    return movedPort;
}

export function receiveMessageOnPort(port) {
    return RuntimeMessagePort.receive(port);
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
    markAsUncloneable,
    markAsUntransferable,
    isMarkedAsUntransferable,
    moveMessagePortToContext,
    receiveMessageOnPort,
    getEnvironmentData,
    setEnvironmentData,
};
