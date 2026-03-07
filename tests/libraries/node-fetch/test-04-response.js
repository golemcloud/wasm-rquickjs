// test-04-response.js — verify Response helpers and body readers
import assert from 'assert';
import {Response} from 'node-fetch';

export const run = async () => {
    const response = Response.json({message: 'hello'}, {status: 201});
    assert.strictEqual(response.status, 201);
    assert.strictEqual(response.headers.get('content-type'), 'application/json');
    assert.deepStrictEqual(await response.json(), {message: 'hello'});

    const redirect = Response.redirect('https://example.com/next', 302);
    assert.strictEqual(redirect.status, 302);
    assert.strictEqual(redirect.headers.get('location'), 'https://example.com/next');

    const textResponse = new Response('plain text body');
    assert.strictEqual(await textResponse.text(), 'plain text body');

    const errorResponse = Response.error();
    assert.strictEqual(errorResponse.type, 'error');
    assert.strictEqual(errorResponse.ok, false);

    return 'PASS: Response static helpers and body readers behave correctly';
};
