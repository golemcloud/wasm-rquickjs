import assert from 'assert';
import FormData from 'form-data';

export const run = () => {
    // Test basic construction
    const form = new FormData();
    assert.ok(form, 'FormData constructor works');

    // Test appending string fields
    form.append('name', 'Alice');
    form.append('age', '30');

    // Test getBoundary returns a non-empty string
    const boundary = form.getBoundary();
    assert.ok(typeof boundary === 'string', 'getBoundary returns a string');
    assert.ok(boundary.length > 0, 'boundary is non-empty');

    // Test getHeaders returns correct content-type
    const headers = form.getHeaders();
    assert.ok(headers['content-type'], 'content-type header exists');
    assert.ok(headers['content-type'].includes('multipart/form-data'), 'content-type is multipart/form-data');
    assert.ok(headers['content-type'].includes(boundary), 'content-type includes boundary');

    return "PASS: basic FormData construction, append, getBoundary, and getHeaders work";
};
