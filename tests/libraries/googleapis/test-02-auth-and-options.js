import assert from 'assert';
import googleapisPkg from 'googleapis';

export const run = () => {
  const { google } = googleapisPkg;

  const oauth2 = new google.auth.OAuth2(
    'client-id',
    'client-secret',
    'http://localhost/oauth/callback',
  );

  oauth2.setCredentials({
    access_token: 'fake-access-token',
    expiry_date: Date.now() + 3600_000,
  });

  const url = oauth2.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/cloud-platform.read-only'],
    prompt: 'consent',
  });

  google.options({
    auth: 'fake-api-key',
    params: { quotaUser: 'wasm-rquickjs-test' },
  });

  assert.ok(url.includes('accounts.google.com'));
  assert.ok(url.includes('client_id=client-id'));
  assert.ok(url.includes('cloud-platform.read-only'));
  assert.strictEqual(oauth2.credentials.access_token, 'fake-access-token');

  return 'PASS: OAuth2 URL generation, credentials, and global options work';
};
