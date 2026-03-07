import assert from 'assert';
import FormData from 'form-data';

export const run = () => {
    const form = new FormData();
    form.setBoundary('test-boundary');

    form.append('text_field', 'hello');
    form.append('binary_field', Buffer.from([0x01, 0x02, 0x03]), {
        filename: 'data.bin',
        contentType: 'application/octet-stream'
    });

    const buf = form.getBuffer();
    const text = buf.toString('utf-8');

    // Verify multipart structure
    assert.ok(text.includes('--test-boundary\r\n'), 'part boundaries present');
    assert.ok(text.includes('--test-boundary--'), 'closing boundary present');

    // Verify text field part
    assert.ok(text.includes('Content-Disposition: form-data; name="text_field"'), 'text field disposition');
    assert.ok(text.includes('hello'), 'text field value');

    // Verify binary field part with filename
    assert.ok(
        text.includes('Content-Disposition: form-data; name="binary_field"; filename="data.bin"'),
        'binary field disposition with filename'
    );
    assert.ok(text.includes('Content-Type: application/octet-stream'), 'binary field content type');

    // Verify multiple fields produce correct number of parts
    const partCount = (text.match(/--test-boundary\r\n/g) || []).length;
    assert.strictEqual(partCount, 2, 'two parts present');

    return "PASS: multipart format structure is correct with proper boundaries, dispositions, and content types";
};
