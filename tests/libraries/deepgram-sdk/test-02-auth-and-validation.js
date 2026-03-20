import assert from 'assert';
import { DeepgramClient, DeepgramError } from '@deepgram/sdk';

export const run = async () => {
  const apiClient = new DeepgramClient({ apiKey: 'api-key-123' });
  const apiAuth = await apiClient._options.authProvider.getAuthRequest({
    url: 'https://example.test',
    method: 'GET',
    headers: {},
  });
  assert.strictEqual(apiAuth.headers.Authorization, 'Token api-key-123');

  const tokenClient = new DeepgramClient({ accessToken: 'access-token-456' });
  const tokenAuth = await tokenClient._options.authProvider.getAuthRequest({
    url: 'https://example.test',
    method: 'GET',
    headers: {},
  });
  assert.strictEqual(tokenAuth.headers.Authorization, 'Bearer access-token-456');

  const noAuthClient = new DeepgramClient();
  await assert.rejects(
    () =>
      noAuthClient._options.authProvider.getAuthRequest({
        url: 'https://example.test',
        method: 'GET',
        headers: {},
      }),
    (error) => {
      assert.ok(error instanceof DeepgramError);
      assert.ok(error.message.includes("Please provide 'apiKey'"));
      return true;
    }
  );

  return 'PASS: auth provider prefixes and missing credential validation';
};
