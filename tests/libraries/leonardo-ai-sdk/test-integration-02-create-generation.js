import assert from 'assert';
import { Leonardo } from '@leonardo-ai/sdk';

export const run = async () => {
  const client = new Leonardo({
    bearerAuth: 'integration-token',
    serverURL: 'http://localhost:18080',
  });

  const response = await client.image.createGeneration({
    prompt: 'A photoreal mountain landscape',
    numImages: 1,
    width: 512,
    height: 512,
  });

  assert.strictEqual(response.statusCode, 200);
  assert.strictEqual(response.object.sdGenerationJob.generationId, 'gen-local-1');
  return 'PASS: image.createGeneration() works against HTTP mock server';
};
