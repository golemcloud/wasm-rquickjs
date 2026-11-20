import { createPrivateWeakMap, NativeWeakRef, nativeWeakRefDeref } from '__wasm_rquickjs_builtin/internal/weak_collections';
import { registerCloneAdapter, markTransferableSignal } from '__wasm_rquickjs_builtin/internal/clone_policy';

// DOMException implementation for AbortError
const DOM_EXCEPTION_CODES = {
    __proto__: null,
    'IndexSizeError': 1,
    'HierarchyRequestError': 3,
    'WrongDocumentError': 4,
    'InvalidCharacterError': 5,
    'NoModificationAllowedError': 7,
    'NotFoundError': 8,
    'NotSupportedError': 9,
    'InvalidStateError': 11,
    'SyntaxError': 12,
    'InvalidModificationError': 13,
    'NamespaceError': 14,
    'InvalidAccessError': 15,
    'TypeMismatchError': 17,
    'SecurityError': 18,
    'NetworkError': 19,
    'AbortError': 20,
    'URLMismatchError': 21,
    'QuotaExceededError': 22,
    'TimeoutError': 23,
    'DataCloneError': 25,
};

const ordinaryCloneAdapter = {__proto__: null, kind: 'DOMException', ordinary: true};
const defineProperty = Object.defineProperty;
const createObject = Object.create;

class DOMException extends Error {
    constructor(message = '', name = 'Error') {
        super(message);
        defineProperty(this, 'name', {__proto__: null, value: name, writable: true, configurable: true});
        defineProperty(this, 'code', {__proto__: null, value: DOM_EXCEPTION_CODES[name] || 0, writable: true, configurable: true});
        registerCloneAdapter(this, ordinaryCloneAdapter);
    }
}

// We need access to the Event _eventTrusted WeakMap to mark events as trusted.
// Import the _eventTrusted symbol from events module.
import { _eventTrusted, Event } from 'node:events';
const NativeEvent = Event;

// Signal state is authoritative and weak; engine 0.14 supports ephemerons.
const signalStates = createPrivateWeakMap();
const NativeSet = Set;
const setAdd = Function.prototype.call.bind(Set.prototype.add);
const setDelete = Function.prototype.call.bind(Set.prototype.delete);
const setForEach = Function.prototype.call.bind(Set.prototype.forEach);
const registerFinalizer = Function.prototype.call.bind(FinalizationRegistry.prototype.register);
const unregisterFinalizer = Function.prototype.call.bind(FinalizationRegistry.prototype.unregister);
const transferCleanup = new FinalizationRegistry(({source, deliver}) => {
    const original = nativeWeakRefDeref(source);
    if (original) setDelete(signalStates.get(original).transferObservers, deliver);
});

function createSignalForwarder(target, clone, enqueue) {
    const weakTarget = new NativeWeakRef(target);
    function deliver(reason) {
        const live = nativeWeakRefDeref(weakTarget);
        try {
            if (!live) return;
            const copy = clone(reason);
            enqueue(() => abortSignal(live, copy));
        } catch (error) {
            // Reuse the process error owner after synchronous source dispatch.
            enqueue(() => globalThis.__wasm_rquickjs_handleUncaughtError(error));
        } finally {
            unregisterFinalizer(transferCleanup, deliver);
            if (live) signalStates.get(live).upstream = undefined;
        }
    }
    return deliver;
}

const signalCloneAdapter = {__proto__: null,
    kind: 'AbortSignal', ordinary: true,
    prepare(source) {
        const target = new AbortSignal(INTERNAL_TOKEN);
        markTransferableSignal(target);
        const state = signalStates.get(source);
        if (!state.aborted) signalStates.get(target).upstream = source;
        return {
            __proto__: null,
            serialized: false,
            target,
            snapshot: () => state,
            initialize(reason) {
                const targetState = signalStates.get(target);
                targetState.aborted = true;
                targetState.reason = reason;
                targetState.upstream = undefined;
            },
            forward: (clone, enqueue) => createSignalForwarder(target, clone, enqueue),
            subscribe(deliver) {
                setAdd(state.transferObservers, deliver);
                try {
                    registerFinalizer(transferCleanup, target, {source: new NativeWeakRef(source), deliver}, deliver);
                } catch (error) {
                    setDelete(state.transferObservers, deliver);
                    throw error;
                }
                return () => {
                    setDelete(state.transferObservers, deliver);
                    unregisterFinalizer(transferCleanup, deliver);
                };
            },
        };
    },
};
const INTERNAL_TOKEN = Symbol('AbortSignal.internal');

// Strong reference set: keeps timeout signals alive as long as they have
// active event listeners. Signals without listeners are released during gc()
// so they can be collected.
const timeoutSignalStrongRefs = new Set();

function getSignalState(signal) {
    const state = signalStates.get(signal);
    if (!state) {
        throw new TypeError('Illegal invocation');
    }
    return state;
}

function setupTimeoutTimer(weakSignal, milliseconds) {
    const timeoutId = setTimeout(() => {
        const s = weakSignal.deref();
        if (s) {
            timeoutSignalStrongRefs.delete(s);
            abortSignal(s, new DOMException('The operation timed out.', 'TimeoutError'));
        }
    }, milliseconds);
    timeoutId.unref();
}

// Called before native GC runs. Releases timeout signals that have no active
// listeners so QuickJS's reference-counting GC can collect them.
function _preGcCleanup() {
    for (const signal of timeoutSignalStrongRefs) {
        const hasListeners = Object.values(signal._listeners).some(arr => arr.length > 0);
        const hasTransfers = signalStates.get(signal).transferObservers.size > 0;
        if (!hasListeners && !hasTransfers) {
            timeoutSignalStrongRefs.delete(signal);
        }
    }
}

// Export for use by the gc wiring
globalThis.__wasm_rquickjs_pre_gc = _preGcCleanup;

// Abort a signal: mark as aborted, set reason, dispatch trusted abort event.
function abortSignal(signal, reason) {
    const state = signalStates.get(signal);
    if (!state || state.aborted) return;
    state.aborted = true;
    state.reason = reason;
    state.upstream = undefined;
    const observers = state.transferObservers;
    state.transferObservers = new NativeSet();
    setForEach(observers, deliver => deliver(reason));
    const event = new NativeEvent('abort');
    _eventTrusted.set(event, true);
    signal.dispatchEvent(event);
}

// AbortSignal implementation
class AbortSignal {
    constructor(token) {
        if (token !== INTERNAL_TOKEN) {
            const err = new TypeError('Illegal constructor');
            err.code = 'ERR_ILLEGAL_CONSTRUCTOR';
            throw err;
        }
        defineProperty(this, '_listeners', {__proto__: null, value: createObject(null), writable: true, configurable: true});
        signalStates.set(this, {
            aborted: false,
            reason: undefined,
            onabort: null,
            transferObservers: new NativeSet(),
            upstream: undefined,
        });
        registerCloneAdapter(this, signalCloneAdapter);
    }

    get aborted() {
        return getSignalState(this).aborted;
    }

    get reason() {
        return getSignalState(this).reason;
    }

    get onabort() {
        return getSignalState(this).onabort;
    }

    set onabort(handler) {
        getSignalState(this).onabort = handler;
    }

    static abort(reason) {
        const signal = new AbortSignal(INTERNAL_TOKEN);
        const state = signalStates.get(signal);
        state.aborted = true;
        state.reason = reason !== undefined
            ? reason
            : new DOMException('This operation was aborted', 'AbortError');
        return signal;
    }

    static timeout(milliseconds) {
        const signal = new AbortSignal(INTERNAL_TOKEN);
        signalStates.get(signal).isTimeout = true;
        // Add to strong refs set so the signal survives QuickJS's ref-counting.
        // The pre-GC hook will release it if it has no active listeners.
        timeoutSignalStrongRefs.add(signal);
        setupTimeoutTimer(new WeakRef(signal), milliseconds);
        return signal;
    }

    static any(signals) {
        if (!Array.isArray(signals)) {
            throw new TypeError('signals must be an iterable');
        }
        const signal = new AbortSignal(INTERNAL_TOKEN);
        const state = signalStates.get(signal);
        for (const s of signals) {
            if (s.aborted) {
                state.aborted = true;
                state.reason = s.reason;
                return signal;
            }
        }
        for (const s of signals) {
            s.addEventListener('abort', function() {
                if (!state.aborted) {
                    abortSignal(signal, s.reason);
                }
            }, { once: true });
        }
        return signal;
    }

    throwIfAborted() {
        const state = getSignalState(this);
        if (state.aborted) {
            throw state.reason;
        }
    }

    addEventListener(type, listener, options) {
        if (!listener) return;

        const opts = typeof options === 'object' ? options : { capture: !!options };

        if (type !== 'abort') return;

        if (!this._listeners[type]) {
            this._listeners[type] = [];
        }
        if (!this._listeners[type].find(l => l.listener === listener)) {
            this._listeners[type].push({
                listener,
                capture: opts.capture || false,
                once: opts.once || false,
            });
        }
    }

    removeEventListener(type, listener, options) {
        if (!listener || !this._listeners[type]) return;

        const capture = typeof options === 'boolean' ? options : !!(options && options.capture);
        const index = this._listeners[type].findIndex(l => l.listener === listener && l.capture === capture);
        if (index !== -1) {
            this._listeners[type].splice(index, 1);
        }
    }

    dispatchEvent(event) {
        event.target = this;

        const state = getSignalState(this);

        if (state.onabort && event.type === 'abort') {
            try {
                state.onabort.call(this, event);
            } catch (e) {
                // Ignore errors in onabort handler
            }
        }

        const entries = this._listeners[event.type];
        if (!entries) return !event.defaultPrevented;

        const listenersToCall = [...entries];

        for (const item of listenersToCall) {
            try {
                item.listener.call(this, event);
            } catch (e) {
                // Ignore errors in event listeners
            }

            if (item.once) {
                const index = entries.indexOf(item);
                if (index !== -1) {
                    entries.splice(index, 1);
                }
            }
        }

        return !event.defaultPrevented;
    }
}

const _controllerSignal = Symbol('AbortController.signal');

function validateController(controller) {
    if (!(controller instanceof AbortController) || !(controller[_controllerSignal])) {
        throw new TypeError('Illegal invocation');
    }
}

// AbortController implementation
class AbortController {
    constructor() {
        this[_controllerSignal] = new AbortSignal(INTERNAL_TOKEN);
    }

    get signal() {
        validateController(this);
        return this[_controllerSignal];
    }

    abort(reason) {
        validateController(this);
        abortSignal(
            this[_controllerSignal],
            reason !== undefined
                ? reason
                : new DOMException('The operation was aborted.', 'AbortError'),
        );
    }
}

const customInspect = Symbol.for('nodejs.util.inspect.custom');

AbortSignal.prototype[customInspect] = function(depth, opts) {
    if (depth < 0) return 'AbortSignal';
    const state = signalStates.get(this);
    if (!state) return 'AbortSignal';
    if (depth === 0) {
        return `[AbortSignal]`;
    }
    return `AbortSignal { aborted: ${state.aborted} }`;
};

AbortController.prototype[customInspect] = function(depth, opts) {
    if (depth !== null && depth < 0) return 'AbortController';
    const signal = this.signal;
    if (!signal) return 'AbortController';
    const nextDepth = depth === null ? null : depth - 1;
    const signalStr = (nextDepth !== null && nextDepth < 0) ? '[AbortSignal]' : signal[customInspect](nextDepth, opts);
    return `AbortController { signal: ${signalStr} }`;
};

Object.defineProperty(AbortController.prototype, Symbol.toStringTag, {
    value: 'AbortController',
    configurable: true,
});

Object.defineProperty(AbortSignal.prototype, Symbol.toStringTag, {
    value: 'AbortSignal',
    configurable: true,
});

export { AbortController, AbortSignal, DOMException };
