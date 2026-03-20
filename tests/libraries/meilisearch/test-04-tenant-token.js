import assert from 'assert';
import { generateTenantToken } from 'meilisearch/token';

export const run = async () => {
  const token = await generateTenantToken({
    apiKey: '0123456789abcdef0123456789abcdef',
    apiKeyUid: '8d5a90aa-17ce-4d68-8f88-45ff6f1f4f09',
    searchRules: {
      books: {
        filter: 'tenant_id = 42',
      },
    },
    expiresAt: new Date(Date.now() + 60_000),
    algorithm: 'HS256',
    force: true,
  });

  const parts = token.split('.');
  assert.strictEqual(parts.length, 3);
  assert.ok(parts.every((part) => typeof part === 'string' && part.length > 0));

  return 'PASS: generateTenantToken returns a JWT-like token string';
};
