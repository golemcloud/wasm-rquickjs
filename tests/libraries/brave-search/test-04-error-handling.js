import assert from 'assert';
import axios from 'axios';
import { BraveSearchError, createClient } from './helpers.js';

const makeAxiosError = (status, message) => {
  return new axios.AxiosError(
    message,
    'ERR_BAD_RESPONSE',
    {},
    {},
    {
      status,
      data: { message },
      headers: {},
      config: {},
      statusText: String(status),
    }
  );
};

export const run = () => {
  const client = createClient('test-brave-key');

  const unauthorized = client.handleApiError(makeAxiosError(401, 'bad key'));
  assert.ok(unauthorized instanceof BraveSearchError);
  assert.strictEqual(unauthorized.message, 'Authentication error: bad key');
  assert.strictEqual(unauthorized.responseData.message, 'bad key');

  const rateLimited = client.handleApiError(makeAxiosError(429, 'too many requests'));
  assert.ok(rateLimited instanceof BraveSearchError);
  assert.strictEqual(rateLimited.message, 'Rate limit exceeded: too many requests');

  const genericApi = client.handleApiError(makeAxiosError(503, 'upstream unavailable'));
  assert.ok(genericApi instanceof BraveSearchError);
  assert.strictEqual(genericApi.message, 'API error (503): upstream unavailable');

  const unexpected = client.handleApiError(new Error('socket hang up'));
  assert.ok(unexpected instanceof BraveSearchError);
  assert.strictEqual(unexpected.message, 'Unexpected error: socket hang up');

  return 'PASS: API and non-API failures map to BraveSearchError consistently';
};
