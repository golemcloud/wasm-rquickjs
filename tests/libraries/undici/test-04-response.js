import assert from 'assert';
import { Response } from 'undici';

export const run = async () => {
    const jsonResponse = Response.json({ready: true});
    assert.strictEqual(jsonResponse.status, 200);
    assert.strictEqual(jsonResponse.headers.get('content-type'), 'application/json');
    assert.deepStrictEqual(await jsonResponse.json(), {ready: true});

    const redirected = Response.redirect('https://example.com/next', 302);
    assert.strictEqual(redirected.status, 302);
    assert.strictEqual(redirected.headers.get('location'), 'https://example.com/next');

    const errored = Response.error();
    assert.strictEqual(errored.type, 'error');
    assert.strictEqual(errored.status, 0);
    assert.strictEqual(errored.ok, false);

    const binary = new Response(new Uint8Array([117, 110, 100, 105, 99, 105]));
    const decoded = new TextDecoder().decode(await binary.arrayBuffer());
    assert.strictEqual(decoded, 'undici');

    return 'PASS: Response static helpers and body readers work as expected';
};
