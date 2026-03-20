import assert from 'assert';
import { fetch } from 'undici';

export const run = async () => {
    const textResponse = await fetch('data:text/plain,Hello%20undici');
    assert.strictEqual(textResponse.status, 200);
    assert.strictEqual(await textResponse.text(), 'Hello undici');

    const jsonResponse = await fetch('data:application/json,%7B%22ok%22%3Atrue%2C%22client%22%3A%22undici%22%7D');
    assert.deepStrictEqual(await jsonResponse.json(), {ok: true, client: 'undici'});

    return 'PASS: undici fetch handles data: URIs and response body parsing';
};
