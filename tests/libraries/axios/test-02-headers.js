// test-02-headers.js — AxiosHeaders manipulation
import assert from 'assert';
import { AxiosHeaders } from 'axios';

export const run = () => {
    // Basic header creation and manipulation
    const headers = new AxiosHeaders();
    headers.set('Content-Type', 'application/json');
    headers.set('Authorization', 'Bearer token123');
    headers.set('X-Custom-Header', 'custom-value');

    assert.strictEqual(headers.get('content-type'), 'application/json');
    assert.strictEqual(headers.get('Content-Type'), 'application/json');
    assert.strictEqual(headers.get('authorization'), 'Bearer token123');

    // has() check (case-insensitive)
    assert.strictEqual(headers.has('content-type'), true);
    assert.strictEqual(headers.has('CONTENT-TYPE'), true);
    assert.strictEqual(headers.has('nonexistent'), false);

    // delete
    headers.delete('x-custom-header');
    assert.strictEqual(headers.has('x-custom-header'), false);

    // Constructor with object
    const headers2 = new AxiosHeaders({
        'Accept': 'text/html',
        'Cache-Control': 'no-cache'
    });
    assert.strictEqual(headers2.get('accept'), 'text/html');
    assert.strictEqual(headers2.get('cache-control'), 'no-cache');

    // toJSON
    const json = headers2.toJSON();
    assert.ok(typeof json === 'object');

    return "PASS: AxiosHeaders creation, get/set/has/delete, case-insensitive access";
};
