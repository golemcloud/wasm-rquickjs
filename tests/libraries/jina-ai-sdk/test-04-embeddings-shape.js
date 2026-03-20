import assert from 'assert';
import * as jinaSdk from '@jina-ai/sdk';

export const run = () => {
  const maybeEmbeddings = jinaSdk.embeddings ?? jinaSdk.Embeddings ?? jinaSdk.createEmbeddings;
  assert.ok(maybeEmbeddings !== undefined, 'expected embeddings-related export to exist');
  return 'PASS: embeddings-related API export exists';
};
