import assert from 'assert';
import * as jinaSdk from '@jina-ai/sdk';

export const run = () => {
  const defaultExport = jinaSdk.default;
  assert.ok(defaultExport !== undefined, 'expected default export to exist');
  return 'PASS: default export is present';
};
