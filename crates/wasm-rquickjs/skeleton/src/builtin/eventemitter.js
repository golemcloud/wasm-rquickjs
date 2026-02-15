// From https://github.com/primus/eventemitter3/

'use strict';

var has = Object.prototype.hasOwnProperty
    , prefix = '~';

/**
 * Constructor to create a storage for our `EE` objects.
 * An `Events` instance is a plain object whose properties are event names.
 *
 * @constructor
 * @private
 */
function Events() {}

//
// We try to not inherit from `Object.prototype`. In some engines creating an
// instance in this way is faster than calling `Object.create(null)` directly.
// If `Object.create(null)` is not supported we prefix the event names with a
// character to make sure that the built-in object properties are not
// overridden or used as an attack vector.
//
if (Object.create) {
    Events.prototype = Object.create(null);

    //
    // This hack is needed because the `__proto__` property is still inherited in
    // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
    //
    if (!new Events().__proto__) prefix = false;
}

/**
 * Representation of a single event listener.
 *
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
 * @constructor
 * @private
 */
function EE(fn, context, once) {
    this.fn = fn;
    this.context = context;
    this.once = once || false;
}

/**
 * Add a listener for a given event.
 *
 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} once Specify if the listener is a one-time listener.
 * @returns {EventEmitter}
 * @private
 */
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

/**
 * Clear event by name.
 *
 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
 * @param {(String|Symbol)} evt The Event name.
 * @private
 */
function clearEvent(emitter, evt) {
    if (--emitter._eventsCount === 0) emitter._events = new Events();
    else delete emitter._events[evt];
}

/**
 * Minimal `EventEmitter` interface that is molded against the Node.js
 * `EventEmitter` interface.
 *
 * @constructor
 * @public
 */
function EventEmitter() {
    this._events = new Events();
    this._eventsCount = 0;
}

/**
 * Return an array listing the events for which the emitter has registered
 * listeners.
 *
 * @returns {Array}
 * @public
 */
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

/**
 * Return the listeners registered for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Array} The registered listeners.
 * @public
 */
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

/**
 * Return the number of listeners listening to a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Number} The number of listeners.
 * @public
 */
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

/**
 * Calls each of the listeners registered for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Boolean} `true` if the event had listeners, else `false`.
 * @public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
    var evt = prefix ? prefix + event : event;

    if (!this._events[evt]) return false;

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

/**
 * Add a listener for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
    return addListener(this, event, fn, context, false);
};

/**
 * Add a one-time listener for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
    return addListener(this, event, fn, context, true);
};

/**
 * Remove the listeners of a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn Only remove the listeners that match this function.
 * @param {*} context Only remove the listeners that have this context.
 * @param {Boolean} once Only remove one-time listeners.
 * @returns {EventEmitter} `this`.
 * @public
 */
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

        //
        // Reset the array, or remove it completely if we have no more listeners.
        //
        if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
        else clearEvent(this, evt);
    }

    return this;
};

/**
 * Remove all listeners, or those of the specified event.
 *
 * @param {(String|Symbol)} [event] The event name.
 * @returns {EventEmitter} `this`.
 * @public
 */
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

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// Expose the prefix.
//
EventEmitter.prefixed = prefix;

//
// Additional instance methods for Node.js compatibility
//

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

//
// Static utility methods for Node.js compatibility
//

EventEmitter.defaultMaxListeners = 10;
EventEmitter.errorMonitor = Symbol('events.errorMonitor');
EventEmitter.captureRejections = false;

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

//
// Allow `EventEmitter` to be imported as module namespace.
//
EventEmitter.EventEmitter = EventEmitter;

//
// Expose the module.
//
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