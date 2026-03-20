import assert from 'assert';
import * as jinaSdk from '@jina-ai/sdk';

export const run = () => {
  const maybeRerank = jinaSdk.rerank ?? jinaSdk.Rerank ?? jinaSdk.createRerank;
  assert.ok(maybeRerank !== undefined, 'expected rerank-related export to exist');
  return 'PASS: rerank-related API export exists';
};
