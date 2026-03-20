import assert from 'assert';
import {
  APIError,
  AuthenticationError,
  RateLimitError,
  toFile,
} from '@anthropic-ai/sdk';

export const run = async () => {
  const authError = APIError.generate(401, { error: { message: 'bad key' } }, undefined, new Headers());
  const rateError = APIError.generate(429, { error: { message: 'slow down' } }, undefined, new Headers());

  assert.ok(authError instanceof AuthenticationError);
  assert.strictEqual(authError.status, 401);
  assert.ok(rateError instanceof RateLimitError);
  assert.strictEqual(rateError.status, 429);

  const file = await toFile(Buffer.from('hello anthropic'), 'sample.txt', { type: 'text/plain' });
  assert.strictEqual(file.name, 'sample.txt');
  assert.strictEqual(file.type, 'text/plain');
  assert.strictEqual(await file.text(), 'hello anthropic');

  return 'PASS: APIError mapping and toFile helper behavior are correct';
};
