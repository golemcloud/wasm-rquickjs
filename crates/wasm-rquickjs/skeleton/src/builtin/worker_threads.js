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
    postMessage() {
        throw new Error(NOT_SUPPORTED_ERROR);
    }
    close() {
        throw new Error(NOT_SUPPORTED_ERROR);
    }
    ref() {
        throw new Error(NOT_SUPPORTED_ERROR);
    }
    unref() {
        throw new Error(NOT_SUPPORTED_ERROR);
    }
    start() {
        throw new Error(NOT_SUPPORTED_ERROR);
    }
    on() {
        throw new Error(NOT_SUPPORTED_ERROR);
    }
    once() {
        throw new Error(NOT_SUPPORTED_ERROR);
    }
    removeListener() {
        throw new Error(NOT_SUPPORTED_ERROR);
    }
}

export class MessageChannel {
    constructor() {
        this.port1 = new MessagePort();
        this.port2 = new MessagePort();
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
