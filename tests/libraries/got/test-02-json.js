// test-02-json.js — JSON parsing and resolveBodyOnly behavior
import assert from 'assert';
import got from 'got';
import {createMockResponse} from './helpers.js';

export const run = async () => {
    const payload = {ok: true, source: 'mock'};

    const client = got.extend({
        retry: {limit: 0},
        responseType: 'json',
        resolveBodyOnly: true,
        hooks: {
            beforeRequest: [
                () => createMockResponse(JSON.stringify(payload), 200, {'content-type': 'application/json'})
            ]
        }
    });

    const body = await client('https://example.test/json');
    assert.deepStrictEqual(body, payload);

    return 'PASS: got parses JSON and returns body when resolveBodyOnly is enabled';
};
