// test-03-request.js — verify Request construction, cloning, and body handling
import assert from 'assert';
import {Request, Blob} from 'node-fetch';

export const run = async () => {
    const request = new Request('https://example.com/upload', {
        method: 'POST',
        headers: {'X-Test': 'true'},
        body: new Blob(['hello node-fetch'], {type: 'text/plain'})
    });

    assert.strictEqual(request.method, 'POST');
    assert.strictEqual(request.headers.get('x-test'), 'true');
    assert.strictEqual(request.headers.get('content-type'), 'text/plain');

    const cloned = request.clone();
    assert.strictEqual(await request.text(), 'hello node-fetch');
    assert.strictEqual(await cloned.text(), 'hello node-fetch');

    let gotTypeError = false;
    try {
        new Request('https://example.com', {method: 'GET', body: 'not allowed'});
    } catch (e) {
        gotTypeError = e instanceof TypeError;
    }
    assert.ok(gotTypeError);

    return 'PASS: Request validates method/body constraints and supports clone';
};
