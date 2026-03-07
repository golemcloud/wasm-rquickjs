// test-05-http-post.js — HTTP POST request and error handling
import assert from 'assert';
import axios, { isAxiosError } from 'axios';

export const run = async () => {
    // POST JSON data
    const response = await axios.post('https://httpbin.org/post', {
        name: 'test-user',
        value: 42
    }, {
        timeout: 15000
    });

    assert.strictEqual(response.status, 200);
    assert.ok(response.data, 'response should have data');
    const posted = JSON.parse(response.data.data);
    assert.strictEqual(posted.name, 'test-user');
    assert.strictEqual(posted.value, 42);

    // Test error handling — request to a 404 endpoint
    try {
        await axios.get('https://httpbin.org/status/404', { timeout: 15000 });
        throw new Error('should have thrown');
    } catch (err) {
        assert.strictEqual(isAxiosError(err), true);
        assert.strictEqual(err.response.status, 404);
    }

    return "PASS: HTTP POST with JSON body, error handling for 404";
};
