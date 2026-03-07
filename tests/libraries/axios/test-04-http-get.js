// test-04-http-get.js — Actual HTTP GET request using a public API
import assert from 'assert';
import axios from 'axios';

export const run = async () => {
    // Use httpbin.org for a reliable public API
    const response = await axios.get('https://httpbin.org/get', {
        params: { test: 'axios-wasm' },
        timeout: 15000
    });

    assert.strictEqual(response.status, 200);
    assert.ok(response.data, 'response should have data');
    assert.ok(response.data.args, 'response should have args');
    assert.strictEqual(response.data.args.test, 'axios-wasm');
    assert.ok(response.headers, 'response should have headers');

    // Verify response structure
    assert.strictEqual(typeof response.config, 'object');

    return "PASS: HTTP GET request to httpbin.org with params";
};
