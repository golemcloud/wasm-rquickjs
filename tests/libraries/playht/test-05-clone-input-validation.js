import assert from 'node:assert/strict';
import * as PlayHT from 'playht';

export const run = async () => {
  let invalidTypeError;
  try {
    await PlayHT.clone('clone-name', 42);
  } catch (error) {
    invalidTypeError = error;
  }
  assert.ok(invalidTypeError, 'Expected clone() to reject non-string/non-buffer input');
  assert.match(String(invalidTypeError.message || invalidTypeError), /Invalid input type for cloning voice/i);

  let invalidMimeError;
  try {
    await PlayHT.clone('clone-name', Buffer.from('not-an-audio-file'));
  } catch (error) {
    invalidMimeError = error;
  }
  assert.ok(invalidMimeError, 'Expected clone() to reject undetectable mime type');
  assert.match(String(invalidMimeError.message || invalidMimeError), /Could not determine mime type of file/i);

  return 'PASS: clone() validates input shape and mime type';
};
