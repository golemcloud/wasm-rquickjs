import assert from 'assert';
import {
  InvalidArgumentError,
  InvalidTimeoutError,
  MissingApiKeyError,
  getJson,
} from 'serpapi';
import { resetConfig } from './helpers.js';

export const run = async () => {
  resetConfig();

  await assert.rejects(
    getJson({ engine: 'google', q: 'missing-key' }),
    (error) => error instanceof MissingApiKeyError,
  );

  assert.throws(
    () => getJson('google'),
    (error) => error instanceof InvalidArgumentError,
  );

  await assert.rejects(
    getJson({ engine: 'google', api_key: 'test-key', q: 'x', timeout: 0 }),
    (error) => error instanceof InvalidTimeoutError,
  );

  resetConfig();
  return 'PASS: argument, API key, and timeout validation errors are enforced';
};
