import './genkit-setup.js';
import assert from 'assert';
import {
  UserFacingError,
  action,
  getCallableJSON,
  getContext,
  getHttpStatus,
  runWithContext,
  z,
} from '@genkit-ai/core';

export const run = async () => {
  const contextAction = action(
    {
      actionType: 'custom',
      name: 'context-reader',
      inputSchema: z.null(),
      outputSchema: z.string(),
    },
    async () => {
      const ctx = getContext();
      return ctx?.auth?.uid || 'missing';
    },
  );

  const uid = await runWithContext({ auth: { uid: 'user-123' } }, () => contextAction(null));
  assert.strictEqual(uid, 'user-123');

  const err = new UserFacingError('UNAUTHENTICATED', 'Auth is required');
  assert.strictEqual(getHttpStatus(err), 401);

  const callable = getCallableJSON(err);
  assert.strictEqual(callable.status, 'UNAUTHENTICATED');
  assert.strictEqual(callable.message, 'Auth is required');

  return 'PASS: context propagation and user-facing error helpers work';
};
