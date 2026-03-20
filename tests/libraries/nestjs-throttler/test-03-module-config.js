import assert from 'assert';
import { getStorageToken, ThrottlerModule } from '@nestjs/throttler';

export const run = () => {
  const dynamicModule = ThrottlerModule.forRoot([
    { name: 'short', ttl: 1000, limit: 2 },
    { name: 'long', ttl: 60_000, limit: 10 },
  ]);

  assert.ok(dynamicModule.module, 'dynamic module should include module reference');
  assert.ok(Array.isArray(dynamicModule.providers), 'dynamic module should include providers');
  assert.ok(Array.isArray(dynamicModule.exports), 'dynamic module should include exports');

  const providers = dynamicModule.providers || [];
  const providerTokens = providers.map((provider) => provider.provide).filter(Boolean);
  assert.ok(providerTokens.includes(getStorageToken()), 'storage token provider should be registered');

  return 'PASS: ThrottlerModule.forRoot returns expected dynamic module structure';
};
