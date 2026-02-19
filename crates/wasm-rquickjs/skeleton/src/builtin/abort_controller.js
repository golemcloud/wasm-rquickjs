// DOMException implementation for AbortError
const DOM_EXCEPTION_CODES = {
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

class DOMException extends Error {
    constructor(message = '', name = 'Error') {
        super(message);
        this.name = name;
        this.code = DOM_EXCEPTION_CODES[name] || 0;
    }
}

// We need access to the Event _eventTrusted WeakMap to mark events as trusted.
// Import the _eventTrusted symbol from events module.
import { _eventTrusted } from 'node:events';

const signalState = new WeakMap();
const INTERNAL_TOKEN = Symbol('AbortSignal.internal');

const _timeoutFinalizer = typeof FinalizationRegistry !== 'undefined'
    ? new FinalizationRegistry((timeoutId) => clearTimeout(timeoutId))
    : null;

// Signals with active abort listeners are kept alive (strong ref) to prevent GC.
// When all listeners are removed, the signal is released and can be collected.
const _gcPersistentSignals = new Set();

function getSignalState(signal) {
    const state = signalState.get(signal);
    if (!state) {
        throw new TypeError('Illegal invocation');
    }
    return state;
}

function createAbortSignal() {
    return new AbortSignal(INTERNAL_TOKEN);
}

// AbortSignal implementation
class AbortSignal {
    constructor(token) {
        if (token !== INTERNAL_TOKEN) {
            const err = new TypeError('Illegal constructor');
            err.code = 'ERR_ILLEGAL_CONSTRUCTOR';
            throw err;
        }
        signalState.set(this, {
            aborted: false,
            reason: undefined,
            listeners: [],
            onabort: null,
        });
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
        const state = getSignalState(this);
        state.onabort = handler;
        if (handler != null) {
            _gcPersistentSignals.add(this);
        } else if (state.listeners.length === 0) {
            _gcPersistentSignals.delete(this);
        }
    }

    static abort(reason) {
        const signal = createAbortSignal();
        const state = signalState.get(signal);
        state.aborted = true;
        if (reason !== undefined) {
            state.reason = reason;
        } else {
            state.reason = new DOMException('This operation was aborted', 'AbortError');
        }
        return signal;
    }

    static timeout(milliseconds) {
        console.error(`[DEBUG] AbortSignal.timeout(${milliseconds}) called`);
        const signal = createAbortSignal();

        // Pin signal temporarily to prevent QuickJS from collecting it before
        // the caller has a chance to attach listeners (QuickJS doesn't guarantee
        // WeakRef referents survive within the same synchronous turn like V8).
        _gcPersistentSignals.add(signal);

        const ref = new WeakRef(signal);
        const timeoutId = setTimeout(() => {
            console.error(`[DEBUG] timeout(${milliseconds}) timer fired`);
            const s = ref.deref();
            if (!s) { console.error(`[DEBUG] timeout(${milliseconds}) signal was GC'd`); return; }
            const st = signalState.get(s);
            if (!st || st.aborted) return;
            st.aborted = true;
            st.reason = new DOMException('The operation timed out.', 'TimeoutError');
            const event = new Event('abort');
            _eventTrusted.set(event, true);
            s.dispatchEvent(event);
        }, milliseconds);
        if (timeoutId && typeof timeoutId.unref === 'function') {
            timeoutId.unref();
        }
        if (_timeoutFinalizer) {
            _timeoutFinalizer.register(signal, timeoutId);
        }

        // After the current synchronous turn, unpin if no listeners were attached.
        // Use the WeakRef to avoid the microtask closure itself preventing GC.
        queueMicrotask(() => {
            const s = ref.deref();
            if (s) {
                const st = signalState.get(s);
                if (st && st.listeners.length === 0 && st.onabort === null) {
                    _gcPersistentSignals.delete(s);
                }
            }
        });

        return signal;
    }

    static any(signals) {
        if (!Array.isArray(signals)) {
            throw new TypeError('signals must be an iterable');
        }
        const signal = createAbortSignal();
        const state = signalState.get(signal);
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
                    state.aborted = true;
                    state.reason = s.reason;
                    signal.dispatchEvent(new Event('abort'));
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

        const state = getSignalState(this);
        if (!state.listeners.find(l => l.listener === listener)) {
            state.listeners.push({
                listener,
                once: opts.once || false
            });
            _gcPersistentSignals.add(this);
        }
    }

    removeEventListener(type, listener, options) {
        if (!listener || type !== 'abort') return;

        const state = getSignalState(this);
        const index = state.listeners.findIndex(l => l.listener === listener);
        if (index !== -1) {
            state.listeners.splice(index, 1);
            if (state.listeners.length === 0 && state.onabort === null) {
                _gcPersistentSignals.delete(this);
            }
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

        const listenersToCall = [...state.listeners];

        for (const item of listenersToCall) {
            try {
                item.listener.call(this, event);
            } catch (e) {
                // Ignore errors in event listeners
            }

            if (item.once) {
                const index = state.listeners.indexOf(item);
                if (index !== -1) {
                    state.listeners.splice(index, 1);
                }
            }
        }

        if (state.listeners.length === 0 && state.onabort === null) {
            _gcPersistentSignals.delete(this);
        }

        return !event.defaultPrevented;
    }
}

const controllerState = new WeakMap();

function getControllerState(controller) {
    const state = controllerState.get(controller);
    if (!state) {
        throw new TypeError('Illegal invocation');
    }
    return state;
}

// AbortController implementation
class AbortController {
    constructor() {
        controllerState.set(this, {
            signal: createAbortSignal(),
        });
    }

    get signal() {
        return getControllerState(this).signal;
    }

    abort(reason) {
        const signal = this.signal;
        const state = signalState.get(signal);
        if (state.aborted) {
            return;
        }
        state.aborted = true;
        if (reason !== undefined) {
            state.reason = reason;
        } else {
            state.reason = new DOMException('The operation was aborted.', 'AbortError');
        }
        const event = new Event('abort');
        _eventTrusted.set(event, true);
        signal.dispatchEvent(event);
    }
}

const customInspect = Symbol.for('nodejs.util.inspect.custom');

AbortSignal.prototype[customInspect] = function(depth, opts) {
    if (depth < 0) return 'AbortSignal';
    const state = signalState.get(this);
    if (!state) return 'AbortSignal';
    if (depth === 0) {
        return `[AbortSignal]`;
    }
    return `AbortSignal { aborted: ${state.aborted} }`;
};

AbortController.prototype[customInspect] = function(depth, opts) {
    if (depth !== null && depth < 0) return 'AbortController';
    const signal = controllerState.get(this)?.signal;
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
