import assert from 'assert';
import { env } from '@xenova/transformers';

export const run = () => {
  const previous = {
    allowRemoteModels: env.allowRemoteModels,
    allowLocalModels: env.allowLocalModels,
    useBrowserCache: env.useBrowserCache,
    useFSCache: env.useFSCache,
    remoteHost: env.remoteHost,
    remotePathTemplate: env.remotePathTemplate,
  };

  try {
    assert.ok(typeof env.version === 'string' && env.version.length > 0);

    env.allowRemoteModels = false;
    env.allowLocalModels = true;
    env.useBrowserCache = false;
    env.useFSCache = false;
    env.remoteHost = 'https://example.invalid';
    env.remotePathTemplate = '/models/{model}/resolve/{revision}/';

    assert.strictEqual(env.allowRemoteModels, false);
    assert.strictEqual(env.allowLocalModels, true);
    assert.strictEqual(env.useBrowserCache, false);
    assert.strictEqual(env.useFSCache, false);
    assert.strictEqual(env.remoteHost, 'https://example.invalid');
    assert.strictEqual(env.remotePathTemplate, '/models/{model}/resolve/{revision}/');

    return 'PASS: env configuration flags are mutable and readable';
  } finally {
    env.allowRemoteModels = previous.allowRemoteModels;
    env.allowLocalModels = previous.allowLocalModels;
    env.useBrowserCache = previous.useBrowserCache;
    env.useFSCache = previous.useFSCache;
    env.remoteHost = previous.remoteHost;
    env.remotePathTemplate = previous.remotePathTemplate;
  }
};
