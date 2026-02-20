// node:domain - full implementation with EventEmitter integration
//
// _stack semantics match Node.js:
//   - _stack contains the entered domains themselves
//   - enter() pushes `this` onto _stack, sets active = this
//   - exit() finds `this` in _stack, pops it and everything above it
//   - If `this` is not in _stack, exit() is a no-op
//   - Error handlers run outside their domain (stack is unwound before handler)
//
import EventEmitter from 'node:events';

export const _stack = [];
export let active = null;

function updateActive() {
    active = _stack.length > 0 ? _stack[_stack.length - 1] : null;
    if (globalThis.process) {
        // Node.js sets process.domain to undefined when no domain is active
        // (after domain module has been loaded), not null.
        globalThis.process.domain = active || undefined;
    }
}

function decorateError(err, props) {
    if (err != null && (typeof err === 'object' || typeof err === 'function')) {
        try {
            for (var key in props) {
                if (key === 'domain') {
                    Object.defineProperty(err, 'domain', {
                        value: props[key],
                        writable: true,
                        enumerable: false,
                        configurable: true,
                    });
                } else {
                    err[key] = props[key];
                }
            }
        } catch (e) { /* frozen object */ }
    }
}

const _origEmit = EventEmitter.prototype.emit;
const _patched = Symbol('domain.patched');

// Monkey-patch EventEmitter.prototype.emit to route unhandled 'error' events
// through the emitter's domain (if set).
if (!EventEmitter.prototype[_patched]) {
    EventEmitter.prototype.emit = function emit(event) {
        if (
            event === 'error' &&
            typeof this.listenerCount === 'function' &&
            this.listenerCount('error') === 0 &&
            this.domain &&
            this.domain !== this &&
            typeof this.domain.emit === 'function' &&
            !this.domain._disposed
        ) {
            var err = arguments[1];
            if (!err) {
                err = new Error('Unhandled error.');
            }
            var theDomain = this.domain;
            decorateError(err, {
                domain: theDomain,
                domainEmitter: this,
                domainThrown: false,
            });
            // Error handlers run outside their domain's context.
            // Unwind the stack to the state before theDomain was entered,
            // then restore after the handler.
            var savedStack = _stack.slice();
            var savedActive = active;
            // Remove theDomain and everything above it from the stack
            var idx = -1;
            for (var si = _stack.length - 1; si >= 0; si--) {
                if (_stack[si] === theDomain) {
                    idx = si;
                    break;
                }
            }
            if (idx >= 0) {
                _stack.length = idx;
            } else {
                _stack.length = 0;
            }
            updateActive();
            try {
                theDomain.emit('error', err);
            } finally {
                // Restore stack
                _stack.length = 0;
                for (var ri = 0; ri < savedStack.length; ri++) {
                    _stack.push(savedStack[ri]);
                }
                active = savedActive;
                if (globalThis.process) {
                    globalThis.process.domain = active || undefined;
                }
            }
            return false;
        }
        return _origEmit.apply(this, arguments);
    };
    EventEmitter.prototype[_patched] = true;
}

// Install implicit domain binding hook on EventEmitter constructor.
// When a new EventEmitter is created while a domain is active, it is
// automatically added to that domain.
EventEmitter._domainInit = function(emitter) {
    if (active && !(emitter instanceof Domain)) {
        active.add(emitter);
    }
};

// Patch setTimeout/setInterval to auto-bind callbacks to active domain.
// We do NOT patch process.nextTick — Node.js doesn't either
// (test-next-tick-domain.js verifies this). nextTick callbacks within
// domain.run() get domain error routing because domain.bind() wraps them
// through the setTimeout/setInterval patch, and thrown errors from
// nextTick propagate up through the event loop.
var _origSetTimeout = globalThis.setTimeout;
var _origSetInterval = globalThis.setInterval;

if (_origSetTimeout) {
    globalThis.setTimeout = function domainSetTimeout(callback, delay) {
        if (active && typeof callback === 'function') {
            callback = active.bind(callback);
        }
        var args = [callback, delay];
        for (var i = 2; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
        return _origSetTimeout.apply(globalThis, args);
    };
}

if (_origSetInterval) {
    globalThis.setInterval = function domainSetInterval(callback, delay) {
        if (active && typeof callback === 'function') {
            callback = active.bind(callback);
        }
        var args = [callback, delay];
        for (var i = 2; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
        return _origSetInterval.apply(globalThis, args);
    };
}

class Domain extends EventEmitter {
    constructor() {
        super();
        this.members = [];
        this._disposed = false;
        this.parent = null;
    }

    run(fn) {
        if (this._disposed) return;
        var errorCaught = false;
        var caughtErr;
        this.enter();
        try {
            var args = [];
            for (var i = 1; i < arguments.length; i++) {
                args.push(arguments[i]);
            }
            return fn.apply(this, args);
        } catch (err) {
            errorCaught = true;
            caughtErr = err;
        } finally {
            this.exit();
        }
        if (errorCaught) {
            // The error handler runs outside this domain's context
            // (exit() was already called in finally).
            decorateError(caughtErr, {
                domain: this,
                domainThrown: true,
            });
            this.emit('error', caughtErr);
        }
    }

    add(emitter) {
        if (emitter.domain === this) return;
        // Remove from previous domain if any
        if (emitter.domain) {
            emitter.domain.remove(emitter);
        }
        if (this.members.indexOf(emitter) === -1) {
            this.members.push(emitter);
        }
        // Node.js sets emitter.domain as non-enumerable
        Object.defineProperty(emitter, 'domain', {
            value: this,
            writable: true,
            enumerable: false,
            configurable: true,
        });
    }

    remove(emitter) {
        var idx = this.members.indexOf(emitter);
        if (idx !== -1) {
            this.members.splice(idx, 1);
        }
        if (emitter.domain === this) {
            // Keep the property non-enumerable after removal
            Object.defineProperty(emitter, 'domain', {
                value: null,
                writable: true,
                enumerable: false,
                configurable: true,
            });
        }
    }

    bind(callback) {
        var self = this;
        var wrapper = function () {
            var errorCaught = false;
            var caughtErr;
            self.enter();
            try {
                return callback.apply(this, arguments);
            } catch (err) {
                errorCaught = true;
                caughtErr = err;
            } finally {
                self.exit();
            }
            if (errorCaught) {
                decorateError(caughtErr, {
                    domain: self,
                    domainThrown: true,
                });
                self.emit('error', caughtErr);
            }
        };
        wrapper.domain = self;
        return wrapper;
    }

    intercept(callback) {
        var self = this;
        var intercepted = function (err) {
            if (err) {
                decorateError(err, {
                    domain: self,
                    domainBound: callback,
                    domainThrown: false,
                });
                self.emit('error', err);
                return;
            }
            var errorCaught = false;
            var caughtErr;
            self.enter();
            try {
                var args = [];
                for (var i = 1; i < arguments.length; i++) {
                    args.push(arguments[i]);
                }
                return callback.apply(this, args);
            } catch (e) {
                errorCaught = true;
                caughtErr = e;
            } finally {
                self.exit();
            }
            if (errorCaught) {
                decorateError(caughtErr, {
                    domain: self,
                    domainBound: callback,
                    domainThrown: true,
                });
                self.emit('error', caughtErr);
            }
        };
        intercepted.domain = self;
        return intercepted;
    }

    enter() {
        if (this._disposed) return;
        _stack.push(this);
        active = this;
        if (globalThis.process) {
            globalThis.process.domain = this;
        }
    }

    exit() {
        // Node.js behavior: find this domain in the stack and pop it
        // + everything above. If not found, it's a no-op.
        var idx = -1;
        for (var i = _stack.length - 1; i >= 0; i--) {
            if (_stack[i] === this) {
                idx = i;
                break;
            }
        }
        if (idx === -1) return; // not in stack, no-op
        _stack.splice(idx);
        updateActive();
    }

    dispose() {
        if (this._disposed) return;
        this._disposed = true;

        // Remove all members
        var members = this.members.slice();
        for (var i = 0; i < members.length; i++) {
            this.remove(members[i]);
        }

        // Remove from stack if present
        for (var j = _stack.length - 1; j >= 0; j--) {
            if (_stack[j] === this) {
                _stack.splice(j, 1);
            }
        }
        updateActive();

        this.emit('dispose');
        this.removeAllListeners();
    }
}

function create() {
    return new Domain();
}

function createDomain() {
    return new Domain();
}

export {
    Domain,
    create,
    createDomain,
};

export default {
    Domain,
    create,
    createDomain,
    get active() { return active; },
    _stack,
};
