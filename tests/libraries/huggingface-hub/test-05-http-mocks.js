import assert from 'assert';
import { repoExists, whoAmI } from '@huggingface/hub';

export const run = async () => {
  const calls = [];

  const fetchWhoAmI = async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method ?? 'GET', headers: init.headers ?? {} });

    return new Response(
      JSON.stringify({
        type: 'user',
        id: 'user_123',
        email: 'alice@example.com',
        emailVerified: true,
        isPro: false,
        orgs: [],
        name: 'alice',
        fullname: 'Alice Example',
        canPay: false,
        avatarUrl: 'https://example.com/avatar.png',
        periodEnd: null,
        billingMode: 'prepaid',
        auth: {
          type: 'access_token',
          accessToken: {
            displayName: 'unit-test-token',
            role: 'read',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        },
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      },
    );
  };

  const who = await whoAmI({
    accessToken: 'hf_unit_test_token',
    fetch: fetchWhoAmI,
  });

  assert.strictEqual(who.type, 'user');
  assert.strictEqual(who.name, 'alice');
  assert.strictEqual(who.auth.type, 'access_token');
  assert.ok(who.auth.accessToken.createdAt instanceof Date);

  assert.strictEqual(calls.length, 1);
  assert.strictEqual(calls[0].url, 'https://huggingface.co/api/whoami-v2');
  assert.strictEqual(calls[0].method, 'GET');
  assert.strictEqual(calls[0].headers.Authorization, 'Bearer hf_unit_test_token');

  const modelExists = await repoExists({
    repo: { type: 'model', name: 'owner/public-model' },
    fetch: async () => new Response('', { status: 200 }),
  });
  assert.strictEqual(modelExists, true);

  const missingDataset = await repoExists({
    repo: { type: 'dataset', name: 'owner/missing-dataset' },
    fetch: async () => new Response('', { status: 404 }),
  });
  assert.strictEqual(missingDataset, false);

  return 'PASS: whoAmI and repoExists support mocked HTTP flows';
};
