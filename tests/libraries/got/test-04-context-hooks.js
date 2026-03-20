// test-04-context-hooks.js — context propagation through hooks
import assert from 'assert';
import got from 'got';
import {createMockResponse} from './helpers.js';

export const run = async () => {
    let observedToken;

    const client = got.extend({
        retry: {limit: 0},
        context: {token: 'default-token'},
        hooks: {
            beforeRequest: [
                (options) => {
                    observedToken = options.context.token;
                    options.headers['x-token'] = options.context.token;
                    return createMockResponse(
                        JSON.stringify({token: options.headers['x-token']}),
                        200,
                        {'content-type': 'application/json'}
                    );
                }
            ]
        }
    });

    const body = await client('https://example.test/context', {
        responseType: 'json',
        context: {token: 'request-token'}
    });

    assert.strictEqual(observedToken, 'request-token');
    assert.strictEqual(body.body.token, 'request-token');

    return 'PASS: got exposes per-request context values inside hooks';
};
