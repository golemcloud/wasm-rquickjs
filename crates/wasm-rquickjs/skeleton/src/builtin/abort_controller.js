// DOMException implementation for AbortError
class DOMException extends Error {
    constructor(message = '', name = 'Error') {
        super(message);
        this.name = name;
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
    }

    static abort(reason) {
        const signal = new AbortSignal();
        signal.aborted = true;
        signal.reason = reason;
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
