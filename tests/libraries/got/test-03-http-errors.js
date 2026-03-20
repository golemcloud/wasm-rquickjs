// test-03-http-errors.js — HTTPError behavior and throwHttpErrors override
import assert from 'assert';
import got from 'got';
import {createMockResponse} from './helpers.js';

const notFoundResponse = () => createMockResponse('missing', 404, {'content-type': 'text/plain'});

export const run = async () => {
    const strictClient = got.extend({
        retry: {limit: 0},
        hooks: {
            beforeRequest: [
                () => notFoundResponse()
            ]
        }
    });

    await assert.rejects(
        async () => strictClient('https://example.test/not-found').text(),
        (error) => {
            assert.strictEqual(error.name, 'HTTPError');
            assert.strictEqual(error.response.statusCode, 404);
            return true;
        }
    );

    const lenientClient = got.extend({
        retry: {limit: 0},
        throwHttpErrors: false,
        hooks: {
            beforeRequest: [
                () => notFoundResponse()
            ]
        }
    });

    const response = await lenientClient('https://example.test/not-found');
    assert.strictEqual(response.statusCode, 404);
    assert.strictEqual(response.body, 'missing');

    return 'PASS: got throws HTTPError by default and can return non-2xx responses';
};
