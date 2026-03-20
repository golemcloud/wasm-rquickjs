import assert from 'assert';
import { oauthLoginUrl } from '@huggingface/hub';

export const run = async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (url) => {
    assert.strictEqual(String(url), 'https://huggingface.co/.well-known/openid-configuration');

    return new Response(
      JSON.stringify({ authorization_endpoint: 'https://huggingface.co/oauth/authorize' }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      },
    );
  };

  try {
    const localStorage = {};

    const loginUrl = await oauthLoginUrl({
      clientId: 'client-id-123',
      redirectUrl: 'https://example.com/callback',
      scopes: 'openid profile',
      state: 'custom-state',
      localStorage,
    });

    const parsed = new URL(loginUrl);

    assert.strictEqual(parsed.origin + parsed.pathname, 'https://huggingface.co/oauth/authorize');
    assert.strictEqual(parsed.searchParams.get('client_id'), 'client-id-123');
    assert.strictEqual(parsed.searchParams.get('scope'), 'openid profile');
    assert.strictEqual(parsed.searchParams.get('response_type'), 'code');
    assert.strictEqual(parsed.searchParams.get('redirect_uri'), 'https://example.com/callback');
    assert.strictEqual(parsed.searchParams.get('code_challenge_method'), 'S256');

    assert.strictEqual(typeof localStorage.codeVerifier, 'string');
    assert.strictEqual(typeof localStorage.nonce, 'string');
    assert.ok(localStorage.codeVerifier.length > 20);
    assert.ok(localStorage.nonce.length > 20);

    const stateParam = JSON.parse(parsed.searchParams.get('state'));
    assert.strictEqual(stateParam.redirectUri, 'https://example.com/callback');
    assert.strictEqual(stateParam.state, 'custom-state');
    assert.strictEqual(stateParam.nonce, localStorage.nonce);

    return 'PASS: oauthLoginUrl builds a valid PKCE redirect URL';
  } finally {
    globalThis.fetch = originalFetch;
  }
};
