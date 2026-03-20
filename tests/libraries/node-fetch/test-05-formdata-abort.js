// test-05-formdata-abort.js — verify FormData round-trip and abort behavior
import assert from 'assert';
import fetch, {Request, Response, FormData, Blob, AbortError} from 'node-fetch';

export const run = async () => {
    const form = new FormData();
    form.set('name', 'alice');
    form.set('file', new Blob(['hello'], {type: 'text/plain'}), 'hello.txt');

    const request = new Request('https://example.com/upload', {method: 'POST', body: form});
    assert.ok(request.headers.get('content-type').startsWith('multipart/form-data; boundary='));

    const parsed = await new Response(await request.arrayBuffer(), {
        headers: {'content-type': request.headers.get('content-type')}
    }).formData();
    assert.strictEqual(parsed.get('name'), 'alice');
    assert.strictEqual(await parsed.get('file').text(), 'hello');

    const controller = new AbortController();
    controller.abort();

    let abortError = null;
    try {
        await fetch('https://example.com', {signal: controller.signal});
    } catch (e) {
        abortError = e;
    }

    assert.ok(abortError instanceof AbortError);
    assert.strictEqual(abortError.type, 'aborted');

    return 'PASS: FormData serialization works and aborted fetch rejects with AbortError';
};
