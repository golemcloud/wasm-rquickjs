import assert from 'assert';
import FormData from 'form-data';

export const run = () => {
    const form = new FormData();

    // Append string and buffer values (both have known lengths)
    form.append('field1', 'value1');
    form.append('field2', Buffer.from('value2'));

    // hasKnownLength should be true for string/buffer-only forms
    assert.strictEqual(form.hasKnownLength(), true, 'hasKnownLength is true for strings and buffers');

    // getLengthSync should return a positive number
    const len = form.getLengthSync();
    assert.ok(typeof len === 'number', 'getLengthSync returns a number');
    assert.ok(len > 0, 'getLengthSync returns a positive value');

    // getBuffer length should match getLengthSync
    const buf = form.getBuffer();
    assert.strictEqual(buf.length, len, 'getBuffer length matches getLengthSync');

    return "PASS: hasKnownLength and getLengthSync work correctly for string/buffer values";
};
