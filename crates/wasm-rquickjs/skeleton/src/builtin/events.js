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

// From https://github.com/primus/eventemitter3/

'use strict';

var has = Object.prototype.hasOwnProperty
    , prefix = '~';

function Events() {}

if (Object.create) {
    Events.prototype = Object.create(null);
    if (!new Events().__proto__) prefix = false;
}

function EE(fn, context, once) {
    this.fn = fn;
    this.context = context;
    this.once = once || false;
}

function addListener(emitter, event, fn, context, once) {
    if (typeof fn !== 'function') {
        throw new TypeError('The listener must be a function');
    }

    var listener = new EE(fn, context || emitter, once)
        , evt = prefix ? prefix + event : event;

    if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
    else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
    else emitter._events[evt] = [emitter._events[evt], listener];

    return emitter;
}

function clearEvent(emitter, evt) {
    if (--emitter._eventsCount === 0) emitter._events = new Events();
    else delete emitter._events[evt];
}

function EventEmitter() {
    this._events = new Events();
    this._eventsCount = 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
    var names = []
        , events
        , name;

    if (this._eventsCount === 0) return names;

    for (name in (events = this._events)) {
        if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
    }

    if (Object.getOwnPropertySymbols) {
        return names.concat(Object.getOwnPropertySymbols(events));
    }

    return names;
};

EventEmitter.prototype.listeners = function listeners(event) {
    var evt = prefix ? prefix + event : event
        , handlers = this._events[evt];

    if (!handlers) return [];
    if (handlers.fn) return [handlers.fn];

    for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
        ee[i] = handlers[i].fn;
    }

    return ee;
};

EventEmitter.prototype.listenerCount = function listenerCount(event, listener) {
    var evt = prefix ? prefix + event : event
        , listeners = this._events[evt];

    if (!listeners) return 0;
    if (listener === undefined) {
        if (listeners.fn) return 1;
        return listeners.length;
    }
    if (listeners.fn) return listeners.fn === listener ? 1 : 0;
    var count = 0;
    for (var i = 0; i < listeners.length; i++) {
        if (listeners[i].fn === listener) count++;
    }
    return count;
};

EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
    var evt = prefix ? prefix + event : event;

    // Emit on errorMonitor for 'error' events regardless of listeners
    if (event === 'error') {
        var monitorEvt = prefix ? prefix + EventEmitter.errorMonitor : EventEmitter.errorMonitor;
        if (this._events[monitorEvt]) {
            var monitorListeners = this._events[monitorEvt];
            if (monitorListeners.fn) {
                monitorListeners.fn.call(monitorListeners.context, a1);
            } else {
                for (var mi = 0; mi < monitorListeners.length; mi++) {
                    monitorListeners[mi].fn.call(monitorListeners[mi].context, a1);
                }
            }
        }
    }

    if (!this._events[evt]) {
        // Node.js behavior: emit('error') with no listener throws
        if (event === 'error') {
            var er = a1;
            if (er instanceof Error) {
                throw er;
            }
            var err = new Error('Unhandled error.' + (er ? ' (' + er + ')' : ''));
            err.context = er;
            throw err;
        }
        return false;
    }

    var listeners = this._events[evt]
        , len = arguments.length
        , args
        , i;

    if (listeners.fn) {
        if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

        switch (len) {
            case 1: return listeners.fn.call(listeners.context), true;
            case 2: return listeners.fn.call(listeners.context, a1), true;
            case 3: return listeners.fn.call(listeners.context, a1, a2), true;
            case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
            case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
            case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
        }

        for (i = 1, args = new Array(len -1); i < len; i++) {
            args[i - 1] = arguments[i];
        }

        listeners.fn.apply(listeners.context, args);
    } else {
        var length = listeners.length
            , j;

        for (i = 0; i < length; i++) {
            if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

            switch (len) {
                case 1: listeners[i].fn.call(listeners[i].context); break;
                case 2: listeners[i].fn.call(listeners[i].context, a1); break;
                case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
                case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
                default:
                    if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
                        args[j - 1] = arguments[j];
                    }

                    listeners[i].fn.apply(listeners[i].context, args);
            }
        }
    }

    return true;
};

EventEmitter.prototype.on = function on(event, fn, context) {
    return addListener(this, event, fn, context, false);
};

EventEmitter.prototype.once = function once(event, fn, context) {
    return addListener(this, event, fn, context, true);
};

EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
    var evt = prefix ? prefix + event : event;

    if (!this._events[evt]) return this;
    if (!fn) {
        clearEvent(this, evt);
        return this;
    }

    var listeners = this._events[evt];

    if (listeners.fn) {
        if (
            listeners.fn === fn &&
            (!once || listeners.once) &&
            (!context || listeners.context === context)
        ) {
            clearEvent(this, evt);
        }
    } else {
        for (var i = 0, events = [], length = listeners.length; i < length; i++) {
            if (
                listeners[i].fn !== fn ||
                (once && !listeners[i].once) ||
                (context && listeners[i].context !== context)
            ) {
                events.push(listeners[i]);
            }
        }

        if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
        else clearEvent(this, evt);
    }

    return this;
};

EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
    var evt;

    if (event) {
        evt = prefix ? prefix + event : event;
        if (this._events[evt]) clearEvent(this, evt);
    } else {
        this._events = new Events();
        this._eventsCount = 0;
    }

    return this;
};

EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

EventEmitter.prefixed = prefix;

EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
    this._maxListeners = n;
    return this;
};
EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
    return this._maxListeners !== undefined ? this._maxListeners : EventEmitter.defaultMaxListeners;
};

EventEmitter.prototype.prependListener = function prependListener(event, fn) {
    if (typeof fn !== 'function') {
        throw new TypeError('The listener must be a function');
    }

    var listener = new EE(fn, this, false)
        , evt = prefix ? prefix + event : event;

    if (!this._events[evt]) {
        this._events[evt] = listener;
        this._eventsCount++;
    } else if (!this._events[evt].fn) {
        this._events[evt].unshift(listener);
    } else {
        this._events[evt] = [listener, this._events[evt]];
    }

    return this;
};

EventEmitter.prototype.prependOnceListener = function prependOnceListener(event, fn) {
    if (typeof fn !== 'function') {
        throw new TypeError('The listener must be a function');
    }

    var listener = new EE(fn, this, true)
        , evt = prefix ? prefix + event : event;

    if (!this._events[evt]) {
        this._events[evt] = listener;
        this._eventsCount++;
    } else if (!this._events[evt].fn) {
        this._events[evt].unshift(listener);
    } else {
        this._events[evt] = [listener, this._events[evt]];
    }

    return this;
};

EventEmitter.prototype.rawListeners = function rawListeners(event) {
    var evt = prefix ? prefix + event : event
        , handlers = this._events[evt];

    if (!handlers) return [];
    if (handlers.fn) return [handlers];

    for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
        ee[i] = handlers[i];
    }

    return ee;
};

EventEmitter.defaultMaxListeners = 10;
EventEmitter.errorMonitor = Symbol('events.errorMonitor');
EventEmitter.captureRejections = false;

// Legacy static listenerCount (used by legacy stream pipe onerror handler)
EventEmitter.listenerCount = function(emitter, eventName) {
    if (emitter == null || typeof emitter.listenerCount !== 'function') return 0;
    return emitter.listenerCount(eventName);
};

EventEmitter.captureRejectionSymbol = Symbol('events.captureRejection');

EventEmitter.once = function(emitter, name, options) {
    return new Promise(function(resolve, reject) {
        var signal = options && options.signal;
        if (signal && signal.aborted) {
            reject(signal.reason);
            return;
        }

        var onAbort;

        function eventHandler() {
            if (errorHandler) emitter.removeListener('error', errorHandler);
            if (onAbort) signal.removeEventListener('abort', onAbort);
            resolve(Array.prototype.slice.call(arguments));
        }

        var errorHandler;
        if (name !== 'error') {
            errorHandler = function(err) {
                emitter.removeListener(name, eventHandler);
                if (onAbort) signal.removeEventListener('abort', onAbort);
                reject(err);
            };
            emitter.once('error', errorHandler);
        }

        emitter.once(name, eventHandler);

        if (signal) {
            onAbort = function() {
                emitter.removeListener(name, eventHandler);
                if (errorHandler) emitter.removeListener('error', errorHandler);
                reject(signal.reason);
            };
            signal.addEventListener('abort', onAbort, { once: true });
        }
    });
};

EventEmitter.on = function(emitter, event, options) {
    var signal = options && options.signal;
    var unconsumedEvents = [];
    var unconsumedPromises = [];
    var done = false;
    var error = null;

    function eventHandler() {
        var args = Array.prototype.slice.call(arguments);
        if (unconsumedPromises.length > 0) {
            unconsumedPromises.shift().resolve(args);
        } else {
            unconsumedEvents.push(args);
        }
    }

    function errorHandler(err) {
        error = err;
        if (unconsumedPromises.length > 0) {
            unconsumedPromises.shift().reject(err);
        }
    }

    function abortHandler() {
        errorHandler(signal.reason);
        cleanup();
    }

    function cleanup() {
        done = true;
        emitter.removeListener(event, eventHandler);
        emitter.removeListener('error', errorHandler);
        if (signal) signal.removeEventListener('abort', abortHandler);
        for (var i = 0; i < unconsumedPromises.length; i++) {
            unconsumedPromises[i].resolve({ value: undefined, done: true });
        }
        unconsumedPromises = [];
    }

    emitter.on(event, eventHandler);
    if (event !== 'error') emitter.on('error', errorHandler);
    if (signal) {
        if (signal.aborted) { abortHandler(); }
        else signal.addEventListener('abort', abortHandler, { once: true });
    }

    var iterator = {
        next: function() {
            if (unconsumedEvents.length > 0) {
                return Promise.resolve({ value: unconsumedEvents.shift(), done: false });
            }
            if (done) return Promise.resolve({ value: undefined, done: true });
            if (error) {
                var err = error;
                error = null;
                return Promise.reject(err);
            }
            return new Promise(function(resolve, reject) {
                unconsumedPromises.push({
                    resolve: function(v) { resolve({ value: v, done: false }); },
                    reject: reject
                });
            });
        },
        return: function() {
            cleanup();
            return Promise.resolve({ value: undefined, done: true });
        },
        throw: function(err) {
            cleanup();
            return Promise.reject(err);
        }
    };
    iterator[Symbol.asyncIterator] = function() { return iterator; };
    return iterator;
};

EventEmitter.getEventListeners = function(emitterOrTarget, eventName) {
    if (typeof emitterOrTarget.listeners === 'function') {
        return emitterOrTarget.listeners(eventName);
    }
    return [];
};

EventEmitter.getMaxListeners = function(emitterOrTarget) {
    if (typeof emitterOrTarget.getMaxListeners === 'function') {
        return emitterOrTarget.getMaxListeners();
    }
    if (emitterOrTarget._maxListeners !== undefined) {
        return emitterOrTarget._maxListeners;
    }
    return EventEmitter.defaultMaxListeners;
};

EventEmitter.setMaxListeners = function(n, ...targets) {
    if (targets.length === 0) {
        EventEmitter.defaultMaxListeners = n;
    } else {
        for (var target of targets) {
            if (typeof target.setMaxListeners === 'function') {
                target.setMaxListeners(n);
            } else {
                target._maxListeners = n;
            }
        }
    }
};

EventEmitter.addAbortListener = function(signal, listener) {
    signal.addEventListener('abort', listener, { once: true });
    return {
        [Symbol.dispose]: function() {
            signal.removeEventListener('abort', listener);
        }
    };
};

EventEmitter.EventEmitter = EventEmitter;

var once = EventEmitter.once;
var on = EventEmitter.on;
var getEventListeners = EventEmitter.getEventListeners;
var getMaxListeners = EventEmitter.getMaxListeners;
var setMaxListeners = EventEmitter.setMaxListeners;
var addAbortListener = EventEmitter.addAbortListener;
var defaultMaxListeners = EventEmitter.defaultMaxListeners;
var errorMonitor = EventEmitter.errorMonitor;
var captureRejections = EventEmitter.captureRejections;

export {
    EventEmitter,
    Event,
    EventTarget,
    CustomEvent,
    once,
    on,
    getEventListeners,
    getMaxListeners,
    setMaxListeners,
    addAbortListener,
    defaultMaxListeners,
    errorMonitor,
    captureRejections
};

export default EventEmitter;
