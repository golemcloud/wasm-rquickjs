import assert from 'assert';
import * as jinaSdk from '@jina-ai/sdk';

export const run = () => {
  assert.ok(jinaSdk);
  const exportedKeys = Object.keys(jinaSdk);
  assert.ok(Array.isArray(exportedKeys));
  return `PASS: module imports with ${exportedKeys.length} exports`;
};
