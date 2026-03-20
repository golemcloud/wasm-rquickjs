import assert from 'assert';
import { AutoConfig, env } from '@xenova/transformers';

export const run = async () => {
  const previous = {
    allowRemoteModels: env.allowRemoteModels,
    allowLocalModels: env.allowLocalModels,
  };

  try {
    env.allowRemoteModels = false;
    env.allowLocalModels = false;

    await assert.rejects(
      () => AutoConfig.from_pretrained('mock-model'),
      (error) => {
        assert.ok(error instanceof Error);
        assert.ok(
          error.message.includes('both local and remote models are disabled'),
          `Unexpected error: ${error.message}`
        );
        return true;
      }
    );

    return 'PASS: AutoConfig reports invalid configuration when all model sources are disabled';
  } finally {
    env.allowRemoteModels = previous.allowRemoteModels;
    env.allowLocalModels = previous.allowLocalModels;
  }
};
