import assert from 'assert';
import { ApiKey, AuthAccessTokenCredentials } from 'weaviate-client';

export const run = () => {
  const apiKey = new ApiKey('demo-api-key');
  assert.strictEqual(apiKey.apiKey, 'demo-api-key');

  assert.throws(
    () => new AuthAccessTokenCredentials({ accessToken: 'token-only' }),
    /expiresIn is required/
  );

  assert.throws(
    () => new AuthAccessTokenCredentials({ accessToken: 'token', expiresIn: 0 }),
    /expiresIn must be int > 0/
  );

  const creds = new AuthAccessTokenCredentials({
    accessToken: 'token',
    expiresIn: 3600,
    refreshToken: 'refresh',
  });

  assert.strictEqual(creds.accessToken, 'token');
  assert.strictEqual(creds.refreshToken, 'refresh');
  assert.ok(creds.expiresAt > Date.now());

  return 'PASS: auth credential classes validate and store values correctly';
};
