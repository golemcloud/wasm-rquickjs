import assert from 'assert';
import FormData from 'form-data';

export const run = () => {
    // Test custom boundary
    const form = new FormData();
    form.append('key', 'value');
    form.setBoundary('my-custom-boundary-123');

    assert.strictEqual(form.getBoundary(), 'my-custom-boundary-123', 'setBoundary works');

    const headers = form.getHeaders();
    assert.ok(headers['content-type'].includes('my-custom-boundary-123'), 'custom boundary in content-type');

    const buf = form.getBuffer();
    const text = buf.toString('utf-8');
    assert.ok(text.includes('--my-custom-boundary-123'), 'custom boundary in serialized output');

    // Test getHeaders with user headers merged
    const form2 = new FormData();
    form2.append('x', 'y');
    const merged = form2.getHeaders({ 'X-Custom': 'test-value' });
    assert.strictEqual(merged['x-custom'], 'test-value', 'user headers are merged (lowercased)');
    assert.ok(merged['content-type'].includes('multipart/form-data'), 'content-type preserved when merging');

    return "PASS: setBoundary, custom boundary serialization, and header merging work";
};
