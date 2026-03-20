import assert from 'assert';
import { Request } from 'undici';

export const run = async () => {
    const request = new Request('https://example.com/items?limit=1', {
        method: 'post',
        headers: {
            'content-type': 'application/json'
        },
        body: JSON.stringify({name: 'test-item'})
    });

    assert.strictEqual(request.method, 'POST');
    assert.strictEqual(request.headers.get('content-type'), 'application/json');
    assert.strictEqual(request.url, 'https://example.com/items?limit=1');

    const cloned = request.clone();
    assert.strictEqual(await cloned.text(), JSON.stringify({name: 'test-item'}));

    let sawTypeError = false;
    try {
        new Request('https://example.com/get', {
            method: 'GET',
            body: 'not-allowed'
        });
    } catch (error) {
        sawTypeError = error instanceof TypeError;
    }

    assert.strictEqual(sawTypeError, true);

    return 'PASS: Request validates method/body combinations and supports clone';
};
