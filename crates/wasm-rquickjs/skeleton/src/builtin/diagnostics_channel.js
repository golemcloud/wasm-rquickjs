// Node.js diagnostics_channel implementation

const channels = new Map();

class Channel {
    constructor(name) {
        this._name = name;
        this._subscribers = [];
    }

    get name() {
        return this._name;
    }

    get hasSubscribers() {
        return this._subscribers.length > 0;
    }

    subscribe(onMessage) {
        if (typeof onMessage !== 'function') {
            throw new TypeError('onMessage must be a function');
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
        for (let i = 0; i < this._subscribers.length; i++) {
            try {
                this._subscribers[i](message, this._name);
            } catch (_e) {
                // subscriber errors must not prevent other subscribers from being called
            }
        }
    }

    bindStore(_store, _transform) {
        // no-op stub (AsyncLocalStorage integration)
    }

    unbindStore(_store) {
        // no-op stub
        return false;
    }
}

function channel(name) {
    if (typeof name !== 'string' && typeof name !== 'symbol') {
        throw new TypeError('Channel name must be a string or Symbol');
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
                    throw new TypeError(`Expected a Channel instance for ${event}`);
                }
                this[event] = nameOrChannels[event];
            }
        } else {
            throw new TypeError('Expected a string or a channels object');
        }
    }

    subscribe(subscribers) {
        for (const event of TRACE_EVENTS) {
            if (typeof subscribers[event] === 'function') {
                this[event].subscribe(subscribers[event]);
            }
        }
    }

    unsubscribe(subscribers) {
        for (const event of TRACE_EVENTS) {
            if (typeof subscribers[event] === 'function') {
                this[event].unsubscribe(subscribers[event]);
            }
        }
    }

    traceSync(fn, context, thisArg, ...args) {
        if (context === undefined || context === null) {
            context = {};
        }
        this.start.publish(context);
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
    }

    tracePromise(fn, context, thisArg, ...args) {
        if (context === undefined || context === null) {
            context = {};
        }
        this.start.publish(context);
        try {
            const promise = fn.apply(thisArg, args);
            return Promise.resolve(promise).then(
                (result) => {
                    context.result = result;
                    this.asyncStart.publish(context);
                    this.asyncEnd.publish(context);
                    return result;
                },
                (err) => {
                    context.error = err;
                    this.error.publish(context);
                    this.asyncStart.publish(context);
                    this.asyncEnd.publish(context);
                    throw err;
                }
            ).finally(() => {
                this.end.publish(context);
            });
        } catch (err) {
            context.error = err;
            this.error.publish(context);
            this.end.publish(context);
            throw err;
        }
    }

    traceCallback(fn, position, context, thisArg, ...args) {
        if (typeof position !== 'number') {
            position = args.length;
        }
        if (context === undefined || context === null) {
            context = {};
        }

        const self = this;
        const originalCb = typeof args[position] === 'function' ? args[position] : undefined;

        function wrappedCallback(err, ...cbArgs) {
            if (err) {
                context.error = err;
                self.error.publish(context);
            } else {
                context.result = cbArgs[0];
            }
            self.asyncStart.publish(context);
            try {
                if (originalCb) {
                    return originalCb.call(this, err, ...cbArgs);
                }
            } finally {
                self.asyncEnd.publish(context);
            }
        }

        args[position] = wrappedCallback;

        this.start.publish(context);
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
