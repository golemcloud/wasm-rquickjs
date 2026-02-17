// node:domain - sync-only stub implementation
import EventEmitter from 'node:events';

const _stack = [];
let active = null;

class Domain extends EventEmitter {
    constructor() {
        super();
        this.members = [];
        this._disposed = false;
    }

    run(fn, ...args) {
        this.enter();
        try {
            return fn.apply(this, args);
        } catch (err) {
            this.emit('error', err);
        } finally {
            this.exit();
        }
    }

    add(emitter) {
        if (this.members.indexOf(emitter) === -1) {
            this.members.push(emitter);
        }
        emitter.domain = this;
    }

    remove(emitter) {
        const idx = this.members.indexOf(emitter);
        if (idx !== -1) {
            this.members.splice(idx, 1);
        }
        delete emitter.domain;
    }

    bind(callback) {
        const self = this;
        return function(...args) {
            self.enter();
            try {
                return callback.apply(this, args);
            } catch (err) {
                self.emit('error', err);
            } finally {
                self.exit();
            }
        };
    }

    intercept(callback) {
        const self = this;
        return function(err, ...args) {
            if (err) {
                self.emit('error', err);
                return;
            }
            self.enter();
            try {
                return callback.apply(this, args);
            } catch (e) {
                self.emit('error', e);
            } finally {
                self.exit();
            }
        };
    }

    enter() {
        _stack.push(active);
        active = this;
    }

    exit() {
        active = _stack.pop() || null;
    }

    dispose() {
        this._disposed = true;
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
    active,
};

export default {
    Domain,
    create,
    createDomain,
    get active() { return active; },
};
