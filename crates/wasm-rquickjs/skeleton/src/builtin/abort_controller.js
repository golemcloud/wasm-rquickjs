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

// Event class for abort events
class AbortEvent {
    constructor(type) {
        this.type = type;
        this.target = null;
        this.defaultPrevented = false;
    }

    preventDefault() {
        this.defaultPrevented = true;
    }
}

// AbortSignal implementation
class AbortSignal {
    constructor() {
        this.aborted = false;
        this.reason = undefined;
        this._listeners = [];
        this._onabort = null;
    }

    static abort(reason) {
        const signal = new AbortSignal();
        signal.aborted = true;
        if (reason !== undefined) {
            signal.reason = reason;
        } else {
            signal.reason = new DOMException('This operation was aborted', 'AbortError');
        }
        return signal;
    }

    static timeout(milliseconds) {
        const signal = new AbortSignal();
        setTimeout(() => {
            if (!signal.aborted) {
                signal.aborted = true;
                signal.reason = new DOMException('AbortError', 'AbortError');
                signal.dispatchEvent(new AbortEvent('abort'));
            }
        }, milliseconds);
        return signal;
    }

    static any(signals) {
        if (!Array.isArray(signals)) {
            throw new TypeError('signals must be an iterable');
        }
        const signal = new AbortSignal();
        // If any signal is already aborted, return an already-aborted signal
        for (const s of signals) {
            if (s.aborted) {
                signal.aborted = true;
                signal.reason = s.reason;
                return signal;
            }
        }
        // Listen for abort on all signals
        for (const s of signals) {
            s.addEventListener('abort', function() {
                if (!signal.aborted) {
                    signal.aborted = true;
                    signal.reason = s.reason;
                    signal.dispatchEvent(new AbortEvent('abort'));
                }
            }, { once: true });
        }
        return signal;
    }

    get onabort() {
        return this._onabort;
    }

    set onabort(handler) {
        this._onabort = handler;
    }

    throwIfAborted() {
        if (this.aborted) {
            throw this.reason;
        }
    }

    addEventListener(type, listener, options) {
        if (!listener) return;
        
        const opts = typeof options === 'object' ? options : { capture: !!options };
        
        // Only handle abort events
        if (type !== 'abort') return;
        
        // Avoid duplicates
        if (!this._listeners.find(l => l.listener === listener)) {
            this._listeners.push({
                listener,
                once: opts.once || false
            });
        }
    }

    removeEventListener(type, listener, options) {
        if (!listener || type !== 'abort') return;
        
        const index = this._listeners.findIndex(l => l.listener === listener);
        if (index !== -1) {
            this._listeners.splice(index, 1);
        }
    }

    dispatchEvent(event) {
        event.target = this;
        
        // Call onabort handler if set
        if (this._onabort && event.type === 'abort') {
            try {
                this._onabort.call(this, event);
            } catch (e) {
                // Ignore errors in onabort handler
            }
        }
        
        const listenersToCall = [...this._listeners];
        
        for (const item of listenersToCall) {
            try {
                item.listener.call(this, event);
            } catch (e) {
                // Ignore errors in event listeners
            }
            
            if (item.once) {
                const index = this._listeners.indexOf(item);
                if (index !== -1) {
                    this._listeners.splice(index, 1);
                }
            }
        }
        
        return !event.defaultPrevented;
    }
}

// AbortController implementation
class AbortController {
    constructor() {
        this.signal = new AbortSignal();
    }

    abort(reason) {
        if (this.signal.aborted) {
            return;
        }
        this.signal.aborted = true;
        if (reason !== undefined) {
            this.signal.reason = reason;
        } else {
            this.signal.reason = new DOMException('The operation was aborted.', 'AbortError');
        }
        this.signal.dispatchEvent(new AbortEvent('abort'));
    }
}

export { AbortController, AbortSignal, DOMException };
