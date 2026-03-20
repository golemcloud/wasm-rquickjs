// test-05-instances.js — instance extension and defaults inheritance
import assert from 'assert';
import got from 'got';
import {createMockResponse} from './helpers.js';

export const run = async () => {
    const baseClient = got.extend({
        retry: {limit: 0},
        headers: {'x-base': 'base'},
        hooks: {
            beforeRequest: [
                (options) => createMockResponse(
                    JSON.stringify({
                        hasBaseHeader: options.headers['x-base'] === 'base',
                        hasChildHeader: options.headers['x-child'] === 'child'
                    }),
                    200,
                    {'content-type': 'application/json'}
                )
            ]
        }
    });

    const childClient = baseClient.extend({
        headers: {'x-child': 'child'}
    });

    const response = await childClient('https://example.test/extend', {responseType: 'json'});
    assert.strictEqual(response.body.hasBaseHeader, true);
    assert.strictEqual(response.body.hasChildHeader, true);

    return 'PASS: got.extend inherits and merges instance defaults';
};
