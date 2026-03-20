import assert from 'assert';
import { ROOT_CONTEXT, context, createContextKey } from '@opentelemetry/api';

export const run = () => {
  const requestKey = createContextKey('test.request-id');
  const userKey = createContextKey('test.user-id');

  const withRequest = ROOT_CONTEXT.setValue(requestKey, 'req-123');
  const withUser = withRequest.setValue(userKey, 'user-456');

  assert.strictEqual(ROOT_CONTEXT.getValue(requestKey), undefined);
  assert.strictEqual(withRequest.getValue(requestKey), 'req-123');
  assert.strictEqual(withRequest.getValue(userKey), undefined);
  assert.strictEqual(withUser.getValue(requestKey), 'req-123');
  assert.strictEqual(withUser.getValue(userKey), 'user-456');

  const withoutUser = withUser.deleteValue(userKey);
  assert.strictEqual(withoutUser.getValue(userKey), undefined);
  assert.strictEqual(withoutUser.getValue(requestKey), 'req-123');

  const result = context.with(withUser, () => 'context.with executed');
  assert.strictEqual(result, 'context.with executed');

  return 'PASS: context API preserves immutable values and supports scoped execution';
};
