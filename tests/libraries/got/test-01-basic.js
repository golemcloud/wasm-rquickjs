// test-01-basic.js — basic GET flow using a mocked transport
import assert from 'assert';
import got from 'got';
import {createMockResponse} from './helpers.js';

export const run = async () => {
    const client = got.extend({
        retry: {limit: 0},
        hooks: {
            beforeRequest: [
                () => createMockResponse('hello from got', 200, {'content-type': 'text/plain'})
            ]
        }
    });

    const text = await client('https://example.test/hello').text();
    assert.strictEqual(text, 'hello from got');

    return 'PASS: got basic request resolves mocked text response';
};
