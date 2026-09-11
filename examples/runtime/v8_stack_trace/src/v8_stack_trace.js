import assert from 'node:assert';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import module, { createRequire } from 'node:module';
import { inspect } from 'node:util';

const require = createRequire(import.meta.url);

// Test 1: Error.captureStackTrace exists as a function
export const testCaptureStackTraceExists = () => {
    try {
        assert.strictEqual(typeof Error.captureStackTrace, 'function');
        assert.strictEqual(typeof Error.stackTraceLimit, 'number');
        return true;
    } catch (e) {
        console.error('testCaptureStackTraceExists FAIL:', e.message);
        return false;
    }
};

// Test 2: Basic Error.captureStackTrace usage — sets .stack on target
export const testCaptureStackTraceBasic = () => {
    try {
        const obj = {};
        Error.captureStackTrace(obj);
        assert.strictEqual(typeof obj.stack, 'string');
        assert(obj.stack.length > 0, 'stack should be non-empty');
        return true;
    } catch (e) {
        console.error('testCaptureStackTraceBasic FAIL:', e.message);
        return false;
    }
};

// Test 3: Error.prepareStackTrace receives CallSite objects
export const testPrepareStackTrace = () => {
    try {
        let receivedCallSites = null;
        const origPrepare = Error.prepareStackTrace;

        Error.prepareStackTrace = function (error, callSites) {
            receivedCallSites = callSites;
            return callSites;
        };

        const obj = {};
        Error.captureStackTrace(obj);
        // Access .stack to trigger prepareStackTrace
        const stack = obj.stack;

        Error.prepareStackTrace = origPrepare;

        assert(Array.isArray(receivedCallSites), 'callSites should be an array');
        assert(receivedCallSites.length > 0, 'callSites should be non-empty');

        // Each call site should have V8-compatible methods
        const site = receivedCallSites[0];
        assert.strictEqual(typeof site.getFileName, 'function');
        assert.strictEqual(typeof site.getLineNumber, 'function');
        assert.strictEqual(typeof site.getColumnNumber, 'function');
        assert.strictEqual(typeof site.getFunctionName, 'function');

        return true;
    } catch (e) {
        console.error('testPrepareStackTrace FAIL:', e.message);
        return false;
    }
};

// Test 4: CallSite methods return correct types
export const testCallSiteMethods = () => {
    try {
        let callSites = null;
        const origPrepare = Error.prepareStackTrace;

        Error.prepareStackTrace = function (error, sites) {
            // Only capture the CallSites from our captureStackTrace call,
            // not from internal Error construction in the ErrorShim.
            if (callSites === null) {
                callSites = sites;
            }
            return 'custom-stack';
        };

        const obj = {};
        Error.captureStackTrace(obj);
        void obj.stack;

        Error.prepareStackTrace = origPrepare;

        assert(Array.isArray(callSites), 'callSites should be an array');
        assert(callSites.length > 0, 'callSites should be non-empty');

        const site = callSites[0];

        // Check all critical methods
        const methods = [
            'getThis', 'getTypeName', 'getFunction', 'getFunctionName',
            'getMethodName', 'getFileName', 'getLineNumber', 'getColumnNumber',
            'getEvalOrigin', 'isToplevel', 'isEval', 'isNative', 'isConstructor',
            'isAsync', 'isPromiseAll', 'getPromiseIndex', 'getScriptNameOrSourceURL',
            'toString'
        ];

        for (const m of methods) {
            assert.strictEqual(typeof site[m], 'function', `CallSite.${m} should be a function`);
        }

        // Verify return types
        assert(site.getFileName() === null || typeof site.getFileName() === 'string');
        assert.strictEqual(typeof site.getLineNumber(), 'number');
        assert.strictEqual(typeof site.getColumnNumber(), 'number');
        assert.strictEqual(typeof site.isEval(), 'boolean');
        assert.strictEqual(typeof site.isNative(), 'boolean');
        assert.strictEqual(typeof site.isConstructor(), 'boolean');
        assert.strictEqual(typeof site.isToplevel(), 'boolean');
        assert.strictEqual(typeof site.toString(), 'string');

        return true;
    } catch (e) {
        console.error('testCallSiteMethods FAIL:', e.message);
        return false;
    }
};

export const testLatePrepareStackTrace = () => {
    const originalPrepare = Error.prepareStackTrace;
    try {
        Error.prepareStackTrace = undefined;
        const lateTarget = {};
        Error.captureStackTrace(lateTarget);
        Error.prepareStackTrace = () => 'late-prepare';
        assert.strictEqual(lateTarget.stack, 'late-prepare');

        Error.prepareStackTrace = () => 'capture-time-prepare';
        const removedTarget = {};
        Error.captureStackTrace(removedTarget);
        Error.prepareStackTrace = undefined;
        assert.strictEqual(typeof removedTarget.stack, 'string');
        assert.notStrictEqual(removedTarget.stack, 'capture-time-prepare');
        return true;
    } catch (e) {
        console.error('testLatePrepareStackTrace FAIL:', e.message);
        return false;
    } finally {
        Error.prepareStackTrace = originalPrepare;
    }
};

export const testDefaultErrorStackHeaders = () => {
    const originalPrepare = Error.prepareStackTrace;
    try {
        Error.prepareStackTrace = undefined;
        assert.match(new Error('base').stack, /^Error: base(?:\n|$)/);
        assert.match(new TypeError('native').stack, /^TypeError: native(?:\n|$)/);
        assert.match(new Error().stack, /^Error(?:\n|$)/);
        class CustomError extends Error {}
        CustomError.prototype.name = 'CustomError';
        assert.match(new CustomError('custom').stack, /^CustomError: custom(?:\n|$)/);
        class EmptyNameError extends Error {}
        EmptyNameError.prototype.name = '';
        assert.match(new EmptyNameError('message-only').stack, /^message-only(?:\n|$)/);
        const originalToString = Error.prototype.toString;
        Error.prototype.toString = () => 'POISON';
        const protectedHeader = new Error('protected').stack;
        Error.prototype.toString = originalToString;
        assert.match(protectedHeader, /^Error: protected(?:\n|$)/);
        function captureNamedFrame() {
            return new Error('named-frame').stack;
        }
        assert.match(captureNamedFrame().split('\n')[1], /^\s*at captureNamedFrame \(.+:\d+:\d+\)$/);
        const originalObjectToString = Object.prototype.toString;
        let protectedCallSiteStack;
        try {
            Object.prototype.toString = () => 'FAKE';
            protectedCallSiteStack = new Error('protected-call-site').stack;
        } finally {
            Object.prototype.toString = originalObjectToString;
        }
        assert.doesNotMatch(protectedCallSiteStack, /FAKE/);
        assert.match(protectedCallSiteStack.split('\n')[1], /^\s*at .+:\d+:\d+/);
        return true;
    } catch (e) {
        console.error('testDefaultErrorStackHeaders FAIL:', e.message);
        return false;
    } finally {
        Error.prepareStackTrace = originalPrepare;
    }
};

export const testErrorInspectUsesCurrentName = () => {
    try {
        const error = new RangeError('foo');
        error.name = 404;
        assert.match(inspect(error), /^404 \[RangeError\]: foo(?:\n|$)/);

        const manualStackError = new RangeError('foo');
        manualStackError.stack = 'RangeError: foo\n    at manual (x.js:1:2)';
        manualStackError.name = 404;
        assert.strictEqual(
            inspect(manualStackError),
            'RangeError: foo\n    at manual (x.js:1:2)',
        );
        return true;
    } catch (e) {
        console.error('testErrorInspectUsesCurrentName FAIL:', e.message);
        return false;
    }
};

export const testAssertionListenerStackFrame = () => {
    const emitter = new EventEmitter();
    emitter.on('failure', assert);
    try {
        emitter.emit('failure', false);
    } catch (error) {
        return String(error.stack).split('\n')[1] || '';
    }
    return '';
};

export const testCjsCallSiteLineOffset = () => {
    const originalPrepare = Error.prepareStackTrace;
    const filename = '/v8-call-site-line-offset.cjs';
    const mapFilename = '/v8-call-site-line-offset.cjs.map';
    try {
        module.setSourceMapsSupport(true);
        Error.prepareStackTrace = (_error, sites) => sites[0];
        fs.writeFileSync(filename, [
            'function branch() {',
            "    throw Error('site');",
            '}',
            'branch();',
            '//# sourceMappingURL=v8-call-site-line-offset.cjs.map',
        ].join('\n'));
        fs.writeFileSync(mapFilename, JSON.stringify({
            version: 3,
            sources: ['v8-call-site-line-offset.ts'],
            names: [],
            mappings: 'AAAA;AACA;AACA;AACA',
        }));
        try {
            require(filename);
        } catch (error) {
            return String(error.stack.getLineNumber());
        }
        return '';
    } finally {
        delete require.cache[filename];
        Error.prepareStackTrace = originalPrepare;
    }
};

export const testPrepareStackTraceDescriptors = () => {
    try {
        const customPrepare = () => 'custom-prepare';
        Error.prepareStackTrace = customPrepare;
        Object.defineProperty(Error, 'prepareStackTrace', { enumerable: false });
        assert.strictEqual(Error.prepareStackTrace, customPrepare);
        assert.strictEqual(new Error('partial-descriptor').stack, 'custom-prepare');

        let getterCalls = 0;
        Object.defineProperty(Error, 'prepareStackTrace', {
            get() {
                getterCalls++;
                return customPrepare;
            },
            configurable: true,
        });
        assert.strictEqual(getterCalls, 0);
        assert.strictEqual(new TypeError('accessor').stack, 'custom-prepare');

        delete Error.prepareStackTrace;
        assert.match(new Error('deleted').stack, /^Error: deleted(?:\n|$)/);

        Object.defineProperty(Error, 'prepareStackTrace', {
            value: customPrepare,
            writable: true,
            configurable: true,
        });
        Object.freeze(Error);
        const descriptor = Object.getOwnPropertyDescriptor(Error, 'prepareStackTrace');
        assert.strictEqual(descriptor.writable, false);
        assert.strictEqual(descriptor.configurable, false);
        assert.strictEqual(new Error('frozen').stack, 'custom-prepare');
        return true;
    } catch (e) {
        console.error('testPrepareStackTraceDescriptors FAIL:', e.message);
        return false;
    }
};

// Test 5: constructorOpt parameter strips frames
export const testConstructorOpt = () => {
    try {
        let callSites = null;
        const origPrepare = Error.prepareStackTrace;

        Error.prepareStackTrace = function (error, sites) {
            callSites = sites;
            return sites;
        };

        function MyError(message) {
            Error.captureStackTrace(this, MyError);
            this.message = message;
        }

        function callerFunction() {
            return new MyError('test');
        }

        const err = callerFunction();
        // Access .stack to trigger prepareStackTrace
        const stack = err.stack;

        Error.prepareStackTrace = origPrepare;

        assert(Array.isArray(callSites) && callSites.length > 0);

        // The first frame should NOT be MyError (it should be stripped)
        const firstFn = callSites[0].getFunctionName();
        assert.notStrictEqual(firstFn, 'MyError',
            'constructorOpt should strip frames including the constructor');

        return true;
    } catch (e) {
        console.error('testConstructorOpt FAIL:', e.message);
        return false;
    }
};

// Test 6: Error.stackTraceLimit is readable/writable
export const testStackTraceLimit = () => {
    try {
        const origLimit = Error.stackTraceLimit;

        assert.strictEqual(typeof Error.stackTraceLimit, 'number');

        Error.stackTraceLimit = 42;
        assert.strictEqual(Error.stackTraceLimit, 42);

        Error.stackTraceLimit = origLimit;
        return true;
    } catch (e) {
        console.error('testStackTraceLimit FAIL:', e.message);
        return false;
    }
};

// Test 7: The exact depd pattern — the real-world use case this fix enables
export const testDepdPattern = () => {
    try {
        // This is exactly what depd does:
        function prepareObjectStackTrace(obj, stack) {
            return stack;
        }

        function getStack() {
            var limit = Error.stackTraceLimit;
            var obj = {};
            var prep = Error.prepareStackTrace;

            Error.prepareStackTrace = prepareObjectStackTrace;
            Error.stackTraceLimit = Math.max(10, limit);

            Error.captureStackTrace(obj);

            var stack = obj.stack.slice(1);

            Error.prepareStackTrace = prep;
            Error.stackTraceLimit = limit;

            return stack;
        }

        function callSiteLocation(callSite) {
            var file = callSite.getFileName() || '<anonymous>';
            var line = callSite.getLineNumber();
            var colm = callSite.getColumnNumber();

            var site = [file, line, colm];
            site.callSite = callSite;
            site.name = callSite.getFunctionName();

            return site;
        }

        function depd(namespace) {
            var stack = getStack();
            var site = callSiteLocation(stack[1]);
            var file = site[0];
            return { file, namespace };
        }

        // This call should NOT throw — it's the exact pattern that was failing
        const result = depd('test-namespace');
        assert.strictEqual(result.namespace, 'test-namespace');
        assert.strictEqual(typeof result.file, 'string');

        return true;
    } catch (e) {
        console.error('testDepdPattern FAIL:', e.message);
        return false;
    }
};
