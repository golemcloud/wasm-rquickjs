import assert from 'assert';
import FormData from 'form-data';

export const run = () => {
    const form = new FormData();

    // Append a Buffer value with metadata
    const buf = Buffer.from('hello world');
    form.append('file', buf, { filename: 'test.txt', contentType: 'text/plain' });

    // Append a string field
    form.append('description', 'A test file');

    // getBuffer should serialize the entire form
    const output = form.getBuffer();
    assert.ok(Buffer.isBuffer(output), 'getBuffer returns a Buffer');

    const text = output.toString('utf-8');
    assert.ok(text.includes('hello world'), 'buffer content is present in output');
    assert.ok(text.includes('test.txt'), 'filename is present in output');
    assert.ok(text.includes('A test file'), 'string field is present in output');
    assert.ok(text.includes('Content-Disposition: form-data'), 'Content-Disposition headers present');

    return "PASS: Buffer append and getBuffer serialization work correctly";
};
