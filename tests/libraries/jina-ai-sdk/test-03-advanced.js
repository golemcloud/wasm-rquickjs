import assert from 'assert';
import * as jinaSdk from '@jina-ai/sdk';

export const run = () => {
  const keyCount = Reflect.ownKeys(jinaSdk).length;
  assert.ok(keyCount >= 1, 'expected at least one export');
  return 'PASS: export surface can be introspected';
};
