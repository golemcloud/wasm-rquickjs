import assert from 'assert';
import { AutoConfig, env } from '@xenova/transformers';

const BASE = 'http://localhost:18080';

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

  try {
    env.allowRemoteModels = true;
    env.allowLocalModels = false;
    env.useBrowserCache = false;
    env.useFSCache = false;
    env.useCustomCache = false;
    env.customCache = null;
    env.remoteHost = BASE;
    env.remotePathTemplate = '/models/{model}/resolve/{revision}/';

    await assert.rejects(
      () => AutoConfig.from_pretrained('does-not-exist'),
      (error) => {
        assert.ok(error instanceof Error);
        assert.ok(
          error.message.includes('Could not locate file'),
          `Unexpected error: ${error.message}`
        );
        assert.ok(error.message.includes('/models/does-not-exist/resolve/main/config.json'));
        return true;
      }
    );

    return 'PASS: AutoConfig surfaces HTTP 404 fetch failures from the mock server';
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
