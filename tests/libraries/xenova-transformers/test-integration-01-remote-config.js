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

    const config = await AutoConfig.from_pretrained('mock-model');

    assert.strictEqual(config.model_type, 'bert');
    assert.strictEqual(config.architectures[0], 'BertModel');
    assert.strictEqual(config.hidden_size, 64);

    return 'PASS: AutoConfig fetches config.json from mock HTTP server';
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
