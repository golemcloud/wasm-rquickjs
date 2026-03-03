// node:test — Phase 1 implementation
// Provides test(), describe(), it(), suite(), and lifecycle hooks.
// Tests run synchronously/eagerly when called. Failures are collected
// and an aggregate error is thrown after all tests in a suite complete.

import assert from 'node:assert';
import { ERR_INVALID_ARG_TYPE } from '__wasm_rquickjs_builtin/internal/errors';

var currentSuite = null;
// Check for globalThis-based filter (set by test harness before file execution)
var _subtestFilter = (typeof globalThis.__wasm_rquickjs_node_test_filter === 'number')
    ? globalThis.__wasm_rquickjs_node_test_filter
    : null;
var _subtestRegistrationIndex = 0;

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

Object.defineProperty(SuiteContext.prototype, 'fullName', {
    get: function () {
        if (this.parent && this.parent.name) {
            return this.parent.fullName + ' > ' + this.name;
        }
        return this.name || '';
    }
});

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

function TestContext(name, parent) {
    this.name = name;
    this.signal = { aborted: false };
    this._parent = parent;
    this._suite = (parent instanceof SuiteContext) ? parent : (parent ? parent._suite : null);
    this._diagnostics = [];
    this._skipMessage = undefined;
    this._todoMessage = undefined;
    this._subtests = [];
    this._beforeFns = [];
    this._afterFns = [];
    this._beforeEachFns = [];
    this._afterEachFns = [];
    this.mock = new MockTracker();

    // Build t.assert: copy assert methods excluding AssertionError, CallTracker, strict,
    // and add snapshot/fileSnapshot per Node.js spec.
    var uncopiedKeys = ['AssertionError', 'CallTracker', 'strict'];
    var tAssert = {};
    var assertKeys = Object.keys(assert);
    for (var i = 0; i < assertKeys.length; i++) {
        var key = assertKeys[i];
        if (!uncopiedKeys.includes(key)) {
            tAssert[key] = assert[key];
        }
    }
    tAssert.snapshot = function snapshot(_value, _options) {
        throw new Error('snapshot is not supported in this context');
    };
    tAssert.fileSnapshot = function fileSnapshot(_value, _path) {
        throw new Error('fileSnapshot is not supported in this context');
    };
    this.assert = tAssert;
}

Object.defineProperty(TestContext.prototype, 'fullName', {
    get: function () {
        var parentName = this._parent ? this._parent.fullName : '';
        if (parentName) {
            return parentName + ' > ' + this.name;
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
    var fn = parsed.fn;
    var parentTest = this;

    // Handle skip
    if (parsed.options.skip === true || (typeof parsed.options.skip === 'string' && parsed.options.skip)) {
        return Promise.resolve();
    }

    var childCtx = new TestContext(parsed.name, parentTest);

    var runSubtest = function () {
        try {
            var result;
            if (fn.length >= 2) {
                // done callback pattern
                return new Promise(function (resolve, reject) {
                    var done = function (err) {
                        childCtx.mock.restoreAll();
                        if (err) reject(err);
                        else resolve();
                    };
                    try {
                        fn.call(childCtx, childCtx, done);
                    } catch (e) {
                        childCtx.mock.restoreAll();
                        reject(e);
                    }
                });
            }

            result = fn.call(childCtx, childCtx);
            if (result && typeof result.then === 'function') {
                return result.then(function () {
                    childCtx.mock.restoreAll();
                }, function (e) {
                    childCtx.mock.restoreAll();
                    throw e;
                });
            }
            childCtx.mock.restoreAll();
            return Promise.resolve();
        } catch (e) {
            childCtx.mock.restoreAll();
            if (e instanceof SkipError) {
                return Promise.resolve();
            }
            return Promise.reject(e);
        }
    };

    return runSubtest();
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

TestContext.prototype.waitFor = function waitFor(condition, options) {
    if (typeof condition !== 'function') {
        throw new ERR_INVALID_ARG_TYPE('condition', 'function', condition);
    }

    if (options !== undefined && (options === null || typeof options !== 'object')) {
        throw new ERR_INVALID_ARG_TYPE('options', 'object', options);
    }

    var opts = options || {};

    if (opts.interval !== undefined && typeof opts.interval !== 'number') {
        throw new ERR_INVALID_ARG_TYPE('options.interval', 'number', opts.interval);
    }

    if (opts.timeout !== undefined && typeof opts.timeout !== 'number') {
        throw new ERR_INVALID_ARG_TYPE('options.timeout', 'number', opts.timeout);
    }

    var interval = opts.interval !== undefined ? opts.interval : 50;
    var timeout = opts.timeout !== undefined ? opts.timeout : 30000;

    return new Promise(function (resolve, reject) {
        var lastError = null;
        var done = false;
        var pollTimerId = null;

        var timeoutId = setTimeout(function () {
            if (done) return;
            done = true;
            if (pollTimerId !== null) {
                clearTimeout(pollTimerId);
            }
            var err = new Error('waitFor() timed out');
            if (lastError) {
                err.cause = lastError;
            }
            reject(err);
        }, timeout);

        var running = false;

        function poll() {
            if (done || running) return;
            running = true;

            try {
                var result = condition();
                if (result && typeof result.then === 'function') {
                    result.then(function (val) {
                        running = false;
                        if (!done) {
                            done = true;
                            clearTimeout(timeoutId);
                            resolve(val);
                        }
                    }, function (e) {
                        running = false;
                        lastError = e;
                        if (!done) {
                            pollTimerId = setTimeout(poll, interval);
                        }
                    });
                } else {
                    running = false;
                    if (!done) {
                        done = true;
                        clearTimeout(timeoutId);
                        resolve(result);
                    }
                }
            } catch (e) {
                running = false;
                lastError = e;
                if (!done) {
                    pollTimerId = setTimeout(poll, interval);
                }
            }
        }

        poll();
    });
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

    var moduleContext = globalThis.__wasm_rquickjs_current_module;
    var capturedModuleContext = undefined;
    if (moduleContext && typeof moduleContext.source === 'string') {
        capturedModuleContext = {
            filename: moduleContext.filename,
            source: moduleContext.source
        };
    }

    return { name: name, options: options, fn: fn, moduleContext: capturedModuleContext };
}

// --- Run a single test ---

function runTest(parsed, parentSuite) {
    var name = parsed.name;
    var options = parsed.options;
    var fn = parsed.fn;
    var moduleContext = parsed.moduleContext;

    var previousModuleContext = globalThis.__wasm_rquickjs_current_module;
    var hasModuleContext = !!(moduleContext && typeof moduleContext.source === 'string');
    if (hasModuleContext) {
        globalThis.__wasm_rquickjs_current_module = moduleContext;
    }

    var restoreModuleContext = function () {
        if (hasModuleContext) {
            globalThis.__wasm_rquickjs_current_module = previousModuleContext;
        }
    };

    var isAsync = false;

    // Handle skip
    if (options.skip === true || (typeof options.skip === 'string' && options.skip)) {
        restoreModuleContext();
        return { status: 'skip', name: name, message: typeof options.skip === 'string' ? options.skip : '' };
    }

    // Handle todo
    var isTodo = options.todo === true || typeof options.todo === 'string';

    var ctx = new TestContext(name, parentSuite);

    // Collect beforeEach from parent suite chain
    var beforeEachFns = parentSuite ? parentSuite.collectBeforeEach() : [];
    var afterEachFns = parentSuite ? parentSuite.collectAfterEach() : [];

    var runAfterEach = function () {
        for (var j = 0; j < afterEachFns.length; j++) {
            afterEachFns[j]();
        }
    };

    var runAfterEachSafe = function () {
        for (var k = 0; k < afterEachFns.length; k++) {
            try { afterEachFns[k](); } catch (ignored) {}
        }
    };

    var runCtxAfterFns = function () {
        for (var af = 0; af < ctx._afterFns.length; af++) {
            try { ctx._afterFns[af](); } catch (ignored) {}
        }
    };

    try {
        // Run beforeEach hooks
        for (var i = 0; i < beforeEachFns.length; i++) {
            beforeEachFns[i]();
        }

        // Run the test function with ctx as both `this` and first argument
        var result = fn.call(ctx, ctx);

        // If test returned a promise, return an async result that can be awaited
        if (result && typeof result.then === 'function') {
            var asyncResult = result.then(function () {
                runCtxAfterFns();
                ctx.mock.restoreAll();
                runAfterEach();
                restoreModuleContext();
                if (isTodo) {
                    return { status: 'todo', name: name, message: typeof options.todo === 'string' ? options.todo : '' };
                }
                return { status: 'pass', name: name };
            }, function (e) {
                runCtxAfterFns();
                ctx.mock.restoreAll();
                runAfterEachSafe();
                restoreModuleContext();
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
            });
            isAsync = true;
            return { status: 'async', name: name, promise: asyncResult };
        }

        // Run subtests if any
        if (ctx._subtests.length > 0) {
            var subResult = runSubtests(ctx);
            if (subResult.failures > 0 && !isTodo) {
                runCtxAfterFns();
                ctx.mock.restoreAll();
                return { status: 'fail', name: name, error: subResult.error };
            }
        } else {
            runCtxAfterFns();
        }

        ctx.mock.restoreAll();
        runAfterEach();

        if (isTodo) {
            return { status: 'todo', name: name, message: typeof options.todo === 'string' ? options.todo : '' };
        }

        return { status: 'pass', name: name };
    } catch (e) {
        runCtxAfterFns();
        ctx.mock.restoreAll();
        runAfterEachSafe();

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
    } finally {
        if (!isAsync) {
            restoreModuleContext();
        }
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
        var result = fn(suite);
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
            var promise = result.promise;
            if (promise) {
                _pendingTestPromises.push(promise.then(function (resolved) {
                    if (resolved && resolved.status === 'fail') {
                        throw resolved.error || new Error('Test "' + resolved.name + '" failed');
                    }
                }));
            }
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
var _pendingTestPromises = [];

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
            var promise = result.promise;
            if (promise) {
                _pendingTestPromises.push(promise.then(function (resolved) {
                    if (resolved && resolved.status === 'fail') {
                        throw resolved.error || new Error('Test "' + resolved.name + '" failed');
                    }
                }));
            }
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
        return Promise.resolve(undefined);
    }

    // Lazy-read filter from global (set by test harness before file execution,
    // but after module initialization)
    if (_subtestFilter === null && typeof globalThis.__wasm_rquickjs_node_test_filter === 'number') {
        _subtestFilter = globalThis.__wasm_rquickjs_node_test_filter;
    }

    // Index-based subtest filtering
    var currentIndex = _subtestRegistrationIndex++;
    if (_subtestFilter !== null && currentIndex !== _subtestFilter) {
        // Silently skip — filtered out
        return Promise.resolve(undefined);
    }

    // Top-level test — run immediately
    var result = runTest(parsed, rootSuite);
    if (result.status === 'async') {
        var p = result.promise.then(function (resolved) {
            if (resolved && resolved.status === 'fail') {
                throw resolved.error || new Error('Test "' + resolved.name + '" failed');
            }
            return undefined;
        });
        _pendingTestPromises.push(p);
        return p;
    }
    if (result.status === 'fail') {
        throw result.error;
    }
    return Promise.resolve(undefined);
}

test.skip = function (nameOrOpts, optionsOrFn, maybeFn) {
    var parsed = parseTestArgs(nameOrOpts, optionsOrFn, maybeFn);
    parsed.options.skip = true;

    if (currentSuite) {
        currentSuite.tests.push(parsed);
        return Promise.resolve(undefined);
    }
    // Top-level skip — no-op (no failure)
    return Promise.resolve(undefined);
};

test.todo = function (nameOrOpts, optionsOrFn, maybeFn) {
    var parsed = parseTestArgs(nameOrOpts, optionsOrFn, maybeFn);
    parsed.options.todo = true;

    if (currentSuite) {
        currentSuite.tests.push(parsed);
        return Promise.resolve(undefined);
    }
    // Top-level todo — run but don't fail on error
    runTest(parsed, rootSuite);
    return Promise.resolve(undefined);
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

    // Lazy-read filter from global
    if (_subtestFilter === null && typeof globalThis.__wasm_rquickjs_node_test_filter === 'number') {
        _subtestFilter = globalThis.__wasm_rquickjs_node_test_filter;
    }

    // Index-based subtest filtering (suites participate just like tests)
    var currentIndex = _subtestRegistrationIndex++;
    if (_subtestFilter !== null && currentIndex !== _subtestFilter) {
        // Silently skip — filtered out
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

// --- MockTracker ---

function MockTracker() {
    this._mocks = [];
}

MockTracker.prototype.method = function (obj, methodName, implementation) {
    var original = obj[methodName];
    var callLog = [];
    var mockInfo = {
        calls: callLog,
        callCount: function () { return callLog.length; },
        resetCalls: function () { callLog.length = 0; },
    };

    var wrapper = function () {
        var args = Array.prototype.slice.call(arguments);
        var callRecord = { arguments: args, result: undefined, error: undefined, target: undefined, this: this };
        try {
            var result;
            if (implementation) {
                result = implementation.apply(this, arguments);
            } else {
                result = original.apply(this, arguments);
            }
            callRecord.result = result;
            callLog.push(callRecord);
            return result;
        } catch (e) {
            callRecord.error = e;
            callLog.push(callRecord);
            throw e;
        }
    };
    wrapper.mock = mockInfo;

    obj[methodName] = wrapper;
    this._mocks.push({ obj: obj, methodName: methodName, original: original });

    return wrapper;
};

MockTracker.prototype.fn = function (impl) {
    var fn = impl || function () {};
    var callLog = [];
    var mockInfo = {
        calls: callLog,
        callCount: function () { return callLog.length; },
        resetCalls: function () { callLog.length = 0; },
    };

    var wrapper = function () {
        var args = Array.prototype.slice.call(arguments);
        var callRecord = { arguments: args, result: undefined, error: undefined, target: undefined, this: this };
        try {
            var result = fn.apply(this, arguments);
            callRecord.result = result;
            callLog.push(callRecord);
            return result;
        } catch (e) {
            callRecord.error = e;
            callLog.push(callRecord);
            throw e;
        }
    };
    wrapper.mock = mockInfo;
    return wrapper;
};

MockTracker.prototype.restoreAll = function () {
    for (var i = this._mocks.length - 1; i >= 0; i--) {
        var m = this._mocks[i];
        m.obj[m.methodName] = m.original;
    }
    this._mocks = [];
};

MockTracker.prototype.reset = function () {
    for (var i = 0; i < this._mocks.length; i++) {
        var m = this._mocks[i];
        if (m.obj[m.methodName] && m.obj[m.methodName].mock) {
            m.obj[m.methodName].mock.calls.length = 0;
        }
    }
};

MockTracker.prototype.getter = function () {};
MockTracker.prototype.setter = function () {};
MockTracker.prototype.timers = { enable: function () {}, reset: function () {}, tick: function () {} };

var mock = new MockTracker();

function run() {
    // Stub — no-op for now
    return { on: function () { return this; }, once: function () { return this; } };
}

function __setFilterIndex(idx) {
    _subtestFilter = idx;
    _subtestRegistrationIndex = 0;
}

function __clearFilter() {
    _subtestFilter = null;
    _subtestRegistrationIndex = 0;
}

async function _awaitPendingTests() {
    while (_pendingTestPromises.length > 0) {
        var promises = _pendingTestPromises;
        _pendingTestPromises = [];
        await Promise.all(promises);
    }
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
    run,
    _awaitPendingTests,
    __setFilterIndex,
    __clearFilter
};

export default test;
