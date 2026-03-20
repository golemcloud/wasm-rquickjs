import assert from 'assert';
import { Headers } from 'undici';

export const run = () => {
    const headers = new Headers({
        'Content-Type': 'application/json',
        'X-Custom': ' value '
    });

    assert.strictEqual(headers.get('content-type'), 'application/json');
    assert.strictEqual(headers.get('x-custom'), 'value');

    headers.append('x-custom', 'next');
    assert.strictEqual(headers.get('x-custom'), 'value, next');

    headers.set('accept', 'application/json');
    assert.strictEqual(headers.has('Accept'), true);

    headers.delete('x-custom');
    assert.strictEqual(headers.has('x-custom'), false);

    const iterated = [];
    headers.forEach((value, key) => {
        iterated.push(`${key}:${value}`);
    });

    assert.ok(iterated.includes('accept:application/json'));
    assert.ok(iterated.includes('content-type:application/json'));

    return 'PASS: Headers supports normalization, mutation, and iteration';
};
