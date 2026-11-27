import assert from 'node:assert';
import { AssertionError } from 'node:assert';
import fs from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);

export const testOk = () => {
    try {
        assert(true);
        assert.ok(true);
        assert.ok(1);
        assert.ok('non-empty');

        let caught = false;
        try { assert(false); } catch (e) { caught = true; }
        if (!caught) throw new Error('assert(false) should have thrown');

        caught = false;
        try { assert.ok(0); } catch (e) { caught = true; }
        if (!caught) throw new Error('assert.ok(0) should have thrown');

        caught = false;
        try { assert.ok(''); } catch (e) { caught = true; }
        if (!caught) throw new Error("assert.ok('') should have thrown");

        caught = false;
        try { assert.ok(null); } catch (e) { caught = true; }
        if (!caught) throw new Error('assert.ok(null) should have thrown');

        caught = false;
        try { assert.ok(undefined); } catch (e) { caught = true; }
        if (!caught) throw new Error('assert.ok(undefined) should have thrown');

        // Test Error-as-message: should throw the Error directly
        caught = false;
        var customErr = new TypeError('custom');
        try { assert.ok(false, customErr); } catch (e) {
            caught = true;
            if (e !== customErr) throw new Error('Expected the custom Error to be thrown directly');
        }
        if (!caught) throw new Error('assert.ok(false, Error) should have thrown');

        // Test message factory
        caught = false;
        try {
            assert.ok(false, function() { return 'lazy message'; });
        } catch (e) {
            caught = true;
            if (e.message !== 'lazy message') throw new Error('Expected lazy message but got: ' + e.message);
        }
        if (!caught) throw new Error('assert.ok(false, factory) should have thrown');

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const testEqual = () => {
    try {
        assert.equal(1, 1);
        assert.equal('a', 'a');
        assert.equal(1, '1'); // loose equality

        let caught = false;
        try { assert.equal(1, 2); } catch (e) { caught = true; }
        if (!caught) throw new Error('assert.equal(1, 2) should have thrown');

        assert.notEqual(1, 2);

        caught = false;
        try { assert.notEqual(1, 1); } catch (e) { caught = true; }
        if (!caught) throw new Error('assert.notEqual(1, 1) should have thrown');

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const testStrictEqual = () => {
    try {
        assert.strictEqual(1, 1);
        assert.strictEqual('hello', 'hello');

        let caught = false;
        try { assert.strictEqual(1, '1'); } catch (e) { caught = true; }
        if (!caught) throw new Error("assert.strictEqual(1, '1') should have thrown");

        assert.notStrictEqual(1, '1');

        caught = false;
        try { assert.notStrictEqual(1, 1); } catch (e) { caught = true; }
        if (!caught) throw new Error('assert.notStrictEqual(1, 1) should have thrown');

        // NaN should be strictly equal to NaN (Object.is semantics)
        assert.strictEqual(NaN, NaN);

        // +0 and -0 should not be strictly equal
        caught = false;
        try { assert.strictEqual(0, -0); } catch (e) { caught = true; }
        if (!caught) throw new Error('assert.strictEqual(0, -0) should have thrown');

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const testDeepEqual = () => {
    try {
        assert.deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 });
        assert.deepEqual([1, 2, 3], [1, 2, 3]);
        assert.deepEqual({ a: { b: 1 } }, { a: { b: 1 } });

        // Loose deep equal: 1 == '1'
        assert.deepEqual({ a: 1 }, { a: '1' });

        let caught = false;
        try { assert.deepEqual({ a: 1 }, { a: 2 }); } catch (e) { caught = true; }
        if (!caught) throw new Error('assert.deepEqual({a:1}, {a:2}) should have thrown');

        assert.notDeepEqual({ a: 1 }, { a: 2 });

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const testDeepStrictEqual = () => {
    try {
        assert.deepStrictEqual({ a: 1 }, { a: 1 });
        assert.deepStrictEqual(new Date(0), new Date(0));
        assert.deepStrictEqual(/abc/g, /abc/g);

        // Independent assertions in a getter must not inherit util's skipPrototype option.
        class A { constructor() { this.value = 1; } }
        class B { constructor() { this.value = 1; } }
        const a = new A();
        const b = new B();
        const left = {
            get value() {
                assert.throws(() => assert.deepStrictEqual(a, b), { code: 'ERR_ASSERTION' });
                assert.notDeepStrictEqual(a, b);
                assert.strictEqual(isDeepStrictEqual(a, b), false);
                return a;
            }
        };
        assert.strictEqual(isDeepStrictEqual(left, { value: b }, true), true);
        assert.strictEqual(isDeepStrictEqual(a, b), false);
        const sentinel = new Error('getter failure');
        assert.throws(() => isDeepStrictEqual({
            get value() { throw sentinel; }
        }, { value: b }, true), (error) => error === sentinel);
        assert.throws(() => assert.deepStrictEqual(a, b), { code: 'ERR_ASSERTION' });

        // Nested comparisons also have independent recursion budgets.
        const nested = Array.from({ length: 3000 }, (_, index) => index);
        const tail = Array.from({ length: 2500 }, (_, index) => index);
        for (const compare of [assert.deepStrictEqual, isDeepStrictEqual]) {
            assert.strictEqual(isDeepStrictEqual({
                get a() {
                    compare(nested, nested.slice());
                    return 1;
                },
                z: tail
            }, { a: 1, z: tail.slice() }), true);
        }

        // Strict: type matters
        let caught = false;
        try { assert.deepStrictEqual({ a: 1 }, { a: '1' }); } catch (e) { caught = true; }
        if (!caught) throw new Error("assert.deepStrictEqual({a:1}, {a:'1'}) should have thrown");

        assert.notDeepStrictEqual({ a: 1 }, { a: '1' });

        // WeakMap: only reference-equal
        var wm = new WeakMap();
        assert.deepStrictEqual(wm, wm); // same ref
        caught = false;
        try { assert.deepStrictEqual(new WeakMap(), new WeakMap()); } catch (e) { caught = true; }
        if (!caught) throw new Error('distinct WeakMaps should not be deepStrictEqual');

        // WeakSet: only reference-equal
        caught = false;
        try { assert.deepStrictEqual(new WeakSet(), new WeakSet()); } catch (e) { caught = true; }
        if (!caught) throw new Error('distinct WeakSets should not be deepStrictEqual');

        // Boxed primitives
        assert.deepStrictEqual(Object(1), Object(1));
        assert.deepStrictEqual(Object('hello'), Object('hello'));
        assert.deepStrictEqual(Object(true), Object(true));
        caught = false;
        try { assert.deepStrictEqual(Object(1), Object(2)); } catch (e) { caught = true; }
        if (!caught) throw new Error('Object(1) !== Object(2) should have thrown');
        caught = false;
        try { assert.deepStrictEqual(Object(1), Object('1')); } catch (e) { caught = true; }
        if (!caught) throw new Error('Object(1) !== Object("1") should have thrown');

        // RegExp lastIndex
        var r1 = /abc/g;
        var r2 = /abc/g;
        r1.lastIndex = 5;
        caught = false;
        try { assert.deepStrictEqual(r1, r2); } catch (e) { caught = true; }
        if (!caught) throw new Error('RegExp with different lastIndex should not be equal');

        // Error with cause
        var e1 = new Error('msg');
        e1.cause = 'reason';
        var e2 = new Error('msg');
        e2.cause = 'reason';
        assert.deepStrictEqual(e1, e2);

        var e3 = new Error('msg');
        e3.cause = 'different';
        caught = false;
        try { assert.deepStrictEqual(e1, e3); } catch (e) { caught = true; }
        if (!caught) throw new Error('Errors with different cause should not be equal');

        // Map with object keys (deep matching)
        var key1 = { id: 1 };
        var key2 = { id: 1 }; // structurally equal
        var m1 = new Map([[key1, 'val']]);
        var m2 = new Map([[key2, 'val']]);
        assert.deepStrictEqual(m1, m2);

        // Symbol-keyed properties in strict mode
        var sym = Symbol('test');
        var obj1 = {};
        obj1[sym] = 42;
        var obj2 = {};
        obj2[sym] = 42;
        assert.deepStrictEqual(obj1, obj2);

        var obj3 = {};
        obj3[sym] = 99;
        caught = false;
        try { assert.deepStrictEqual(obj1, obj3); } catch (e) { caught = true; }
        if (!caught) throw new Error('Objects with different Symbol values should not be equal');

        // Sparse arrays vs explicit undefined
        caught = false;
        try {
            var sparse = new Array(1); // [<empty>]
            var explicit = [undefined]; // [undefined]
            assert.deepStrictEqual(sparse, explicit);
        } catch (e) { caught = true; }
        if (!caught) throw new Error('Sparse array vs [undefined] should not be strictEqual');

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const testThrows = () => {
    try {
        assert.throws(() => { throw new Error('test'); });
        assert.throws(() => { throw new Error('hello world'); }, /hello/);
        assert.throws(() => { throw new TypeError('test'); }, TypeError);
        assert.throws(() => { throw new Error('test'); }, { message: 'test' });

        // Object matching with regex for message
        assert.throws(() => { throw new Error('hello world'); }, { message: /hello/ });

        // Validation function
        assert.throws(() => { throw new Error('custom'); }, function(err) {
            return err.message === 'custom';
        });

        let caught = false;
        try { assert.throws(() => {}); } catch (e) { caught = true; }
        if (!caught) throw new Error('assert.throws with no error should have thrown');

        // String as second arg becomes message, not error matcher
        caught = false;
        try { assert.throws(() => {}, 'custom message'); } catch (e) {
            caught = true;
            if (e.message !== 'Missing expected exception: custom message') throw new Error('Expected "Missing expected exception: custom message" but got: ' + e.message);
        }
        if (!caught) throw new Error('assert.throws with string message should have thrown');

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const testDoesNotThrow = () => {
    try {
        assert.doesNotThrow(() => { return 1; });

        let caught = false;
        try { assert.doesNotThrow(() => { throw new Error('oops'); }); } catch (e) { caught = true; }
        if (!caught) throw new Error('assert.doesNotThrow with throwing fn should have thrown');

        // doesNotThrow with non-matching error type should rethrow original
        caught = false;
        try {
            assert.doesNotThrow(() => { throw new RangeError('out of range'); }, TypeError);
        } catch (e) {
            caught = true;
            // Should be the original RangeError, not an AssertionError
            if (!(e instanceof RangeError)) throw new Error('Expected RangeError to be rethrown, got: ' + e.constructor.name);
        }
        if (!caught) throw new Error('doesNotThrow should rethrow non-matching errors');

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const testIfError = () => {
    try {
        assert.ifError(null);
        assert.ifError(undefined);

        let caught = false;
        try { assert.ifError(new Error('test')); } catch (e) { caught = true; }
        if (!caught) throw new Error('assert.ifError(new Error) should have thrown');

        caught = false;
        try { assert.ifError(1); } catch (e) { caught = true; }
        if (!caught) throw new Error('assert.ifError(1) should have thrown');

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const testMatch = () => {
    try {
        assert.match('hello world', /hello/);

        let caught = false;
        try { assert.match('hello', /goodbye/); } catch (e) { caught = true; }
        if (!caught) throw new Error('assert.match should have thrown');

        assert.doesNotMatch('hello', /goodbye/);

        const global = /a/g;
        assert.match('aa', global);
        if (global.lastIndex !== 1) throw new Error('assert.match reset RegExp.lastIndex before matching');
        assert.match('aa', global);
        if (global.lastIndex !== 2) throw new Error('assert.match did not preserve RegExp.lastIndex');
        caught = false;
        try { assert.match('aa', global); } catch (e) { caught = true; }
        if (!caught || global.lastIndex !== 0) {
            throw new Error('assert.match did not preserve global RegExp execution semantics');
        }

        caught = false;
        try { assert.doesNotMatch('hello', /hello/); } catch (e) { caught = true; }
        if (!caught) throw new Error('assert.doesNotMatch should have thrown');

        // Non-string first arg should throw AssertionError (not TypeError)
        caught = false;
        try { assert.match(123, /123/); } catch (e) {
            caught = true;
            if (!(e instanceof AssertionError)) throw new Error('Expected AssertionError for non-string arg, got: ' + e.constructor.name);
        }
        if (!caught) throw new Error('assert.match(number) should have thrown');

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const testFail = () => {
    try {
        let caught = false;
        try { assert.fail('custom message'); } catch (e) {
            caught = true;
            if (e.message !== 'custom message') {
                throw new Error('Expected message "custom message" but got "' + e.message + '"');
            }
        }
        if (!caught) throw new Error('assert.fail should have thrown');

        caught = false;
        try { assert.fail(); } catch (e) {
            caught = true;
            if (e.message !== 'Failed') throw new Error('Expected default "Failed" message');
        }
        if (!caught) throw new Error('assert.fail() should have thrown');

        // Error-as-message should throw it directly
        caught = false;
        var customErr = new TypeError('direct throw');
        try { assert.fail(customErr); } catch (e) {
            caught = true;
            if (e !== customErr) throw new Error('Expected the Error to be thrown directly');
        }
        if (!caught) throw new Error('assert.fail(Error) should have thrown');

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const testRejects = async () => {
    try {
        await assert.rejects(async () => { throw new Error('async error'); });
        await assert.rejects(async () => { throw new TypeError('type err'); }, TypeError);
        await assert.rejects(Promise.reject(new Error('rejected')));

        let caught = false;
        try {
            await assert.rejects(async () => 42);
        } catch (e) {
            caught = true;
        }
        if (!caught) throw new Error('assert.rejects should have thrown for resolved promise');

        await assert.doesNotReject(async () => 42);
        await assert.doesNotReject(Promise.resolve(42));

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const testStrictMode = () => {
    try {
        assert.strict.equal(1, 1);

        let caught = false;
        try { assert.strict.equal(1, '1'); } catch (e) { caught = true; }
        if (!caught) throw new Error("assert.strict.equal(1, '1') should have thrown");

        assert.strict.deepEqual({ a: 1 }, { a: 1 });

        caught = false;
        try { assert.strict.deepEqual({ a: 1 }, { a: '1' }); } catch (e) { caught = true; }
        if (!caught) throw new Error("assert.strict.deepEqual({a:1}, {a:'1'}) should have thrown");

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const testAssertionError = () => {
    try {
        const err = new AssertionError({
            actual: 1,
            expected: 2,
            operator: 'strictEqual',
            message: 'values not equal',
        });

        if (err.name !== 'AssertionError') throw new Error('Expected name AssertionError but got ' + err.name);
        if (err.actual !== 1) throw new Error('Expected actual 1 but got ' + err.actual);
        if (err.expected !== 2) throw new Error('Expected expected 2 but got ' + err.expected);
        if (err.operator !== 'strictEqual') throw new Error('Expected operator strictEqual but got ' + err.operator);
        // Node.js appends the diff to the user message
        if (!err.message.startsWith('values not equal')) throw new Error('Expected message to start with "values not equal" but got ' + err.message);
        if (err.code !== 'ERR_ASSERTION') throw new Error('Expected code ERR_ASSERTION but got ' + err.code);
        if (!(err instanceof Error)) throw new Error('Expected instance of Error');
        if (!(err instanceof AssertionError)) throw new Error('Expected instance of AssertionError');
        if (err.generatedMessage !== false) throw new Error('Expected generatedMessage false');

        // Test auto-generated message
        const err2 = new AssertionError({
            actual: 'foo',
            expected: 'bar',
            operator: 'strictEqual',
        });
        if (err2.generatedMessage !== true) throw new Error('Expected generatedMessage true');
        if (!err2.message.includes('foo')) throw new Error('Auto message should include actual value');

        // toString should include ERR_ASSERTION
        var str = err.toString();
        if (!str.includes('ERR_ASSERTION')) throw new Error('toString should include ERR_ASSERTION, got: ' + str);

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const testEvalGeneratedMessage = () => {
    let evalError;
    try {
        eval('console.log("FOO");\nassert.ok(1 === 2);');
    } catch (err) {
        evalError = err;
    }
    if (!evalError || evalError.code !== 'ERR_ASSERTION' || evalError.message !== 'false == true') return false;

    // A Function constructor's synthetic source is not the calling module.
    for (const invoke of [
        () => Function('assert', 'assert(false)')(assert),
        () => new Function('assert', 'assert.ok(false)')(assert),
        () => Reflect.construct(Function, ['assert', 'assert(false)'])(assert),
    ]) {
        assert.throws(invoke, { code: 'ERR_ASSERTION', message: 'false == true' });
    }

    const filename = '/assert-eval-named-function.cjs';
    fs.writeFileSync(filename, [
        "const assert = require('assert');",
        "const namedFunction = { ['eval helper']() { assert.ok(false); } };",
        "try { namedFunction['eval helper'](); } catch (err) { module.exports = err.message; }",
    ].join('\n'));
    const message = require(filename);
    return message !== 'false == true' &&
        message.startsWith('The expression evaluated to a falsy value:');
};

// Subtests await async setup and teardown, then restore mocks before settling, for synchronous,
// promise and done-callback bodies. Teardown runs once even after setup/body failure; that
// primary error wins over a secondary teardown error. Node reports child failures through the
// parent and resolves t.test(); this runtime rejects, so error identity is checked only on
// rejection. Both outcomes are accepted, but cleanup order and mock restoration always apply.
export const testSubtestAfterEachOnce = async () => {
    try {
        for (const kind of ['sync', 'promise', 'callback']) {
            const target = { method() { return 'original'; } };
            const calls = [];
            await test('async hooks ' + kind, async (t) => {
                t.beforeEach(async (st) => {
                    await null;
                    st.mock.method(target, 'method', () => 'mocked');
                    calls.push('before');
                });
                t.afterEach(async () => {
                    await null;
                    calls.push('after:' + target.method());
                });
                const body = (st) => { calls.push('body:' + target.method()); };
                const fn = kind === 'callback' ? (st, done) => { body(st); done(); }
                    : kind === 'promise' ? async (st) => { await null; body(st); } : body;
                await t.test(kind, fn);
                calls.push('settled:' + target.method());
            });
            assert.deepStrictEqual(calls, ['before', 'body:mocked', 'after:mocked', 'settled:original']);
        }

        for (const phase of ['setup', 'body', 'teardown']) {
            const primary = new Error(phase + ' failed');
            const secondary = new Error('secondary teardown failure');
            const target = { method() { return 'original'; } };
            const calls = [];
            await test('async hook rejection ' + phase, async (t) => {
                t.beforeEach(async (st) => {
                    st.mock.method(target, 'method', () => 'mocked');
                    await null;
                    calls.push('before');
                    if (phase === 'setup') throw primary;
                });
                t.afterEach(async () => {
                    await null;
                    calls.push('after:' + target.method());
                    throw phase === 'teardown' ? primary : secondary;
                });
                try {
                    await t.test(phase, async () => {
                        calls.push('body');
                        if (phase === 'body') throw primary;
                    });
                } catch (e) {
                    assert.strictEqual(e, primary);
                }
                calls.push('settled:' + target.method());
            });
            assert.deepStrictEqual(calls, phase === 'setup'
                ? ['before', 'after:mocked', 'settled:original']
                : ['before', 'body', 'after:mocked', 'settled:original']);
        }

        const hookError = new Error('afterEach failed');
        const target = { method() { return 'original'; } };
        const calls = [];
        const outcomes = {};
        const mockAndRecord = (st, kind) => {
            st.mock.method(target, 'method', () => 'mocked');
            calls.push(kind + ':' + target.method());
        };
        await test('afterEach once', async (t) => {
            t.afterEach(() => {
                calls.push('afterEach');
                throw hookError;
            });
            const subtests = [
                ['sync', (st) => { mockAndRecord(st, 'sync'); }],
                ['promise', async (st) => { await null; mockAndRecord(st, 'promise'); }],
                ['callback', (st, done) => { mockAndRecord(st, 'callback'); done(); }],
            ];
            for (const [kind, fn] of subtests) {
                try {
                    await t.test(kind, fn);
                    outcomes[kind] = 'resolved';
                } catch (e) {
                    outcomes[kind] = e === hookError ? 'hook-error' : e;
                }
                calls.push(kind + ':' + target.method());
            }
        });
        assert.deepStrictEqual(calls, [
            'sync:mocked', 'afterEach', 'sync:original',
            'promise:mocked', 'afterEach', 'promise:original',
            'callback:mocked', 'afterEach', 'callback:original',
        ]);
        for (const kind of ['sync', 'promise', 'callback']) {
            assert.ok(outcomes[kind] === 'resolved' || outcomes[kind] === 'hook-error', kind);
        }
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};
