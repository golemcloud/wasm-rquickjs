import assert from 'assert';
import { AutoConfig, env } from '@xenova/transformers';

export const run = async () => {
  const previous = {
    allowRemoteModels: env.allowRemoteModels,
    allowLocalModels: env.allowLocalModels,
    useBrowserCache: env.useBrowserCache,
    useFSCache: env.useFSCache,
    useCustomCache: env.useCustomCache,
    customCache: env.customCache,
    remoteHost: env.remoteHost,
    remotePathTemplate: env.remotePathTemplate,
  };

  const cacheHits = [];

  try {
    env.allowRemoteModels = true;
    env.allowLocalModels = false;
    env.useBrowserCache = false;
    env.useFSCache = false;
    env.useCustomCache = true;
    env.remoteHost = 'http://does-not-exist.invalid';
    env.remotePathTemplate = '/models/{model}/resolve/{revision}/';

    env.customCache = {
      async match(key) {
        const normalized = String(key);
        cacheHits.push(normalized);
        if (normalized.endsWith('/config.json')) {
          return new Response(JSON.stringify({ model_type: 'bert', hidden_size: 32 }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          });
        }
        return undefined;
      },
      async put() {
      },
    };

    const config = await AutoConfig.from_pretrained('mock-model');
    assert.strictEqual(config.model_type, 'bert');
    assert.strictEqual(config.hidden_size, 32);
    assert.ok(cacheHits.length >= 1);

    return 'PASS: AutoConfig can load configuration via env.customCache';
  } finally {
    env.allowRemoteModels = previous.allowRemoteModels;
    env.allowLocalModels = previous.allowLocalModels;
    env.useBrowserCache = previous.useBrowserCache;
    env.useFSCache = previous.useFSCache;
    env.useCustomCache = previous.useCustomCache;
    env.customCache = previous.customCache;
    env.remoteHost = previous.remoteHost;
    env.remotePathTemplate = previous.remotePathTemplate;
  }
};
