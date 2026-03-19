import assert from 'node:assert';
import { AssertionError } from 'node:assert';

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
