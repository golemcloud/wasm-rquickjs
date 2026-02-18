// node:worker_threads stub implementation
// Multi-threading is not possible in WASM environment

const NOT_SUPPORTED_ERROR = 'worker_threads is not supported in WebAssembly environment';

export const isMainThread = true;
export const parentPort = null;
export const workerData = null;
export const threadId = 0;
export const resourceLimits = {};

export class Worker {
    constructor() {
        throw new Error(NOT_SUPPORTED_ERROR);
    }
}

export class BroadcastChannel {
    constructor() {
        throw new Error(NOT_SUPPORTED_ERROR);
    }
}

export class MessagePort {
    #onmessage = null
    #closed = false

    get onmessage() {
        return this.#onmessage
    }
    set onmessage(fn) {
        this.#onmessage = fn
    }

    _deliver(data) {
        if (this.#closed) return
        if (typeof this.#onmessage === 'function') {
            this.#onmessage({ data })
        }
    }

    postMessage(value) {
        if (this.#closed) return
        const target = this._target
        if (target) {
            Promise.resolve().then(() => target._deliver(value))
        }
    }
    close() {
        this.#closed = true
    }
    ref() {}
    unref() {}
    start() {}
    on(event, fn) {
        if (event === 'message') this.#onmessage = fn
    }
    once(event, fn) {
        if (event === 'message') {
            this.#onmessage = (e) => { this.#onmessage = null; fn(e) }
        }
    }
    removeListener() {}
}

export class MessageChannel {
    constructor() {
        this.port1 = new MessagePort();
        this.port2 = new MessagePort();
        this.port1._target = this.port2;
        this.port2._target = this.port1;
    }
}

export function markAsUntransferable() {
    throw new Error(NOT_SUPPORTED_ERROR);
}

export function moveMessagePortToContext() {
    throw new Error(NOT_SUPPORTED_ERROR);
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
