// node:test — Phase 1 implementation
// Provides test(), describe(), it(), suite(), and lifecycle hooks.
// Tests run synchronously/eagerly when called. Failures are collected
// and an aggregate error is thrown after all tests in a suite complete.

var currentSuite = null;

// --- Suite context ---

function SuiteContext(name, parent) {
    this.name = name;
    this.parent = parent;
    this.tests = [];
    this.suites = [];
    this.beforeFns = [];
    this.afterFns = [];
    this.beforeEachFns = [];
    this.afterEachFns = [];
}

SuiteContext.prototype.fullName = function () {
    if (this.parent && this.parent.name) {
        return this.parent.fullName() + ' > ' + this.name;
    }
    return this.name || '';
};

SuiteContext.prototype.collectBeforeEach = function () {
    var fns = [];
    if (this.parent) {
        fns = this.parent.collectBeforeEach();
    }
    return fns.concat(this.beforeEachFns);
};

SuiteContext.prototype.collectAfterEach = function () {
    var fns = this.afterEachFns.slice();
    if (this.parent) {
        fns = fns.concat(this.parent.collectAfterEach());
    }
    return fns;
};

// --- Test context (t) ---

function TestContext(name, suite) {
    this.name = name;
    this.signal = { aborted: false };
    this._suite = suite;
    this._diagnostics = [];
    this._skipMessage = undefined;
    this._todoMessage = undefined;
    this._subtests = [];
    this._beforeFns = [];
    this._afterFns = [];
    this._beforeEachFns = [];
    this._afterEachFns = [];
}

Object.defineProperty(TestContext.prototype, 'fullName', {
    get: function () {
        var suiteName = this._suite ? this._suite.fullName() : '';
        if (suiteName) {
            return suiteName + ' > ' + this.name;
        }
        return this.name;
    }
});

TestContext.prototype.diagnostic = function (msg) {
    this._diagnostics.push(msg);
};

TestContext.prototype.skip = function (msg) {
    this._skipMessage = msg || 'skipped';
    throw new SkipError(this._skipMessage);
};

TestContext.prototype.todo = function (msg) {
    this._todoMessage = msg || 'TODO';
    throw new TodoError(this._todoMessage);
};

TestContext.prototype.test = function (name, optionsOrFn, maybeFn) {
    var parsed = parseTestArgs(name, optionsOrFn, maybeFn);
    this._subtests.push(parsed);
};

TestContext.prototype.before = function (fn) {
    this._beforeFns.push(fn);
};

TestContext.prototype.after = function (fn) {
    this._afterFns.push(fn);
};

TestContext.prototype.beforeEach = function (fn) {
    this._beforeEachFns.push(fn);
};

TestContext.prototype.afterEach = function (fn) {
    this._afterEachFns.push(fn);
};

// --- Sentinel errors ---

function SkipError(message) {
    this.message = message;
    this.name = 'SkipError';
}
SkipError.prototype = Object.create(Error.prototype);
SkipError.prototype.constructor = SkipError;

function TodoError(message) {
    this.message = message;
    this.name = 'TodoError';
}
TodoError.prototype = Object.create(Error.prototype);
TodoError.prototype.constructor = TodoError;

// --- Argument parsing ---

function parseTestArgs(nameOrOpts, optionsOrFn, maybeFn) {
    var name, options, fn;

    if (typeof nameOrOpts === 'function') {
        // (fn) form
        fn = nameOrOpts;
        name = fn.name || '<anonymous>';
        options = {};
    } else if (typeof nameOrOpts === 'string' || typeof nameOrOpts === 'undefined') {
        name = nameOrOpts || '<anonymous>';
        if (typeof optionsOrFn === 'function') {
            // (name, fn) form
            fn = optionsOrFn;
            options = {};
        } else if (typeof optionsOrFn === 'object' && optionsOrFn !== null) {
            // (name, opts, fn) form
            options = optionsOrFn;
            fn = maybeFn;
        } else {
            options = {};
            fn = maybeFn;
        }
    } else if (typeof nameOrOpts === 'object' && nameOrOpts !== null) {
        // (opts, fn) form
        options = nameOrOpts;
        fn = optionsOrFn;
        name = options.name || (fn && fn.name) || '<anonymous>';
    } else {
        name = String(nameOrOpts);
        options = {};
        fn = optionsOrFn;
    }

    if (!options) options = {};
    if (!fn) fn = function () {};

    return { name: name, options: options, fn: fn };
}

// --- Run a single test ---

function runTest(parsed, parentSuite) {
    var name = parsed.name;
    var options = parsed.options;
    var fn = parsed.fn;

    // Handle skip
    if (options.skip === true || (typeof options.skip === 'string' && options.skip)) {
        return { status: 'skip', name: name, message: typeof options.skip === 'string' ? options.skip : '' };
    }

    // Handle todo
    var isTodo = options.todo === true || typeof options.todo === 'string';

    var ctx = new TestContext(name, parentSuite);

    // Collect beforeEach from parent suite chain
    var beforeEachFns = parentSuite ? parentSuite.collectBeforeEach() : [];
    var afterEachFns = parentSuite ? parentSuite.collectAfterEach() : [];

    try {
        // Run beforeEach hooks
        for (var i = 0; i < beforeEachFns.length; i++) {
            beforeEachFns[i]();
        }

        // Run the test function with ctx as both `this` and first argument
        var result = fn.call(ctx, ctx);

        // If test returned a promise, we can't await it synchronously in CJS context.
        // But QuickJS supports top-level await in modules... for CJS require() context
        // we need to handle this. Actually QuickJS can handle promise synchronously
        // in some contexts. Let's just check and handle.
        if (result && typeof result.then === 'function') {
            // We'll handle this by returning a pending result marker
            return { status: 'async', name: name, promise: result, ctx: ctx, isTodo: isTodo, afterEachFns: afterEachFns };
        }

        // Run subtests if any
        if (ctx._subtests.length > 0) {
            var subResult = runSubtests(ctx);
            if (subResult.failures > 0 && !isTodo) {
                return { status: 'fail', name: name, error: subResult.error };
            }
        }

        // Run afterEach hooks (own first, then parent's)
        for (var j = 0; j < afterEachFns.length; j++) {
            afterEachFns[j]();
        }

        if (isTodo) {
            return { status: 'todo', name: name, message: typeof options.todo === 'string' ? options.todo : '' };
        }

        return { status: 'pass', name: name };
    } catch (e) {
        // Run afterEach hooks even on failure
        for (var k = 0; k < afterEachFns.length; k++) {
            try { afterEachFns[k](); } catch (ignored) {}
        }

        if (e instanceof SkipError) {
            return { status: 'skip', name: name, message: e.message };
        }
        if (e instanceof TodoError) {
            return { status: 'todo', name: name, message: e.message };
        }
        if (isTodo) {
            return { status: 'todo', name: name, message: typeof options.todo === 'string' ? options.todo : '' };
        }
        return { status: 'fail', name: name, error: e };
    }
}

function runSubtests(ctx) {
    var failures = 0;
    var errors = [];

    // Run before hooks
    for (var b = 0; b < ctx._beforeFns.length; b++) {
        ctx._beforeFns[b]();
    }

    for (var i = 0; i < ctx._subtests.length; i++) {
        var subtestParsed = ctx._subtests[i];
        var result = runTest(subtestParsed, ctx._suite);
        if (result.status === 'fail') {
            failures++;
            errors.push(result.error);
        }
    }

    // Run after hooks
    for (var a = 0; a < ctx._afterFns.length; a++) {
        try { ctx._afterFns[a](); } catch (ignored) {}
    }

    var error = null;
    if (errors.length === 1) {
        error = errors[0];
    } else if (errors.length > 1) {
        error = new AggregateError(errors, failures + ' subtest(s) failed');
    }

    return { failures: failures, error: error };
}

// --- Run a suite ---

function runSuite(name, options, fn, parentSuite) {
    // Handle skip
    if (options.skip === true || (typeof options.skip === 'string' && options.skip)) {
        return { status: 'skip', name: name };
    }

    var isTodo = options.todo === true || typeof options.todo === 'string';

    var suite = new SuiteContext(name, parentSuite);
    var prevSuite = currentSuite;
    currentSuite = suite;

    try {
        // Run the describe/suite callback to discover tests
        var result = fn();
        if (result && typeof result.then === 'function') {
            // Async suite discovery — need to await it
            return {
                status: 'async-suite',
                name: name,
                promise: result,
                suite: suite,
                prevSuite: prevSuite,
                isTodo: isTodo,
                parentSuite: parentSuite
            };
        }
    } catch (e) {
        currentSuite = prevSuite;
        if (isTodo) {
            return { status: 'todo', name: name };
        }
        return { status: 'fail', name: name, error: e };
    }

    currentSuite = prevSuite;
    return executeSuite(suite, isTodo);
}

function executeSuite(suite, isTodo) {
    var failures = 0;
    var errors = [];

    // Run before hooks
    for (var b = 0; b < suite.beforeFns.length; b++) {
        try {
            suite.beforeFns[b]();
        } catch (e) {
            if (!isTodo) {
                return { status: 'fail', name: suite.name, error: e };
            }
            return { status: 'todo', name: suite.name };
        }
    }

    // Run child suites and tests in order they were registered
    for (var i = 0; i < suite.tests.length; i++) {
        var entry = suite.tests[i];
        var result;
        if (entry.type === 'suite') {
            result = runSuite(entry.name, entry.options, entry.fn, suite);
        } else {
            result = runTest(entry, suite);
        }

        if (result.status === 'async' || result.status === 'async-suite') {
            // Can't handle async in synchronous require() context — treat as failure
            failures++;
            errors.push(new Error('Async test "' + (result.name || '') + '" in synchronous context'));
            continue;
        }

        if (result.status === 'fail') {
            failures++;
            errors.push(result.error || new Error('Test "' + result.name + '" failed'));
        }
    }

    // Run after hooks (always, even on failure)
    for (var a = 0; a < suite.afterFns.length; a++) {
        try {
            suite.afterFns[a]();
        } catch (e) {
            failures++;
            errors.push(e);
        }
    }

    if (isTodo) {
        return { status: 'todo', name: suite.name };
    }

    if (failures > 0) {
        var error;
        if (errors.length === 1) {
            error = errors[0];
        } else {
            error = new AggregateError(errors, failures + ' test(s) failed');
        }
        return { status: 'fail', name: suite.name, error: error };
    }

    return { status: 'pass', name: suite.name };
}

// --- Top-level collection ---

var topLevelTests = [];
var rootSuite = new SuiteContext('', null);

function flushTopLevel() {
    if (topLevelTests.length === 0) return;

    var failures = 0;
    var errors = [];

    for (var i = 0; i < topLevelTests.length; i++) {
        var entry = topLevelTests[i];
        var result;

        if (entry.type === 'suite') {
            result = runSuite(entry.name, entry.options, entry.fn, rootSuite);
        } else {
            result = runTest(entry, rootSuite);
        }

        if (result.status === 'async' || result.status === 'async-suite') {
            // Can't handle async in synchronous require() context
            failures++;
            errors.push(new Error('Async test "' + (result.name || '') + '" in synchronous context'));
            continue;
        }

        if (result.status === 'fail') {
            failures++;
            errors.push(result.error || new Error('Test "' + result.name + '" failed'));
        }
    }

    topLevelTests = [];

    if (failures > 0) {
        if (errors.length === 1) {
            throw errors[0];
        }
        throw new AggregateError(errors, failures + ' test(s) failed');
    }
}

// --- Public API ---

function test(nameOrOpts, optionsOrFn, maybeFn) {
    var parsed = parseTestArgs(nameOrOpts, optionsOrFn, maybeFn);

    if (currentSuite) {
        // Inside a describe/suite — register for later execution
        currentSuite.tests.push(parsed);
        return;
    }

    // Top-level test — run immediately
    var result = runTest(parsed, rootSuite);
    if (result.status === 'fail') {
        throw result.error;
    }
}

test.skip = function (nameOrOpts, optionsOrFn, maybeFn) {
    var parsed = parseTestArgs(nameOrOpts, optionsOrFn, maybeFn);
    parsed.options.skip = true;

    if (currentSuite) {
        currentSuite.tests.push(parsed);
        return;
    }
    // Top-level skip — no-op (no failure)
};

test.todo = function (nameOrOpts, optionsOrFn, maybeFn) {
    var parsed = parseTestArgs(nameOrOpts, optionsOrFn, maybeFn);
    parsed.options.todo = true;

    if (currentSuite) {
        currentSuite.tests.push(parsed);
        return;
    }
    // Top-level todo — run but don't fail on error
    runTest(parsed, rootSuite);
};

test.only = function (nameOrOpts, optionsOrFn, maybeFn) {
    // only is a no-op filter for now, just run as normal test
    return test(nameOrOpts, optionsOrFn, maybeFn);
};

function describe(nameOrOpts, optionsOrFn, maybeFn) {
    var parsed = parseTestArgs(nameOrOpts, optionsOrFn, maybeFn);

    if (currentSuite) {
        // Nested suite
        currentSuite.tests.push({
            type: 'suite',
            name: parsed.name,
            options: parsed.options,
            fn: parsed.fn
        });
        return;
    }

    // Top-level suite — run immediately
    var result = runSuite(parsed.name, parsed.options, parsed.fn, rootSuite);
    if (result.status === 'fail') {
        throw result.error;
    }
}

describe.skip = function (nameOrOpts, optionsOrFn, maybeFn) {
    var parsed = parseTestArgs(nameOrOpts, optionsOrFn, maybeFn);
    parsed.options.skip = true;

    if (currentSuite) {
        currentSuite.tests.push({
            type: 'suite',
            name: parsed.name,
            options: parsed.options,
            fn: parsed.fn
        });
        return;
    }
    // Top-level skip suite — no-op
};

describe.todo = function (nameOrOpts, optionsOrFn, maybeFn) {
    var parsed = parseTestArgs(nameOrOpts, optionsOrFn, maybeFn);
    parsed.options.todo = true;

    if (currentSuite) {
        currentSuite.tests.push({
            type: 'suite',
            name: parsed.name,
            options: parsed.options,
            fn: parsed.fn
        });
        return;
    }
    runSuite(parsed.name, parsed.options, parsed.fn, rootSuite);
};

describe.only = function (nameOrOpts, optionsOrFn, maybeFn) {
    return describe(nameOrOpts, optionsOrFn, maybeFn);
};

var it = test;
it.skip = test.skip;
it.todo = test.todo;
it.only = test.only;

var suite = describe;
suite.skip = describe.skip;
suite.todo = describe.todo;
suite.only = describe.only;

// --- Lifecycle hooks ---

function before(fn) {
    if (currentSuite) {
        currentSuite.beforeFns.push(fn);
    } else {
        rootSuite.beforeFns.push(fn);
    }
}

function after(fn) {
    if (currentSuite) {
        currentSuite.afterFns.push(fn);
    } else {
        rootSuite.afterFns.push(fn);
    }
}

function beforeEach(fn) {
    if (currentSuite) {
        currentSuite.beforeEachFns.push(fn);
    } else {
        rootSuite.beforeEachFns.push(fn);
    }
}

function afterEach(fn) {
    if (currentSuite) {
        currentSuite.afterEachFns.push(fn);
    } else {
        rootSuite.afterEachFns.push(fn);
    }
}

// --- Stubs for later phases ---

var mock = {
    fn: function (impl) {
        var mockFn = impl || function () {};
        return mockFn;
    },
    method: function (obj, methodName, impl) {
        if (impl) {
            obj[methodName] = impl;
        }
    },
    getter: function () {},
    setter: function () {},
    reset: function () {},
    restoreAll: function () {},
    timers: { enable: function () {}, reset: function () {}, tick: function () {} }
};

function run() {
    // Stub — no-op for now
    return { on: function () { return this; }, once: function () { return this; } };
}

export {
    test,
    describe,
    it,
    suite,
    before,
    after,
    beforeEach,
    afterEach,
    mock,
    run
};

export default test;
