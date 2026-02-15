// Web platform Event, EventTarget, and CustomEvent implementations

class Event {
    constructor(type, eventInitDict = {}) {
        this.type = String(type);
        this.bubbles = !!eventInitDict.bubbles;
        this.cancelable = !!eventInitDict.cancelable;
        this.composed = !!eventInitDict.composed;
        this.defaultPrevented = false;
        this.target = null;
        this.currentTarget = null;
        this.eventPhase = 0; // Event.NONE
        this.timeStamp = Date.now();
        this.isTrusted = false;
        this._stopPropagation = false;
        this._stopImmediatePropagation = false;
    }

    composedPath() {
        return this.target ? [this.target] : [];
    }

    preventDefault() {
        if (this.cancelable) {
            this.defaultPrevented = true;
        }
    }

    stopPropagation() {
        this._stopPropagation = true;
    }

    stopImmediatePropagation() {
        this._stopImmediatePropagation = true;
        this._stopPropagation = true;
    }

}

Object.defineProperties(Event, {
    NONE: { value: 0, writable: false, configurable: false, enumerable: true },
    CAPTURING_PHASE: { value: 1, writable: false, configurable: false, enumerable: true },
    AT_TARGET: { value: 2, writable: false, configurable: false, enumerable: true },
    BUBBLING_PHASE: { value: 3, writable: false, configurable: false, enumerable: true },
});

Object.defineProperties(Event.prototype, {
    NONE: { value: 0 },
    CAPTURING_PHASE: { value: 1 },
    AT_TARGET: { value: 2 },
    BUBBLING_PHASE: { value: 3 },
});

class EventTarget {
    constructor() {
        this._listeners = Object.create(null);
    }

    addEventListener(type, listener, options) {
        if (listener == null) return;

        const capture = typeof options === 'boolean' ? options : !!(options && options.capture);
        const once = !!(options && typeof options === 'object' && options.once);
        const passive = !!(options && typeof options === 'object' && options.passive);
        const signal = options && typeof options === 'object' ? options.signal : undefined;

        if (signal && signal.aborted) return;

        if (!this._listeners[type]) {
            this._listeners[type] = [];
        }

        // No duplicates (same listener + same capture)
        for (const entry of this._listeners[type]) {
            if (entry.listener === listener && entry.capture === capture) return;
        }

        const entry = { listener, capture, once, passive };
        this._listeners[type].push(entry);

        if (signal) {
            signal.addEventListener('abort', () => {
                this.removeEventListener(type, listener, { capture });
            }, { once: true });
        }
    }

    removeEventListener(type, listener, options) {
        if (!this._listeners[type]) return;

        const capture = typeof options === 'boolean' ? options : !!(options && options.capture);
        this._listeners[type] = this._listeners[type].filter(
            e => e.listener !== listener || e.capture !== capture
        );
    }

    dispatchEvent(event) {
        if (!(event instanceof Event)) {
            throw new TypeError("Failed to execute 'dispatchEvent': parameter 1 is not of type 'Event'.");
        }

        event.target = this;
        event.currentTarget = this;

        const list = this._listeners[event.type];
        if (list) {
            const handlers = list.slice();
            for (const entry of handlers) {
                if (event._stopImmediatePropagation) break;
                try {
                    if (typeof entry.listener === 'function') {
                        entry.listener.call(this, event);
                    } else if (entry.listener && typeof entry.listener.handleEvent === 'function') {
                        entry.listener.handleEvent(event);
                    }
                } catch (e) {
                    // Swallow errors in event listeners
                }
                if (entry.once) {
                    this.removeEventListener(event.type, entry.listener, { capture: entry.capture });
                }
            }
        }

        return !event.defaultPrevented;
    }
}

class CustomEvent extends Event {
    constructor(type, eventInitDict = {}) {
        super(type, eventInitDict);
        this.detail = eventInitDict.detail !== undefined ? eventInitDict.detail : null;
    }
}

export { Event, EventTarget, CustomEvent };
