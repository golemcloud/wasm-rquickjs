// Node.js diagnostics_channel implementation

const channels = new Map();

class Channel {
    constructor(name) {
        this._name = name;
        this._subscribers = [];
        this._stores = new Map();
    }

    get name() {
        return this._name;
    }

    get hasSubscribers() {
        return this._subscribers.length > 0 || this._stores.size > 0;
    }

    subscribe(onMessage) {
        if (typeof onMessage !== 'function') {
            const err = new TypeError('The "onMessage" argument must be of type function. Received ' + (onMessage === null ? 'null' : typeof onMessage) + ' [ERR_INVALID_ARG_TYPE]');
            err.code = 'ERR_INVALID_ARG_TYPE';
            throw err;
        }
        this._subscribers.push(onMessage);
    }

    unsubscribe(onMessage) {
        const index = this._subscribers.indexOf(onMessage);
        if (index === -1) {
            return false;
        }
        this._subscribers.splice(index, 1);
        return true;
    }

    publish(message) {
        const subs = this._subscribers.slice();
        for (let i = 0; i < subs.length; i++) {
            try {
                subs[i](message, this._name);
            } catch (e) {
                queueMicrotask(() => { throw e; });
            }
        }
    }

    bindStore(store, transform) {
        this._stores.set(store, transform);
    }

    unbindStore(store) {
        return this._stores.delete(store);
    }

    runStores(context, fn, thisArg, ...args) {
        let run = () => {
            this.publish(context);
            return fn.apply(thisArg, args);
        };
        for (const [store, transform] of this._stores) {
            const next = run;
            run = () => {
                let value;
                try {
                    value = typeof transform === 'function' ? transform(context) : context;
                } catch (e) {
                    queueMicrotask(() => { throw e; });
                    return next();
                }
                return store.run(value, next);
            };
        }
        return run();
    }
}

function channel(name) {
    if (typeof name !== 'string' && typeof name !== 'symbol') {
        const err = new TypeError('The "name" argument must be of type string or an instance of Symbol. Received ' + (name === null ? 'null' : typeof name) + ' [ERR_INVALID_ARG_TYPE]');
        err.code = 'ERR_INVALID_ARG_TYPE';
        throw err;
    }
    let ch = channels.get(name);
    if (ch === undefined) {
        ch = new Channel(name);
        channels.set(name, ch);
    }
    return ch;
}

function subscribe(name, onMessage) {
    return channel(name).subscribe(onMessage);
}

function unsubscribe(name, onMessage) {
    return channel(name).unsubscribe(onMessage);
}

function hasSubscribers(name) {
    return channel(name).hasSubscribers;
}

const TRACE_EVENTS = ['start', 'end', 'asyncStart', 'asyncEnd', 'error'];

class TracingChannel {
    constructor(nameOrChannels) {
        if (typeof nameOrChannels === 'string' || typeof nameOrChannels === 'symbol') {
            const name = nameOrChannels;
            this.start = channel(`tracing:${String(name)}:start`);
            this.end = channel(`tracing:${String(name)}:end`);
            this.asyncStart = channel(`tracing:${String(name)}:asyncStart`);
            this.asyncEnd = channel(`tracing:${String(name)}:asyncEnd`);
            this.error = channel(`tracing:${String(name)}:error`);
        } else if (nameOrChannels && typeof nameOrChannels === 'object') {
            for (const event of TRACE_EVENTS) {
                if (!(nameOrChannels[event] instanceof Channel)) {
                    const err = new TypeError(`The "nameOrChannels.${event}" property must be an instance of Channel. Received ${nameOrChannels[event] === undefined ? 'undefined' : typeof nameOrChannels[event]} [ERR_INVALID_ARG_TYPE]`);
                    err.code = 'ERR_INVALID_ARG_TYPE';
                    throw err;
                }
                this[event] = nameOrChannels[event];
            }
        } else {
            const err = new TypeError('The "nameOrChannels" argument must be of type string or an instance of TracingChannel or Object. Received ' + (nameOrChannels === null ? 'null' : typeof nameOrChannels) + ' [ERR_INVALID_ARG_TYPE]');
            err.code = 'ERR_INVALID_ARG_TYPE';
            throw err;
        }
    }

    subscribe(subscribers) {
        for (const event of TRACE_EVENTS) {
            if (typeof subscribers[event] === 'function') {
                this[event].subscribe(subscribers[event]);
            }
        }
    }

    get hasSubscribers() {
        return TRACE_EVENTS.some(e => this[e].hasSubscribers);
    }

    unsubscribe(subscribers) {
        let allRemoved = true;
        for (const event of TRACE_EVENTS) {
            if (typeof subscribers[event] === 'function') {
                if (!this[event].unsubscribe(subscribers[event])) {
                    allRemoved = false;
                }
            }
        }
        return allRemoved;
    }

    traceSync(fn, context, thisArg, ...args) {
        if (!this.hasSubscribers) {
            return fn.apply(thisArg, args);
        }
        if (context === undefined || context === null) {
            context = {};
        }
        // runStores publishes start, then calls doTrace inside store contexts
        const doTrace = () => {
            try {
                const result = fn.apply(thisArg, args);
                context.result = result;
                return result;
            } catch (err) {
                context.error = err;
                this.error.publish(context);
                throw err;
            } finally {
                this.end.publish(context);
            }
        };
        return this.start.runStores(context, doTrace);
    }

    tracePromise(fn, context, thisArg, ...args) {
        if (!this.hasSubscribers) {
            return fn.apply(thisArg, args);
        }
        if (context === undefined || context === null) {
            context = {};
        }
        // runStores publishes start, then calls doTrace inside store contexts
        // end fires after the synchronous portion (when fn returns a promise),
        // asyncStart/asyncEnd fire when the promise settles
        const doTrace = () => {
            try {
                const promise = fn.apply(thisArg, args);
                // end fires here — after sync portion, before promise settles
                this.end.publish(context);
                return Promise.resolve(promise).then(
                    (result) => {
                        context.result = result;
                        // asyncStart.runStores publishes asyncStart, restores store contexts
                        return this.asyncStart.runStores(context, () => {
                            try { return result; }
                            finally { this.asyncEnd.publish(context); }
                        });
                    },
                    (err) => {
                        context.error = err;
                        this.error.publish(context);
                        return this.asyncStart.runStores(context, () => {
                            try { throw err; }
                            finally { this.asyncEnd.publish(context); }
                        });
                    }
                );
            } catch (err) {
                context.error = err;
                this.error.publish(context);
                this.end.publish(context);
                throw err;
            }
        };
        return this.start.runStores(context, doTrace);
    }

    traceCallback(fn, position, context, thisArg, ...args) {
        if (!this.hasSubscribers) {
            return fn.apply(thisArg, args);
        }
        if (typeof position !== 'number') {
            position = -1;
        }
        const idx = position < 0 ? args.length + position : position;
        if (context === undefined || context === null) {
            context = {};
        }

        const self = this;
        const originalCb = args[idx];

        if (idx >= 0 && idx < args.length && typeof originalCb !== 'function') {
            const err = new TypeError('The "callback" argument must be of type function. Received ' + (originalCb === null ? 'null' : typeof originalCb) + ' [ERR_INVALID_ARG_TYPE]');
            err.code = 'ERR_INVALID_ARG_TYPE';
            throw err;
        }

        if (typeof originalCb !== 'function') {
            // No callback at position; just trace the sync call
            const doTrace = () => {
                try {
                    return fn.apply(thisArg, args);
                } catch (err) {
                    context.error = err;
                    this.error.publish(context);
                    throw err;
                } finally {
                    this.end.publish(context);
                }
            };
            return this.start.runStores(context, doTrace);
        }

        function wrappedCallback(err, ...cbArgs) {
            if (err) {
                context.error = err;
                self.error.publish(context);
            } else {
                context.result = cbArgs[0];
            }
            // Restore store contexts for async continuation
            // asyncStart.runStores publishes asyncStart, then runs callback inside stores
            const doAsync = () => {
                try {
                    return originalCb.call(this, err, ...cbArgs);
                } finally {
                    self.asyncEnd.publish(context);
                }
            };
            return self.asyncStart.runStores(context, doAsync);
        }

        args[idx] = wrappedCallback;

        // runStores publishes start, then calls doTrace inside store contexts
        const doTrace = () => {
            try {
                const result = fn.apply(thisArg, args);
                return result;
            } catch (err) {
                context.error = err;
                this.error.publish(context);
                throw err;
            } finally {
                this.end.publish(context);
            }
        };
        return this.start.runStores(context, doTrace);
    }
}

function tracingChannel(name) {
    return new TracingChannel(name);
}

const diagnostics_channel = {
    Channel,
    TracingChannel,
    channel,
    hasSubscribers,
    subscribe,
    unsubscribe,
    tracingChannel,
};

export {
    Channel,
    TracingChannel,
    channel,
    hasSubscribers,
    subscribe,
    unsubscribe,
    tracingChannel,
};

export default diagnostics_channel;
