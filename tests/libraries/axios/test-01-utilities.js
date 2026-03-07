// test-01-utilities.js — Pure utility functions: getUri, HttpStatusCode, isAxiosError, isCancel
import assert from 'assert';
import axios, { HttpStatusCode, isAxiosError, isCancel, AxiosError, CanceledError, mergeConfig } from 'axios';

export const run = () => {
    // getUri builds a full URL from config without making a request
    const uri1 = axios.getUri({ url: '/users', baseURL: 'https://api.example.com' });
    assert.strictEqual(uri1, 'https://api.example.com/users');

    const uri2 = axios.getUri({ url: '/search', baseURL: 'https://api.example.com', params: { q: 'hello', page: 2 } });
    assert.ok(uri2.includes('q=hello'), 'should include q param');
    assert.ok(uri2.includes('page=2'), 'should include page param');

    // HttpStatusCode enum
    assert.strictEqual(HttpStatusCode.Ok, 200);
    assert.strictEqual(HttpStatusCode.NotFound, 404);
    assert.strictEqual(HttpStatusCode.InternalServerError, 500);
    assert.strictEqual(HttpStatusCode.Created, 201);

    // isAxiosError
    const axErr = new AxiosError('test error', 'ERR_BAD_REQUEST');
    assert.strictEqual(isAxiosError(axErr), true);
    assert.strictEqual(isAxiosError(new Error('regular')), false);
    assert.strictEqual(isAxiosError(null), false);

    // isCancel
    const cancelErr = new CanceledError('cancelled');
    assert.strictEqual(isCancel(cancelErr), true);
    assert.strictEqual(isCancel(new Error('not cancel')), false);

    // mergeConfig
    const merged = mergeConfig(
        { baseURL: 'https://api.example.com', timeout: 5000 },
        { timeout: 10000, headers: { 'X-Custom': 'value' } }
    );
    assert.strictEqual(merged.baseURL, 'https://api.example.com');
    assert.strictEqual(merged.timeout, 10000);

    return "PASS: axios utility functions (getUri, HttpStatusCode, isAxiosError, isCancel, mergeConfig)";
};
