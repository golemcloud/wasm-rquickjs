// test-01-basic.js — fetch data: URI and parse response payloads
import assert from 'assert';
import fetch from 'node-fetch';

export const run = async () => {
    const textResponse = await fetch('data:text/plain,Hello%20node-fetch');
    assert.strictEqual(textResponse.status, 200);
    assert.strictEqual(await textResponse.text(), 'Hello node-fetch');

    const jsonResponse = await fetch('data:application/json,%7B%22ok%22%3Atrue%7D');
    assert.deepStrictEqual(await jsonResponse.json(), {ok: true});

    return 'PASS: node-fetch handles data: URIs and basic response parsing';
};
