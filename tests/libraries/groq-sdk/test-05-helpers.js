import assert from 'assert';
import Groq, { APIError, toFile } from 'groq-sdk';

export const run = async () => {
  const authError = APIError.generate(
    401,
    { error: { message: 'bad key' } },
    'bad key',
    new Headers(),
  );

  assert.strictEqual(authError.constructor.name, 'AuthenticationError');
  assert.strictEqual(authError.status, 401);

  const textFile = await toFile(new Uint8Array([65, 66, 67]), 'abc.txt', {
    type: 'text/plain',
  });
  assert.strictEqual(textFile.name, 'abc.txt');
  assert.strictEqual(textFile.type, 'text/plain');

  const binaryFile = await Groq.toFile(new Uint8Array([0, 1, 2]), 'bytes.bin');
  assert.strictEqual(binaryFile.name, 'bytes.bin');

  return 'PASS: Error factories and toFile helpers work offline';
};
