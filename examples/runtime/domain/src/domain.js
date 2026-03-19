import domain from 'node:domain';
import { active as activeExport, _stack, Domain, create, createDomain } from 'node:domain';
import EventEmitter from 'node:events';

export const testCreate = () => {
    try {
        var d1 = domain.create();
        if (!(d1 instanceof Domain)) throw new Error('create() should return Domain instance');
        if (!(d1 instanceof EventEmitter)) throw new Error('Domain should extend EventEmitter');
        if (!Array.isArray(d1.members)) throw new Error('members should be an array');
        if (d1.members.length !== 0) throw new Error('members should be empty');
        if (d1._disposed !== false) throw new Error('_disposed should be false');

        var d2 = createDomain();
        if (!(d2 instanceof Domain)) throw new Error('createDomain() should return Domain instance');

        // active should be null initially
        if (domain.active !== null) throw new Error('active should be null initially');

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const testRun = () => {
    try {
        var d = domain.create();
        var ranInDomain = false;

        // Normal execution
        var result = d.run(function () {
            ranInDomain = true;
            return 42;
        });
        if (!ranInDomain) throw new Error('run() should execute the function');
        if (result !== 42) throw new Error('run() should return the function result');

        // Error catching
        var caughtError = null;
        d.on('error', function (err) {
            caughtError = err;
        });

        d.run(function () {
            throw new Error('test error');
        });

        if (!caughtError) throw new Error('run() should catch errors');
        if (caughtError.message !== 'test error') throw new Error('Should catch the correct error');

        // run() with arguments
        var d2 = domain.create();
        var receivedArgs = null;
        d2.run(function (a, b, c) {
            receivedArgs = [a, b, c];
        }, 1, 'two', 3);
        if (!receivedArgs) throw new Error('run() should pass arguments');
        if (receivedArgs[0] !== 1 || receivedArgs[1] !== 'two' || receivedArgs[2] !== 3) {
            throw new Error('run() should pass correct arguments');
        }

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const testBind = () => {
    try {
        var d = domain.create();
        var caughtError = null;
        d.on('error', function (err) {
            caughtError = err;
        });

        // Normal callback
        var fn = d.bind(function (a, b) {
            return a + b;
        });
        var result = fn(2, 3);
        if (result !== 5) throw new Error('bind() wrapper should return function result');

        // Wrapper should have .domain
        if (fn.domain !== d) throw new Error('bind() wrapper should have .domain property');

        // Error routing
        var errFn = d.bind(function () {
            throw new Error('bind error');
        });
        caughtError = null;
        errFn();
        if (!caughtError) throw new Error('bind() should route errors to domain');
        if (caughtError.message !== 'bind error') throw new Error('bind() should route correct error');

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const testIntercept = () => {
    try {
        var d = domain.create();
        var caughtError = null;
        d.on('error', function (err) {
            caughtError = err;
        });

        // Success callback (no error)
        var fn = d.intercept(function (data) {
            return data * 2;
        });
        var result = fn(null, 21);
        if (result !== 42) throw new Error('intercept() should pass data without error arg');

        // Wrapper should have .domain
        if (fn.domain !== d) throw new Error('intercept() wrapper should have .domain property');

        // Error-first callback interception
        caughtError = null;
        fn(new Error('intercepted error'));
        if (!caughtError) throw new Error('intercept() should route error-first errors');
        if (caughtError.message !== 'intercepted error') throw new Error('intercept() should route correct error');
        // domainBound should be the original callback passed to intercept()
        // (fn is the wrapper; we need to check against the original callback)

        // Error thrown inside callback
        var throwFn = d.intercept(function () {
            throw new Error('thrown in intercept');
        });
        caughtError = null;
        throwFn(null);
        if (!caughtError) throw new Error('intercept() should route thrown errors');
        if (caughtError.message !== 'thrown in intercept') throw new Error('intercept() should route correct thrown error');

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const testAddRemove = () => {
    try {
        var d = domain.create();
        var emitter = new EventEmitter();

        // Add
        d.add(emitter);
        if (d.members.length !== 1) throw new Error('add() should add to members');
        if (d.members[0] !== emitter) throw new Error('add() should add the correct emitter');
        if (emitter.domain !== d) throw new Error('add() should set emitter.domain');

        // Adding same emitter again should be idempotent
        d.add(emitter);
        if (d.members.length !== 1) throw new Error('add() should not add duplicate');

        // Remove
        d.remove(emitter);
        if (d.members.length !== 0) throw new Error('remove() should remove from members');
        if (emitter.domain === d) throw new Error('remove() should delete emitter.domain');

        // Add to one domain, then add to another should move it
        var d2 = domain.create();
        d.add(emitter);
        if (d.members.length !== 1) throw new Error('should be in d');
        d2.add(emitter);
        if (d.members.length !== 0) throw new Error('should be removed from d');
        if (d2.members.length !== 1) throw new Error('should be in d2');
        if (emitter.domain !== d2) throw new Error('emitter.domain should be d2');

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const testEnterExit = () => {
    try {
        var d = domain.create();

        // Initial state
        if (domain.active !== null) throw new Error('active should be null initially');

        // Enter
        d.enter();
        if (domain.active !== d) throw new Error('active should be d after enter()');
        if (process.domain !== d) throw new Error('process.domain should be d after enter()');

        // _stack should contain entered domains
        if (domain._stack.length !== 1) throw new Error('_stack should have 1 entry');
        if (domain._stack[0] !== d) throw new Error('_stack[0] should be d');

        // Exit
        d.exit();
        if (domain.active !== null) throw new Error('active should be null after exit()');

        // Exit mid-stack pops everything above
        var a = domain.create();
        a.name = 'a';
        var b = domain.create();
        b.name = 'b';
        var c = domain.create();
        c.name = 'c';

        a.enter();
        b.enter();
        c.enter();
        if (domain._stack.length !== 3) throw new Error('_stack should have 3 entries');

        // Exiting b should pop b and c
        b.exit();
        if (domain._stack.length !== 1) throw new Error('_stack should have 1 entry after mid-exit');
        if (domain._stack[0] !== a) throw new Error('_stack[0] should be a');

        a.exit();

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const testEmitterErrorRouting = () => {
    try {
        var d = domain.create();
        var caughtError = null;
        d.on('error', function (err) {
            caughtError = err;
        });

        var emitter = new EventEmitter();
        d.add(emitter);

        // Emit 'error' with no error listener on the emitter
        // Should route to domain, NOT throw
        emitter.emit('error', new Error('emitter error'));

        if (!caughtError) throw new Error('unhandled emitter error should route to domain');
        if (caughtError.message !== 'emitter error') throw new Error('should route correct error');

        // If emitter HAS its own error listener, domain should NOT intercept
        var emitter2 = new EventEmitter();
        d.add(emitter2);
        var emitterCaught = false;
        emitter2.on('error', function () {
            emitterCaught = true;
        });
        caughtError = null;
        emitter2.emit('error', new Error('handled error'));
        if (!emitterCaught) throw new Error('emitter error listener should fire');

        // After remove, emitter error should throw (no domain, no listener)
        d.remove(emitter);
        var threw = false;
        try {
            emitter.emit('error', new Error('no handler'));
        } catch (e) {
            threw = true;
        }
        if (!threw) throw new Error('error without domain or listener should throw');

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const testErrorDecoration = () => {
    try {
        // run() should set domainThrown = true
        var d = domain.create();
        var caughtError = null;
        d.on('error', function (err) {
            caughtError = err;
        });

        d.run(function () {
            throw new Error('thrown');
        });

        if (!caughtError) throw new Error('should catch error');
        if (caughtError.domain !== d) throw new Error('error.domain should be the domain');
        if (caughtError.domainThrown !== true) throw new Error('error.domainThrown should be true for run()');
        // domain property should be non-enumerable
        if (Object.prototype.propertyIsEnumerable.call(caughtError, 'domain')) {
            throw new Error('error.domain should be non-enumerable');
        }

        // EventEmitter routing should set domainThrown = false and domainEmitter
        var emitter = new EventEmitter();
        d.add(emitter);
        caughtError = null;
        emitter.emit('error', new Error('emitter'));
        if (!caughtError) throw new Error('should catch emitter error');
        if (caughtError.domainThrown !== false) throw new Error('domainThrown should be false for emitter');
        if (caughtError.domainEmitter !== emitter) throw new Error('domainEmitter should be the emitter');
        if (caughtError.domain !== d) throw new Error('error.domain should be the domain');

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const testDispose = () => {
    try {
        var d = domain.create();
        var emitter1 = new EventEmitter();
        var emitter2 = new EventEmitter();
        d.add(emitter1);
        d.add(emitter2);

        var disposeEmitted = false;
        d.on('dispose', function () {
            disposeEmitted = true;
        });

        d.dispose();

        if (!d._disposed) throw new Error('_disposed should be true');
        if (d.members.length !== 0) throw new Error('members should be empty after dispose');
        if (emitter1.domain === d) throw new Error('emitter1.domain should be cleared');
        if (emitter2.domain === d) throw new Error('emitter2.domain should be cleared');
        if (disposeEmitted !== true) throw new Error('dispose event should be emitted');
        if (d.listenerCount('dispose') !== 0) throw new Error('listeners should be removed');

        // Disposed domain should not run
        var ran = false;
        d.run(function () { ran = true; });
        if (ran) throw new Error('disposed domain should not run');

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const testNested = () => {
    try {
        var d1 = domain.create();
        var d2 = domain.create();
        var errors = [];

        d1.on('error', function (err) {
            errors.push({ domain: 'd1', message: err.message });
        });
        d2.on('error', function (err) {
            errors.push({ domain: 'd2', message: err.message });
        });

        // Nested run
        d1.run(function () {
            if (domain.active !== d1) throw new Error('active should be d1 in run');
            d2.run(function () {
                if (domain.active !== d2) throw new Error('active should be d2 in nested run');
                throw new Error('inner error');
            });
            if (domain.active !== d1) throw new Error('active should be d1 after nested run');
            throw new Error('outer error');
        });

        if (errors.length !== 2) throw new Error('should have 2 errors, got ' + errors.length);
        if (errors[0].domain !== 'd2' || errors[0].message !== 'inner error') {
            throw new Error('first error should be from d2');
        }
        if (errors[1].domain !== 'd1' || errors[1].message !== 'outer error') {
            throw new Error('second error should be from d1');
        }

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};
