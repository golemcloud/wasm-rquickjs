// test-03-interceptors.js — Interceptor registration and instance creation
import assert from 'assert';
import axios from 'axios';

export const run = () => {
    // Create an instance with custom defaults
    const instance = axios.create({
        baseURL: 'https://api.example.com',
        timeout: 10000,
        headers: { 'X-App': 'test-app' }
    });

    // Verify instance has the defaults
    assert.strictEqual(instance.defaults.baseURL, 'https://api.example.com');
    assert.strictEqual(instance.defaults.timeout, 10000);

    // Register request interceptors
    const id1 = instance.interceptors.request.use(
        (config) => { config.headers['X-Intercepted'] = 'true'; return config; },
        (error) => Promise.reject(error)
    );
    assert.strictEqual(typeof id1, 'number');

    const id2 = instance.interceptors.request.use(
        (config) => { config.headers['X-Second'] = 'yes'; return config; }
    );
    assert.strictEqual(typeof id2, 'number');

    // Register response interceptor
    const id3 = instance.interceptors.response.use(
        (response) => response,
        (error) => Promise.reject(error)
    );
    assert.strictEqual(typeof id3, 'number');

    // Eject one interceptor
    instance.interceptors.request.eject(id1);

    // Clear all response interceptors
    instance.interceptors.response.clear();

    // getUri works on instance too
    const uri = instance.getUri({ url: '/data', params: { key: 'val' } });
    assert.ok(uri.includes('api.example.com/data'), 'should use baseURL');
    assert.ok(uri.includes('key=val'), 'should include params');

    return "PASS: axios.create, interceptor use/eject/clear, instance getUri";
};
