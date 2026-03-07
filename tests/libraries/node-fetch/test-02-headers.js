// test-02-headers.js — validate header normalization and multi-value behavior
import assert from 'assert';
import {Headers} from 'node-fetch';

export const run = () => {
    const headers = new Headers({
        'Content-Type': 'application/json',
        'X-Trace-Id': 'abc123'
    });

    headers.append('X-Trace-Id', 'def456');

    assert.strictEqual(headers.get('content-type'), 'application/json');
    assert.strictEqual(headers.get('x-trace-id'), 'abc123, def456');
    assert.deepStrictEqual(headers.raw()['x-trace-id'], ['abc123', 'def456']);

    return 'PASS: Headers normalizes names and preserves repeated values';
};
